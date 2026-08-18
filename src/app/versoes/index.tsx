import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { ProductImage } from '@/components/ui/ProductImage'
import { useToast } from '@/components/ui/Toast'
import { usePlano } from '@/app/PlanoProvider'
import { iniciaisPessoa } from '@/lib/cea'
import {
  COLECAO,
  MOTIVOS_QUALIFICACAO,
  PLANNER,
  PLANO,
  RECORTES_VERSAO,
  chaveDoRecorte,
} from '@/data/derived'
import {
  formatBRL,
  formatBRLCompact,
  formatDataHora,
  formatDelta,
  formatNum,
  formatPct,
  plural,
} from '@/lib/format'

export default function VersoesPage() {
  const { push } = useToast()
  const {
    linhas,
    totaisOriginal,
    totaisQualificado,
    banda,
    historico,
    aprovados,
    aprovar,
    aprovarTodos,
  } = usePlano()
  const [recorte, setRecorte] = useState<(typeof RECORTES_VERSAO)[number]>('Categoria')

  /** Agrupa as linhas pelo recorte escolhido, com deltas Original × Qualificado. */
  const grupos = useMemo(() => {
    const mapa = new Map<
      string,
      { chave: string; linhas: number; pecasO: number; pecasQ: number; invO: number; invQ: number }
    >()
    for (const l of linhas) {
      const chave = chaveDoRecorte(l, recorte)
      const atual =
        mapa.get(chave) ?? { chave, linhas: 0, pecasO: 0, pecasQ: 0, invO: 0, invQ: 0 }
      atual.linhas += 1
      atual.pecasO += l.qtdOriginal
      atual.pecasQ += l.qtd
      atual.invO += l.qtdOriginal * l.pc
      atual.invQ += l.qtd * l.pc
      mapa.set(chave, atual)
    }
    return [...mapa.values()].sort((a, b) => b.invQ - a.invQ)
  }, [linhas, recorte])

  const chaves = grupos.map((g) => g.chave)
  const aprovadosNoRecorte = chaves.filter((c) => aprovados.includes(c))
  const tudoAprovado = aprovadosNoRecorte.length === chaves.length && chaves.length > 0

  /** Linhas que diferem do baseline — as qualificações. */
  const qualificacoes = useMemo(
    () =>
      linhas
        .filter((l) => l.qtd !== l.qtdOriginal)
        .map((l) => ({
          ...l,
          deltaPecas: l.qtd - l.qtdOriginal,
          deltaInv: (l.qtd - l.qtdOriginal) * l.pc,
          motivo:
            MOTIVOS_QUALIFICACAO[l.id] ??
            (l.qtdOriginal === 0
              ? 'Linha incluída manualmente nesta sessão.'
              : 'Quantidade ajustada na lista de compras.'),
        }))
        .sort((a, b) => Math.abs(b.deltaInv) - Math.abs(a.deltaInv)),
    [linhas],
  )

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Versões & Aprovação"
        subtitulo={`${COLECAO.rotulo} · Plano Original × Qualificado, com aprovação por nível agregado`}
        meta={
          <>
            <StatusChip tom={tudoAprovado ? 'ok' : 'info'}>
              {aprovadosNoRecorte.length} de {chaves.length} aprovados
            </StatusChip>
            <StatusChip tom="neutro">Recorte por {recorte.toLowerCase()}</StatusChip>
          </>
        }
        acoes={
          <Button
            variante="primario"
            disabled={tudoAprovado}
            onClick={() => {
              aprovarTodos(chaves)
              push(
                'Plano aprovado por completo',
                'ok',
                `${chaves.length} agrupamentos de ${recorte.toLowerCase()} aprovados por ${PLANNER.nome}.`,
              )
            }}
          >
            {tudoAprovado ? 'Tudo aprovado ✓' : 'Aprovar todos'}
          </Button>
        }
      />

      {/* ------------------------------------------ cards das versões ---- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-base flex flex-col border-l-4 border-l-slate-300 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-[15px] font-semibold text-cea-deep">Plano Original</h2>
            <StatusChip tom="neutro">baseline imutável</StatusChip>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Metrica rotulo="Peças" valor={formatNum(totaisOriginal.pecas)} />
            <Metrica
              rotulo="Investimento"
              valor={formatBRLCompact(totaisOriginal.investimento, 2)}
            />
            <Metrica rotulo="Margem" valor={formatPct(totaisOriginal.margem)} />
            <Metrica rotulo="PC médio" valor={formatBRL(totaisOriginal.pcMedio)} />
          </div>
          <p className="mt-auto pt-3 text-[11.5px] leading-snug text-muted">
            Gerado pelos habilitadores e pelo histórico, antes de qualquer qualificação. Não muda —
            é a referência de comparação.
          </p>
        </div>

        <div
          className={`card-base flex flex-col border-l-4 p-4 ${banda.estourou ? 'border-l-warn' : 'border-l-cea-blue'}`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-[15px] font-semibold text-cea-deep">
              Plano Qualificado
            </h2>
            <StatusChip tom={banda.estourou ? 'warn' : 'ok'}>
              {plural(historico.length, 'alteração', 'alterações')}
            </StatusChip>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Metrica
              rotulo="Peças"
              valor={formatNum(totaisQualificado.pecas)}
              delta={formatDelta((totaisQualificado.pecas / totaisOriginal.pecas - 1) * 100)}
              positivo={totaisQualificado.pecas >= totaisOriginal.pecas}
            />
            <Metrica
              rotulo="Investimento"
              valor={formatBRLCompact(totaisQualificado.investimento, 2)}
              delta={formatBRLCompact(
                totaisQualificado.investimento - totaisOriginal.investimento,
                2,
              )}
              positivo={totaisQualificado.investimento >= totaisOriginal.investimento}
            />
            <Metrica
              rotulo="Margem"
              valor={formatPct(totaisQualificado.margem)}
              delta={`${formatNum(totaisQualificado.margem - totaisOriginal.margem, 2)} p.p.`}
              positivo={totaisQualificado.margem >= totaisOriginal.margem}
            />
            <Metrica
              rotulo="PC médio"
              valor={formatBRL(totaisQualificado.pcMedio)}
              delta={formatBRL(totaisQualificado.pcMedio - totaisOriginal.pcMedio)}
              positivo={totaisQualificado.pcMedio >= totaisOriginal.pcMedio}
            />
          </div>
          <p className="mt-auto pt-3 text-[11.5px] leading-snug text-muted">
            Reflete ao vivo o que está no{' '}
            <Link to="/plano" className="font-semibold text-cea-blue hover:underline">
              Plano de Sortimento
            </Link>
            . Mudou uma quantidade lá? Os deltas acima já mudaram.
          </p>
        </div>
      </div>

      {banda.estourou && (
        <Banner
          tom="warn"
          titulo={`Estouro de ${formatDelta(banda.desvioPct)} sobre o OTB do recorte`}
        >
          O Qualificado soma {formatBRLCompact(banda.investimento, 2)} contra o alvo de{' '}
          {formatBRLCompact(PLANO.otbRecorte, 2)} — {formatBRLCompact(banda.desvio, 2)} acima. A
          aprovação por nível não dispensa a compensação da verba.
        </Banner>
      )}

      <Banner tom="info" titulo="Aprovação por nível agregado">
        Ninguém aprova SKU a SKU. A aprovação acontece no nível em que o comitê decide — categoria,
        sessão, cluster ou faixa de preço — e o detalhe fica registrado no histórico.
      </Banner>

      {/* --------------------------------------- tabela de aprovação ---- */}
      <SectionCard
        titulo={`Aprovação por ${recorte.toLowerCase()}`}
        subtitulo="Δ é a diferença do Qualificado contra o Original"
        acoes={
          <div className="flex items-center gap-1 rounded-lg border border-line bg-slate-50 p-0.5">
            {RECORTES_VERSAO.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRecorte(r)}
                aria-pressed={recorte === r}
                className={`focus-ring rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition ${
                  recorte === r ? 'bg-white text-cea-blue shadow-card' : 'text-slate-500'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        }
        compacto
      >
        <div className="scroll-x">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                <th className="px-3 py-2 text-left">{recorte}</th>
                <th className="px-3 py-2 text-right">Linhas</th>
                <th className="px-3 py-2 text-right">Peças original</th>
                <th className="px-3 py-2 text-right">Peças qualificado</th>
                <th className="px-3 py-2 text-right">Δ peças</th>
                <th className="px-3 py-2 text-right">Investimento</th>
                <th className="px-3 py-2 text-right">Δ investimento</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => {
                const deltaPecas = g.pecasQ - g.pecasO
                const deltaInv = g.invQ - g.invO
                const aprovado = aprovados.includes(g.chave)
                return (
                  <tr
                    key={g.chave}
                    className="border-b border-line/70 odd:bg-white even:bg-slate-50/50"
                  >
                    <td className="px-3 py-2 font-semibold text-ink">{g.chave}</td>
                    <td className="num px-3 py-2 text-right text-muted">{g.linhas}</td>
                    <td className="num px-3 py-2 text-right text-muted">{formatNum(g.pecasO)}</td>
                    <td className="num px-3 py-2 text-right">{formatNum(g.pecasQ)}</td>
                    <td
                      className={`num px-3 py-2 text-right font-semibold ${
                        deltaPecas > 0 ? 'text-ok' : deltaPecas < 0 ? 'text-crit' : 'text-slate-400'
                      }`}
                    >
                      {deltaPecas === 0
                        ? '—'
                        : `${deltaPecas > 0 ? '+' : '−'}${formatNum(Math.abs(deltaPecas))}`}
                    </td>
                    <td className="num px-3 py-2 text-right">{formatBRLCompact(g.invQ, 2)}</td>
                    <td
                      className={`num px-3 py-2 text-right font-semibold ${
                        deltaInv > 0 ? 'text-ok' : deltaInv < 0 ? 'text-crit' : 'text-slate-400'
                      }`}
                    >
                      {Math.abs(deltaInv) < 1 ? '—' : formatBRLCompact(deltaInv, 2)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {aprovado ? (
                        <StatusChip tom="ok">Aprovado ✓</StatusChip>
                      ) : (
                        <Button
                          tamanho="sm"
                          onClick={() => {
                            aprovar(g.chave)
                            push(
                              `${g.chave} aprovado`,
                              'ok',
                              `${plural(g.linhas, 'linha')} · ${formatBRLCompact(g.invQ, 2)} de investimento.`,
                            )
                          }}
                        >
                          Aprovar
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line bg-slate-50 font-semibold text-cea-deep">
                <td className="px-3 py-2.5 text-[12px] uppercase tracking-wide">Total</td>
                <td className="num px-3 py-2.5 text-right">{linhas.length}</td>
                <td className="num px-3 py-2.5 text-right">{formatNum(totaisOriginal.pecas)}</td>
                <td className="num px-3 py-2.5 text-right">{formatNum(totaisQualificado.pecas)}</td>
                <td className="num px-3 py-2.5 text-right text-ok">
                  +{formatNum(totaisQualificado.pecas - totaisOriginal.pecas)}
                </td>
                <td className="num px-3 py-2.5 text-right">
                  {formatBRLCompact(totaisQualificado.investimento, 2)}
                </td>
                <td className="num px-3 py-2.5 text-right text-ok">
                  {formatBRLCompact(
                    totaisQualificado.investimento - totaisOriginal.investimento,
                    2,
                  )}
                </td>
                <td className="px-3 py-2.5 text-center text-[12px]">
                  {aprovadosNoRecorte.length}/{chaves.length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      {/* -------------------------------- alterações vs original ---- */}
      <SectionCard
        titulo="Alterações vs Original"
        subtitulo={`${plural(qualificacoes.length, 'qualificação', 'qualificações')} no plano`}
        compacto
      >
        {qualificacoes.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">
            O Qualificado está idêntico ao Original.
          </p>
        ) : (
          <div className="scroll-x">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-2 text-left">Ref</th>
                  <th className="px-3 py-2 text-left">Produto</th>
                  <th className="px-3 py-2 text-left">Categoria</th>
                  <th className="px-3 py-2 text-right">Δ peças</th>
                  <th className="px-3 py-2 text-right">Δ investimento</th>
                  <th className="px-3 py-2 text-left">Motivo da qualificação</th>
                </tr>
              </thead>
              <tbody>
                {qualificacoes.map((q) => (
                  <tr key={q.id} className="border-b border-line/70 odd:bg-white even:bg-slate-50/50">
                    <td className="num px-3 py-2 text-[12px] font-semibold text-slate-500">
                      {q.ref}
                    </td>
                    <td className="max-w-[220px] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <ProductImage
                          cod={q.ref}
                          nome={q.produto}
                          categoria={q.categoria}
                          lado={34}
                        />
                        <span className="font-medium leading-snug text-ink">{q.produto}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[12px] text-slate-600">{q.categoria}</td>
                    <td
                      className={`num px-3 py-2 text-right font-semibold ${q.deltaPecas > 0 ? 'text-ok' : 'text-crit'}`}
                    >
                      {q.deltaPecas > 0 ? '+' : '−'}
                      {formatNum(Math.abs(q.deltaPecas))}
                    </td>
                    <td
                      className={`num px-3 py-2 text-right font-semibold ${q.deltaInv > 0 ? 'text-ok' : 'text-crit'}`}
                    >
                      {formatBRLCompact(q.deltaInv, 2)}
                    </td>
                    <td className="px-3 py-2 text-[12px] leading-snug text-slate-600">
                      {q.motivo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ------------------------------------------------ histórico ---- */}
      <SectionCard
        titulo="Histórico de alterações"
        subtitulo="Cada mudança feita no Plano de Sortimento nesta sessão"
        tag={<StatusChip tom="neutro">{plural(historico.length, 'registro')}</StatusChip>}
      >
        {historico.length === 0 ? (
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-[12.5px] leading-snug text-slate-600">
              Nenhuma alteração nesta sessão ainda. Mude uma quantidade no{' '}
              <Link to="/plano" className="font-semibold text-cea-blue hover:underline">
                Plano de Sortimento
              </Link>{' '}
              e o registro aparece aqui com autor e horário.
            </p>
          </div>
        ) : (
          <ol className="space-y-2.5">
            {historico.map((h) => (
              <li key={h.id} className="flex gap-3 border-b border-line/70 pb-2.5 last:border-0">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cea-blue text-[10px] font-bold text-white">
                  {iniciaisPessoa(h.autor)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] text-ink">
                    <strong>{h.campo}</strong> em{' '}
                    <span className="num text-slate-500">{h.ref}</span> {h.produto} ·{' '}
                    <span className="num">{formatNum(h.de)}</span> →{' '}
                    <span className="num font-semibold">{formatNum(h.para)}</span>
                  </p>
                  {h.nota && <p className="mt-0.5 text-[11.5px] text-muted">{h.nota}</p>}
                  <p className="num mt-0.5 text-[11px] text-slate-400">
                    {h.autor} · {formatDataHora(h.quando)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>
    </div>
  )
}

function Metrica({
  rotulo,
  valor,
  delta,
  positivo,
}: {
  rotulo: string
  valor: string
  delta?: string
  positivo?: boolean
}) {
  return (
    <div>
      <p className="kpi-label">{rotulo}</p>
      <p className="num mt-0.5 font-display text-[17px] font-semibold text-cea-deep">{valor}</p>
      {delta && (
        <p className={`num text-[11.5px] font-semibold ${positivo ? 'text-ok' : 'text-crit'}`}>
          {delta} vs Original
        </p>
      )}
    </div>
  )
}
