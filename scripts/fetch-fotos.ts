/**
 * Baixa as fotos reais dos produtos C&A uma única vez, para o repo servir as
 * imagens localmente. Depois disso a demo não depende de rede nenhuma.
 *
 *   npm run fotos
 *
 * Para cada produto do cea_data.json que tem "cod", tenta três caminhos, nesta
 * ordem, e para no primeiro que trouxer imagem:
 *   1. busca por RefId na API de catálogo
 *   2. busca por termo (nome do produto), pegando o resultado mais parecido
 *   3. a PDP do próprio produto, extraindo og:image
 *
 * Nada aqui aborta por causa de um item: o que falhar entra na contagem de
 * "sem foto" e a tela usa a silhueta. O script é idempotente — rodar de novo
 * só rebaixa o que ainda não existe, a menos que se passe --forcar.
 *
 * O JSON continua sendo a fonte da verdade de preço: os preços coletados vão
 * para fotos.json e uma divergência só aparece no log, nunca sobrescreve.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Produto } from '../src/lib/cea'

const RAIZ = process.cwd()
const DESTINO = join(RAIZ, 'public', 'produtos')
const MANIFESTO = join(RAIZ, 'src', 'data', 'fotos.json')

const BASE = 'https://www.cea.com.br'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const CONCORRENCIA = 3
const DELAY_MS = 400
const TENTATIVAS = 3
const MAX_CORES = 4
const TAMANHOS = [500, 160] as const

const FORCAR = process.argv.includes('--forcar')

/* ---------------------------------------------------------------- tipos --- */

export type CorFoto = { nome: string; img500: string; img160: string }

export type EntradaFoto = {
  nomeReal: string
  marca: string
  precoPor: number | null
  precoDe: number | null
  cores: CorFoto[]
  /** por onde a foto veio: refid, termo ou pdp */
  origem: string
}

type Manifesto = Record<string, EntradaFoto>

type ItemVtex = {
  name?: string
  images?: { imageUrl?: string }[]
  sellers?: { commertialOffer?: { Price?: number; ListPrice?: number } }[]
}

type ProdutoVtex = {
  productName?: string
  brand?: string
  items?: ItemVtex[]
}

/* ------------------------------------------------------------- utilidades - */

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function buscar(url: string, comoTexto = false): Promise<unknown> {
  let ultimoErro: unknown
  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    try {
      const controle = new AbortController()
      const timer = setTimeout(() => controle.abort(), 15_000)
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: comoTexto ? 'text/html' : 'application/json' },
        signal: controle.signal,
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return comoTexto ? await res.text() : await res.json()
    } catch (e) {
      ultimoErro = e
      if (tentativa < TENTATIVAS) await esperar(DELAY_MS * 2 ** tentativa)
    }
  }
  throw ultimoErro
}

/** Similaridade grosseira por palavras em comum — decide o melhor resultado. */
function similaridade(a: string, b: string): number {
  const normalizar = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .split(/\W+/)
      .filter((p) => p.length > 2)
  const pa = new Set(normalizar(a))
  const pb = normalizar(b)
  if (!pa.size || !pb.length) return 0
  return pb.filter((p) => pa.has(p)).length / Math.max(pa.size, pb.length)
}

/**
 * Reescreve a URL da VTEX para o tamanho pedido. O padrão do CDN é
 * .../arquivos/ids/{id}-{largura}-{altura}/... — quando o path não bate com o
 * padrão, devolve a original (melhor imagem grande que imagem nenhuma).
 */
function noTamanho(url: string, lado: number): string {
  return url.replace(/(\/arquivos\/ids\/\d+)(-\d+-\d+)?/, `$1-${lado}-${lado}`)
}

async function baixarImagem(url: string, caminho: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!res.ok) return false
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 1024) return false // resposta vazia ou placeholder do CDN
    writeFileSync(caminho, buf)
    return true
  } catch {
    return false
  }
}

/* ------------------------------------------------------------ os 3 planos - */

async function porRefId(cod: string): Promise<ProdutoVtex | null> {
  const url = `${BASE}/api/catalog_system/pub/products/search/?fq=alternateIds_RefId:${cod}`
  const json = (await buscar(url)) as ProdutoVtex[]
  return Array.isArray(json) && json.length ? json[0] : null
}

async function porTermo(nome: string): Promise<ProdutoVtex | null> {
  const url = `${BASE}/api/catalog_system/pub/products/search/${encodeURIComponent(nome)}?_from=0&_to=4`
  const json = (await buscar(url)) as ProdutoVtex[]
  if (!Array.isArray(json) || !json.length) return null
  const ranqueado = json
    .map((p) => ({ p, s: similaridade(nome, p.productName ?? '') }))
    .sort((a, b) => b.s - a.s)[0]
  return ranqueado.s >= 0.3 ? ranqueado.p : null
}

async function porPdp(urlPdp: string): Promise<string | null> {
  const html = (await buscar(urlPdp, true)) as string
  const m = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html)
  return m?.[1] ?? null
}

/* ------------------------------------------------------------ um produto -- */

type Resultado = { cod: string; entrada: EntradaFoto | null; nota: string }

