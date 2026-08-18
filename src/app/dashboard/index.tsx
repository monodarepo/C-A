import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Icone } from '@/components/ui/Icone'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/ui/KpiCard'
import { StatusChip } from '@/components/ui/StatusChip'
import { ProductImage } from '@/components/ui/ProductImage'
import { DataTable, type Coluna } from '@/components/ui/DataTable'
import { Barra } from '@/components/ui/Barra'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Tooltip } from '@/components/ui/Tooltip'
import { useToast } from '@/components/ui/Toast'
import {
  ALERTAS_CRITICOS,
  ATRIBUTOS_SEMANA,
  COLECAO,
  DASHBOARD,
  FINANCEIRO_2T26,
  FOLLOWUP_FORNECEDORES,
  OTB,
  RANKING_ESTILISTAS,
  REDE,
  TOP_CIDADES,
  TOTAIS_ESTILISTAS,
  resumoIA,
  type LinhaEstilista,
  type LinhaFornecedor,
  type StatusFornecedor,
} from '@/data/derived'
import {
  formatBRLCompact,
  formatDelta,
  formatNum,
  formatPct,
  formatPP,
  tendencia as direcao,
} from '@/lib/format'

const TOM_STATUS: Record<StatusFornecedor, 'ok' | 'warn' | 'crit'> = {
  OK: 'ok',
  'ATENÇÃO': 'warn',
  'CRÍTICO': 'crit',
}

