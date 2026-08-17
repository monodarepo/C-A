import { useEffect, useState } from 'react'
import { hydrate, placeholderFor } from '@/lib/cea'

type Props = {
  /** código real do produto — sem ele nem tenta hidratar */
  cod?: string
  nome: string
  cor?: string
  tamanho?: number
  className?: string
}

/**
 * Foto do produto com hidratação opcional: tenta o imageUrl ao vivo pelo
 * conector VTEX e cai num bloco de cor determinístico (cor da variante +
 * iniciais) quando não há foto. Nunca quebra o layout por falta de imagem.
 */
export function FotoProduto({ cod, nome, cor, tamanho = 40, className = '' }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const ph = placeholderFor({ nome, cor })

  useEffect(() => {
    if (!cod) return
    let ativo = true
    hydrate(cod).then((h) => {
      if (ativo && h.imageUrl) setUrl(h.imageUrl)
    })
    return () => {
      ativo = false
    }
  }, [cod])

  const estilo = { width: tamanho, height: tamanho }

  if (url) {
    return (
      <img
        src={url}
        alt={nome}
        loading="lazy"
        style={estilo}
        onError={() => setUrl(null)}
        className={`shrink-0 rounded-md border border-line object-cover ${className}`}
      />
    )
  }

  return (
    <span
      title={`${nome}${cor ? ` · ${cor}` : ''}`}
      aria-label={nome}
      role="img"
      style={{ ...estilo, background: ph.bg, color: ph.fg }}
      className={`grid shrink-0 place-items-center rounded-md border border-line text-[10px] font-bold ${className}`}
    >
      {ph.iniciais}
    </span>
  )
}
