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

/**
 * O Intl devolve hífen no negativo (-R$ 1,38); o resto da UI usa o menos
 * tipográfico (−) do formatDelta. Uma função só normaliza os dois, senão a
 * mesma tela mistura os dois traços.
 */
function menos(texto: string): string {
  return texto.replace(/-/g, '−')
}

/** R$ 159,99 */
export function formatBRL(v: number, casas: 0 | 2 = 2): string {
  return menos(casas === 0 ? BRL0.format(v) : BRL.format(v))
}

/**
 * R$ 2,08 bi · R$ 435 mi · R$ 46,4 mil — escala automática para KPIs.
 * Negativo leva o sinal ANTES do R$ (−R$ 210,5 mil), como o resto da UI.
 */
export function formatBRLCompact(v: number, casas = 1): string {
  const abs = Math.abs(v)
  const sinalPrefixo = v < 0 ? '−' : ''
  if (abs >= 1e9) return `${sinalPrefixo}R$ ${formatNum(abs / 1e9, casas)} bi`
  if (abs >= 1e6) return `${sinalPrefixo}R$ ${formatNum(abs / 1e6, casas)} mi`
  if (abs >= 1e3) return `${sinalPrefixo}R$ ${formatNum(abs / 1e3, casas)} mil`
  return formatBRL(v)
}

/** 1.208.400 */
export function formatNum(v: number, casas = 0): string {
  return menos(
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    }).format(v),
  )
}

/** 1,2 mi · 246,8 mil — para eixos de gráfico e contadores. */
export function formatCompact(v: number, casas = 1): string {
  const abs = Math.abs(v)
  if (abs >= 1e9) return `${formatNum(v / 1e9, casas)} bi`
  if (abs >= 1e6) return `${formatNum(v / 1e6, casas)} mi`
  if (abs >= 1e3) return `${formatNum(v / 1e3, casas)} mil`
  return menos(NUM.format(v))
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

/**
 * "3 lojas" / "1 loja" — concordância de verdade no lugar do "(s)" de
 * programador. Zero segue o plural do pt-BR ("0 registros").
 */
export function plural(n: number, singular: string, formaPlural?: string): string {
  return `${formatNum(n)} ${n === 1 ? singular : (formaPlural ?? `${singular}s`)}`
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

/* ------------------------------------------------- semanas ISO e datas ---- */

/** Segunda-feira da semana ISO informada (base do Gantt anual). */
export function segundaDaSemanaISO(semana: number, ano = 2026): Date {
  const jan4 = new Date(Date.UTC(ano, 0, 4))
  const diaDeJan4 = (jan4.getUTCDay() + 6) % 7 // 0 = segunda
  const segundaDaSemana1 = new Date(jan4)
  segundaDaSemana1.setUTCDate(jan4.getUTCDate() - diaDeJan4)
  const d = new Date(segundaDaSemana1)
  d.setUTCDate(segundaDaSemana1.getUTCDate() + (semana - 1) * 7)
  return d
}

/** Número da semana ISO de uma data. */
export function semanaISO(data: Date): number {
  const d = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()))
  const diaDaSemana = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - diaDaSemana + 3) // quinta da mesma semana ISO
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  const diaDeJan4 = (jan4.getUTCDay() + 6) % 7
  const segundaDaSemana1 = new Date(jan4)
  segundaDaSemana1.setUTCDate(jan4.getUTCDate() - diaDeJan4)
  return Math.floor((d.getTime() - segundaDaSemana1.getTime()) / (7 * 86_400_000)) + 1
}

/** 12/05 — data curta para cards de kanban. */
export function formatDataCurta(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
}

/** "10/05/2026" → Date (UTC), formato do snapshot. */
export function dataDoSnapshot(br: string): Date {
  const [dia, mes, ano] = br.split('/').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia))
}
