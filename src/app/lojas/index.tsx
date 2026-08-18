import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/ui/KpiCard'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { StatusChip } from '@/components/ui/StatusChip'
import { Sparkline } from '@/components/ui/Sparkline'
import { useToast } from '@/components/ui/Toast'
import {
  CARDS_CLUSTER,
  CLIMAS_LOJA,
  DISTRIBUICAO_REGIONAL,
  LOJAS,
  PORTES_LOJA,
  REDE,
  SUGESTOES_REAGRUPAMENTO,
  serieSparkline,
  type Clima,
  type Cluster,
  type Loja,
  type Porte,
} from '@/data/derived'
import { formatBRL, formatBRLCompact, formatDelta, formatNum, formatPct, plural } from '@/lib/format'

type LojaNova = {
  nome: string
  cidade: string
  uf: string
  cluster: Cluster
  porte: Porte
  clima: Clima
}

const NOVA_VAZIA: LojaNova = {
  nome: '',
  cidade: '',
  uf: 'SP',
  cluster: 'C',
  porte: 'M',
  clima: 'Híbrida Quente',
}

export default function LojasPage() {
  const { push } = useToast()
  const [cadastrando, setCadastrando] = useState(false)
  const [nova, setNova] = useState<LojaNova>(NOVA_VAZIA)
  /** lojas cadastradas nesta sessão — vivem só em memória, como manda o mockup */
  const [cadastradas, setCadastradas] = useState<LojaNova[]>([])
  const [detalhe, setDetalhe] = useState<Loja | null>(null)
  const [aceitas, setAceitas] = useState<string[]>([])

  const total = REDE.totalLojas + cadastradas.length
  const pendentes = SUGESTOES_REAGRUPAMENTO.filter((s) => !aceitas.includes(s.lojaId))

  const faturamentoRegiao = useMemo(
    () =>
      DISTRIBUICAO_REGIONAL.map((r) => ({
        ...r,
        lojas: LOJAS.filter((l) => l.regiao === r.regiao).length,
        faturamento: LOJAS.filter((l) => l.regiao === r.regiao).reduce(
          (a, l) => a + l.faturamentoMes,
          0,
        ),
      })),
    [],
  )

  const podeCadastrar = nova.nome.trim().length > 2 && nova.cidade.trim().length > 1

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Lojas & Clusters"
        subtitulo={`${formatNum(total)} lojas físicas em ${formatNum(new Set(LOJAS.map((l) => l.uf)).size)} UFs · ${REDE.cds.length} centros de distribuição`}
        meta={
          <>
            <StatusChip tom="neutro">{formatNum(REDE.clusters.length)} clusters</StatusChip>
            {cadastradas.length > 0 && (
              <StatusChip tom="ok">
                +{plural(cadastradas.length, 'cadastrada')} nesta sessão
              </StatusChip>
            )}
            {pendentes.length > 0 && (
              <StatusChip tom="warn">
                {plural(pendentes.length, 'loja')} fora do cluster
              </StatusChip>
            )}
          </>
        }
        acoes={
          <Button variante="primario" onClick={() => setCadastrando(true)}>
            Cadastrar loja
          </Button>
        }
      />

      {/* -------------------------------------------------- cards cluster -- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS_CLUSTER.map((c) => (
          <div key={c.id} className="card-base p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="kpi-label">Cluster {c.id}</p>
              <span className="num text-[11px] font-semibold text-cea-blue">
                {formatPct(c.partFaturamento, 0)} do faturamento
              </span>
            </div>
            <p className="num mt-1 font-display text-[28px] font-semibold leading-none text-cea-deep">
              {formatNum(c.lojas)}
            </p>
            <p className="mt-0.5 text-[12px] text-muted">{c.nome}</p>
            <dl className="mt-3 space-y-1 border-t border-line pt-2.5">
              <div className="flex items-baseline justify-between gap-2 text-[11.5px]">
                <dt className="text-muted">Ticket médio</dt>
                <dd className="num font-semibold text-ink">{formatBRL(c.ticketMedio)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-2 text-[11.5px]">
                <dt className="text-muted">Conversão</dt>
                <dd className="num font-semibold text-ink">{formatPct(c.conversao)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-2 text-[11.5px]">
                <dt className="text-muted">Faturamento/mês</dt>
                <dd className="num font-semibold text-ink">
                  {formatBRLCompact(c.faturamentoMes, 1)}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------ reagrupamento -- */}
      {pendentes.length > 0 && (
        <SectionCard
          titulo={`Reagrupamento sugerido — ${plural(pendentes.length, 'loja')} fora do cluster`}
          subtitulo="Lojas cujo desempenho está no patamar de outro degrau da escada A→B→C"
          tag={<StatusChip tom="warn">Sugestão da IA</StatusChip>}
        >
          <ul className="space-y-2.5">
            {pendentes.map((s) => (
              <li
                key={s.lojaId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#F6D8A0] bg-[var(--warn-soft)] p-3"
              >
                <div className="min-w-[240px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[12.5px] font-semibold text-ink">{s.nome}</p>
                    <span className="num text-[11px] text-muted">
                      {s.cidade}/{s.uf}
                    </span>
                    <span className="flex items-center gap-1 text-[11.5px] font-semibold">
                      <StatusChip tom="neutro">{s.clusterAtual}</StatusChip>
                      <span aria-hidden className="text-cea-blue">
                        →
                      </span>
                      <StatusChip tom="info">{s.clusterSugerido}</StatusChip>
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11.5px]">
                    <span className="num rounded bg-white/80 px-1.5 py-0.5 font-semibold text-slate-600 ring-1 ring-[#F6D8A0]">
                      P{formatNum(s.desempenho)} da rede
                    </span>
                    <span className="num rounded bg-white/80 px-1.5 py-0.5 text-slate-500 ring-1 ring-[#F6D8A0]">
                      mediana {s.clusterAtual}: {formatNum(s.desempenhoClusterAtual)}
                    </span>
                    <span className="text-slate-600">
                      {s.desempenho > s.desempenhoClusterAtual
                        ? `gira como loja de ${s.clusterSugerido}`
                        : `opera no patamar de ${s.clusterSugerido}`}
                    </span>
                  </div>
                </div>
                <Button
                  variante="secundario"
                  tamanho="sm"
                  onClick={() => {
                    setAceitas((a) => [...a, s.lojaId])
                    push(
                      `${s.nome} movida para o cluster ${s.clusterSugerido}`,
                      'ok',
                      `Sortimento, gabarito de grade e profundidade de markdown passam a seguir o cluster ${s.clusterSugerido}.`,
                    )
                  }}
                >
                  Aceitar
                </Button>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {aceitas.length > 0 && pendentes.length === 0 && (
        <Banner tom="ok" titulo="Reagrupamento concluído">
          As {formatNum(aceitas.length)} lojas sugeridas foram movidas nesta sessão. O novo
          agrupamento entra no próximo ciclo de clusterização de verba.
        </Banner>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[1.45fr_1fr]">
        {/* ------------------------------------------------- top 10 lojas -- */}
        <SectionCard
          titulo="Top 10 lojas"
          subtitulo="Clique numa linha para abrir o painel da loja"
          compacto
        >
          <div className="scroll-x">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Loja</th>
                  <th className="px-3 py-2 text-center">Cluster</th>
                  <th className="px-3 py-2 text-right">Faturamento</th>
                  <th className="px-3 py-2 text-left">Sell-through</th>
                  <th className="px-3 py-2 text-right">vs LY</th>
                </tr>
              </thead>
              <tbody>
                {LOJAS.slice(0, 10).map((l, i) => (
                  <tr
                    key={l.id}
                    onClick={() => setDetalhe(l)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setDetalhe(l)
                      }
                    }}
                    className="focus-ring cursor-pointer border-b border-line/70 odd:bg-white even:bg-slate-50/50 hover:bg-cea-soft"
                  >
                    <td className="num px-3 py-2 text-[12px] font-medium tabular-nums text-slate-500">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium leading-snug text-ink">{l.nome}</p>
                      <p className="num text-[11px] text-muted">
                        {l.cidade}/{l.uf} · porte {l.porte}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatusChip tom="neutro">{l.cluster}</StatusChip>
                    </td>
                    <td className="num px-3 py-2 text-right font-semibold">
                      {formatBRLCompact(l.faturamentoMes, 2)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${l.sellThrough}%`,
                              background: 'var(--viz-azul)',
                            }}
                          />
                        </div>
                        <span className="num text-[11.5px] text-muted">
                          {formatPct(l.sellThrough)}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`num px-3 py-2 text-right font-semibold ${l.vsLY < 0 ? 'text-crit' : 'text-ok'}`}
                    >
                      {formatDelta(l.vsLY)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* --------------------------------------------- distribuição -- */}
        <SectionCard
          titulo="Distribuição regional"
          subtitulo={`${formatNum(REDE.totalLojas)} lojas e ${formatBRLCompact(faturamentoRegiao.reduce((a, r) => a + r.faturamento, 0), 1)} por mês`}
        >
          <div className="space-y-3">
            {faturamentoRegiao.map((r) => (
              <div key={r.regiao}>
                <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
                  <span className="font-medium text-ink">{r.regiao}</span>
                  <span className="num text-muted">
                    {formatPct(r.pct, 0)} · {formatNum(r.lojas)} lojas
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${r.pct}%`, background: 'var(--viz-azul)' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-snug text-slate-400">
            Centros de distribuição: {REDE.cds.join(' e ')}. A malha logística é o que define a
            janela de reposição de cada região.
          </p>
        </SectionCard>
      </div>

      {/* ------------------------------------------- modal cadastrar loja -- */}
      <Modal
        aberto={cadastrando}
        onFechar={() => setCadastrando(false)}
        titulo="Cadastrar loja"
        subtitulo="Demo · a loja fica na memória desta sessão, não há backend"
        largura="md"
        rodape={
          <>
            <Button onClick={() => setCadastrando(false)}>Cancelar</Button>
            <Button
              variante="primario"
              disabled={!podeCadastrar}
              onClick={() => {
                setCadastradas((c) => [...c, nova])
                setCadastrando(false)
                push(
                  'Loja cadastrada',
                  'ok',
                  `${nova.nome} · ${nova.cidade}/${nova.uf} · cluster ${nova.cluster} · porte ${nova.porte}. A rede passa a ${formatNum(total + 1)} lojas nesta sessão.`,
                )
                setNova(NOVA_VAZIA)
              }}
            >
              Cadastrar
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoTexto
            rotulo="Nome da loja"
            valor={nova.nome}
            onChange={(v) => setNova({ ...nova, nome: v })}
            placeholder="C&A Shopping ..."
            className="sm:col-span-2"
          />
          <CampoTexto
            rotulo="Cidade"
            valor={nova.cidade}
            onChange={(v) => setNova({ ...nova, cidade: v })}
            placeholder="São Paulo"
          />
          <CampoTexto
            rotulo="UF"
            valor={nova.uf}
            onChange={(v) => setNova({ ...nova, uf: v.toUpperCase().slice(0, 2) })}
            placeholder="SP"
          />
          <CampoSelect
            rotulo="Cluster"
            valor={nova.cluster}
            opcoes={REDE.clusters.map((c) => ({ v: c.id, r: `${c.id} — ${c.nome}` }))}
            onChange={(v) => setNova({ ...nova, cluster: v as Cluster })}
          />
          <CampoSelect
            rotulo="Porte"
            valor={nova.porte}
            opcoes={PORTES_LOJA.map((p) => ({ v: p, r: p }))}
            onChange={(v) => setNova({ ...nova, porte: v as Porte })}
          />
          <CampoSelect
            rotulo="Clima"
            valor={nova.clima}
            opcoes={CLIMAS_LOJA.map((c) => ({ v: c, r: c }))}
            onChange={(v) => setNova({ ...nova, clima: v as Clima })}
            className="sm:col-span-2"
          />
        </div>
        {cadastradas.length > 0 && (
          <div className="mt-4 rounded-lg border border-line">
            <p className="border-b border-line px-3 py-2 text-[12px] font-semibold text-cea-deep">
              Cadastradas nesta sessão
            </p>
            <ul className="divide-y divide-line">
              {cadastradas.map((c, i) => (
                <li key={`${c.nome}-${i}`} className="px-3 py-2 text-[12px]">
                  <span className="font-medium text-ink">{c.nome}</span>
                  <span className="num ml-2 text-muted">
                    {c.cidade}/{c.uf} · cluster {c.cluster} · porte {c.porte} · {c.clima}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {/* --------------------------------------------- drawer da loja -- */}
      <Modal
        aberto={detalhe !== null}
        onFechar={() => setDetalhe(null)}
        titulo={detalhe?.nome ?? ''}
        subtitulo={
          detalhe
            ? `${detalhe.cidade}/${detalhe.uf} · Cluster ${detalhe.cluster} — ${detalhe.clusterNome} · porte ${detalhe.porte} · clima ${detalhe.clima}`
            : ''
        }
        largura="lg"
        rodape={
          <Button variante="primario" onClick={() => setDetalhe(null)}>
            Fechar
          </Button>
        }
      >
        {detalhe && <PainelLoja loja={detalhe} />}
      </Modal>
    </div>
  )
}

/* ------------------------------------------------------------ auxiliares -- */

const ESTILO_CAMPO =
  'focus-ring w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12.5px] text-ink'

function CampoTexto({
  rotulo,
  valor,
  onChange,
  placeholder,
  className = '',
}: {
  rotulo: string
  valor: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
        {rotulo}
      </span>
      <input
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={ESTILO_CAMPO}
      />
    </label>
  )
}

function CampoSelect({
  rotulo,
  valor,
  opcoes,
  onChange,
  className = '',
}: {
  rotulo: string
  valor: string
  opcoes: { v: string; r: string }[]
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
        {rotulo}
      </span>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className={`${ESTILO_CAMPO} font-medium`}
      >
        {opcoes.map((o) => (
          <option key={o.v} value={o.v}>
            {o.r}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Painel da loja: os KPIs derivados da própria frota simulada. */
function PainelLoja({ loja }: { loja: Loja }) {
  const mediaCluster = useMemo(() => {
    const pares = LOJAS.filter((l) => l.cluster === loja.cluster)
    return {
      faturamento: pares.reduce((a, l) => a + l.faturamentoMes, 0) / pares.length,
      sellThrough: pares.reduce((a, l) => a + l.sellThrough, 0) / pares.length,
      conversao: pares.reduce((a, l) => a + l.conversao, 0) / pares.length,
      cobertura: pares.reduce((a, l) => a + l.coberturaDias, 0) / pares.length,
    }
  }, [loja.cluster])

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Faturamento/mês"
          valor={formatBRLCompact(loja.faturamentoMes, 2)}
          sub={`${formatDelta((loja.faturamentoMes / mediaCluster.faturamento - 1) * 100)} vs média do cluster`}
          tomSub={loja.faturamentoMes >= mediaCluster.faturamento ? 'alta' : 'baixa'}
          dica="Faturamento simulado do mês para esta loja."
          extra={<Sparkline dados={serieSparkline(`loja-${loja.id}`, loja.faturamentoMes, 10)} />}
        />
        <KpiCard
          label="Sell-through"
          valor={formatPct(loja.sellThrough)}
          sub={`média do cluster ${formatPct(mediaCluster.sellThrough)}`}
          tomSub={loja.sellThrough >= mediaCluster.sellThrough ? 'alta' : 'baixa'}
          dica="Percentual da coleção já vendido nesta loja."
        />
        <KpiCard
          label="Conversão"
          valor={formatPct(loja.conversao)}
          sub={`média do cluster ${formatPct(mediaCluster.conversao)}`}
          tomSub={loja.conversao >= mediaCluster.conversao ? 'alta' : 'baixa'}
          dica="Cupons ÷ visitantes contados na porta."
        />
        <KpiCard
          label="vs ano anterior"
          valor={formatDelta(loja.vsLY)}
          sub={loja.vsLY < 0 ? 'abaixo do ano anterior' : 'acima do ano anterior'}
          tomSub={loja.vsLY < 0 ? 'baixa' : 'alta'}
          dica="Variação de venda contra o mesmo período do ano anterior."
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ['Ticket médio', formatBRL(loja.ticket)],
            ['Venda/dia', formatBRLCompact(loja.vendaDia, 1)],
            ['Peças em 30 dias', formatNum(loja.venda30d)],
            ['Estoque', formatNum(loja.estoque)],
            ['Estoque/venda', `${formatNum(loja.ev, 2)} meses`],
            ['Cobertura', `${formatNum(loja.coberturaDias, 1)} dias`],
            ['Ruptura', formatPct(loja.rupturaPct)],
            ['Média do cluster', `${formatNum(mediaCluster.cobertura, 1)} dias de cobertura`],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line bg-slate-50/60 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted">{k}</p>
            <p className="num mt-0.5 text-[15px] font-semibold text-cea-deep">{v}</p>
          </div>
        ))}
      </div>

      <Banner tom={loja.nomeada ? 'info' : 'warn'}>
        {loja.nomeada
          ? 'Localização real listada no snapshot público da C&A. As métricas operacionais desta tela são simuladas de forma coerente com os indicadores reais.'
          : 'Loja gerada para completar a malha de 335 unidades: nome, localização e métricas são simulados.'}
      </Banner>
    </div>
  )
}
