import { useState } from 'react'
import { fotoAproximada, fotoDoProduto, legendaDaFoto } from '@/lib/fotos'
import { SilhuetaSVG } from './SilhuetaSVG'

/**
 * Foto do produto em dois níveis:
 *
 *   1. FOTO LOCAL — imagem do catálogo público da C&A, servida de
 *      public/produtos/. É estática: funciona offline e no deploy, sem
 *      nenhuma chamada de rede.
 *   2. SILHUETA — desenho da peça na cor real da variante, para os produtos
 *      que não têm foto e para o caso de a imagem falhar ao carregar.
 *
 * As fotos são JPG de estúdio com fundo branco, então a moldura é branca e a
 * imagem entra com object-contain: a peça aparece inteira, sem corte nem
 * distorção. O aspect-ratio é fixo, então o espaço já está reservado antes de
 * a imagem chegar e nada salta de lugar.
 */

export type TamanhoFoto = 'thumb' | 'card' | 'hero'

/** Lados em px — fixos, para a imagem não empurrar o layout ao carregar. */
const LADO: Record<TamanhoFoto, number> = { thumb: 40, card: 220, hero: 240 }

type Props = {
  cod?: string
  nome: string
  categoria?: string
  cor?: string
  tamanho?: TamanhoFoto
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
  rotulo = false,
  lado: ladoProp,
  className = '',
}: Props) {
  const [quebrou, setQuebrou] = useState(false)
  const [carregando, setCarregando] = useState(true)

  const entrada = fotoDoProduto(cod, nome)
  const foto = entrada?.cores[0]
  const src = foto ? (tamanho === 'thumb' ? foto.img160 : foto.img500) : undefined

  const lado = ladoProp ?? LADO[tamanho]
  const borda = tamanho === 'thumb' ? 'rounded-md' : 'rounded-lg'
  const caixa = tamanho === 'thumb' ? { width: lado, height: lado } : { aspectRatio: '5 / 6' }

  if (!src || quebrou) {
    return (
      <span
        className={`relative shrink-0 overflow-hidden border border-line bg-slate-100 ${borda} ${className}`}
        style={caixa}
      >
        <SilhuetaSVG categoria={categoria} nome={nome} cor={cor} rotulo={rotulo} />
      </span>
    )
  }

  /* o alt descreve o que a foto MOSTRA — nas entradas em que a coleta caiu na
     busca por termo, a imagem é de uma variante da mesma família */
  const legenda = legendaDaFoto(entrada)
  const aproximada = fotoAproximada(entrada)
  const alt = legenda ?? `${nome}${cor ? ` na cor ${cor}` : ''}`
  const titulo = aproximada && legenda ? `Foto de referência — mostra: ${legenda}` : alt

  return (
    <span
      className={`relative shrink-0 overflow-hidden border border-line bg-white ${borda} ${className}`}
      style={caixa}
    >
      {carregando && <span aria-hidden className="shimmer absolute inset-0" />}
      <img
        src={src}
        alt={alt}
        title={titulo}
        loading="lazy"
        decoding="async"
        width={lado}
        height={tamanho === 'thumb' ? lado : Math.round((lado * 6) / 5)}
        /* imagem em cache pode terminar antes de o React ligar o onLoad; sem
           esta checagem o shimmer ficaria por cima da foto para sempre */
        ref={(el) => {
          if (el?.complete) setCarregando(false)
        }}
        onLoad={() => setCarregando(false)}
        onError={() => {
          setQuebrou(true)
          setCarregando(false)
        }}
        className="h-full w-full object-contain"
      />
      {/* Marca a foto que NÃO é do SKU exato. Nessas entradas a coleta caiu na
          busca por termo e trouxe outra peça da mesma família — a cor e às
          vezes o próprio tipo divergem do que a linha diz. Sem esta marca a
          tela afirmaria algo que a imagem contradiz. */}
      {aproximada && tamanho !== 'thumb' && (
        <span
          aria-hidden
          title={titulo}
          className="absolute bottom-1 left-1 rounded bg-white/85 px-1 py-px text-[9.5px] font-semibold text-slate-500 backdrop-blur-sm"
        >
          foto de referência
        </span>
      )}
    </span>
  )
}
