export type TomBarra = 'marca' | 'ok' | 'warn' | 'crit' | 'neutro'

const CORES: Record<TomBarra, string> = {
  marca: 'bg-cea-blue',
  ok: 'bg-ok',
  warn: 'bg-warn',
  crit: 'bg-crit',
  neutro: 'bg-slate-300',
}

type Props = {
  /** valor absoluto; a barra é valor/max */
  valor: number
  max?: number
  tom?: TomBarra
  /** compara com uma meta: acima = verde, abaixo = âmbar (ignora `tom`) */
  meta?: number
  altura?: number
  /** texto à direita da barra */
  rotulo?: string
  className?: string
}

/** Barra de proporção — sell-through em tabela, share por cidade, banda de verba. */
export function Barra({
  valor,
  max = 100,
  tom = 'marca',
  meta,
  altura = 6,
  rotulo,
  className = '',
}: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (valor / max) * 100)) : 0
  const cor = meta === undefined ? CORES[tom] : valor >= meta ? CORES.ok : CORES.warn

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="relative min-w-[48px] flex-1 overflow-hidden rounded-full bg-slate-200/80"
        style={{ height: altura }}
        role="img"
        aria-label={rotulo ?? `${pct.toFixed(0)}%`}
      >
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${pct}%` }} />
        {meta !== undefined && meta > 0 && meta <= max && (
          <span
            aria-hidden
            title={`Meta ${meta}`}
            className="absolute top-0 h-full w-px bg-slate-500/70"
            style={{ left: `${(meta / max) * 100}%` }}
          />
        )}
      </div>
      {rotulo && <span className="num w-11 shrink-0 text-right text-xs text-muted">{rotulo}</span>}
    </div>
  )
}
