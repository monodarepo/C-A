import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ReactNode } from 'react'
import { SectionCard } from '@/components/ui/SectionCard'
import { formatDelta, formatNum, formatPct } from '@/lib/format'
import {
  META_MARGEM_OTB,
  OTB_MENSAL_CALCULADO,
  type LinhaOTB,
  type TotaisOTB,
} from '@/data/derived'

/* Paleta de dados: tokens --viz-*, validados para contraste e daltonismo. */
const AZUL = 'var(--viz-azul)'
const AZUL_CLARO = 'var(--viz-azul-claro)'
const REF = 'var(--viz-ref)'
const OK = 'var(--ok)'
const WARN = 'var(--warn)'

const EIXO = { fontSize: 11, fill: 'var(--ink-muted)' }
const GRADE = 'var(--border)'

/** R$ em milhões — a unidade de toda esta tela. */
const mi = (v: number, casas = 0) => `R$ ${formatNum(v, casas)} mi`

/**
 * Rótulo curto para o eixo X horizontal: rótulos até 9 caracteres passam
 * inteiros; nos maiores, cada palavra com mais de 5 letras vira as 3 primeiras
 * + ponto ("Moda Íntima" → "Moda Ínt.", "Esportivo ACE" → "Esp. ACE"). O nome
 * completo segue no tooltip.
 */
const abreviarRotulo = (rotulo: string) =>
  rotulo.length <= 9
    ? rotulo
    : rotulo
        .split(' ')
        .map((palavra) => (palavra.length > 5 ? `${palavra.slice(0, 3)}.` : palavra))
        .join(' ')

function Legenda({ itens }: { itens: { cor: string; rotulo: string }[] }) {
  return (
    <span className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
      {itens.map((i) => (
        <span key={i.rotulo} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: i.cor, outline: '1px solid var(--border)' }}
          />
          {i.rotulo}
        </span>
      ))}
    </span>
  )
}

function CaixaTooltip({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-card px-3 py-2 text-[12px] shadow-pop">
      {children}
    </div>
  )
}

/* ============================================================ (a) mensal == */

type PontoMensal = (typeof OTB_MENSAL_CALCULADO)[number]

/**
 * Tooltip único dos dois painéis mensais: "DEZ · Plano R$ 402 mi ·
 * LY R$ 371 mi · +8,4%" (exemplo da spec).
 */
function TooltipMensal({ active, label }: { active?: boolean; label?: string | number }) {
  if (!active) return null
  const ponto = OTB_MENSAL_CALCULADO.find((m) => m.mes === label)
  if (!ponto) return null
  return (
    <CaixaTooltip>
      <p className="font-semibold text-cea-deep">{ponto.mes}</p>
      <p className="num mt-1 text-slate-600">
        Plano <strong className="text-ink">{mi(ponto.plano)}</strong> · LY {mi(ponto.ly)} ·{' '}
        <strong className={ponto.crescimento >= 0 ? 'text-ok' : 'text-crit'}>
          {formatDelta(ponto.crescimento)}
        </strong>
      </p>
      <p className="num mt-0.5 text-[11px] text-muted">
        Estoque projetado {mi(ponto.estoque)} · cobertura{' '}
        {formatNum(ponto.coberturaSemanas, 1)} semanas
      </p>
    </CaixaTooltip>
  )
}

/**
 * Plano × LY por mês + crescimento %.
 * Dois painéis empilhados compartilhando o eixo de meses (syncId), em vez de um
 * gráfico de eixo duplo: R$ e % têm escalas diferentes e sobrepor as duas num só
 * plano inventa uma correlação que não está no dado.
 */
