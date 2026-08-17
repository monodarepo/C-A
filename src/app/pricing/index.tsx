import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/ui/KpiCard'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { useToast } from '@/components/ui/Toast'
import {
  CALENDARIO_PRECO,
  CANDIDATOS_PRECO,
  DASHBOARD,
  DRILL_PRECO,
  PROFUNDIDADE_CLUSTER_A,
  REDE,
  REGRAS_CANAL,
  TIPOS_ETIQUETA,
  VIVO,
  type CandidatoPreco,
  type LinhaDrillPreco,
  type TipoEtiqueta,
} from '@/data/derived'
import { formatBRL, formatBRLCompact, formatDelta, formatNum, formatPct } from '@/lib/format'

type AcaoAtiva = {
  id: number
  nome: string
  etiqueta: string
  clusters: string[]
  vigencia: string
  pecas: number
  impacto: number
  itens: number
}

const CLUSTERS = REDE.clusters.map((c) => ({ id: c.id, nome: c.nome, lojas: c.lojas }))

export default function PricingPage() {
  const { push } = useToast()

  const [selecionados, setSelecionados] = useState<string[]>([])
  const [nome, setNome] = useState('Liquidação de vestidos — vitrine de agosto')
  const [etiqueta, setEtiqueta] = useState<TipoEtiqueta>('de-por')
  const [inicio, setInicio] = useState('18/08/2026')
  const [fim, setFim] = useState('31/08/2026')
  const [clustersAlvo, setClustersAlvo] = useState<string[]>(['A'])
  const [acoes, setAcoes] = useState<AcaoAtiva[]>([])
  const [aberto, setAberto] = useState<string[]>([])
  const [clusterFoco, setClusterFoco] = useState('A')

  const itens = CANDIDATOS_PRECO.filter((c) => selecionados.includes(c.id))

  /** Prévia do impacto: só soma o que está marcado, nada é fixo na tela. */
  const previa = useMemo(() => {
    const pecas = itens.reduce((a, i) => a + i.estoque, 0)
    const receitaCheia = itens.reduce((a, i) => a + i.estoque * i.precoDe, 0)
    const receitaRemarcada = itens.reduce((a, i) => a + i.estoque * i.precoPor, 0)
    const lojas = clustersAlvo.reduce(
      (a, c) => a + (CLUSTERS.find((x) => x.id === c)?.lojas ?? 0),
      0,
    )
    return {
      pecas,
      lojas,
      receitaCheia,
      receitaRemarcada,
      impacto: receitaRemarcada - receitaCheia,
      profundidade: receitaCheia > 0 ? (receitaRemarcada / receitaCheia - 1) * 100 : 0,
      coberturaMedia:
        itens.length > 0 ? itens.reduce((a, i) => a + i.cobertura, 0) / itens.length : 0,
    }
  }, [itens, clustersAlvo])

  const tipoEtiqueta = TIPOS_ETIQUETA.find((t) => t.id === etiqueta)!
  const podeCriar = itens.length > 0 && clustersAlvo.length > 0 && nome.trim().length > 2

  function criarAcao() {
    if (!podeCriar) return
    const nova: AcaoAtiva = {
      id: acoes.length + 1,
      nome: nome.trim(),
      etiqueta: tipoEtiqueta.nome,
      clusters: [...clustersAlvo].sort(),
      vigencia: `${inicio} a ${fim}`,
      pecas: previa.pecas,
      impacto: previa.impacto,
      itens: itens.length,
    }
    setAcoes((a) => [nova, ...a])
    setSelecionados([])
    push(
      'Ação de preço criada',
      'ok',
      `${nova.itens} referência(s) · ${formatNum(nova.pecas)} peças · cluster ${nova.clusters.join(', ')} · ${nova.vigencia}.`,
    )
  }

  function aplicarNoClusterFoco() {
    const foco = CLUSTERS.find((c) => c.id === clusterFoco)!
    const recomendados = DRILL_PRECO.filter(
      (l) => l.nivel === 'SKU' && l.recomendacao === 'Reduzir',
    ).slice(0, 3)
    setClustersAlvo([foco.id])
    setSelecionados(CANDIDATOS_PRECO.slice(0, 3).map((c) => c.id))
    push(
      `Pré-carregado no cluster ${foco.id}`,
      'info',
      `${recomendados.length} recomendações de redução do drill-down entraram na ação — revise e confirme.`,
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Pricing & Markdown"
        subtitulo={`Ação de preço por cluster e leitura de posicionamento — ${formatNum(VIVO.markdownsAtivos)} markdowns ativos, profundidade média ${formatDelta(VIVO.markdownMedio)}`}
        meta={
          <>
            <StatusChip tom={acoes.length ? 'ok' : 'neutro'}>
              {formatNum(acoes.length)} ação(ões) criada(s) nesta sessão
            </StatusChip>
            <StatusChip tom="warn">
              Markdown acumulado {formatPct(DASHBOARD.markdownAcumulado)} de{' '}
              {formatPct(DASHBOARD.markdownLimite)}
            </StatusChip>
          </>
        }
        acoes={
          <Button variante="primario" onClick={aplicarNoClusterFoco}>
            Aplicar no Cluster {clusterFoco} ({formatNum(CANDIDATOS_PRECO.slice(0, 3).length)})
          </Button>
        }
      />

      {/* ==================================================== criar ação == */}
      <SectionCard
        titulo="Criar ação de preço"
        subtitulo="Escolha as referências, o tipo de etiqueta, a vigência e os clusters-alvo"
        tag={
          <StatusChip tom={itens.length ? 'info' : 'neutro'}>
            {formatNum(itens.length)} selecionada(s)
          </StatusChip>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          {/* ------------------------------------------ lista de produtos -- */}
          <div className="rounded-lg border border-line">
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
              <p className="text-[12px] font-semibold text-cea-deep">
                Candidatos — markdowns reais do catálogo
              </p>
              <Button
                tamanho="sm"
                onClick={() =>
                  setSelecionados((s) =>
                    s.length === CANDIDATOS_PRECO.length
                      ? []
                      : CANDIDATOS_PRECO.map((c) => c.id),
                  )
                }
              >
                {selecionados.length === CANDIDATOS_PRECO.length ? 'Limpar' : 'Selecionar todos'}
              </Button>
            </div>
            <ul className="divide-y divide-line">
              {CANDIDATOS_PRECO.map((c) => (
                <LinhaCandidato
                  key={c.id}
                  c={c}
                  marcado={selecionados.includes(c.id)}
                  onToggle={() =>
                    setSelecionados((s) =>
                      s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id],
                    )
                  }
                />
              ))}
            </ul>
          </div>

          {/* ------------------------------------------------ configuração -- */}
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Nome da ação
              </span>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="focus-ring w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12.5px] text-ink"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Tipo de etiqueta
              </span>
              <select
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value as TipoEtiqueta)}
                className="focus-ring w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-ink"
              >
                {TIPOS_ETIQUETA.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[11px] leading-snug text-slate-400">
                {tipoEtiqueta.nota}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Início
                </span>
                <input
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  className="focus-ring num w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12.5px] text-ink"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Fim
                </span>
                <input
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                  className="focus-ring num w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12.5px] text-ink"
                />
              </label>
            </div>

            <div>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Clusters-alvo
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CLUSTERS.map((c) => {
                  const on = clustersAlvo.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setClustersAlvo((s) =>
                          s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id],
                        )
                      }
                      className={`focus-ring rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold transition ${
                        on
                          ? 'border-cea-blue bg-cea-blue text-white'
                          : 'border-line bg-white text-slate-500 hover:border-cea-blue/50'
                      }`}
                    >
                      {c.id}
                      <span className={`num ml-1 ${on ? 'text-white/70' : 'text-slate-400'}`}>
                        {formatNum(c.lojas)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ------------------------------------------------- preview -- */}
            <div className="rounded-lg border border-[#C7D4F0] bg-cea-soft p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-cea-deep">
                Prévia do impacto
              </p>
              {itens.length === 0 ? (
                <p className="mt-1 text-[12px] text-slate-600">
                  Marque ao menos uma referência para ver o impacto da ação.
                </p>
              ) : (
                <dl className="mt-1.5 space-y-1">
                  {(
                    [
                      ['Referências', formatNum(itens.length)],
                      ['Peças em estoque', formatNum(previa.pecas)],
                      ['Lojas atingidas', formatNum(previa.lojas)],
                      ['Receita a preço cheio', formatBRLCompact(previa.receitaCheia, 2)],
                      ['Receita remarcada', formatBRLCompact(previa.receitaRemarcada, 2)],
                      ['Profundidade média', formatDelta(previa.profundidade)],
                      ['Cobertura média hoje', `${formatNum(Math.round(previa.coberturaMedia))} d`],
                    ] as [string, string][]
                  ).map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-3 text-[11.5px]">
                      <dt className="text-slate-600">{k}</dt>
                      <dd className="num font-semibold text-cea-deep">{v}</dd>
                    </div>
                  ))}
                  <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t border-[#C7D4F0] pt-1.5 text-[12px]">
                    <dt className="font-semibold text-slate-700">Impacto na receita</dt>
                    <dd className="num font-bold text-cea-red">
                      {formatBRLCompact(previa.impacto, 2)}
                    </dd>
                  </div>
                </dl>
              )}
            </div>

            <Button variante="primario" className="w-full" onClick={criarAcao} disabled={!podeCriar}>
              {podeCriar ? 'Criar ação de preço' : 'Selecione referência e cluster'}
            </Button>
          </div>
        </div>

        {acoes.length > 0 && (
          <div className="mt-4 rounded-lg border border-line">
            <p className="border-b border-line px-3 py-2 text-[12px] font-semibold text-cea-deep">
              Ações ativas nesta sessão
            </p>
            <ul className="divide-y divide-line">
              {acoes.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-[220px]">
                    <p className="text-[12.5px] font-medium text-ink">{a.nome}</p>
                    <p className="num text-[11px] text-muted">
                      {a.etiqueta} · cluster {a.clusters.join(', ')} · {a.vigencia} ·{' '}
                      {formatNum(a.itens)} ref · {formatNum(a.pecas)} pç
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="num text-[12px] font-semibold text-cea-red">
                      {formatBRLCompact(a.impacto, 2)}
                    </span>
                    <StatusChip tom="ok">Ativa</StatusChip>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>

      {/* ================================================= base analítica == */}
      <SectionCard
        titulo="Base analítica"
        subtitulo="Onde nosso preço está contra o cluster, o canal e o mercado digital"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {CLUSTERS.map((c) => {
            const foco = c.id === clusterFoco
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={foco}
                onClick={() => {
                  setClusterFoco(c.id)
                  push(
                    `Cluster ${c.id} em foco`,
                    'info',
                    `${c.nome} · ${formatNum(c.lojas)} lojas · a leitura de preço abaixo passa a ser deste cluster.`,
                  )
                }}
                className={`rounded-lg border p-3.5 text-left transition ${
                  foco
                    ? 'border-cea-blue bg-cea-soft ring-2 ring-cea-blue/25'
                    : 'border-line bg-slate-50/60 hover:border-cea-blue/40'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[12.5px] font-semibold text-cea-deep">Cluster {c.id}</p>
                  {foco && <span className="text-[12px] font-bold text-cea-blue">✓</span>}
                </div>
                <p className="num mt-1 font-display text-[24px] font-semibold leading-none text-cea-deep">
                  {formatNum(c.lojas)}
                </p>
                <p className="text-[11px] text-muted">lojas</p>
                <p className="mt-2 border-t border-line pt-2 text-[11px] leading-snug text-slate-600">
                  {c.nome}
                </p>
              </button>
            )
          })}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {REGRAS_CANAL.map((r) => (
            <div
              key={r.canal}
              className={`rounded-lg border p-3 ${
                r.tom === 'warn'
                  ? 'border-[#F6D8A0] bg-[var(--warn-soft)]'
                  : 'border-line bg-slate-50/60'
              }`}
            >
              <p className="text-[12px] font-semibold text-cea-deep">{r.canal}</p>
              <p className="mt-1 text-[11.5px] leading-snug text-slate-600">{r.regra}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Markdown acumulado"
          valor={formatPct(DASHBOARD.markdownAcumulado)}
          sub={`limite da estação ${formatPct(DASHBOARD.markdownLimite)}`}
          tomSub="alerta"
          dica="Percentual da receita já entregue em remarcação nesta coleção."
        />
        <KpiCard
          label="Markdowns ativos"
          valor={formatNum(VIVO.markdownsAtivos)}
          sub={`média ${formatDelta(VIVO.markdownMedio)}`}
          tomSub="neutra"
          dica="Ações de preço rodando agora na rede."
        />
        <KpiCard
          label="Profundidade Cluster A"
          valor={`${formatPct(PROFUNDIDADE_CLUSTER_A.min, 0)} a ${formatPct(PROFUNDIDADE_CLUSTER_A.max, 0)}`}
          sub="faixa recomendada"
          tomSub="neutra"
          dica="Cluster A sustenta etiqueta cheia mais tempo: markdown raso e escalonado, nunca liquidação direta."
        />
        <KpiCard
          label="C&A Pay"
          valor={formatPct(DASHBOARD.ceaPayShare)}
          sub="das vendas da rede"
          tomSub="neutra"
          dica="Base da mecânica de desconto exclusivo no meio de pagamento próprio."
        />
      </div>

      {/* -------------------------------------------------- drill-down -- */}
      <SectionCard
        titulo={`Preço praticado — N1 até SKU (cluster ${clusterFoco})`}
        subtitulo="Clique no departamento para abrir as referências"
        compacto
      >
        <div className="scroll-x">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line bg-slate-50/80 text-[11px] uppercase tracking-wide text-muted">
                <th className="px-3 py-2 text-left">Nível</th>
                <th className="px-3 py-2 text-right">Físico cluster {clusterFoco}</th>
                <th className="px-3 py-2 text-right">Digital</th>
                <th className="px-3 py-2 text-right">Mercado digital</th>
                <th className="px-3 py-2 text-center">Recomendação</th>
                <th className="px-3 py-2 text-right">Profundidade</th>
                <th className="px-3 py-2 text-left">Ação</th>
              </tr>
            </thead>
            <tbody>
              {DRILL_PRECO.filter(
                (l) => l.nivel === 'N1' || aberto.includes(l.paiId ?? ''),
              ).map((l) => (
                <LinhaDrill
                  key={l.id}
                  l={l}
                  aberto={aberto.includes(l.id)}
                  onToggle={() =>
                    setAberto((a) => (a.includes(l.id) ? a.filter((x) => x !== l.id) : [...a, l.id]))
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-3 py-2 text-[11px] leading-snug text-slate-400">
          A referência de mercado muda com a faixa de preço: peça de entrada é comparada ao mercado
          inteiro (onde pesa o bloco de valor), peça premium aos pares aspirativos. Mesma base do{' '}
          <Link to="/benchmark" className="font-semibold text-cea-blue hover:underline">
            Benchmark
          </Link>
          .
        </p>
      </SectionCard>

      {/* ------------------------------------------------- calendário -- */}
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard
          titulo="Calendário de preço"
          subtitulo="Janelas fixas do calendário comercial — a contagem sai da data do snapshot"
        >
          <ul className="space-y-2.5">
            {CALENDARIO_PRECO.map((j) => (
              <li
                key={j.nome}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 ${
                  j.status === 'ATIVO'
                    ? 'border-[#A7E8D0] bg-[var(--ok-soft)]'
                    : 'border-line bg-slate-50/60'
                }`}
              >
                <div className="min-w-[200px] flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[12.5px] font-semibold text-cea-deep">{j.nome}</p>
                    <StatusChip tom={j.status === 'ATIVO' ? 'ok' : 'neutro'}>{j.status}</StatusChip>
                  </div>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-slate-600">{j.nota}</p>
                </div>
                <div className="text-right">
                  <p className="num text-[12.5px] font-semibold text-cea-deep">{j.quando}</p>
                  {j.dias !== null && (
                    <p className="num text-[11px] text-muted">em {formatNum(j.dias)} dias</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          titulo={`Profundidade do markdown — cluster ${clusterFoco}`}
          subtitulo="Quanto descer, e por quê"
        >
          <div className="rounded-lg border border-line bg-slate-50/60 p-4 text-center">
            <p className="num font-display text-[30px] font-semibold leading-none text-cea-deep">
              {formatPct(PROFUNDIDADE_CLUSTER_A.min, 0)} a {formatPct(PROFUNDIDADE_CLUSTER_A.max, 0)}
            </p>
            <p className="mt-1 text-[11.5px] text-muted">faixa recomendada nesta janela</p>
          </div>
          <Banner tom="info" className="mt-3">
            O cluster A concentra as lojas de maior ticket: markdown raso preserva a percepção de
            preço e ainda gira o estoque. Profundidade cheia entra primeiro em D (outlet e saldo), que
            já opera com essa expectativa.
          </Banner>
          <p className="mt-3 text-[11.5px] leading-relaxed text-slate-500">
            Descer além de {formatPct(PROFUNDIDADE_CLUSTER_A.max, 0)} no cluster A consome verba que a
            Black Friday vai precisar — o markdown acumulado da coleção já está em{' '}
            {formatPct(DASHBOARD.markdownAcumulado)} de um limite de{' '}
            {formatPct(DASHBOARD.markdownLimite)}.
          </p>
        </SectionCard>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ auxiliares -- */

function LinhaCandidato({
  c,
  marcado,
  onToggle,
}: {
  c: CandidatoPreco
  marcado: boolean
  onToggle: () => void
}) {
  return (
    <li className={marcado ? 'bg-cea-soft' : ''}>
      <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5">
        <input
          type="checkbox"
          checked={marcado}
          onChange={onToggle}
          className="focus-ring mt-0.5 h-4 w-4 shrink-0 accent-[var(--cea-blue)]"
          aria-label={`Selecionar ${c.produto}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium leading-snug text-ink">{c.produto}</p>
          <p className="num mt-0.5 text-[11.5px] text-muted">
            {c.cod ? `ref ${c.cod} · ` : ''}
            {c.cor} · <span className="line-through">{formatBRL(c.precoDe)}</span>{' '}
            <span className="font-semibold text-ink">{formatBRL(c.precoPor)}</span>{' '}
            <span className="font-semibold text-cea-red">{formatDelta(c.markdownPct)}</span>
          </p>
          <p className="num text-[11px] text-slate-400">
            {formatNum(c.estoque)} pç em estoque · {formatNum(c.cobertura)} d de cobertura · ST{' '}
            {formatPct(c.sellThrough)}
          </p>
        </div>
      </label>
    </li>
  )
}

const TOM_RECOMENDACAO = {
  Reduzir: 'warn',
  Subir: 'ok',
  Manter: 'neutro',
} as const

function LinhaDrill({
  l,
  aberto,
  onToggle,
}: {
  l: LinhaDrillPreco
  aberto: boolean
  onToggle: () => void
}) {
  const n1 = l.nivel === 'N1'
  return (
    <tr
      className={`border-b border-line/70 ${n1 ? 'bg-slate-50/80 font-semibold' : 'odd:bg-white even:bg-slate-50/40'} hover:bg-cea-soft`}
    >
      <td className="px-3 py-2">
        {n1 ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={aberto}
            className="focus-ring flex items-center gap-1.5 rounded text-[12.5px] font-semibold text-cea-deep"
          >
            <span aria-hidden className="text-[10px] text-cea-blue">
              {aberto ? '▾' : '▸'}
            </span>
            {l.rotulo}
          </button>
        ) : (
          <span className="ml-4 block max-w-[280px] text-[12.5px] font-medium leading-snug text-ink">
            {l.rotulo}
            {l.cod && (
              <span className="num ml-1.5 text-[10.5px] font-semibold text-slate-400">
                {l.cod}
              </span>
            )}
          </span>
        )}
      </td>
      <td className="num px-3 py-2 text-right">{formatBRL(l.precoFisicoA)}</td>
      <td className="num px-3 py-2 text-right">
        {formatBRL(l.precoDigital)}
        {l.precoDigital < l.precoFisicoA && (
          <span className="ml-1 text-[10px] font-semibold text-warn">ação de canal</span>
        )}
      </td>
      <td className="num px-3 py-2 text-right text-muted">{formatBRL(l.precoMercadoDigital)}</td>
      <td className="px-3 py-2 text-center">
        <StatusChip tom={TOM_RECOMENDACAO[l.recomendacao]}>{l.recomendacao}</StatusChip>
      </td>
      <td
        className={`num px-3 py-2 text-right font-semibold ${l.profundidade < 0 ? 'text-crit' : l.profundidade > 0 ? 'text-ok' : 'text-slate-300'}`}
      >
        {l.profundidade === 0 ? '—' : formatPct(l.profundidade, 0)}
      </td>
      <td className="max-w-[300px] px-3 py-2 text-[11.5px] font-normal leading-snug text-slate-600">
        {l.acao}
      </td>
    </tr>
  )
}
