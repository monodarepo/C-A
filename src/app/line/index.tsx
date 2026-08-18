import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Icone } from '@/components/ui/Icone'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/ui/KpiCard'
import { EmptyGate } from '@/components/ui/EmptyGate'
import { StatusChip } from '@/components/ui/StatusChip'
import { ProductImage } from '@/components/ui/ProductImage'
import { useToast } from '@/components/ui/Toast'
import { usePlano } from '@/app/PlanoProvider'
import { COLECAO, LIMITE_ACEITE_LINE, LINHAS_LINE, LINHAS_PLANO } from '@/data/derived'
import { formatBRL, formatBRLCompact, formatDelta, formatNum, formatPct } from '@/lib/format'

export default function LinePage() {
  const { push } = useToast()
  const { lineCarregado, carregarLine, decisoesLine, decidirLine } = usePlano()

  const totais = useMemo(() => {
    const pedido = LINHAS_LINE.reduce((a, l) => a + l.qtdPedida * l.pcPedido, 0)
    const negociado = LINHAS_LINE.reduce((a, l) => a + l.qtdRetornada * l.pcNegociado, 0)
    return {
      pedido,
      negociado,
      delta: negociado - pedido,
      deltaPct: (negociado / pedido - 1) * 100,
      aceitar: LINHAS_LINE.filter((l) => decisoesLine[l.id] === 'Aceitar').length,
      renegociar: LINHAS_LINE.filter((l) => decisoesLine[l.id] === 'Renegociar').length,
      pecasPedidas: LINHAS_LINE.reduce((a, l) => a + l.qtdPedida, 0),
      pecasRetornadas: LINHAS_LINE.reduce((a, l) => a + l.qtdRetornada, 0),
    }
  }, [decisoesLine])

  if (!lineCarregado) {
    return (
      <div className="space-y-5">
        <PageHeader
          titulo="Montagem do Line"
          subtitulo={`${COLECAO.rotulo} · pedido planejado × retorno negociado com os fornecedores`}
        />
        <EmptyGate
          icone={<Icone nome="pacote" tamanho={22} />}
          titulo="Carregar Line devolvido"
          texto="O line é o que os fornecedores devolvem depois da negociação: preço fechado e quantidade confirmada por referência. Carregue para comparar com o plano e decidir item a item."
          nota={`Demo · devolução simulada de ${LINHAS_LINE.length} itens`}
          cta={{
            rotulo: 'Carregar Line devolvido',
            icone: <Icone nome="baixar" tamanho={15} />,
            onClick: () => {
              carregarLine()
              push(
                'Line carregado',
                'ok',
                `${LINHAS_LINE.length} itens devolvidos · grade, emissão e distribuição liberadas.`,
              )
            },
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Montagem do Line"
        subtitulo={`${COLECAO.rotulo} · ${LINHAS_LINE.length} itens devolvidos por ${new Set(LINHAS_LINE.map((l) => l.fornecedor)).size} fornecedores`}
        meta={
          <>
            <StatusChip tom="ok">Line carregado</StatusChip>
            <StatusChip tom={totais.renegociar > 0 ? 'warn' : 'ok'}>
              {totais.renegociar} a renegociar
            </StatusChip>
          </>
        }
        acoes={
          <Link
            to="/grade"
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-cea-blue px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-cea-deep"
          >
            Montar grades <span aria-hidden>→</span>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Pedido planejado"
          valor={formatBRLCompact(totais.pedido, 2)}
          sub={`${formatNum(totais.pecasPedidas)} peças`}
          tomSub="neutra"
          dica="Investimento do plano ao preço de custo planejado, antes da negociação."
        />
        <KpiCard
          label="Retorno negociado"
          valor={formatBRLCompact(totais.negociado, 2)}
          sub={`${formatNum(totais.pecasRetornadas)} peças confirmadas`}
          tomSub="neutra"
          dica="O que os fornecedores fecharam: preço negociado × quantidade que conseguem entregar."
        />
        <KpiCard
          label="Diferença"
          valor={formatBRLCompact(totais.delta, 2)}
          sub={`${formatDelta(totais.deltaPct)} vs pedido`}
          tomSub={totais.delta <= 0 ? 'alta' : 'alerta'}
          dica="Negativo é bom: significa que a negociação trouxe o custo abaixo do planejado."
        />
        <KpiCard
          label="Decisões"
          valor={`${formatNum(totais.aceitar)} / ${formatNum(LINHAS_LINE.length)}`}
          sub={`${totais.renegociar} pendentes de renegociação`}
          tomSub={totais.renegociar > 0 ? 'alerta' : 'alta'}
          dica={`Aceite automático quando o desvio de preço fica em até ${LIMITE_ACEITE_LINE}%; acima disso a linha entra como Renegociar.`}
        />
      </div>

      <SectionCard
        titulo="Pedido × Retorno"
        subtitulo={`Desvio de preço até ${LIMITE_ACEITE_LINE}% entra como Aceitar automaticamente — a decisão continua sua`}
        compacto
      >
        <div className="scroll-x">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                <th className="px-3 py-2 text-left">Ref</th>
                <th className="px-3 py-2 text-left">Produto</th>
                <th className="px-3 py-2 text-left">Fornecedor</th>
                <th className="px-3 py-2 text-right">Qtd pedida</th>
                <th className="px-3 py-2 text-right">Qtd retornada</th>
                <th className="px-3 py-2 text-right">PC pedido</th>
                <th className="px-3 py-2 text-right">PC negociado</th>
                <th className="px-3 py-2 text-right">Δ preço</th>
                <th className="px-3 py-2 text-center">Decisão</th>
              </tr>
            </thead>
            <tbody>
              {LINHAS_LINE.map((l) => {
                const linhaPlano = LINHAS_PLANO.find((p) => p.ref === l.ref)
                const decisao = decisoesLine[l.id]
                const piorou = l.deltaPct > LIMITE_ACEITE_LINE
                return (
                  <tr
                    key={l.id}
                    className="border-b border-line/70 odd:bg-white even:bg-slate-50/50 hover:bg-cea-soft"
                  >
                    <td className="num px-3 py-2 text-[12px] font-semibold text-slate-500">
                      {l.ref}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <ProductImage
                          cod={l.ref}
                          nome={l.produto}
                          categoria={linhaPlano?.categoria}
                          cor={linhaPlano?.cor}
                          lado={34}
                        />
                        <span className="max-w-[200px] font-medium leading-snug text-ink">
                          {l.produto}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[12px] text-slate-600">{l.fornecedor}</td>
                    <td className="num px-3 py-2 text-right text-muted">
                      {formatNum(l.qtdPedida)}
                    </td>
                    <td className="num px-3 py-2 text-right">
                      {formatNum(l.qtdRetornada)}
                      {l.deltaQtdPct !== 0 && (
                        <span
                          className={`ml-1 text-[10.5px] font-semibold ${l.deltaQtdPct > 0 ? 'text-ok' : 'text-crit'}`}
                        >
                          {formatDelta(l.deltaQtdPct)}
                        </span>
                      )}
                    </td>
                    <td className="num px-3 py-2 text-right text-muted">{formatBRL(l.pcPedido)}</td>
                    <td className="num px-3 py-2 text-right font-semibold">
                      {formatBRL(l.pcNegociado)}
                    </td>
                    <td
                      className={`num px-3 py-2 text-right font-semibold ${piorou ? 'text-crit' : l.deltaPct < 0 ? 'text-ok' : 'text-muted'}`}
                    >
                      {formatDelta(l.deltaPct)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1 rounded-lg border border-line bg-white p-0.5">
                        {(['Aceitar', 'Renegociar'] as const).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              decidirLine(l.id, d)
                              push(
                                `${l.ref} · ${d}`,
                                d === 'Aceitar' ? 'ok' : 'warn',
                                d === 'Aceitar'
                                  ? `Preço de ${formatBRL(l.pcNegociado)} confirmado.`
                                  : `Volta para ${l.fornecedor} com contraproposta.`,
                              )
                            }}
                            aria-pressed={decisao === d}
                            className={`focus-ring rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                              decisao === d
                                ? d === 'Aceitar'
                                  ? 'bg-ok text-white'
                                  : 'bg-warn text-white'
                                : 'text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line bg-slate-50 font-semibold text-cea-deep">
                <td className="px-3 py-2.5 text-[12px] uppercase tracking-wide" colSpan={3}>
                  Total do line
                </td>
                <td className="num px-3 py-2.5 text-right">{formatNum(totais.pecasPedidas)}</td>
                <td className="num px-3 py-2.5 text-right">{formatNum(totais.pecasRetornadas)}</td>
                <td className="num px-3 py-2.5 text-right">
                  {formatBRLCompact(totais.pedido, 2)}
                </td>
                <td className="num px-3 py-2.5 text-right">
                  {formatBRLCompact(totais.negociado, 2)}
                </td>
                <td
                  className={`num px-3 py-2.5 text-right ${totais.deltaPct <= 0 ? 'text-ok' : 'text-crit'}`}
                >
                  {formatDelta(totais.deltaPct)}
                </td>
                <td className="px-3 py-2.5 text-center text-[12px]">
                  {formatPct((totais.aceitar / LINHAS_LINE.length) * 100, 0)} aceito
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
