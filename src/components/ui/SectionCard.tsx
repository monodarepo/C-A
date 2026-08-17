import type { ReactNode } from 'react'

type Props = {
  titulo?: ReactNode
  subtitulo?: ReactNode
  tag?: ReactNode
  acoes?: ReactNode
  children: ReactNode
  /** remove o padding do corpo — útil para tabelas encostarem na borda */
  compacto?: boolean
  className?: string
}

export function SectionCard({
  titulo,
  subtitulo,
  tag,
  acoes,
  children,
  compacto,
  className = '',
}: Props) {
  return (
    <section className={`card-base flex flex-col ${className}`}>
      {(titulo || acoes) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {titulo && <h2 className="text-sm font-semibold text-ink">{titulo}</h2>}
              {tag}
            </div>
            {subtitulo && <p className="mt-0.5 text-xs text-muted">{subtitulo}</p>}
          </div>
          {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
        </header>
      )}
      <div className={compacto ? 'min-w-0 flex-1' : 'min-w-0 flex-1 p-4'}>{children}</div>
    </section>
  )
}
