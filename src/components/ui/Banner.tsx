import type { ReactNode } from 'react'

export type TomBanner = 'info' | 'warn' | 'crit' | 'ok'

const TONS: Record<TomBanner, { box: string; icone: string; titulo: string }> = {
  info: {
    box: 'border-[#C7D4F0] bg-cea-soft',
    icone: 'text-cea-blue',
    titulo: 'text-cea-deep',
  },
  warn: {
    box: 'border-[#F6D8A0] bg-[var(--warn-soft)]',
    icone: 'text-warn',
    titulo: 'text-[#A15C00]',
  },
  crit: {
    box: 'border-[#F6B8BC] bg-[var(--crit-soft)]',
    icone: 'text-crit',
    titulo: 'text-[#A8060F]',
  },
  ok: { box: 'border-[#A7E8D0] bg-[var(--ok-soft)]', icone: 'text-ok', titulo: 'text-[#0A7355]' },
}

const ICONES: Record<TomBanner, string> = { info: 'ℹ', warn: '⚠', crit: '⛔', ok: '✓' }

type Props = {
  tom?: TomBanner
  titulo?: ReactNode
  children?: ReactNode
  acoes?: ReactNode
  className?: string
}

export function Banner({ tom = 'info', titulo, children, acoes, className = '' }: Props) {
  const t = TONS[tom]
  return (
    <div className={`flex items-start gap-3 rounded-card border px-4 py-3 ${t.box} ${className}`}>
      <span aria-hidden className={`mt-0.5 text-sm font-bold ${t.icone}`}>
        {ICONES[tom]}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        {titulo && <p className={`font-semibold ${t.titulo}`}>{titulo}</p>}
        {children && <div className="mt-0.5 leading-snug text-slate-600">{children}</div>}
      </div>
      {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
    </div>
  )
}
