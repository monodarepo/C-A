import type { ReactNode } from 'react'

type Props = {
  titulo: string
  subtitulo?: ReactNode
  /** chips/badges logo abaixo do subtítulo */
  meta?: ReactNode
  acoes?: ReactNode
  className?: string
}

/** Cabeçalho padrão de tela: título + subtítulo + ações (spec de cada fase). */
export function PageHeader({ titulo, subtitulo, meta, acoes, className = '' }: Props) {
  return (
    <header className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="font-display text-[22px] font-semibold leading-tight text-cea-deep">
          {titulo}
        </h1>
        {subtitulo && <p className="mt-1 text-sm text-muted">{subtitulo}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  )
}
