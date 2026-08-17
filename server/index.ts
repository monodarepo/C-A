/**
 * Mini-backend do mockup — proxy para o catálogo público (VTEX) da cea.com.br.
 * Existe apenas para evitar CORS no browser. Não há banco, auth ou regra de negócio.
 *
 * Contrato (CLAUDE.md):
 *   GET /api/cea/search?term=...  → busca por termo
 *   GET /api/cea/ref/:cod         → busca por RefId (código do produto)
 *   GET /api/cea/logo             → extrai {blue, red} dos fills do logo oficial
 *
 * Regras: timeout de 3s, cache em memória por 1h, e em QUALQUER erro/timeout
 * responder { fallback: true } para o front cair no snapshot local.
 */
import express from 'express'
import cors from 'cors'

const PORT = Number(process.env.API_PORT ?? 3001)
const VTEX = 'https://www.cea.com.br'
const TIMEOUT_MS = 3000
const TTL_MS = 60 * 60 * 1000

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

type CacheEntry = { at: number; payload: unknown }
const cache = new Map<string, CacheEntry>()

function fromCache(key: string): unknown | undefined {
  const hit = cache.get(key)
  if (!hit) return undefined
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(key)
    return undefined
  }
  return hit.payload
}

function toCache(key: string, payload: unknown) {
  cache.set(key, { at: Date.now(), payload })
}

async function fetchUpstream(url: string, accept: string) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: accept },
    })
    if (!res.ok) throw new Error(`upstream ${res.status}`)
    return res
  } finally {
    clearTimeout(timer)
  }
}

/** Reduz o payload VTEX ao que o app usa, para não trafegar 200kB por produto. */
type SlimProduct = {
  cod: string | null
  nome: string
  marca: string | null
  categorias: string[]
  imageUrl: string | null
  precoPor: number | null
  precoDe: number | null
  disponivel: boolean
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function slim(raw: any): SlimProduct {
  const item = raw?.items?.[0] ?? {}
  const offer = item?.sellers?.[0]?.commertialOffer ?? {}
  const price = typeof offer.Price === 'number' && offer.Price > 0 ? offer.Price : null
  const listPrice =
    typeof offer.ListPrice === 'number' && offer.ListPrice > 0 ? offer.ListPrice : null
  return {
    cod: raw?.productReference ?? item?.referenceId?.[0]?.Value ?? null,
    nome: raw?.productName ?? '',
    marca: raw?.brand ?? null,
    categorias: Array.isArray(raw?.categories) ? raw.categories : [],
    imageUrl: item?.images?.[0]?.imageUrl ?? null,
    precoPor: price,
    precoDe: listPrice && listPrice !== price ? listPrice : null,
    disponivel: (offer.AvailableQuantity ?? 0) > 0,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const app = express()
app.use(cors())

app.get('/api/cea/health', (_req, res) => {
  res.json({ ok: true, cacheKeys: cache.size, ttlMin: TTL_MS / 60000 })
})

app.get('/api/cea/search', async (req, res) => {
  const term = String(req.query.term ?? '').trim()
  if (!term) return res.status(400).json({ fallback: true, erro: 'informe ?term=' })

  const key = `search:${term.toLowerCase()}`
  const cached = fromCache(key)
  if (cached) return res.json(cached)

  try {
    const url = `${VTEX}/api/catalog_system/pub/products/search/${encodeURIComponent(term)}?_from=0&_to=19`
    const upstream = await fetchUpstream(url, 'application/json')
    const raw = (await upstream.json()) as unknown[]
    const payload = {
      fallback: false,
      term,
      total: Number(upstream.headers.get('resources')?.split('/')?.[1] ?? raw.length),
      produtos: raw.map(slim),
    }
    toCache(key, payload)
    res.json(payload)
  } catch {
    res.json({ fallback: true, term, produtos: [] })
  }
})

app.get('/api/cea/ref/:cod', async (req, res) => {
  const cod = String(req.params.cod).replace(/\D/g, '')
  if (!cod) return res.status(400).json({ fallback: true, erro: 'código inválido' })

  const key = `ref:${cod}`
  const cached = fromCache(key)
  if (cached) return res.json(cached)

  try {
    const url = `${VTEX}/api/catalog_system/pub/products/search/?fq=alternateIds_RefId:${cod}`
    const upstream = await fetchUpstream(url, 'application/json')
    const raw = (await upstream.json()) as unknown[]
    if (!raw.length) throw new Error('sem resultado')
    const payload = { fallback: false, cod, produto: slim(raw[0]) }
    toCache(key, payload)
    res.json(payload)
  } catch {
    res.json({ fallback: true, cod, produto: null })
  }
})

/** Baixa a home, procura o SVG/CSS do logo e devolve os dois fills da marca. */
app.get('/api/cea/logo', async (_req, res) => {
  const key = 'logo'
  const cached = fromCache(key)
  if (cached) return res.json(cached)

  try {
    const upstream = await fetchUpstream(VTEX, 'text/html')
    const html = await upstream.text()
    const hexes = [...html.matchAll(/#([0-9a-fA-F]{6})\b/g)].map((m) => `#${m[1].toUpperCase()}`)

    // azul-marinho C&A Brasil: R baixo, B alto. vermelho promo: R alto, G/B baixos.
    const isBlue = (h: string) => {
      const [r, g, b] = rgb(h)
      return b > 90 && b - r > 60 && b - g > 40
    }
    const isRed = (h: string) => {
      const [r, g, b] = rgb(h)
      return r > 150 && r - g > 90 && r - b > 90
    }
    const blue = hexes.find(isBlue) ?? null
    const red = hexes.find(isRed) ?? null
    if (!blue && !red) throw new Error('fills não localizados')

    const payload = { fallback: false, blue, red, fonte: 'cea.com.br (html/css)' }
    toCache(key, payload)
    res.json(payload)
  } catch {
    res.json({ fallback: true, blue: null, red: null })
  }
})

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

app.listen(PORT, () => {
  console.log(`[api] conector VTEX C&A em http://localhost:${PORT}/api/cea`)
})
