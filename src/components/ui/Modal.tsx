import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  aberto: boolean
  onFechar: () => void
  titulo: ReactNode
  subtitulo?: ReactNode
  children: ReactNode
  rodape?: ReactNode
  largura?: 'sm' | 'md' | 'lg'
}

const LARGURAS = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' } as const

/** Modal simples: fecha no Esc e no backdrop, trava o scroll e devolve o foco. */
export function Modal({
  aberto,
  onFechar,
  titulo,
  subtitulo,
  children,
  rodape,
  largura = 'md',
}: Props) {
  const caixa = useRef<HTMLDivElement>(null)
  const focoAnterior = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!aberto) return

    focoAnterior.current = document.activeElement as HTMLElement
    const overflowOriginal = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    caixa.current?.focus()

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', aoTeclar)

    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowOriginal
      focoAnterior.current?.focus()
    }
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onFechar}
        className="fixed inset-0 cursor-default bg-slate-900/40 backdrop-blur-[1px]"
      />
      <div
        ref={caixa}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${LARGURAS[largura]} rounded-card border border-line bg-card shadow-pop outline-none`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-cea-deep">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-xs text-muted">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="focus-ring -mr-1 -mt-1 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </header>

        <div className="px-5 py-4">{children}</div>

        {rodape && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">
            {rodape}
          </footer>
        )}
      </div>
    </div>
  )
}
