import { Area, AreaChart, ResponsiveContainer } from 'recharts'

type Props = {
  dados: { i: number; v: number }[]
  /** cor da linha — default azul C&A; use var(--ok)/var(--crit) para tendência */
  cor?: string
  altura?: number
  className?: string
}

/** Mini-gráfico sem eixos, para dentro de KpiCards e listas. */
export function Sparkline({ dados, cor = 'var(--cea-blue)', altura = 34, className = '' }: Props) {
  const id = `spark-${cor.replace(/[^a-z0-9]/gi, '')}`
  return (
    <div className={className} style={{ height: altura }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dados} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cor} stopOpacity={0.28} />
              <stop offset="100%" stopColor={cor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={cor}
            strokeWidth={1.8}
            fill={`url(#${id})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