async function processar(p: Produto & { cod: string }): Promise<Resultado> {
  let vtex: ProdutoVtex | null = null
  let origem = ''

  try {
    vtex = await porRefId(p.cod)
    if (vtex) origem = 'refid'
  } catch {
    /* segue para o próximo plano */
  }

  if (!vtex) {
    await esperar(DELAY_MS)
    try {
      vtex = await porTermo(p.nome)
      if (vtex) origem = 'termo'
    } catch {
      /* segue */
    }
  }

  /* imagens da VTEX: a primeira foto de cada item (cada item é uma cor) */
  const urls: { nome: string; url: string }[] = []
  if (vtex?.items?.length) {
    for (const item of vtex.items.slice(0, MAX_CORES)) {
      const img = item.images?.[0]?.imageUrl
      if (img) urls.push({ nome: item.name ?? p.cor ?? '—', url: img })
    }
  }

  if (!urls.length && p.url) {
    await esperar(DELAY_MS)
    try {
      const og = await porPdp(p.url)
      if (og) {
        urls.push({ nome: p.cor ?? '—', url: og })
        origem = 'pdp'
      }
    } catch {
      /* sem foto mesmo */
    }
  }

  if (!urls.length) return { cod: p.cod, entrada: null, nota: 'sem imagem em nenhum dos 3 planos' }

  const cores: CorFoto[] = []
  for (const [i, u] of urls.entries()) {
    const arquivos: Partial<Record<(typeof TAMANHOS)[number], string>> = {}
    for (const lado of TAMANHOS) {
      const nomeArquivo = `${p.cod}-${i}-${lado}.jpg`
      const caminho = join(DESTINO, nomeArquivo)
      if (!FORCAR && existsSync(caminho)) {
        arquivos[lado] = `/produtos/${nomeArquivo}`
        continue
      }
      await esperar(DELAY_MS)
      const ok = await baixarImagem(noTamanho(u.url, lado), caminho)
      if (ok) arquivos[lado] = `/produtos/${nomeArquivo}`
    }
    /* sem a 500 a cor não entra; sem a 160 o componente usa a 500 */
    if (arquivos[500]) {
      cores.push({ nome: u.nome, img500: arquivos[500]!, img160: arquivos[160] ?? arquivos[500]! })
    }
  }

  if (!cores.length) return { cod: p.cod, entrada: null, nota: 'imagens não baixaram' }

  const oferta = vtex?.items?.[0]?.sellers?.[0]?.commertialOffer
  return {
    cod: p.cod,
    entrada: {
      nomeReal: vtex?.productName ?? p.nome,
      marca: vtex?.brand ?? 'C&A',
      precoPor: oferta?.Price ?? null,
      precoDe: oferta?.ListPrice ?? null,
      cores,
      origem: origem || 'pdp',
    },
    nota: `${cores.length} cor(es) via ${origem || 'pdp'}`,
  }
}

/* ------------------------------------------------------------------ main -- */

async function main() {
  const snapshot = JSON.parse(readFileSync(join(RAIZ, 'src/data/cea_data.json'), 'utf8')) as {
    produtos: Produto[]
  }
  const alvos = snapshot.produtos.filter((p): p is Produto & { cod: string } => Boolean(p.cod))

  mkdirSync(DESTINO, { recursive: true })
  console.log(`\n— coleta de fotos — ${alvos.length} produtos com código real\n`)

  const manifesto: Manifesto = existsSync(MANIFESTO)
    ? (JSON.parse(readFileSync(MANIFESTO, 'utf8')) as Manifesto)
    : {}

  const divergencias: string[] = []
  const semFoto: string[] = []
  const fila = [...alvos]

  async function trabalhador() {
    for (;;) {
      const p = fila.shift()
      if (!p) return
      try {
        const r = await processar(p)
        if (r.entrada) {
          manifesto[r.cod] = r.entrada
          console.log(`✓ ${r.cod}  ${r.nota.padEnd(22)} ${r.entrada.nomeReal.slice(0, 46)}`)

          /* preço é só para conferência: o cea_data.json continua mandando */
          if (p.precoPor && r.entrada.precoPor && Math.abs(p.precoPor - r.entrada.precoPor) > 0.01) {
            divergencias.push(
              `${r.cod}: snapshot R$ ${p.precoPor.toFixed(2)} × coletado R$ ${r.entrada.precoPor.toFixed(2)}`,
            )
          }
        } else {
          semFoto.push(`${p.cod} (${r.nota})`)
          console.log(`· ${p.cod}  ${r.nota}`)
        }
      } catch (e) {
        semFoto.push(`${p.cod} (erro: ${(e as Error).message})`)
        console.log(`✗ ${p.cod}  ${(e as Error).message}`)
      }
      await esperar(DELAY_MS)
    }
  }

  await Promise.all(Array.from({ length: CONCORRENCIA }, trabalhador))

  writeFileSync(MANIFESTO, `${JSON.stringify(manifesto, null, 2)}\n`)

  const comFoto = Object.keys(manifesto).length
  console.log(`\n${comFoto} produtos com foto · ${semFoto.length} sem foto (usarão silhueta)`)
  if (semFoto.length) console.log(`  sem foto: ${semFoto.join(', ')}`)
  if (divergencias.length) {
    console.log(`\n⚠ ${divergencias.length} preço(s) divergente(s) — o snapshot continua valendo:`)
    divergencias.forEach((d) => console.log(`  ${d}`))
  }
  console.log(`\nmanifesto: ${MANIFESTO}\nimagens:   ${DESTINO}\n`)
}

main()
