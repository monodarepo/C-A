import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ReactNode } from 'react'
import { HISTORICO } from '@/data/derived'
import { formatNum, formatPct } from '@/lib/format'

/* Paleta de dados: tokens --viz-*, validados para contraste e daltonismo. */
const AZUL = 'var(--viz-azul)'
const AZUL_CLARO = 'var(--viz-azul-claro)'

const EIXO = { fontSize: 11, fill: 'var(--ink-muted)' }
const GRADE = 'var(--border)'

export type PontoMes = { mes: string; receita: number; margem: number; pecas: number }

function CaixaTooltip({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-card px-3 py-2 text-[12px] shadow-pop">
      {children}
    </div>
  )
}

function TooltipMes({ active, payload }: { active?: boolean; payload?: { payload: PontoMes }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <CaixaTooltip>
      <p className="font-semibold text-cea-deep">{p.mes}</p>
      <p className="num mt-0.5 text-muted">
        R$ {formatNum(p.receita / 1e6, 1)} mi · {formatNum(p.pecas)} pç
      </p>
      <p className="num text-muted">margem {formatPct(p.margem)}</p>
    </CaixaTooltip>
  )
}

/**
 * Receita e margem em dois painéis empilhados com o mesmo eixo de meses
 * (syncId), não num gráfico de eixo duplo: R$ e % têm escalas diferentes e
 * sobrepor as duas num plano só inventa uma correlação que o dado não tem.
 */
export function GraficoMensalHistorico({ dados }: { dados: PontoMes[] }) {
  return (
    <div>
      <div className="h-[196px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dados} syncId="histMensal" margin={{ top: 4, right: 8, bottom: 0, left: -6 }}>
            <defs>
              <linearGradient id="areaReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={AZUL} stopOpacity={0.28} />
                <stop offset="100%" stopColor={AZUL} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRADE} vertical={false} />
            <XAxis dataKey="mes" tick={EIXO} axisLine={false} tickLine={false} />
            <YAxis
              tick={EIXO}
              axisLine={false}
              tickLine={false}
              width={54}
              tickFormatter={(v: number) => `${formatNum(v / 1e6, 0)} mi`}
            />
            <Tooltip content={<TooltipMes />} />
            <Area
              type="monotone"
              dataKey="receita"
              name="Receita"
              stroke={AZUL}
              strokeWidth={2}
              fill="url(#areaReceita)"
              dot={{ r: 2.5, fill: AZUL }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 h-[104px]">
        <p className="kpi-label mb-1">Margem bruta do mês</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} syncId="histMensal" margin={{ top: 4, right: 8, bottom: 0, left: -6 }}>
            <CartesianGrid stroke={GRADE} vertical={false} />
            <XAxis dataKey="mes" tick={EIXO} axisLine={false} tickLine={false} />
            <YAxis
              tick={EIXO}
              axisLine={false}
              tickLine={false}
              width={54}
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(v: number) => `${formatNum(v, 0)}%`}
            />
            <Tooltip content={<TooltipMes />} />
            {/* Sem rótulo no plot: a média aparece no subtítulo do card, onde
                não colide com o último ponto da série na borda direita. */}
            <ReferenceLine y={HISTORICO.margem} stroke={AZUL_CLARO} strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="margem"
              name="Margem"
              stroke={AZUL}
              strokeWidth={2}
              dot={{ r: 2.5, fill: AZUL }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
