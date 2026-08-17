import { useState } from 'react'
import { SectionCard } from '@/components/ui/SectionCard'
import { StatusChip } from '@/components/ui/StatusChip'
import { Button } from '@/components/ui/Button'
import { InputNumero } from '@/components/ui/InputNumero'
import { useToast } from '@/components/ui/Toast'
import { formatBRLCompact, formatNum, formatPct } from '@/lib/format'
import {
  CLUSTERIZACAO_DEFAULT,
  DORSAL_NEED_DEFAULT,
  EXPLICACAO_DORSAL_NEED,
  VERBA_HABILITADORES,
  resumoDorsalNeed,
  type CelulaVerba,
  type MesDorsal,
} from '@/data/derived'

/* ======================================= ③ clusterização de verba ========= */

export function BlocoClusterizacao() {
  const { push } = useToast()
  const [celulas, setCelulas] = useState<CelulaVerba[]>(CLUSTERIZACAO_DEFAULT)

  const total = celulas.reduce((a, c) => a + c.pct, 0)
  const fechou = Math.abs(total - 100) < 0.01
  const verba = VERBA_HABILITADORES.verba

  function atualizar(id: string, v: number) {
    setCelulas((atual) => atual.map((c) => (c.id === id ? { ...c, pct: v } : c)))
  }

  function sugerir() {
    setCelulas(CLUSTERIZACAO_DEFAULT)
    push(
      'Distribuição sugerida aplicada',
      'ok',
      `Voltou ao default: 82% em loja física e ${CLUSTERIZACAO_DEFAULT.find((c) => c.id === 'ecommerce')?.pct}% em e-commerce.`,
    )
  }

  return (
    <SectionCard
      titulo="③ Clusterização de Verba"
      subtitulo="Como a verba do recorte se divide entre porte de loja, clima e e-commerce"
      tag={
        <StatusChip tom={fechou ? 'ok' : 'warn'}>
          {formatPct(total, 1)} · {formatBRLCompact((verba * total) / 100, 2)}
        </StatusChip>
      }
      acoes={
        <Button tamanho="sm" onClick={sugerir}>
          Sugerir distribuição
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {celulas.map((c) => (
          <div
            key={c.id}
            className={`rounded-lg border p-3 ${
              c.porte === 'E-commerce'
                ? 'border-[#C7D4F0] bg-cea-soft'
                : 'border-line bg-slate-50/60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-ink">
                  {c.porte === 'E-commerce' ? 'E-commerce' : `Porte ${c.porte}`}
                </p>
                {c.clima !== '—' && (
                  <p className="text-[11px] text-muted">Clima {c.clima.toLowerCase()}</p>
                )}
                {c.porte === 'E-commerce' && (
                  <p className="text-[11px] text-muted">CD atende a cauda longa</p>
                )}
              </div>
              <InputNumero
                valor={c.pct}
                onChange={(v) => atualizar(c.id, v)}
                max={100}
                sufixo="%"
                invalido={!fechou}
                rotulo={`Verba de ${c.porte} ${c.clima}`}
                largura="66px"
              />
            </div>
            <p className="num mt-2 font-display text-[15px] font-semibold text-cea-deep">
              {formatBRLCompact((verba * c.pct) / 100, 2)}
            </p>
          </div>
        ))}
      </div>

      {/* barra de validação */}
      <div className="mt-4 border-t border-line pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[12px] font-semibold text-muted">
            Total distribuído
          </span>
          <span className={`num text-[13px] font-semibold ${fechou ? 'text-ok' : 'text-warn'}`}>
            {formatPct(total, 1)} · {formatBRLCompact((verba * total) / 100, 2)} de{' '}
            {formatBRLCompact(verba, 2)}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200/80">
          <div
            className={`h-full rounded-full transition-all ${fechou ? 'bg-ok' : 'bg-warn'}`}
            style={{ width: `${Math.min(100, total)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11.5px] text-muted">
          {fechou ? (
            <>
              A verba fecha em {formatPct(100, 0)}. Pode gerar o plano de sortimento.
            </>
          ) : (
            <>
              {total > 100
                ? `Excedendo ${formatPct(total - 100, 1)} — a soma passou de 100% e estouraria a verba em ${formatBRLCompact((verba * (total - 100)) / 100, 2)}.`
                : `Faltam ${formatPct(100 - total, 1)} para fechar a verba — ${formatBRLCompact((verba * (100 - total)) / 100, 2)} sem destino.`}
            </>
          )}
        </p>
      </div>
    </SectionCard>
  )
}

/* ========================================== ④ Dorsal × Need / NID ======== */

export function BlocoDorsalNeed() {
  const { push } = useToast()
  const [meses, setMeses] = useState<MesDorsal[]>(DORSAL_NEED_DEFAULT)
  const resumo = resumoDorsalNeed(meses)

  function atualizar(mes: string, campo: 'dorsalQuente' | 'dorsalFrio', v: number) {
    setMeses((atual) => atual.map((m) => (m.mes === mes ? { ...m, [campo]: v } : m)))
  }

  function restaurar() {
    setMeses(DORSAL_NEED_DEFAULT)
    push('Curva restaurada', 'info', 'Dorsal volta de 92/88 em setembro para 55/50 em fevereiro.')
  }

  return (
    <SectionCard
      titulo="④ Dorsal × Need / NID"
      subtitulo="Quanto do sortimento é espinha da temporada e quanto fica livre para reagir"
      acoes={
        <Button tamanho="sm" onClick={restaurar}>
          Restaurar curva
        </Button>
      }
    >
      {/* boxes explicativos */}
      <div className="grid gap-3 sm:grid-cols-2">
        {EXPLICACAO_DORSAL_NEED.map((e) => (
          <div key={e.titulo} className="rounded-lg border border-line bg-slate-50/60 p-3">
            <p className="text-[12.5px] font-semibold text-cea-deep">{e.titulo}</p>
            <p className="mt-1 text-[12px] leading-snug text-slate-600">{e.texto}</p>
          </div>
        ))}
      </div>

      {/* tabela Set–Fev */}
      <div className="scroll-x mt-4">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line bg-slate-50/80 text-[11px] uppercase tracking-wide text-muted">
              <th className="px-3 py-2 text-left">Mês</th>
              <th className="px-3 py-2 text-right">Dorsal quente</th>
              <th className="px-3 py-2 text-right">Dorsal frio</th>
              <th className="px-3 py-2 text-right">Need quente</th>
              <th className="px-3 py-2 text-right">Need frio</th>
              <th className="px-3 py-2 text-left" style={{ width: '30%' }}>
                Dorsal × Need no mês
              </th>
            </tr>
          </thead>
          <tbody>
            {meses.map((m) => {
              const dorsalMedio = (m.dorsalQuente + m.dorsalFrio) / 2
              return (
                <tr key={m.mes} className="border-b border-line/70 odd:bg-white even:bg-slate-50/50">
                  <td className="px-3 py-2 font-semibold text-ink">{m.mes}</td>
                  <td className="px-3 py-2 text-right">
                    <InputNumero
                      valor={m.dorsalQuente}
                      onChange={(v) => atualizar(m.mes, 'dorsalQuente', v)}
                      max={100}
                      sufixo="%"
                      rotulo={`Dorsal quente em ${m.mes}`}
                      className="justify-end"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <InputNumero
                      valor={m.dorsalFrio}
                      onChange={(v) => atualizar(m.mes, 'dorsalFrio', v)}
                      max={100}
                      sufixo="%"
                      rotulo={`Dorsal frio em ${m.mes}`}
                      className="justify-end"
                    />
                  </td>
                  <td className="num px-3 py-2 text-right text-muted">
                    {formatPct(100 - m.dorsalQuente, 0)}
                  </td>
                  <td className="num px-3 py-2 text-right text-muted">
                    {formatPct(100 - m.dorsalFrio, 0)}
                  </td>
                  <td className="px-3 py-2">
                    {/* barra bicolor: dorsal (azul) × need (âmbar) */}
                    <div
                      className="flex h-3.5 overflow-hidden rounded-full bg-slate-200"
                      title={`Dorsal ${formatPct(dorsalMedio, 0)} · Need ${formatPct(100 - dorsalMedio, 0)}`}
                    >
                      <div
                        className="h-full bg-cea-blue"
                        style={{ width: `${dorsalMedio}%` }}
                      />
                      <div
                        className="h-full bg-warn"
                        style={{ width: `${100 - dorsalMedio}%` }}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* cards-resumo */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#C7D4F0] bg-cea-soft p-3">
          <p className="kpi-label">Dorsal</p>
          <p className="num mt-1 font-display text-[19px] font-semibold text-cea-deep">
            {formatBRLCompact(resumo.dorsalValor, 1)}
          </p>
          <p className="mt-0.5 text-[11.5px] text-muted">
            {formatPct(resumo.dorsalPct, 0)} da verba do recorte
          </p>
        </div>
        <div className="rounded-lg border border-[#F6D8A0] bg-[var(--warn-soft)] p-3">
          <p className="kpi-label">Need / NID</p>
          <p className="num mt-1 font-display text-[19px] font-semibold text-[#A15C00]">
            {formatBRLCompact(resumo.needValor, 1)}
          </p>
          <p className="mt-0.5 text-[11.5px] text-muted">
            {formatPct(resumo.needPct, 0)} livre para evento e ciclo
          </p>
        </div>
        <div
          className={`rounded-lg border p-3 ${
            resumo.mesesComFolga === resumo.totalMeses
              ? 'border-[#A7E8D0] bg-[var(--ok-soft)]'
              : 'border-[#F6D8A0] bg-[var(--warn-soft)]'
          }`}
        >
          <p className="kpi-label">Folga para reagir</p>
          <p
            className={`num mt-1 font-display text-[19px] font-semibold ${
              resumo.mesesComFolga === resumo.totalMeses ? 'text-[#0A7355]' : 'text-[#A15C00]'
            }`}
          >
            {formatNum(resumo.mesesComFolga)} / {formatNum(resumo.totalMeses)}
          </p>
          <p className="mt-0.5 text-[11.5px] text-muted">
            meses com espaço de Need (dorsal ≤ 95%)
          </p>
        </div>
      </div>
    </SectionCard>
  )
}
