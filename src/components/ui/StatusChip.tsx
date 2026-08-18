import type { ReactNode } from 'react'

export type TomChip = 'ok' | 'warn' | 'crit' | 'info' | 'neutro' | 'marca' | 'violeta'

const TONS: Record<TomChip, string> = {
  ok: 'bg-[var(--ok-soft)] text-[#0A7355] border-[#A7E8D0]',
  warn: 'bg-[var(--warn-soft)] text-[#A15C00] border-[#F6D8A0]',
  crit: 'bg-[var(--crit-soft)] text-[#A8060F] border-[#F6B8BC]',
  info: 'bg-cea-soft text-cea-blue border-[#C7D4F0]',
  neutro: 'bg-slate-100 text-slate-600 border-slate-200',
  marca: 'bg-cea-blue text-white border-cea-blue',
  violeta: 'bg-violet-50 text-violet-700 border-violet-200',
}

type Props = {
  children: ReactNode
  tom?: TomChip
  /** ponto colorido antes do texto (status de sistema, severidade) */
  ponto?: boolean
  titulo?: string
  className?: string
}

export function StatusChip({ children, tom = 'neutro', ponto, titulo, className = '' }: Props) {
  return (
    <span
      title={titulo}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${TONS[tom]} ${className}`}
    >
      {ponto && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
