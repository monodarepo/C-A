/**
 * Loader do snapshot C&A + hidratação opcional via conector VTEX.
 * O app precisa funcionar perfeitamente sem o conector (a demo nunca quebra):
 * toda função aqui degrada para o snapshot local em erro/timeout.
 */
import snapshot from '@/data/cea_data.json'

/* ---------------------------------------------------------------- tipos ---- */

export type Produto = {
  cod?: string
  nome: string
  dept: string
  cat: string
  cor?: string
  cores?: string[]
  material?: string
  marca?: string
  licenca?: string
  padronagem?: string
  tamanhos?: string
  atributos?: string[]
  precoDe?: number
  precoPor?: number
  desc?: string
  status?: string
  url?: string
  papelNoApp?: string
  hidratar?: boolean
  obs?: string
}

export type LojaNomeada = { nome: string; uf: string; cluster: string }

export type ClusterModelo = {
  id: string
  nome: string
  lojas: number
  ticketMedio: number
  conv: string
  partFaturamento: string
}

export type Estilista = { nome: string; time: string }

export type EventoCalendario = {
  evento?: string
  mes?: string
  data?: string
  periodo?: string
  obs?: string
  seasons?: string[]
}

export type CeaSnapshot = {
  meta: { projeto: string; dataColeta: string; fontes: string[]; avisos: string[] }
  identidadeVisual: {
    estrategia: string
    paletaAproximada: Record<string, string>
    tipografia: { titulos: string; dados: string }
    tomDeVoz: string
    assinaturasReais: string[]
  }
  financeiro: {
    t2_2026: Record<string, string | number>
    fy2025: Record<string, unknown>
    seriesTrimestrais_receita_R$: Record<string, number>
    seriesTrimestrais_sssVestuario: Record<string, string>
    usoNoApp: Record<string, string>
  }
  rede: {
    totalLojasBase: string
    conceitos: string[]
    clustersModelo: ClusterModelo[]
    lojasNomeadas_localizacoesReais_metricasSimuladas: LojaNomeada[]
    sede: string
    cds: string[]
  }
  ecossistema: Record<string, unknown>
  arvoreMercadologica: {
    departamentos: string[]
    feminino: Record<string, string[]>
    masculino: Record<string, string[]>
    infantil: { faixas: string[]; marcas: string[] }
    jeans: { fitsReais: string[]; linhas: string[] }
    beleza: string[]
    hierarquiaN1N7_paraOApp: string
  }
  marcas: {
    proprias: string[]
    parceiras: string[]
    belezaDestaques: string[]
    licencasInfantil: string[]
  }
  atributosReais: Record<string, string[]>
  piramidePrecoObservada: Record<string, Record<string, unknown>>
  produtos: Produto[]
  benchmark: {
    'posicionamentoC&A': { ticketMedioAprox: number; tipo: string; forca: string }
    concorrentesMonitorados: { marca: string; tipo: string; precoMedio?: number; obs: string }[]
  }
  calendarioComercial_2026_27: EventoCalendario[]
  ficticios: {
    estilistas: Estilista[]
    fornecedores: string[]
    planner: { nome: string; area: string }
  }
  conexaoViva: Record<string, unknown>
}

export const cea = snapshot as unknown as CeaSnapshot

/* --------------------------------------------------------- atalhos úteis ---- */

export const produtos = cea.produtos
export const clusters = cea.rede.clustersModelo
export const lojasNomeadas = cea.rede.lojasNomeadas_localizacoesReais_metricasSimuladas
export const estilistas = cea.ficticios.estilistas
export const fornecedores = cea.ficticios.fornecedores
export const planner = cea.ficticios.planner
export const concorrentes = cea.benchmark.concorrentesMonitorados
export const cartelaCores = cea.atributosReais.coresCartela
export const calendario = cea.calendarioComercial_2026_27

/** Busca um produto do snapshot pelo código de referência real. */
export function produtoPorCod(cod: string): Produto | undefined {
  return produtos.find((p) => p.cod === cod)
}

/** Produtos que têm código real (os que podem ser hidratados na VTEX). */
export function produtosComCod(): Produto[] {
  return produtos.filter((p): p is Produto & { cod: string } => Boolean(p.cod))
}

/* ------------------------------------------------------------ hidratação ---- */

export type Hidratado = {
  precoPor?: number
  precoDe?: number
  imageUrl?: string
  fallback: boolean
}

const cacheHidratacao = new Map<string, Hidratado>()
const emVoo = new Map<string, Promise<Hidratado>>()

/**
 * Tenta enriquecer um produto com preço/foto ao vivo (/api/cea/ref/:cod).
 * Sempre resolve — em erro devolve { fallback: true } com os dados do snapshot.
 */
export async function hydrate(cod: string): Promise<Hidratado> {
  const cached = cacheHidratacao.get(cod)
  if (cached) return cached

  const voando = emVoo.get(cod)
  if (voando) return voando

  const base = produtoPorCod(cod)
  const doSnapshot: Hidratado = {
    precoPor: base?.precoPor,
    precoDe: base?.precoDe,
    fallback: true,
  }

  const promessa = (async (): Promise<Hidratado> => {
    try {
      const res = await fetch(`/api/cea/ref/${cod}`)
      const json = (await res.json()) as {
        fallback: boolean
        produto: { precoPor: number | null; precoDe: number | null; imageUrl: string | null } | null
      }
      if (json.fallback || !json.produto) return doSnapshot
      const vivo: Hidratado = {
        precoPor: json.produto.precoPor ?? base?.precoPor,
        precoDe: json.produto.precoDe ?? base?.precoDe,
        imageUrl: json.produto.imageUrl ?? undefined,
        fallback: false,
      }
      return vivo
    } catch {
      return doSnapshot
    }
  })().then((r) => {
    cacheHidratacao.set(cod, r)
    emVoo.delete(cod)
    return r
  })

  emVoo.set(cod, promessa)
  return promessa
}

