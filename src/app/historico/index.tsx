import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/ui/KpiCard'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { Select } from '@/components/ui/Select'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import { ProductImage } from '@/components/ui/ProductImage'
import { GraficoMensalHistorico, type PontoMes } from './GraficosHistorico'
import {
  CANAIS,
  CATEGORIAS_HISTORICO,
  COLECOES_HISTORICO,
  DASHBOARD,
  DISTRIBUICAO_REGIONAL,
  ESTOQUE_POR_REGIAO,
  FATOS_HISTORICO,
  FILTRO_HISTORICO_PADRAO,
  HEATMAP_UF,
  HISTORICO,
  LOJAS,
  MESES_HISTORICO,
  RANKING_SKUS,
  SERIE_MENSAL_HISTORICO,
  SKUS_HISTORICO,
  type ColecaoHistorico,
  type FiltroHistorico,
  type RankingSku,
} from '@/data/derived'
import { formatBRL, formatBRLCompact, formatDelta, formatNum, formatPct, formatPP, plural } from '@/lib/format'
import { exportarArquivo } from '@/lib/exportar'

const ABAS = [
  { id: 'agregada', rotulo: 'Visão agregada' },
  { id: 'sku', rotulo: 'Lista por SKU' },
]

/** As 20 maiores lojas alimentam o filtro — a lista inteira teria 335 opções. */
const LOJAS_FILTRO = LOJAS.slice(0, 20)

