/** Formatação pt-BR — todo número exibido na UI passa por aqui. */

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

const BRL0 = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const NUM = new Intl.NumberFormat('pt-BR')

/** R$ 159,99 */
export function formatBRL(v: number, casas: 0 | 2 = 2): string {
  return casas === 0 ? BRL0.format(v) : BRL.format(v)
}

/** R$ 2,08 bi · R$ 435 mi · R$ 46,4 mil — escala automática para KPIs. */
export function formatBRLCompact(v: number, casas = 1): string {
  const abs = Math.abs(v)
  if (abs >= 1e9) return `R$ ${formatNum(v / 1e9, casas)} bi`
  if (abs >= 1e6) return `R$ ${formatNum(v / 1e6, casas)} mi`
  if (abs >= 1e3) return `R$ ${formatNum(v / 1e3, casas)} mil`
  return formatBRL(v)
}

/** 1.208.400 */
export function formatNum(v: number, casas = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(v)
}

/** 1,2 mi · 246,8 mil — para eixos de gráfico e contadores. */
export function formatCompact(v: number, casas = 1): string {
  const abs = Math.abs(v)
  if (abs >= 1e9) return `${formatNum(v / 1e9, casas)} bi`
  if (abs >= 1e6) return `${formatNum(v / 1e6, casas)} mi`
  if (abs >= 1e3) return `${formatNum(v / 1e3, casas)} mil`
  return NUM.format(v)
}

/** 59,1% — recebe o número já em pontos percentuais (59.1), não a fração. */
export function formatPct(v: number, casas = 1): string {
  return `${formatNum(v, casas)}%`
}

/** +2,4 p.p. / −5 p.p. — variação em pontos percentuais, com sinal. */
export function formatPP(v: number, casas = 1): string {
  return `${sinal(v)}${formatNum(Math.abs(v), casas)} p.p.`
}

/** +33,3% / −12,0% — variação relativa, com sinal. */
export function formatDelta(v: number, casas = 1): string {
  return `${sinal(v)}${formatNum(Math.abs(v), casas)}%`
}

/** 46 dias · 12,8 sem */
export function formatDias(v: number): string {
  return `${formatNum(v, v % 1 === 0 ? 0 : 1)} dias`
}

export function formatPecas(v: number): string {
  return `${formatNum(v)} pç`
}

/** 14:32 — timestamp curto para "último push" e históricos. */
export function formatHora(d: Date): string {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDataHora(d: Date): string {
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${formatHora(d)}`
}

function sinal(v: number): string {
  if (v > 0) return '+'
  if (v < 0) return '−' // sinal de menos tipográfico (U+2212)
  return ''
}

/** Direção de uma variação — usada para pintar o subtexto dos KpiCards. */
export type Tendencia = 'alta' | 'baixa' | 'neutra'

export function tendencia(v: number): Tendencia {
  if (v > 0) return 'alta'
  if (v < 0) return 'baixa'
  return 'neutra'
}
