import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/ui/KpiCard'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { useToast } from '@/components/ui/Toast'
import { usePlano } from '@/app/PlanoProvider'
import { ReguaDeBanda } from '@/app/plano/ReguaDeBanda'
import {
  CANDIDATOS_COMPENSACAO,
  COLECAO,
  COMPENSACAO_NECESSARIA,
  EVENTOS_CICLOS,
  INCLUSAO_MAPA,
  PLANO,
  RESUMO_EVENTOS,
  VINCULOS_EVENTO,
  type TipoEvento,
} from '@/data/derived'
import { formatBRLCompact, formatDelta, formatNum, formatPct } from '@/lib/format'

/**
 * Valores de compensação vivem na casa dos milhares: "R$ 310 mil" lê melhor que
 * "R$ 310,00 mil". Acima de 1 milhão volta a usar 2 casas.
 */
const brl = (v: number) => formatBRLCompact(v, Math.abs(v) >= 1e6 ? 2 : 0)

const TOM_TAG: Record<TipoEvento, 'warn' | 'info' | 'ok' | 'marca' | 'neutro'> = {
  EVENTO: 'warn',
  COMERCIAL: 'info',
  'CÁPSULA': 'marca',
  CICLO: 'ok',
  VITRINE: 'neutro',
}

export default function RetroalimentacaoPage() {
  const { push } = useToast()
  const { linhas, banda, historico, decisoes, alterarQtd, decidir } = usePlano()
  const [compensados, setCompensados] = useState<string[]>([])

  const copaDoMundo = EVENTOS_CICLOS.find((e) => e.nome === 'Copa do Mundo')!

  /** Cada candidato libera peças × PC da linha atual do plano. */
  const candidatos = useMemo(
    () =>
      CANDIDATOS_COMPENSACAO.map((c) => {
        const linha = linhas.find((l) => l.id === c.linhaId)
        return {
          ...c,
          linha,
          valor: linha ? Math.round(c.pecas * linha.pc) : 0,
          disponivel: Boolean(linha) && (linha?.qtd ?? 0) > c.pecas,
        }
      }),
    [linhas],
  )

  const liberado = candidatos
    .filter((c) => compensados.includes(c.id))
    .reduce((a, c) => a + c.valor, 0)
  const falta = Math.max(0, COMPENSACAO_NECESSARIA - liberado)
  const fechou = falta === 0

  function compensar(id: string) {
    const c = candidatos.find((x) => x.id === id)
    if (!c?.linha || !c.disponivel) {
      push('Não é possível compensar', 'warn', 'A linha não tem quantidade suficiente no plano.')
      return
    }
    // reduz de verdade a quantidade no plano: a régua e os KPIs reagem
    alterarQtd(c.linha.id, c.linha.qtd - c.pecas, `Compensação de verba · ${c.motivo}`)
    setCompensados((atual) => [...atual, id])
    decidir({
      tipo: 'compensacao',
      titulo: `${brl(c.valor)} liberados em ${c.produto}`,
      detalhe: `${formatNum(c.pecas)} peças a menos. ${c.motivo}`,
    })
    push(
      'Verba compensada',
      'ok',
      `${brl(c.valor)} liberados · falta ${brl(Math.max(0, falta - c.valor))}.`,
    )
  }

  const impactoLiquido = INCLUSAO_MAPA.valor + COMPENSACAO_NECESSARIA - liberado

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Retroalimentação do Plano"
        subtitulo={`${COLECAO.rotulo} · o que a parede de setembro devolveu para a verba`}
        meta={
          <>
            <StatusChip tom={banda.estourou ? 'warn' : 'ok'}>
              {banda.estourou ? 'Estouro' : 'Dentro da banda'}
            </StatusChip>
            <StatusChip tom={fechou ? 'ok' : 'info'}>
              {compensados.length} de {CANDIDATOS_COMPENSACAO.length} compensações
            </StatusChip>
          </>
        }
      />

      {/* ------------------------------------------------------- KPIs ---- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="OTB alvo do recorte"
          valor={formatBRLCompact(PLANO.otbRecorte, 1)}
          sub="verba aprovada"
          tomSub="neutra"
          dica="Alvo de investimento do recorte, com banda de ±3% aceita pelo comitê."
        />
        <KpiCard
          label="Plano com o Mapa"
          valor={formatBRLCompact(banda.investimento, 1)}
          sub={`${formatDelta(banda.desvioPct)} vs alvo`}
          tomSub={banda.estourou ? 'alerta' : 'alta'}
          dica="Investimento do plano depois das inclusões que vieram da parede de setembro."
        />
        <KpiCard
          label="Impacto líquido do Mapa"
          valor={brl(impactoLiquido)}
          sub={
            liberado > 0
              ? `${brl(liberado)} já compensados`
              : 'nada compensado ainda'
          }
          tomSub={liberado > 0 ? 'alta' : 'neutra'}
          dica="Inclusões da parede mais os vínculos de evento, menos o que já foi compensado no plano."
        />
        <KpiCard
          label="Status da verba"
          valor={banda.estourou ? 'ESTOURO' : 'OK'}
          sub={
            banda.estourou
              ? `${formatBRLCompact(banda.desvio, 2)} acima do alvo`
              : 'dentro da banda de OTB'
          }
          tomSub={banda.estourou ? 'alerta' : 'alta'}
          dica="Enquanto houver estouro, a emissão de pedidos fica travada."
        />
      </div>

      <Banner
        tom="warn"
        titulo={`${copaDoMundo.nome} · ${copaDoMundo.janela}`}
        acoes={<StatusChip tom="warn">{copaDoMundo.tipo}</StatusChip>}
      >
        {copaDoMundo.nota} A verba estratégica reservada para eventos é de{' '}
        {brl(RESUMO_EVENTOS.verbaEstrategica)} — e foi consumida inteira por esta
        inclusão.
      </Banner>

      <ReguaDeBanda banda={banda} />

      {/* -------------------------------------------------- inclusões ---- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          titulo="Inclusões da parede"
          subtitulo="Itens que o Mapa trouxe e o plano original não tinha"
        >
          <div className="rounded-lg border border-[#F6D8A0] bg-[var(--warn-soft)] p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#A15C00]">
                  {INCLUSAO_MAPA.produto}
                </p>
                <p className="mt-1 text-[12px] leading-snug text-slate-600">
                  {INCLUSAO_MAPA.nota}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="num font-display text-[17px] font-semibold text-[#A15C00]">
                  {brl(INCLUSAO_MAPA.valor)}
                </p>
                <p className="num text-[11px] text-muted">
                  {formatNum(INCLUSAO_MAPA.pecas)} pç · {formatBRLCompact(INCLUSAO_MAPA.pc)}/pç
                </p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[12px] leading-snug text-muted">
            A inclusão cabe exatamente na verba estratégica de eventos. O que estoura a banda são os
            vínculos abaixo, que entraram além dela.
          </p>
        </SectionCard>

        <SectionCard
          titulo="Vinculados a eventos"
          subtitulo={`${VINCULOS_EVENTO.length} itens do plano que existem por causa de um evento, cápsula, ciclo ou vitrine`}
        >
          <ul className="space-y-2">
            {VINCULOS_EVENTO.map((v) => {
              const ev = EVENTOS_CICLOS.find((e) => e.id === v.eventoId)
              return (
                <li
                  key={v.id}
                  className="flex items-start justify-between gap-3 border-b border-line/70 pb-2 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusChip tom={TOM_TAG[v.tag]}>{v.tag}</StatusChip>
                      {v.ref && (
                        <span className="num text-[11px] font-semibold text-slate-400">
                          {v.ref}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12.5px] font-medium leading-snug text-ink">
                      {v.produto}
                    </p>
                    <p className="text-[11px] text-muted">{ev?.nome}</p>
                  </div>
                  <span className="num shrink-0 text-[13px] font-semibold text-cea-deep">
                    {brl(v.valor)}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 border-t border-line pt-2.5 text-[12px] text-muted">
            Total além da verba estratégica:{' '}
            <strong className="num text-ink">
              {brl(COMPENSACAO_NECESSARIA)}
            </strong>
          </p>
        </SectionCard>
      </div>

      {/* ---------------------------------------------- compensação ---- */}
      <SectionCard
        titulo={
          fechou
            ? 'Verba compensada'
            : `Compensar a verba — falta ${brl(falta)}`
        }
        subtitulo="Compensar reduz a quantidade da linha no Plano de Sortimento — a régua acima reage na hora"
        tag={
          <StatusChip tom={fechou ? 'ok' : 'warn'}>
            {brl(liberado)} de {brl(COMPENSACAO_NECESSARIA)}
          </StatusChip>
        }
      >
        {/* barra de progresso da compensação */}
        <div className="mb-4">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
            <div
              className={`h-full rounded-full transition-all ${fechou ? 'bg-ok' : 'bg-warn'}`}
              style={{
                width: `${Math.min(100, (liberado / COMPENSACAO_NECESSARIA) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-1.5 text-[11.5px] text-muted">
            {fechou
              ? 'Os vínculos de evento estão cobertos. O plano ainda pode estar fora da banda por outros motivos — confira a régua.'
              : `${formatPct((liberado / COMPENSACAO_NECESSARIA) * 100, 0)} coberto · escolha onde tirar as peças que faltam.`}
          </p>
        </div>

        <ul className="space-y-2">
          {candidatos.map((c) => {
            const feito = compensados.includes(c.id)
            return (
              <li
                key={c.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 ${
                  feito ? 'border-[#A7E8D0] bg-[var(--ok-soft)]' : 'border-line bg-slate-50/60'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="num text-[11px] font-semibold text-slate-400">{c.ref}</span>
                    {feito && <StatusChip tom="ok">compensado</StatusChip>}
                    {!c.disponivel && !feito && (
                      <StatusChip tom="neutro">sem quantidade</StatusChip>
                    )}
                  </div>
                  <p className="mt-0.5 text-[12.5px] font-medium leading-snug text-ink">
                    {c.produto}
                  </p>
                  <p className="text-[11.5px] leading-snug text-muted">{c.motivo}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="num text-[13px] font-semibold text-cea-deep">
                      {brl(c.valor)}
                    </p>
                    <p className="num text-[11px] text-muted">−{formatNum(c.pecas)} pç</p>
                  </div>
                  <Button
                    tamanho="sm"
                    variante={feito ? 'fantasma' : 'secundario'}
                    disabled={feito || !c.disponivel}
                    onClick={() => compensar(c.id)}
                  >
                    {feito ? 'Compensado ✓' : 'Compensar'}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </SectionCard>

      {/* ------------------------------------------------- histórico ---- */}
      <SectionCard
        titulo="Histórico de alterações do Mapa"
        subtitulo="Decisões da parede, compensações e mudanças de quantidade desta sessão"
        tag={
          <StatusChip tom="neutro">
            {decisoes.length + historico.length} registro(s)
          </StatusChip>
        }
      >
        {decisoes.length === 0 && historico.length === 0 ? (
          <p className="rounded-lg border border-line bg-slate-50/60 p-4 text-[12.5px] leading-snug text-slate-600">
            Nada registrado ainda. Mova um card no{' '}
            <Link to="/mapa" className="font-semibold text-cea-blue hover:underline">
              Mapa da Coleção
            </Link>{' '}
            ou compense uma linha acima.
          </p>
        ) : (
          <ol className="space-y-2.5">
            {decisoes.map((d) => (
              <li key={d.id} className="border-b border-line/70 pb-2.5 last:border-0">
                <div className="flex items-center gap-2">
                  <StatusChip
                    tom={d.tipo === 'compensacao' ? 'ok' : d.tipo === 'evento' ? 'warn' : 'info'}
                  >
                    {d.tipo === 'compensacao' ? 'compensação' : d.tipo}
                  </StatusChip>
                  <p className="text-[12.5px] font-medium text-ink">{d.titulo}</p>
                </div>
                <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{d.detalhe}</p>
                <p className="num mt-0.5 text-[11px] text-slate-400">
                  {d.autor} · {d.quando.toLocaleTimeString('pt-BR')}
                </p>
              </li>
            ))}
            {historico.map((h) => (
              <li key={h.id} className="border-b border-line/70 pb-2.5 last:border-0">
                <div className="flex items-center gap-2">
                  <StatusChip tom="neutro">plano</StatusChip>
                  <p className="text-[12.5px] text-ink">
                    {h.campo} em <span className="num text-slate-500">{h.ref}</span> ·{' '}
                    <span className="num">{formatNum(h.de)}</span> →{' '}
                    <span className="num font-semibold">{formatNum(h.para)}</span>
                  </p>
                </div>
                {h.nota && <p className="mt-0.5 text-[11.5px] text-muted">{h.nota}</p>}
                <p className="num mt-0.5 text-[11px] text-slate-400">
                  {h.autor} · {h.quando.toLocaleTimeString('pt-BR')}
                </p>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>
    </div>
  )
}
