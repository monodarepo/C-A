import { useEffect, useState } from 'react'
import fotos from '@/data/fotos.json'
import { hydrate } from '@/lib/cea'
import { SilhuetaSVG } from './SilhuetaSVG'

/**
 * Foto do produto em três níveis, nesta ordem:
 *
 *   1. LOCAL   — imagem baixada por `npm run fotos` e commitada no repo.
 *                É o caminho normal: funciona offline e no deploy.
 *   2. RUNTIME — só se não houver local: uma tentativa por sessão no conector
 *                VTEX, com timeout curto. Reforço opcional, nunca requisito.
 *   3. SILHUETA — desenho da peça na cor real da variante. É o que aparece se
 *                 os dois de cima falharem, e foi feito para ser apresentável.
 *
 * Nunca renderiza <img> quebrada: qualquer erro de carga cai para a silhueta.
 */

export type TamanhoFoto = 'thumb' | 'card' | 'hero'

type CorFoto = { nome: string; img500: string; img160: string }
type EntradaFoto = {
  nomeReal: string
  marca: string
  precoPor: number | null
  precoDe: number | null
  cores: CorFoto[]
  origem: string
}

const MANIFESTO = fotos as Record<string, EntradaFoto>

/** Lados em px — fixos, para a imagem não empurrar o layout ao carregar. */
const LADO: Record<TamanhoFoto, number> = { thumb: 40, card: 220, hero: 240 }

/* --------------------------------- cache da tentativa de runtime por sessão */

const runtimeTentado = new Map<string, string | null>()

const TIMEOUT_RUNTIME_MS = 2000

async function urlDoRuntime(cod: string): Promise<string | null> {
  if (runtimeTentado.has(cod)) return runtimeTentado.get(cod) ?? null
  const resultado = await Promise.race([
    hydrate(cod).then((h) => h.imageUrl ?? null),
    new Promise<null>((r) => setTimeout(() => r(null), TIMEOUT_RUNTIME_MS)),
  ]).catch(() => null)
  runtimeTentado.set(cod, resultado)
  return resultado
}

/* ------------------------------------------------------------- componente - */

type Props = {
  cod?: string
  nome: string
  categoria?: string
  cor?: string
  tamanho?: TamanhoFoto
  /** índice da cor no manifesto (o Mapa usa para mostrar variantes) */
  indiceCor?: number
  /** nome da cor sobre a silhueta — só faz sentido em card/hero */
  rotulo?: boolean
  /** sobrescreve o lado em px (o dashboard usa thumb de 32) */
  lado?: number
  className?: string
}

export function ProductImage({
  cod,
  nome,
  categoria,
  cor,
  tamanho = 'thumb',
  indiceCor = 0,
  rotulo = false,
  lado: ladoProp,
  className = '',
}: Props) {
  const local = cod ? MANIFESTO[cod]?.cores[indiceCor] : undefined
  const src = local ? (tamanho === 'thumb' ? local.img160 : local.img500) : undefined

  const [urlRuntime, setUrlRuntime] = useState<string | null>(null)
  const [quebrou, setQuebrou] = useState(false)
  const [carregando, setCarregando] = useState(Boolean(src))

  useEffect(() => {
    if (src || !cod) return
    let ativo = true
    urlDoRuntime(cod).then((u) => {
      if (ativo && u) {
        setUrlRuntime(u)
        setCarregando(true)
      }
    })
    return () => {
      ativo = false
    }
  }, [cod, src])

  const lado = ladoProp ?? LADO[tamanho]
  const alt = `${nome}${cor ? ` na cor ${cor}` : ''}`
  const borda = tamanho === 'thumb' ? 'rounded-md' : 'rounded-lg'
  /* aspect-ratio fixo é o que evita o layout shift: o espaço já está reservado */
  const moldura = `relative shrink-0 overflow-hidden border border-line bg-slate-100 ${borda} ${className}`

  const urlFinal = quebrou ? undefined : (src ?? urlRuntime ?? undefined)

  if (!urlFinal) {
    return (
      <span
        className={moldura}
        style={tamanho === 'thumb' ? { width: lado, height: lado } : { aspectRatio: '5 / 6' }}
      >
        <SilhuetaSVG categoria={categoria} nome={nome} cor={cor} rotulo={rotulo} />
      </span>
    )
  }

  return (
    <span
      className={moldura}
      style={tamanho === 'thumb' ? { width: lado, height: lado } : { aspectRatio: '5 / 6' }}
    >
      {carregando && <span aria-hidden className="shimmer absolute inset-0" />}
      <img
        src={urlFinal}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={lado}
        height={tamanho === 'thumb' ? lado : Math.round((lado * 6) / 5)}
        onLoad={() => setCarregando(false)}
        onError={() => {
          setQuebrou(true)
          setCarregando(false)
        }}
        className="h-full w-full object-cover"
      />
    </span>
  )
}