export function GraficoMensal() {
  const dados: PontoMensal[] = OTB_MENSAL_CALCULADO

  return (
    <SectionCard
      titulo="Plano × ano anterior"
      subtitulo="Sazonalidade do verão 26-27, de agosto a fevereiro"
      acoes={
        <Legenda
          itens={[
            { cor: AZUL, rotulo: 'Plano 26-27' },
            { cor: REF, rotulo: 'Ano anterior' },
          ]}
        />
      }
    >
      <div className="h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} syncId="otbMensal" margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={GRADE} vertical={false} />
            <XAxis dataKey="mes" tick={EIXO} axisLine={false} tickLine={false} />
            <YAxis
              tick={EIXO}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(v: number) => formatNum(v)}
            />
            <Tooltip content={<TooltipMensal />} cursor={{ fill: 'var(--cea-blue-soft)' }} />
            <Bar dataKey="ly" name="Ano anterior" fill={REF} radius={[4, 4, 0, 0]} maxBarSize={26} />
            <Bar dataKey="plano" name="Plano" fill={AZUL} radius={[4, 4, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 h-[92px]">
        <p className="kpi-label mb-1">Crescimento sobre o ano anterior</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} syncId="otbMensal" margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={GRADE} vertical={false} />
            <XAxis dataKey="mes" tick={EIXO} axisLine={false} tickLine={false} />
            <YAxis
              tick={EIXO}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(v: number) => `${formatNum(v)}%`}
            />
            <Tooltip content={<TooltipMensal />} />
            <Line
              type="monotone"
              dataKey="crescimento"
              stroke={AZUL}
              strokeWidth={2}
              dot={{ r: 3, fill: AZUL, stroke: 'var(--card)', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        R$ e % em painéis separados, com o mesmo eixo de meses — passe o mouse em qualquer um dos
        dois para ver os três números do mês.
      </p>
    </SectionCard>
  )
}

/* ================================================ (b) comprometido × ATB == */

export function GraficoComprometido({ linhas, totais }: { linhas: LinhaOTB[]; totais: TotaisOTB }) {
  const dados = linhas.map((l) => ({
    categoria: l.categoria,
    comprometido: l.otb - l.atb,
    atb: l.atb,
  }))

  return (
    <SectionCard
      titulo="OTB comprometido × ATB"
      subtitulo={`${mi(totais.comprometido)} já comprometidos e ${mi(totais.atb)} livres para recompra`}
      acoes={
        <Legenda
          itens={[
            { cor: AZUL, rotulo: 'Comprometido' },
            { cor: AZUL_CLARO, rotulo: 'ATB (livre)' },
          ]}
        />
      }
    >
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={GRADE} vertical={false} />
            <XAxis
              dataKey="categoria"
              tick={{ ...EIXO, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={0}
              tickFormatter={abreviarRotulo}
            />
            <YAxis
              tick={EIXO}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(v: number) => formatNum(v)}
            />
            <Tooltip
              cursor={{ fill: 'var(--cea-blue-soft)' }}
              content={({ active, label, payload }) => {
                if (!active || !payload?.length) return null
                const comprometido = Number(payload.find((p) => p.dataKey === 'comprometido')?.value ?? 0)
                const atb = Number(payload.find((p) => p.dataKey === 'atb')?.value ?? 0)
                return (
                  <CaixaTooltip>
                    <p className="font-semibold text-cea-deep">{label}</p>
                    <p className="num mt-1 text-slate-600">
                      Comprometido <strong className="text-ink">{mi(comprometido)}</strong>
                    </p>
                    <p className="num text-slate-600">
                      ATB livre <strong className="text-ink">{mi(atb)}</strong>
                    </p>
                    <p className="num mt-0.5 text-[11px] text-muted">
                      OTB da categoria {mi(comprometido + atb)} ·{' '}
                      {formatPct((atb / (comprometido + atb)) * 100)} livre
                    </p>
                  </CaixaTooltip>
                )
              }}
            />
            {/* stroke da cor do card cria o vão de 2px entre os segmentos */}
            <Bar
              dataKey="comprometido"
              stackId="otb"
              fill={AZUL}
              maxBarSize={38}
              stroke="var(--card)"
              strokeWidth={2}
            />
            <Bar
              dataKey="atb"
              stackId="otb"
              fill={AZUL_CLARO}
              radius={[4, 4, 0, 0]}
              maxBarSize={38}
              stroke="var(--card)"
              strokeWidth={2}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  )
}

/* ==================================================== (c) estoque × cob === */

/**
 * Estoque projetado + cobertura. Mesmo tratamento do gráfico mensal: R$ e
 * semanas em painéis separados, nunca dois eixos no mesmo plano.
 */
export function GraficoEstoque() {
  const dados = OTB_MENSAL_CALCULADO

  return (
    <SectionCard
      titulo="Estoque projetado e cobertura"
      subtitulo="Fim de cada mês, no ritmo de venda planejado"
      acoes={<Legenda itens={[{ cor: AZUL_CLARO, rotulo: 'Estoque projetado' }]} />}
    >
      <div className="h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} syncId="otbEstoque" margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={GRADE} vertical={false} />
            <XAxis dataKey="mes" tick={EIXO} axisLine={false} tickLine={false} />
            <YAxis
              tick={EIXO}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(v: number) => formatNum(v)}
            />
            <Tooltip content={<TooltipMensal />} cursor={{ fill: 'var(--cea-blue-soft)' }} />
            <Bar dataKey="estoque" fill={AZUL_CLARO} radius={[4, 4, 0, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 h-[92px]">
        <p className="kpi-label mb-1">Cobertura em semanas</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} syncId="otbEstoque" margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={GRADE} vertical={false} />
            <XAxis dataKey="mes" tick={EIXO} axisLine={false} tickLine={false} />
            <YAxis
              tick={EIXO}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(v: number) => formatNum(v)}
            />
            <Tooltip content={<TooltipMensal />} />
            <Line
              type="monotone"
              dataKey="coberturaSemanas"
              stroke={AZUL}
              strokeWidth={2}
              dot={{ r: 3, fill: AZUL, stroke: 'var(--card)', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  )
}

/* ================================================== (d) margem por cat === */

export function GraficoMargem({ linhas, totais }: { linhas: LinhaOTB[]; totais: TotaisOTB }) {
  const dados = [...linhas]
    .sort((a, b) => b.margem - a.margem)
    .map((l) => ({ categoria: l.categoria, margem: l.margem }))

  const abaixo = linhas.filter((l) => l.margem < META_MARGEM_OTB).length

  return (
    <SectionCard
      titulo="Margem planejada por categoria"
      subtitulo={`Meta de ${formatPct(META_MARGEM_OTB, 0)} · ${abaixo} categorias abaixo · consolidado ${formatPct(totais.margem)}`}
      acoes={
        <Legenda
          itens={[
            { cor: OK, rotulo: `≥ meta` },
            { cor: WARN, rotulo: `< meta` },
          ]}
        />
      }
    >
      <div className="h-[316px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dados}
            layout="vertical"
            margin={{ top: 4, right: 44, bottom: 0, left: 8 }}
          >
            <CartesianGrid stroke={GRADE} horizontal={false} />
            <XAxis
              type="number"
              domain={[50, 66]}
              tick={EIXO}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${formatNum(v)}%`}
            />
            <YAxis
              type="category"
              dataKey="categoria"
              tick={{ ...EIXO, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={96}
            />
            <Tooltip
              cursor={{ fill: 'var(--cea-blue-soft)' }}
              content={({ active, label, payload }) => {
                if (!active || !payload?.length) return null
                const margem = Number(payload[0].value)
                const delta = margem - META_MARGEM_OTB
                return (
                  <CaixaTooltip>
                    <p className="font-semibold text-cea-deep">{label}</p>
                    <p className="num mt-1 text-slate-600">
                      Margem planejada <strong className="text-ink">{formatPct(margem)}</strong>
                    </p>
                    <p className={`num text-[11px] ${delta >= 0 ? 'text-ok' : 'text-warn'}`}>
                      {delta >= 0 ? 'acima' : 'abaixo'} da meta em{' '}
                      {formatNum(Math.abs(delta), 1)} p.p.
                    </p>
                  </CaixaTooltip>
                )
              }}
            />
            <ReferenceLine
              x={META_MARGEM_OTB}
              stroke="var(--ink-muted)"
              strokeDasharray="4 3"
              label={{
                value: `meta ${formatPct(META_MARGEM_OTB, 0)}`,
                position: 'top',
                fontSize: 10,
                fill: 'var(--ink-muted)',
              }}
            />
            {/* rótulo direto em cada barra: exigido porque verde e âmbar ficam
                abaixo de 3:1 no branco — a leitura não pode depender só da cor */}
            <Bar dataKey="margem" radius={[0, 4, 4, 0]} maxBarSize={18} label={RotuloMargem}>
              {dados.map((d) => (
                <Cell key={d.categoria} fill={d.margem >= META_MARGEM_OTB ? OK : WARN} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function RotuloMargem(props: any) {
  const { x, y, width, height, value } = props
  return (
    <text
      x={Number(x) + Number(width) + 6}
      y={Number(y) + Number(height) / 2 + 4}
      className="num"
      fontSize={11}
      fontWeight={600}
      fill="var(--ink)"
    >
      {formatPct(Number(value))}
    </text>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */
