import type { ReactNode } from 'react'
import { Tooltip } from './Tooltip'
import { StatusChip, type TomChip } from './StatusChip'

export type TomSub = 'alta' | 'baixa' | 'neutra' | 'alerta'

const COR_SUB: Record<TomSub, string> = {
  alta: 'text-ok',
  baixa: 'text-crit',
  neutra: 'text-muted',
  alerta: 'text-warn',
}

/** 'alerta' não leva seta: é um aviso de patamar, não uma direção de variação. */
const SETA: Record<TomSub, string> = { alta: '▲', baixa: '▼', neutra: '', alerta: '' }

type Props = {
  label: string
  valor: ReactNode
  /** subtexto colorido com seta (ex.: "+2,4 p.p. vs LY") */
  sub?: ReactNode
  tomSub?: TomSub
  /** explicação do indicador — abre no "?" ao lado do label */
  dica?: ReactNode
  badge?: { texto: string; tom?: TomChip }
  /** sparkline ou barra de apoio no pé do card */
  extra?: ReactNode
  loading?: boolean
  onClick?: () => void
  className?: string
}

export function KpiCard({
  label,
  valor,
  sub,
  tomSub = 'neutra',
  dica,
  badge,
  extra,
  loading,
  onClick,
  className = '',
}: Props) {
  if (loading) {
    return (
      <div className={`card-base p-4 ${className}`}>
        <div className="skeleton h-3 w-24" />
        <div className="skeleton mt-3 h-7 w-28" />
        <div className="skeleton mt-3 h-3 w-20" />
      </div>
    )
  }

  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      {...(onClick ? { onClick, type: 'button' as const } : {})}
      className={`card-base p-4 text-left ${
        onClick ? 'focus-ring transition hover:border-cea-blue/40 hover:shadow-pop' : ''
      } ${className}`}
    >
      {/* min-h reserva duas linhas de label: assim os valores de uma fileira de
          KpiCards ficam na mesma linha de base, mesmo com rótulos de tamanhos
          diferentes ("Cobertura" × "Aderência IA · distribuição"). */}
      <div className="flex min-h-[30px] items-start justify-between gap-2">
        <span className="kpi-label leading-tight">{label}</span>
        {dica && <Tooltip texto={dica} />}
      </div>

      <p className="mt-2 font-display text-[26px] font-semibold leading-none text-cea-deep">
        {valor}
      </p>

      {(sub || badge) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {sub && (
            <span className={`text-xs font-medium ${COR_SUB[tomSub]}`}>
              {SETA[tomSub] && <span aria-hidden>{SETA[tomSub]} </span>}
              {sub}
            </span>
          )}
          {badge && <StatusChip tom={badge.tom ?? 'info'}>{badge.texto}</StatusChip>}
        </div>
      )}

      {extra && <div className="mt-3">{extra}</div>}
    </Wrapper>
  )
}