/** Busca por termo no catálogo ao vivo — usada no /benchmark ("Atualizar Coleta"). */
export type ColetaViva = {
  fallback: boolean
  term: string
  total: number
  produtos: {
    cod: string | null
    nome: string
    precoPor: number | null
    precoDe: number | null
    imageUrl: string | null
  }[]
}

export async function buscarAoVivo(term: string): Promise<ColetaViva> {
  try {
    const res = await fetch(`/api/cea/search?term=${encodeURIComponent(term)}`)
    const json = (await res.json()) as ColetaViva
    return { ...json, term }
  } catch {
    return { fallback: true, term, total: 0, produtos: [] }
  }
}

/** Cores da marca extraídas do logo oficial; fallback = tokens do CLAUDE.md. */
export const CORES_FALLBACK = { blue: '#00287A', red: '#E30613' } as const

export async function coresDaMarca(): Promise<{ blue: string; red: string; aoVivo: boolean }> {
  try {
    const res = await fetch('/api/cea/logo')
    const json = (await res.json()) as { fallback: boolean; blue: string | null; red: string | null }
    if (json.fallback || !json.blue) return { ...CORES_FALLBACK, aoVivo: false }
    return { blue: json.blue, red: json.red ?? CORES_FALLBACK.red, aoVivo: true }
  } catch {
    return { ...CORES_FALLBACK, aoVivo: false }
  }
}

/* ----------------------------------------------------------- placeholder ---- */

/** Cartela real do JSON traduzida para hex — base do placeholder de foto. */
const HEX_POR_COR: Record<string, string> = {
  preto: '#1B1B1F',
  'off white': '#F1EEE7',
  branco: '#F7F7F8',
  'azul denim': '#3C5A8A',
  'azul médio': '#4A72A8',
  'azul claro': '#8FB0D6',
  'azul escuro': '#22375E',
  azul: '#3C5A8A',
  marrom: '#6B4A33',
  mocha: '#8A6A52',
  bege: '#D9C7AC',
  'bege/natural': '#D9C7AC',
  natural: '#E3D5BE',
  'natural/bege': '#D9C7AC',
  verde: '#3F6B4E',
  vermelho: '#C1272D',
  vinho: '#6B2233',
  laranja: '#D9662B',
  amarelo: '#E3B341',
  cinza: '#8A8F98',
  grafite: '#4A4F58',
  'cinza/grafite': '#4A4F58',
  rosa: '#D98BA0',
  'bege/amarelo': '#DFC98C',
  'azul bicolor': '#41608F',
}

/** Hex da cor da cartela real — usado no placeholder e na hierarquia de cores. */
export function hexDaCor(nome: string): string {
  const chave = nome.trim().toLowerCase().replace(/\s*\+\d+.*$/, '')
  return HEX_POR_COR[chave] ?? hexDeterministico(chave)
}

export type Placeholder = { bg: string; fg: string; iniciais: string; cor: string }

/**
 * Bloco de cor determinístico para quando não houver foto: usa a cor da variante
 * (cartela real) + iniciais do produto. Nunca quebra o layout por falta de imagem.
 */
export function placeholderFor(p: Pick<Produto, 'nome' | 'cor' | 'cores'>): Placeholder {
  const cor = (p.cor ?? p.cores?.[0] ?? '').trim()
  const chave = cor.toLowerCase().replace(/\s*\+\d+.*$/, '')
  const bg = HEX_POR_COR[chave] ?? hexDeterministico(`${p.nome}|${cor}`)
  return {
    bg,
    fg: contraste(bg),
    iniciais: iniciaisDe(p.nome),
    cor: cor || '—',
  }
}

/** Duas letras a partir das palavras significativas do nome do produto. */
function iniciaisDe(nome: string): string {
  const ignorar = new Set(['de', 'da', 'do', 'com', 'e', 'em', 'a', 'o', 'para', 'sem'])
  const palavras = nome
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((w) => w.length > 1 && !ignorar.has(w.toLowerCase()))
  const letras = palavras.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '')
  return letras.join('') || nome.slice(0, 2).toUpperCase()
}

/** Hash estável (FNV-1a) → tom sóbrio dentro da paleta da marca. */
function hexDeterministico(chave: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < chave.length; i++) {
    h ^= chave.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  const tons = [
    '#3C5A8A',
    '#6B4A33',
    '#3F6B4E',
    '#8A6A52',
    '#4A4F58',
    '#6B2233',
    '#22375E',
    '#8A8F98',
  ]
  return tons[Math.abs(h) % tons.length]
}

/** Preto ou branco conforme a luminância do fundo. */
export function contraste(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.62 ? '#1B1B1F' : '#FFFFFF'
}

/** Iniciais de pessoa — avatares do kanban, histórico e rodapé da sidebar. */
export function iniciaisPessoa(nome: string): string {
  const partes = nome.split(/\s+/).filter(Boolean)
  return ((partes[0]?.[0] ?? '') + (partes[partes.length - 1]?.[0] ?? '')).toUpperCase()
}

/** Microcopy oficial para empty states e toasts (tom de voz C&A). */
export const TOM_DE_VOZ = {
  vazio: 'A gente se encontra na C&A ❤',
  assinatura: 'A gente se encontra na moda, a gente se encontra na C&A!',
} as const