export default function DashboardPage() {
  const { push } = useToast()
  const [resumoAberto, setResumoAberto] = useState(false)
  const bullets = resumoIA()

  const folgaCobertura = DASHBOARD.coberturaMeta - DASHBOARD.coberturaDias
  const folgaMarkdown = DASHBOARD.markdownLimite - DASHBOARD.markdownAcumulado
  const concentracaoSpRj = TOP_CIDADES[0].pct + TOP_CIDADES[1].pct
  const clusterA = REDE.clusters.find((c) => c.id === 'A')!

  const colunasEstilistas: Coluna<LinhaEstilista>[] = [
    {
      chave: 'estilista',
      titulo: 'Estilista',
      valor: (l) => l.nome,
      render: (l) => (
        <div className="min-w-0">
          <p className="font-semibold text-ink">{l.nome}</p>
          <p className="text-[11px] text-muted">{l.time}</p>
        </div>
      ),
    },
    {
      chave: 'pecas',
      titulo: 'Peças',
      alinhar: 'dir',
      valor: (l) => l.pecas,
      render: (l) => <span className="num">{formatNum(l.pecas)}</span>,
    },
    {
      chave: 'vendido',
      titulo: 'Vendido',
      alinhar: 'dir',
      valor: (l) => l.vendido,
      render: (l) => <span className="num font-semibold">{formatBRLCompact(l.vendido)}</span>,
    },
    {
      chave: 'st',
      titulo: 'Sell-through',
      largura: '190px',
      valor: (l) => l.sellThrough,
      render: (l) => (
        <Barra
          valor={l.sellThrough}
          meta={DASHBOARD.sellThroughColecao}
          rotulo={formatPct(l.sellThrough)}
        />
      ),
    },
    {
      chave: 'tendencia',
      titulo: 'Tendência',
      alinhar: 'dir',
      valor: (l) => l.tendencia,
      render: (l) => {
        const dir = direcao(l.tendencia)
        return (
          <span
            className={`num text-xs font-semibold ${
              dir === 'alta' ? 'text-ok' : dir === 'baixa' ? 'text-crit' : 'text-muted'
            }`}
          >
            {dir === 'alta' ? '▲' : dir === 'baixa' ? '▼' : ''} {formatDelta(l.tendencia)}
          </span>
        )
      },
    },
  ]

  const colunasFornecedores: Coluna<LinhaFornecedor>[] = [
    {
      chave: 'fornecedor',
      titulo: 'Fornecedor',
      valor: (l) => l.fornecedor,
      render: (l) => <span className="font-semibold text-ink">{l.fornecedor}</span>,
    },
    {
      chave: 'pedidos',
      titulo: 'Pedidos',
      alinhar: 'dir',
      valor: (l) => l.pedidos,
      render: (l) => <span className="num">{formatNum(l.pedidos)}</span>,
    },
    {
      chave: 'atrasos',
      titulo: 'Atrasos',
      alinhar: 'dir',
      valor: (l) => l.atrasos,
      render: (l) => (
        <span className={`num ${l.atrasos > 2 ? 'font-semibold text-crit' : ''}`}>{l.atrasos}</span>
      ),
    },
    {
      chave: 'otd',
      titulo: 'No prazo',
      alinhar: 'dir',
      valor: (l) => l.otdPct,
      render: (l) => <span className="num">{formatPct(l.otdPct)}</span>,
    },
    {
      chave: 'status',
      titulo: 'Status',
      valor: (l) => l.status,
      render: (l) => <StatusChip tom={TOM_STATUS[l.status]}>{l.status}</StatusChip>,
    },
    {
      chave: 'obs',
      titulo: 'Observação',
      valor: (l) => l.observacao,
      render: (l) => <span className="text-[12px] leading-snug text-slate-600">{l.observacao}</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Dashboard Executivo"
        subtitulo={`${COLECAO.nome} · semana ${COLECAO.semana} · ${formatNum(REDE.totalLojas)} lojas · ${formatNum(COLECAO.skusAtivos)} SKUs ativos`}
        acoes={
          <Button variante="primario" icone={<Icone nome="ia" tamanho={15} />} onClick={() => setResumoAberto(true)}>
            Pedir Resumo da IA
          </Button>
        }
      />

      {/* ---------------------------------------------------- linha de KPIs ---- */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Indicadores da semana</h2>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip tom="info">
            Digital {formatPct(DASHBOARD.digitalShare)} ({formatDelta(DASHBOARD.digitalVar)})
          </StatusChip>
          <StatusChip tom="info">C&amp;A Pay {formatPct(DASHBOARD.ceaPayShare, 0)}</StatusChip>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Sell-through coleção"
          valor={formatPct(DASHBOARD.sellThroughColecao)}
          sub={`${formatPP(DASHBOARD.sellThroughVsLY)} vs LY`}
          tomSub="alta"
          dica="Percentual das peças da coleção já vendidas em relação ao total recebido. Acima do ano passado significa giro mais rápido — e menos pulmão para o restante da temporada."
        />
        <KpiCard
          label="Cobertura"
          valor={`${formatNum(DASHBOARD.coberturaDias)} dias`}
          sub={`Meta ${formatNum(DASHBOARD.coberturaMeta)} dias · ${formatNum(folgaCobertura)} abaixo`}
          tomSub="alerta"
          dica="Quantos dias de venda o estoque atual sustenta no ritmo das últimas semanas. Abaixo da meta indica risco de ruptura; muito acima indica excesso."
        />
        <KpiCard
          label="Margem realizada"
          valor={formatPct(DASHBOARD.margemRealizada)}
          sub={`Planejado ${formatPct(OTB.margemPlanejada)} no OTB`}
          tomSub="neutra"
          badge={{
            texto: `${FINANCEIRO_2T26.trimestresExpansaoMargem} tris de expansão`,
            tom: 'ok',
          }}
          dica="Margem bruta de vestuário efetivamente realizada no trimestre, já líquida de remarcações. O badge marca a sequência de trimestres com expansão consecutiva."
        />
        <KpiCard
          label="Markdown acumulado"
          valor={formatPct(DASHBOARD.markdownAcumulado)}
          sub={`Limite ${formatPct(DASHBOARD.markdownLimite, 0)} · folga ${formatPP(folgaMarkdown).replace(' p.p.', '\u00A0p.p.')}`}
          tomSub="alta"
          dica="Desconto médio concedido no acumulado da coleção, medido sobre o preço cheio. O limite é a verba de remarcação aprovada no OTB."
        />
        <KpiCard
          label="Aderência IA · distribuição"
          valor={formatPct(DASHBOARD.aderenciaIA, 0)}
          sub={`${formatNum(COLECAO.skusAtivos)} SKUs em ${formatNum(REDE.totalLojas)} lojas`}
          tomSub="neutra"
          dica="Quanto da alocação sugerida pelo modelo foi mantida pela equipe na distribuição efetiva. Quedas fortes indicam que a sugestão não está sendo aceita em loja."
        />
        <KpiCard
          label="Sincronia ERP"
          valor={DASHBOARD.erpStatus}
          sub={`Push ${DASHBOARD.erpUltimoPush} · ${formatNum(DASHBOARD.erpErros)}\u00A0erros`}
          tomSub="alta"
          dica="Situação da última integração de plano, pedidos e preços com o sistema corporativo. Erros aqui travam a emissão de pedidos."
        />
      </div>

      {/* ------------------------------------- estilistas + top de cidades ---- */}
      {/* items-start: o card Top Cidades fecha na altura do conteúdo em vez de
          esticar com rodapé morto quando o ranking ao lado é mais alto */}
      <div className="grid gap-4 xl:grid-cols-3 xl:items-start">
        <SectionCard
          className="xl:col-span-2"
          titulo="Ranking de Estilistas"
          subtitulo={`${formatNum(TOTAIS_ESTILISTAS.pecas)} peças vendidas da coleção · preço médio ${formatBRLCompact(TOTAIS_ESTILISTAS.precoMedio)}`}
          tag={<StatusChip tom="neutro">Nomes fictícios</StatusChip>}
          compacto
        >
          <DataTable
            colunas={colunasEstilistas}
            dados={RANKING_ESTILISTAS}
            chaveLinha={(l) => l.nome}
            ordemInicial={{ chave: 'vendido', dir: 'desc' }}
            rodape={
              <>
                <td className="px-3 py-2.5 text-[12px] uppercase tracking-wide">Coleção</td>
                <td className="num px-3 py-2.5 text-right">{formatNum(TOTAIS_ESTILISTAS.pecas)}</td>
                <td className="num px-3 py-2.5 text-right">
                  {formatBRLCompact(TOTAIS_ESTILISTAS.vendido)}
                </td>
                <td className="num px-3 py-2.5 text-right">
                  {formatPct(TOTAIS_ESTILISTAS.sellThrough)}
                </td>
                <td className="num px-3 py-2.5 text-right">
                  {formatDelta(FINANCEIRO_2T26.sssVestuario)}
                </td>
              </>
            }
          />
        </SectionCard>

        <SectionCard
          titulo="Top Cidades"
          subtitulo="Participação nas vendas da rede"
          tag={
            <Tooltip texto="Participação de cada praça no faturamento da rede no acumulado da coleção." />
          }
        >
          <ul className="space-y-3">
            {TOP_CIDADES.map((c) => (
              <li key={c.cidade}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-medium text-ink">{c.cidade}</span>
                  <span className="num text-[13px] font-semibold text-cea-deep">
                    {formatPct(c.pct, 0)}
                  </span>
                </div>
                <Barra valor={c.pct} max={TOP_CIDADES[0].pct} altura={7} />
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-[12px] leading-snug text-muted">
            {TOP_CIDADES[0].cidade} e {TOP_CIDADES[1].cidade} concentram{' '}
            <strong className="text-ink">{formatPct(concentracaoSpRj, 0)}</strong> das vendas. O
            cluster {clusterA.id} — {clusterA.nome} pesa{' '}
            <strong className="text-ink">{formatPct(clusterA.partFatPct, 0)}</strong> do plano.
          </p>
          <div className="mt-3 flex flex-col gap-1.5 text-[12px] font-semibold text-cea-blue">
            <Link to="/historico" className="focus-ring rounded hover:underline">
              Abrir Histórico de Vendas <span aria-hidden>→</span>
            </Link>
            <Link to="/lojas" className="focus-ring rounded hover:underline">
              Ver Lojas &amp; Clusters <span aria-hidden>→</span>
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* ------------------------------------------- atributos da semana ---- */}
      <SectionCard
        titulo="Atributos de Produto — Leitura da Semana"
        subtitulo="O que o cliente está escolhendo dentro da cartela real da coleção"
        tag={<StatusChip tom="info">Dimensões N3–N7</StatusChip>}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {ATRIBUTOS_SEMANA.map((a) => {
            const dir = a.delta === null ? 'neutra' : direcao(a.delta)
            return (
              <div key={a.dimensao} className="rounded-lg border border-line bg-slate-50/60 p-3">
                <p className="kpi-label">{a.dimensao}</p>
                <p className="mt-1.5 font-display text-[15px] font-semibold leading-tight text-cea-deep">
                  {a.valor}
                </p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {a.share !== null && (
                    <span className="num text-sm font-semibold text-ink">
                      {formatPct(a.share, 0)}
                    </span>
                  )}
                  {a.delta !== null && (
                    <span
                      className={`num text-xs font-semibold ${
                        dir === 'alta' ? 'text-ok' : dir === 'baixa' ? 'text-crit' : 'text-muted'
                      }`}
                    >
                      {formatPP(a.delta)} {a.unidadeDelta}
                    </span>
                  )}
                  {a.share !== null && a.delta === null && (
                    <span className="text-xs text-muted">{a.unidadeDelta}</span>
                  )}
                </div>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {a.nivel}
                </p>
              </div>
            )
          })}
        </div>
      </SectionCard>

      {/* ------------------------------------- follow-up de fornecedor ---- */}
      <SectionCard
        titulo="Follow-up de Fornecedor"
        subtitulo={`${formatNum(FOLLOWUP_FORNECEDORES.reduce((a, f) => a + f.pedidos, 0))} pedidos na carteira · ${FOLLOWUP_FORNECEDORES.filter((f) => f.status !== 'OK').length} fornecedores exigem ação`}
        tag={<StatusChip tom="neutro">Fornecedores fictícios · refs reais</StatusChip>}
        compacto
      >
        <DataTable
          colunas={colunasFornecedores}
          dados={FOLLOWUP_FORNECEDORES}
          chaveLinha={(l) => l.fornecedor}
        />
      </SectionCard>

      {/* -------------------------------------------- alertas críticos ---- */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">Alertas Críticos</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {ALERTAS_CRITICOS.map((a) => (
            <Link
              key={a.id}
              to={a.rota}
              className={`focus-ring group card-base flex flex-col gap-2 border-l-4 p-4 transition hover:shadow-pop ${
                a.tom === 'crit'
                  ? 'border-l-crit'
                  : a.tom === 'warn'
                    ? 'border-l-warn'
                    : 'border-l-cea-blue'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <StatusChip tom={a.tom} ponto>
                  {a.tipo}
                </StatusChip>
                <span className="num text-[11px] font-semibold text-muted">{a.cod}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ProductImage cod={a.cod} nome={a.produto} lado={32} />
                <p className="font-display text-[14px] font-semibold leading-snug text-cea-deep">
                  {a.produto}
                </p>
              </div>
              <p className="text-[12px] leading-snug text-slate-600">{a.texto}</p>
              <p className="num text-[12px] font-semibold text-ink">{a.metrica}</p>
              <span className="mt-auto pt-1 text-[12px] font-semibold text-cea-blue">
                {a.cta} <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* --------------------------------------------- modal do resumo ---- */}
      <Modal
        aberto={resumoAberto}
        onFechar={() => setResumoAberto(false)}
        titulo="Resumo da IA — leitura da semana"
        subtitulo={`${COLECAO.rotulo} · semana ${COLECAO.semana} · gerado a partir dos indicadores desta tela`}
        largura="lg"
        rodape={
          <>
            <Button
              onClick={() => {
                const texto = bullets.map((b) => `• ${b.titulo}\n${b.texto}`).join('\n\n')
                navigator.clipboard?.writeText(texto)
                push('Resumo copiado', 'ok', 'Cole no e-mail ou na ata do comitê.')
              }}
            >
              Copiar resumo
            </Button>
            <Button variante="primario" onClick={() => setResumoAberto(false)}>
              Fechar
            </Button>
          </>
        }
      >
        <ol className="space-y-4">
          {bullets.map((b, i) => (
            <li key={b.titulo} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cea-soft text-[11px] font-bold text-cea-blue">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-cea-deep">{b.titulo}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600">{b.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </Modal>
    </div>
  )
}
