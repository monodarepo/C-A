import { formatBRLCompact, formatDelta } from '@/lib/format'
import type { PosicaoBanda } from '@/data/derived'

/**
 * Régua da banda de OTB: Piso — Alvo — Teto, com o marcador do investimento
 * atual. Reage ao vivo às quantidades da lista de compras.
 *
 * Geometria em três faixas para os rótulos não colidirem com o marcador:
 *   0–26px  rótulos dos marcos · 28–38px  tracinhos · 40–50px trilha
 *   36–54px marcador (centrado na trilha)
 */
export function ReguaDeBanda({ banda }: { banda: PosicaoBanda }) {
  const escala = (v: number) => {
    const folga = (banda.teto - banda.piso) * 0.35
    const min = banda.piso - folga
    const max = banda.teto + folga
    return Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))
  }

  const pPiso = escala(banda.piso)
  const pAlvo = escala(banda.alvo)
  const pTeto = escala(banda.teto)

  /** Resíduo de arredondamento não é desvio: abaixo de 0,05% do alvo, está no alvo. */
  const noAlvo = Math.abs(banda.desvio) < banda.alvo * 0.0005

  return (
    <div className="card-base px-4 pb-5 pt-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Banda de OTB do recorte</h2>
        <span
          className={`num text-[13px] font-semibold ${
            banda.estourou ? 'text-warn' : noAlvo ? 'text-ok' : 'text-slate-600'
          }`}
        >
          {formatBRLCompact(banda.investimento, 2)}
          {noAlvo ? (
            <span className="text-ok"> · no alvo do OTB</span>
          ) : (
            <>
              {' · '}
              {banda.desvio >= 0 ? '+' : '−'}
              {formatBRLCompact(Math.abs(banda.desvio), 2)} ({formatDelta(banda.desvioPct)}) vs alvo
            </>
          )}
        </span>
      </div>

      <div className="relative h-[58px]">
        {/* rótulos dos marcos */}
        {[
          { pos: pPiso, rotulo: 'Piso', valor: banda.piso },
          { pos: pAlvo, rotulo: 'Alvo', valor: banda.alvo },
          { pos: pTeto, rotulo: 'Teto', valor: banda.teto },
        ].map((m) => (
          <div
            key={m.rotulo}
            className="absolute top-0 -translate-x-1/2 text-center"
            style={{ left: `${m.pos}%` }}
          >
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {m.rotulo}
            </span>
            <span className="num block whitespace-nowrap text-[11px] font-semibold text-slate-500">
              {formatBRLCompact(m.valor, 1)}
            </span>
            <span aria-hidden className="mx-auto mt-0.5 block h-2.5 w-px bg-slate-400" />
          </div>
        ))}

        {/* trilha completa */}
        <div className="absolute inset-x-0 top-[40px] h-2.5 rounded-full bg-slate-200/80" />

        {/* faixa aceitável (piso → teto) */}
        <div
          className="absolute top-[40px] h-2.5 rounded-full bg-ok/30"
          style={{ left: `${pPiso}%`, width: `${pTeto - pPiso}%` }}
        />

        {/* marcador do investimento */}
        <div
          className="absolute top-[36px] transition-all duration-300"
          style={{ left: `${banda.posicaoPct}%` }}
          role="img"
          aria-label={`Investimento em ${formatBRLCompact(banda.investimento, 2)}`}
        >
          <span
            className={`block h-[18px] w-[18px] -translate-x-1/2 rounded-full border-[3px] border-white shadow-pop ${
              banda.estourou ? 'bg-warn' : 'bg-cea-blue'
            }`}
          />
        </div>
      </div>

      <p className="mt-1 text-[11px] text-slate-400">
        Banda de ±{formatBRLCompact(banda.teto - banda.alvo, 2)} sobre o alvo do OTB. O marcador
        anda conforme você altera as quantidades na lista de compras.
      </p>
    </div>
  )
}