export default function HistoricoPage() {
  const { push } = useToast()
  const navigate = useNavigate()
  const [aba, setAba] = useState('agregada')
  const [filtro, setFiltro] = useState<FiltroHistorico>(FILTRO_HISTORICO_PADRAO)

  const colecao = COLECOES_HISTORICO.find((c) => c.id === filtro.colecao)!
  const loja = LOJAS.find((l) => l.id === filtro.loja)

  /**
   * Todo número da tela sai daqui: a tabela-fato filtrada pelos 7 controles.
   * Coleção e loja entram como fatores — a coleção pelo seu porte relativo, a
   * loja pela participação dela no faturamento da própria região.
   */
  const dados = useMemo(() => {
    const skusVisiveis = SKUS_HISTORICO.filter(
      (s) =>
        (filtro.sku === 'todos' || s.id === filtro.sku) &&
        (filtro.categoria === 'todas' || s.categoria === filtro.categoria),
    )
    const idsVisiveis = new Set(skusVisiveis.map((s) => s.id))

    const regiaoDaLoja = loja?.regiao
    const fatos = FATOS_HISTORICO.filter(
      (f) =>
        idsVisiveis.has(f.skuId) &&
        (filtro.regiao === 'todas' || f.regiao === filtro.regiao) &&
        (!regiaoDaLoja || f.regiao === regiaoDaLoja) &&
        (filtro.canal === 'todos' || f.canal === filtro.canal),
    )

    /* Fator da loja: participação dela no faturamento da própria região. É
       rateio, e a tela avisa quando está ativo. */
    const fatorLoja = loja
      ? loja.faturamentoMes /
        LOJAS.filter((l) => l.regiao === loja.regiao).reduce((a, l) => a + l.faturamentoMes, 0)
      : 1
    const fatorMeses = filtro.meses / MESES_HISTORICO.length
    const fator = colecao.fator * fatorLoja * fatorMeses

    const pecas = fatos.reduce((a, f) => a + f.pecas, 0) * fator
    const receita = fatos.reduce((a, f) => a + f.receita, 0) * fator
    const receitaPorSku = new Map<string, number>()
    for (const f of fatos) {
      receitaPorSku.set(f.skuId, (receitaPorSku.get(f.skuId) ?? 0) + f.receita)
    }
    const margem =
      receita > 0
        ? skusVisiveis.reduce((a, s) => a + s.margem * (receitaPorSku.get(s.id) ?? 0), 0) /
          [...receitaPorSku.values()].reduce((a, v) => a + v, 0)
        : 0
    const digital =
      receita > 0
        ? (fatos.filter((f) => f.canal === 'Digital').reduce((a, f) => a + f.receita, 0) /
            fatos.reduce((a, f) => a + f.receita, 0)) *
          100
        : 0

    const porRegiao = DISTRIBUICAO_REGIONAL.map((r) => {
      const linhas = fatos.filter((f) => f.regiao === r.regiao)
      return {
        regiao: r.regiao,
        pecas: linhas.reduce((a, f) => a + f.pecas, 0) * fator,
        receita: linhas.reduce((a, f) => a + f.receita, 0) * fator,
      }
    }).filter((r) => r.receita > 0)

    const porCanal = CANAIS.map((canal) => {
      const linhas = fatos.filter((f) => f.canal === canal)
      return {
        canal,
        pecas: linhas.reduce((a, f) => a + f.pecas, 0) * fator,
        receita: linhas.reduce((a, f) => a + f.receita, 0) * fator,
      }
    }).filter((c) => c.receita > 0)

    const escalaMes = receita / HISTORICO.receita
    const serie: PontoMes[] = SERIE_MENSAL_HISTORICO.slice(
      MESES_HISTORICO.length - filtro.meses,
    ).map((m) => ({
      mes: m.mes,
      receita: Math.round(m.receita * escalaMes * (MESES_HISTORICO.length / filtro.meses)),
      margem: m.margem,
      pecas: Math.round(m.pecas * escalaMes * (MESES_HISTORICO.length / filtro.meses)),
    }))

    const ranking: RankingSku[] = skusVisiveis
      .map((s) => {
        const linhas = fatos.filter((f) => f.skuId === s.id)
        return {
          ...s,
          pecas: Math.round(linhas.reduce((a, f) => a + f.pecas, 0) * fator),
          receita: linhas.reduce((a, f) => a + f.receita, 0) * fator,
        }
      })
      .filter((s) => s.pecas > 0)

    return {
      pecas: Math.round(pecas),
      receita,
      ticket: pecas > 0 ? receita / pecas : 0,
      margem,
      digital,
      porRegiao,
      porCanal,
      serie,
      ranking,
      skus: skusVisiveis.length,
      fatorLoja,
      completo: filtro === FILTRO_HISTORICO_PADRAO,
    }
  }, [filtro, colecao, loja])

  const best = useMemo(
    () => [...dados.ranking].sort((a, b) => b.pecas - a.pecas).slice(0, 5),
    [dados.ranking],
  )
  const slow = useMemo(
    () => [...dados.ranking].sort((a, b) => a.sellThrough - b.sellThrough).slice(0, 5),
    [dados.ranking],
  )

  const filtrosAtivos = contarFiltros(filtro)

  async function exportarCsv() {
    const cabecalho = [
      'ref',
      'produto',
      'departamento',
      'categoria',
      'cor',
      'preco',
      'pecas',
      'receita',
      'margem',
      'sell_through',
      'markdown',
    ]
    const linhas = [...dados.ranking]
      .sort((a, b) => b.receita - a.receita)
      .map((s) =>
        [
          s.cod ?? '',
          `"${s.nome.replace(/"/g, '""')}"`,
          s.dept,
          s.categoria,
          s.cor,
          s.pv.toFixed(2).replace('.', ','),
          s.pecas,
          s.receita.toFixed(2).replace('.', ','),
          s.margem.toFixed(1).replace('.', ','),
          s.sellThrough.toFixed(1).replace('.', ','),
          s.markdownPct,
        ].join(';'),
      )
    // BOM para o Excel abrir o CSV em UTF-8 sem quebrar acento
    const csv = `\uFEFF${[cabecalho.join(';'), ...linhas].join('\n')}`
    /* sem acento e sem espaço no nome do arquivo: o visualizador sanitiza o
       nome antes de confirmar, e o resultado fica mais previsível assim */
    const rotulo = colecao.rotulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
    const nome = `historico-${rotulo}.csv`

    const r = await exportarArquivo(nome, csv)
    if (r.estado === 'salvo') {
      push(
        'CSV exportado',
        'ok',
        `${formatNum(dados.ranking.length)} SKUs com os filtros atuais, separado por ponto e vírgula.`,
      )
    } else if (r.estado === 'copiado') {
      push(
        'CSV copiado',
        'ok',
        `${formatNum(dados.ranking.length)} SKUs na área de transferência — cole no Excel e use Dados › Texto para colunas (;).`,
      )
    } else if (r.estado === 'recusado') {
      push('Exportação cancelada', 'info', 'Nada foi salvo. O botão continua aqui quando quiser.')
    } else {
      push('Não deu para exportar', 'warn', `O download foi bloqueado (${r.motivo}).`)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Histórico de Vendas"
        subtitulo={`${colecao.rotulo} · ${formatNum(dados.skus)} de ${formatNum(SKUS_HISTORICO.length)} SKUs no recorte · ${colecao.nota}`}
        meta={
          <>
            <StatusChip tom={filtrosAtivos ? 'info' : 'neutro'}>
              {filtrosAtivos
                ? plural(filtrosAtivos, 'filtro ativo', 'filtros ativos')
                : 'Recorte completo'}
            </StatusChip>
            {loja && <StatusChip tom="warn">Rateio por loja ativo</StatusChip>}
          </>
        }
        acoes={
          <>
            {filtrosAtivos > 0 && (
              <Button
                onClick={() => {
                  setFiltro(FILTRO_HISTORICO_PADRAO)
                  push('Filtros limpos', 'info', 'De volta ao recorte completo da coleção base.')
                }}
              >
                Limpar filtros
              </Button>
            )}
            <Button variante="primario" onClick={exportarCsv}>
              Exportar CSV
            </Button>
          </>
        }
      />

      {/* ------------------------------------------------------- filtros -- */}
      <SectionCard
        titulo="Filtros"
        subtitulo="Todo KPI, gráfico e tabela desta tela sai da mesma tabela-fato filtrada aqui"
        compacto
      >
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Campo rotulo="Coleção">
            <Select
              className="w-full"
              value={filtro.colecao}
              onChange={(e) =>
                setFiltro({ ...filtro, colecao: e.target.value as ColecaoHistorico })
              }
            >
              {COLECOES_HISTORICO.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.rotulo}
                  {c.atual ? ' (ativa)' : ''}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo rotulo="Produto">
            <Select
              className="w-full"
              value={filtro.sku}
              onChange={(e) => setFiltro({ ...filtro, sku: e.target.value })}
            >
              <option value="todos">Todos os produtos</option>
              {RANKING_SKUS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.cod ? `${s.cod} — ` : ''}
                  {s.nome}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo rotulo="Categoria">
            <Select
              className="w-full"
              value={filtro.categoria}
              onChange={(e) => setFiltro({ ...filtro, categoria: e.target.value })}
            >
              <option value="todas">Todas</option>
              {CATEGORIAS_HISTORICO.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo rotulo="Região">
            <Select
              className="w-full"
              value={filtro.regiao}
              disabled={Boolean(loja)}
              onChange={(e) => setFiltro({ ...filtro, regiao: e.target.value })}
            >
              <option value="todas">Todas</option>
              {DISTRIBUICAO_REGIONAL.map((r) => (
                <option key={r.regiao} value={r.regiao}>
                  {r.regiao}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo rotulo="Loja">
            <Select
              className="w-full"
              value={filtro.loja}
              onChange={(e) =>
                setFiltro({ ...filtro, loja: e.target.value, regiao: 'todas' })
              }
            >
              <option value="todas">Todas as lojas</option>
              {LOJAS_FILTRO.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo rotulo="Canal">
            <Select
              className="w-full"
              value={filtro.canal}
              onChange={(e) => setFiltro({ ...filtro, canal: e.target.value })}
            >
              <option value="todos">Todos</option>
              {CANAIS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo rotulo="Período">
            <Select
              className="w-full"
              value={filtro.meses}
              onChange={(e) => setFiltro({ ...filtro, meses: Number(e.target.value) })}
            >
              {[6, 3, 1].map((m) => (
                <option key={m} value={m}>
                  {m === 6 ? '6 meses (completo)' : `Últimos ${m} ${m === 1 ? 'mês' : 'meses'}`}
                </option>
              ))}
            </Select>
          </Campo>
        </div>
        {loja && (
          <p className="border-t border-line px-4 py-2 text-[11.5px] text-slate-500">
            <strong className="text-slate-600">Rateio ativo:</strong> o recorte é da coleção
            inteira, não da loja. Com {loja.nome} selecionada, os valores saem da região{' '}
            {loja.regiao} multiplicados pela participação da loja no faturamento regional (
            {formatPct(dados.fatorLoja * 100, 2)}).
          </p>
        )}
      </SectionCard>

      {/* ---------------------------------------------------------- KPIs -- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Receita"
          valor={<span className="whitespace-nowrap">{formatBRLCompact(dados.receita, 1)}</span>}
          sub={dados.completo ? 'recorte completo' : 'com os filtros atuais'}
          tomSub="neutra"
          dica="Soma da tabela-fato filtrada: peças × preço de venda praticado."
        />
        <KpiCard
          label="Peças"
          valor={formatNum(dados.pecas)}
          sub={`${formatNum(dados.skus)} SKUs`}
          tomSub="neutra"
          dica="Unidades vendidas no recorte selecionado."
        />
        <KpiCard
          label="Ticket médio"
          valor={formatBRL(dados.ticket)}
          sub="receita ÷ peças"
          tomSub="neutra"
          dica="Preço médio realizado por peça — cai quando o mix pesa para o básico."
        />
        <KpiCard
          label="Margem bruta"
          valor={formatPct(dados.margem)}
          sub={
            Math.abs(dados.margem - HISTORICO.margem) < 0.05
              ? 'média do recorte'
              : `${formatPP(dados.margem - HISTORICO.margem)} vs recorte`
          }
          tomSub={
            Math.abs(dados.margem - HISTORICO.margem) < 0.05
              ? 'neutra'
              : dados.margem > HISTORICO.margem
                ? 'alta'
                : 'baixa'
          }
          dica="Margem ponderada pela receita de cada SKU do recorte filtrado."
        />
        <KpiCard
          label="Digital"
          valor={formatPct(dados.digital)}
          sub="da receita do recorte"
          tomSub="neutra"
          dica="Participação do canal digital dentro do recorte filtrado."
        />
        <KpiCard
          label="vs ano anterior"
          valor={formatDelta(HISTORICO.varVsLY)}
          sub="mesma coleção, ano anterior"
          tomSub="alta"
          dica="Crescimento do recorte contra a coleção equivalente do ano anterior."
        />
      </div>

      <Tabs abas={ABAS} ativa={aba} onTrocar={setAba} />

      {aba === 'agregada' ? (
        <div className="space-y-5">
          <SectionCard
            titulo="Receita e margem no período"
            subtitulo={`${plural(dados.serie.length, 'mês', 'meses')} · a linha pontilhada é a margem média do recorte (${formatPct(HISTORICO.margem)})`}
          >
            <GraficoMensalHistorico dados={dados.serie} />
          </SectionCard>

          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard
              titulo="Calor por UF"
              subtitulo="Índice de participação com São Paulo em 100"
            >
              <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7 lg:grid-cols-9">
                {HEATMAP_UF.map((u) => (
                  <QuadradoUf key={u.uf} uf={u.uf} indice={u.indice} lojas={u.lojas} />
                ))}
              </div>
              <p className="mt-3 border-t border-line pt-2 text-[11px] text-slate-400">
                A escala vem da frota real por UF. SP concentra o maior bloco de lojas e por isso
                fixa o topo do índice.
              </p>
            </SectionCard>

            <div className="space-y-5">
              <SectionCard titulo="Vendas por região" subtitulo="Participação na receita do recorte">
                <div className="space-y-2.5">
                  {dados.porRegiao.map((r) => (
                    <BarraSimples
                      key={r.regiao}
                      rotulo={r.regiao}
                      valor={r.receita}
                      total={dados.receita}
                      detalhe={`${formatNum(Math.round(r.pecas))} pç`}
                    />
                  ))}
                </div>
              </SectionCard>

              <SectionCard titulo="Vendas por canal" subtitulo="Físico × digital no recorte">
                <div className="space-y-2.5">
                  {dados.porCanal.map((c) => (
                    <BarraSimples
                      key={c.canal}
                      rotulo={c.canal}
                      valor={c.receita}
                      total={dados.receita}
                      detalhe={`${formatNum(Math.round(c.pecas))} pç`}
                    />
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard
              titulo="Best sellers"
              subtitulo="Maior giro em unidades — a leitura que o sortimento usa"
              compacto
            >
              <ListaRanking
                itens={best}
                tom="ok"
                acao={{
                  rotulo: 'Acompanhar ao vivo',
                  onClick: (s) => {
                    navigate('/vivo')
                    push(
                      'Aberto no Sortimento Vivo',
                      'info',
                      `${s.nome} entra na leitura de reposição do dia.`,
                    )
                  },
                }}
              />
            </SectionCard>

            <SectionCard
              titulo="Slow sellers"
              subtitulo="Menor sell-through — candidatos a ação de preço"
              compacto
            >
              <ListaRanking
                itens={slow}
                tom="warn"
                acao={{
                  rotulo: 'Criar ação de preço',
                  onClick: (s) => {
                    navigate('/pricing')
                    push(
                      'Aberto no Pricing',
                      'info',
                      `${s.nome} · sell-through de ${formatPct(s.sellThrough)} pede decisão de markdown.`,
                    )
                  },
                }}
              />
            </SectionCard>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard
              titulo="Top 10 lojas"
              subtitulo="Faturamento do mês na frota — base do recorte"
              compacto
            >
              <div className="scroll-x">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                      <th className="px-3 py-2 text-left">Loja</th>
                      <th className="px-3 py-2 text-center">Cluster</th>
                      <th className="px-3 py-2 text-right">Faturamento</th>
                      <th className="px-3 py-2 text-right">ST</th>
                      <th className="px-3 py-2 text-right">vs LY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LOJAS.slice(0, 10).map((l) => (
                      <tr
                        key={l.id}
                        className="border-b border-line/70 odd:bg-white even:bg-slate-50/50 hover:bg-cea-soft"
                      >
                        <td className="px-3 py-2 font-medium text-ink">{l.nome}</td>
                        <td className="px-3 py-2 text-center">
                          <StatusChip tom="neutro">{l.cluster}</StatusChip>
                        </td>
                        <td className="num px-3 py-2 text-right">
                          {formatBRLCompact(l.faturamentoMes, 2)}
                        </td>
                        <td className="num px-3 py-2 text-right">{formatPct(l.sellThrough)}</td>
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

            <SectionCard
              titulo="Estoque por região"
              subtitulo="Cobertura da coleção de verão lida em agosto"
              compacto
            >
              <div className="scroll-x">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                      <th className="px-3 py-2 text-left">Região</th>
                      <th className="px-3 py-2 text-right">Lojas</th>
                      <th className="px-3 py-2 text-right">Estoque</th>
                      <th className="px-3 py-2 text-right">Cobertura</th>
                      <th className="px-3 py-2 text-right">E/V</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ESTOQUE_POR_REGIAO.map((r) => (
                      <tr
                        key={r.regiao}
                        className="border-b border-line/70 odd:bg-white even:bg-slate-50/50 hover:bg-cea-soft"
                      >
                        <td className="px-3 py-2 font-medium text-ink">{r.regiao}</td>
                        <td className="num px-3 py-2 text-right text-muted">{formatNum(r.lojas)}</td>
                        <td className="num px-3 py-2 text-right">{formatNum(r.estoque)}</td>
                        <td className="num px-3 py-2 text-right font-semibold">
                          {formatNum(r.coberturaDias, 1)} d
                        </td>
                        <td className="num px-3 py-2 text-right text-muted">
                          {formatNum(r.ev, 2)}
                        </td>
                        <td className="px-3 py-2">
                          <StatusChip
                            tom={
                              r.status === 'Excesso'
                                ? 'crit'
                                : r.status === 'Atenção'
                                  ? 'warn'
                                  : 'ok'
                            }
                          >
                            {r.status}
                          </StatusChip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-line px-3 py-2 text-[11px] leading-snug text-slate-400">
                O Sul ainda não entrou no verão e carrega mais coleção; Nordeste e Norte já vendem há
                semanas. A média ponderada continua nos {formatNum(DASHBOARD.coberturaDias)} dias do Dashboard.
              </p>
            </SectionCard>
          </div>
        </div>
      ) : (
        <SectionCard
          titulo="Lista por SKU"
          subtitulo={`${formatNum(dados.ranking.length)} referências no recorte filtrado, ordenadas por receita`}
          acoes={
            <Button tamanho="sm" onClick={exportarCsv}>
              Exportar CSV
            </Button>
          }
          compacto
        >
          <div className="scroll-x">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-2 text-left">Ref</th>
                  <th className="px-3 py-2 text-left">Produto</th>
                  <th className="px-3 py-2 text-left">Departamento</th>
                  <th className="px-3 py-2 text-left">Categoria</th>
                  <th className="px-3 py-2 text-right">Preço</th>
                  <th className="px-3 py-2 text-right">Peças</th>
                  <th className="px-3 py-2 text-right">Receita</th>
                  <th className="px-3 py-2 text-right">Margem</th>
                  <th className="px-3 py-2 text-right">ST</th>
                  <th className="px-3 py-2 text-center">Markdown</th>
                </tr>
              </thead>
              <tbody>
                {[...dados.ranking]
                  .sort((a, b) => b.receita - a.receita)
                  .map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-line/70 odd:bg-white even:bg-slate-50/50 hover:bg-cea-soft"
                    >
                      <td className="num px-3 py-2 text-[12px] font-semibold text-slate-500">
                        {s.cod ?? '—'}
                      </td>
                      <td className="max-w-[280px] px-3 py-2 font-medium leading-snug text-ink">
                        {s.nome}
                      </td>
                      <td className="px-3 py-2 text-[12px] text-slate-600">{s.dept}</td>
                      <td className="px-3 py-2 text-[12px] text-slate-600">{s.categoria}</td>
                      <td className="num px-3 py-2 text-right">{formatBRL(s.pv)}</td>
                      <td className="num px-3 py-2 text-right">{formatNum(s.pecas)}</td>
                      <td className="num px-3 py-2 text-right font-semibold">
                        {formatBRLCompact(s.receita, 1)}
                      </td>
                      <td className="num px-3 py-2 text-right">{formatPct(s.margem)}</td>
                      <td
                        className={`num px-3 py-2 text-right font-semibold ${s.sellThrough < 50 ? 'text-crit' : s.sellThrough > 75 ? 'text-ok' : ''}`}
                      >
                        {formatPct(s.sellThrough)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {s.remarcado ? (
                          <StatusChip tom="warn">{formatDelta(s.markdownPct)}</StatusChip>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {dados.ranking.length === 0 && (
            <Banner tom="warn" titulo="Nenhum SKU no recorte" className="m-4">
              Os filtros atuais não deixam nenhuma referência. Limpe um deles para voltar a ver
              dados.
            </Banner>
          )}
        </SectionCard>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- auxiliares -- */

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
        {rotulo}
      </span>
      {children}
    </label>
  )
}

function contarFiltros(f: FiltroHistorico): number {
  let n = 0
  if (f.colecao !== FILTRO_HISTORICO_PADRAO.colecao) n++
  if (f.sku !== 'todos') n++
  if (f.categoria !== 'todas') n++
  if (f.regiao !== 'todas') n++
  if (f.loja !== 'todas') n++
  if (f.canal !== 'todos') n++
  if (f.meses !== FILTRO_HISTORICO_PADRAO.meses) n++
  return n
}

/** Quadrado do heatmap: opacidade proporcional ao índice, texto sempre legível. */
function QuadradoUf({ uf, indice, lojas }: { uf: string; indice: number; lojas: number }) {
  const forte = indice >= 55
  return (
    <div
      title={`${uf}: índice ${indice} (SP = 100) · ${lojas} lojas`}
      className="flex aspect-square cursor-help flex-col items-center justify-center rounded-md border border-line"
      style={{
        background: `color-mix(in srgb, var(--viz-azul) ${Math.max(6, indice)}%, white)`,
      }}
    >
      <span className={`text-[11.5px] font-bold ${forte ? 'text-white' : 'text-cea-deep'}`}>
        {uf}
      </span>
      <span className={`num text-[10px] ${forte ? 'text-white/80' : 'text-slate-500'}`}>
        {indice}
      </span>
    </div>
  )
}

function BarraSimples({
  rotulo,
  valor,
  total,
  detalhe,
}: {
  rotulo: string
  valor: number
  total: number
  detalhe: string
}) {
  const pct = total > 0 ? (valor / total) * 100 : 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
        <span className="font-medium text-ink">{rotulo}</span>
        <span className="num text-muted">
          {formatBRLCompact(valor, 1)} · {formatPct(pct, 1)} · {detalhe}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: 'var(--viz-azul)' }}
        />
      </div>
    </div>
  )
}

function ListaRanking({
  itens,
  tom,
  acao,
}: {
  itens: RankingSku[]
  tom: 'ok' | 'warn'
  acao: { rotulo: string; onClick: (s: RankingSku) => void }
}) {
  if (itens.length === 0) {
    return <p className="p-4 text-[12.5px] text-muted">Nenhum SKU no recorte filtrado.</p>
  }
  return (
    <ul className="divide-y divide-line">
      {itens.map((s, i) => (
        <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
          <span className="num w-5 shrink-0 text-[12px] font-bold text-slate-300">{i + 1}</span>
          <ProductImage cod={s.cod} nome={s.nome} categoria={s.categoria} cor={s.cor} />
          <div className="min-w-[180px] flex-1">
            <p className="text-[12.5px] font-medium leading-snug text-ink">{s.nome}</p>
            <p className="num text-[11px] text-muted">
              {s.cod ? `ref ${s.cod} · ` : ''}
              {formatNum(s.pecas)} pç · {formatBRLCompact(s.receita, 1)} · ST{' '}
              <span className={tom === 'ok' ? 'text-ok' : 'text-warn'}>
                {formatPct(s.sellThrough)}
              </span>
              {s.remarcado && ` · ${formatDelta(s.markdownPct)}`}
            </p>
          </div>
          <Button tamanho="sm" onClick={() => acao.onClick(s)}>
            {acao.rotulo}
          </Button>
        </li>
      ))}
    </ul>
  )
}
