import { useId, useState, type ReactNode } from 'react'

type Props = {
  texto: ReactNode
  children?: ReactNode
  /** Lado preferencial do balão. */
  lado?: 'topo' | 'baixo'
  className?: string
}

/**
 * Balão de ajuda leve (sem dependência externa). Aparece em hover e em foco,
 * para o teclado também alcançar as explicações de KPI.
 */
export function Tooltip({ texto, children, lado = 'topo', className = '' }: Props) {
  const [aberto, setAberto] = useState(false)
  const id = useId()

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
    >
      <span
        tabIndex={0}
        aria-describedby={aberto ? id : undefined}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        className="focus-ring inline-flex cursor-help items-center rounded"
      >
        {children ?? (
          <span
            aria-hidden
            className="grid h-4 w-4 place-items-center rounded-full border border-line text-[10px] font-semibold text-muted"
          >
            ?
          </span>
        )}
      </span>
      {aberto && (
        <span
          id={id}
          role="tooltip"
          className={`absolute left-1/2 z-40 w-60 -translate-x-1/2 rounded-lg bg-cea-deep px-3 py-2 text-xs font-normal leading-snug text-white shadow-pop ${
            lado === 'topo' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {texto}
        </span>
      )}
    </span>
  )
}
