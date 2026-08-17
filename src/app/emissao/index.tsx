import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/ui/KpiCard'
import { EmptyGate } from '@/components/ui/EmptyGate'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { useToast } from '@/components/ui/Toast'
import { usePlano } from '@/app/PlanoProvider'
import {
  COLECAO,
  OCS_DO_LINE,
  PRAZO_IMPORTADO_DIAS,
  type OrdemCompra,
} from '@/data/derived'
import { formatBRLCompact, formatDataHora, formatNum } from '@/lib/format'

export default function EmissaoPage() {
  const { push } = useToast()
  const navigate = useNavigate()
  const { lineCarregado, ocsEmitidas, emitirOCs } = usePlano()

  /** Quais OCs já apareceram — a emissão entra uma a uma, com toast. */
  const [emitidas, setEmitidas] = useState<string[]>([])
  const [emitindo, setEmitindo] = useState(false)
  const [integradoEm, setIntegradoEm] = useState<Record<string, Date>>({})

  // se as OCs já foram emitidas nesta sessão, a lista aparece completa
  useEffect(() => {
    if (ocsEmitidas && emitidas.length === 0) {
      setEmitidas(OCS_DO_LINE.map((o) => o.numero))
      setIntegradoEm(
        Object.fromEntries(OCS_DO_LINE.map((o) => [o.numero, new Date()])) as Record<string, Date>,
      )
    }
  }, [ocsEmitidas, emitidas.length])

  const totais = useMemo(() => {
    const lista = OCS_DO_LINE.filter((o) => emitidas.includes(o.numero))
    return {
      ocs: lista.length,
      pecas: lista.reduce((a, o) => a + o.pecas, 0),
      valor: lista.reduce((a, o) => a + o.valor, 0),
      importadas: lista.filter((o) => o.prazoDias === PRAZO_IMPORTADO_DIAS).length,
    }
  }, [emitidas])

  function gerar() {
    if (emitindo) return
    setEmitindo(true)
    OCS_DO_LINE.forEach((oc, i) => {
      window.setTimeout(() => {
        setEmitidas((atual) => (atual.includes(oc.numero) ? atual : [...atual, oc.numero]))
        setIntegradoEm((atual) => ({ ...atual, [oc.numero]: new Date() }))
        push(
          `${oc.numero} integrada ao ERP`,
          'ok',
          `${oc.fornecedor} · ${formatNum(oc.pecas)} pç · ${formatBRLCompact(oc.valor, 2)}`,
        )
        if (i === OCS_DO_LINE.length - 1) {
          setEmitindo(false)
          emitirOCs()
        }
      }, 450 * (i + 1))
    })
  }

  if (!lineCarregado) {
    return (
      <div className="space-y-5">
        <PageHeader
          titulo="Emissão de Pedidos"
          subtitulo={`${COLECAO.rotulo} · ordens de compra por fornecedor e integração com o ERP`}
        />
        <EmptyGate
          icone="⎙"
          titulo="Carregue o Line antes de emitir os pedidos"
          texto="A ordem de compra sai do preço negociado e da quantidade confirmada no line. Emitir antes disso seria emitir contra o plano, não contra o acordo."
          nota="A cadeia é Line → Grade → Emissão → Distribuição"
          cta={{ rotulo: 'Ir para o Line', icone: '→', onClick: () => navigate('/line') }}
        />
      </div>
    )
  }

  const pendentes = OCS_DO_LINE.length - emitidas.length

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Emissão de Pedidos"
        subtitulo={`${COLECAO.rotulo} · ${OCS_DO_LINE.length} ordens de compra agrupadas por fornecedor`}
        meta={
          <>
            <StatusChip tom={pendentes === 0 ? 'ok' : 'info'}>
              {emitidas.length} de {OCS_DO_LINE.length} emitidas
            </StatusChip>
            {totais.importadas > 0 && (
              <StatusChip tom="warn">{totais.importadas} importada(s) · D-90</StatusChip>
            )}
          </>
        }
        acoes={
          <>
            <Link
              to="/distribuicao"
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-cea-blue hover:bg-slate-50"
            >
              Ver distribuição <span aria-hidden>→</span>
            </Link>
            <Button variante="primario" onClick={gerar} disabled={emitindo || pendentes === 0}>
              {emitindo
                ? 'Emitindo…'
                : pendentes === 0
                  ? 'Tudo emitido ✓'
                  : `Gerar OCs (${pendentes})`}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Ordens emitidas"
          valor={`${formatNum(totais.ocs)} / ${formatNum(OCS_DO_LINE.length)}`}
          sub={pendentes === 0 ? 'carteira completa' : `${pendentes} pendentes`}
          tomSub={pendentes === 0 ? 'alta' : 'neutra'}
          dica="Uma OC por fornecedor, agrupando todas as referências negociadas com ele."
        />
        <KpiCard
          label="Peças em pedido"
          valor={formatNum(totais.pecas)}
          sub="quantidade confirmada no line"
          tomSub="neutra"
          dica="Soma das quantidades que os fornecedores confirmaram, não das planejadas."
        />
        <KpiCard
          label="Valor emitido"
          valor={formatBRLCompact(totais.valor, 2)}
          sub="a preço negociado"
          tomSub="neutra"
          dica="Quantidade confirmada × preço de custo negociado, por fornecedor."
        />
        <KpiCard
          label="Lead time importado"
          valor={`D-${formatNum(PRAZO_IMPORTADO_DIAS)}`}
          sub="sourcing, trânsito e desembaraço"
          tomSub="neutra"
          dica="Premissa do calendário de compras: 90 dias no importado contra 45 no nacional."
        />
      </div>

      {emitidas.length === 0 ? (
        <EmptyGate
          icone="📄"
          titulo="Nenhuma ordem emitida ainda"
          texto={`O line está carregado e ${OCS_DO_LINE.length} ordens estão prontas para sair, agrupadas por fornecedor. Gerar as OCs integra cada uma ao ERP.`}
          nota="Demo · integração simulada"
          assinatura={false}
          cta={{ rotulo: `Gerar ${OCS_DO_LINE.length} OCs`, icone: '⎙', onClick: gerar }}
        />
      ) : (
        <SectionCard
          titulo="Carteira de pedidos"
          subtitulo="Cada ordem sai com o prazo de entrega no CD conforme o lead time do fornecedor"
          compacto
        >
          <div className="scroll-x">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line bg-slate-50/80 text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 text-left">Ordem</th>
                  <th className="px-3 py-2 text-left">Fornecedor</th>
                  <th className="px-3 py-2 text-left">Referências</th>
                  <th className="px-3 py-2 text-right">Peças</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2 text-center">Prazo</th>
                  <th className="px-3 py-2 text-left">Destino</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {OCS_DO_LINE.filter((o) => emitidas.includes(o.numero)).map((oc) => (
                  <LinhaOC key={oc.numero} oc={oc} integradoEm={integradoEm[oc.numero]} />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-line bg-slate-50 font-semibold text-cea-deep">
                  <td className="px-3 py-2.5 text-[12px] uppercase tracking-wide" colSpan={3}>
                    Total emitido
                  </td>
                  <td className="num px-3 py-2.5 text-right">{formatNum(totais.pecas)}</td>
                  <td className="num px-3 py-2.5 text-right">
                    {formatBRLCompact(totais.valor, 2)}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  )
}

function LinhaOC({ oc, integradoEm }: { oc: OrdemCompra; integradoEm?: Date }) {
  return (
    <tr className="border-b border-line/70 odd:bg-white even:bg-slate-50/50 hover:bg-cea-soft">
      <td className="num px-3 py-2 font-semibold text-cea-deep">{oc.numero}</td>
      <td className="px-3 py-2 text-[12.5px] text-ink">{oc.fornecedor}</td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {oc.refs.map((r) => (
            <span
              key={r}
              className="num rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-500"
            >
              {r}
            </span>
          ))}
        </div>
      </td>
      <td className="num px-3 py-2 text-right">{formatNum(oc.pecas)}</td>
      <td className="num px-3 py-2 text-right font-semibold">
        {formatBRLCompact(oc.valor, 2)}
      </td>
      <td className="px-3 py-2 text-center">
        <StatusChip tom={oc.prazoDias === PRAZO_IMPORTADO_DIAS ? 'warn' : 'neutro'}>
          D-{oc.prazoDias}
        </StatusChip>
      </td>
      <td className="px-3 py-2 text-[11.5px] text-slate-600">{oc.cd}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <StatusChip tom="ok">Integrado ao ERP ✓</StatusChip>
          {integradoEm && (
            <span className="num text-[10.5px] text-slate-400">{formatDataHora(integradoEm)}</span>
          )}
        </div>
      </td>
    </tr>
  )
}
