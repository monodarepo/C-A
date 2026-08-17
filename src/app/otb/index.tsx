import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/ui/KpiCard'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { DataTable, type Coluna } from '@/components/ui/DataTable'
import { useToast } from '@/components/ui/Toast'
import {
  GraficoComprometido,
  GraficoEstoque,
  GraficoMargem,
  GraficoMensal,
} from './GraficosOTB'
import {
  COLECAO,
  META_MARGEM_OTB,
  NIVEIS_HIERARQUIA,
  OTB,
  OTB_CATEGORIAS,
  OTB_INSUMOS,
  OTB_ULTIMA_LEITURA_MIN,
  SEGMENTOS_N5,
  indicadoresOTB,
  recortarPorSegmento,
  totaisOTB,
  type LinhaOTB,
} from '@/data/derived'
import { formatBRLCompact, formatDelta, formatNum, formatPct } from '@/lib/format'

const TODOS = 'todos'

/** R$ em milhões — unidade única da tela. */
const mi = (v: number, casas = 0) => `${formatNum(v, casas)}`

export default function OtbPage() {
  const { push } = useToast()
  const [n1, setN1] = useState<string>(TODOS)
  const [n2, setN2] = useState<string>(TODOS)
  const [n3, setN3] = useState<string>(TODOS)
  const [n5, setN5] = useState<string>(TODOS)
  const [sincronizando, setSincronizando] = useState(false)

  /** Opções em cascata: cada select só oferece o que sobrou do nível anterior. */
  const opcoes = useMemo(() => {
    const porN1 = OTB_CATEGORIAS.filter((l) => n1 === TODOS || l.n1 === n1)
    const porN2 = porN1.filter((l) => n2 === TODOS || l.n2 === n2)
    return {
      n1: [...new Set(OTB_CATEGORIAS.map((l) => l.n1))],
      n2: [...new Set(porN1.map((l) => l.n2))],
      n3: [...new Set(porN2.map((l) => l.n3))],
    }
  }, [n1, n2])

  const linhas = useMemo(() => {
    const filtradas = OTB_CATEGORIAS.filter(
      (l) =>
        (n1 === TODOS || l.n1 === n1) &&
        (n2 === TODOS || l.n2 === n2) &&
        (n3 === TODOS || l.n3 === n3),
    )
    return recortarPorSegmento(filtradas, n5 === TODOS ? 'todos' : (n5 as (typeof SEGMENTOS_N5)[number]))
  }, [n1, n2, n3, n5])

  const totais = useMemo(() => totaisOTB(linhas), [linhas])
  const indicadores = useMemo(() => indicadoresOTB(linhas), [linhas])
  const filtrado = linhas.length !== OTB_CATEGORIAS.length || n5 !== TODOS

  function limparFiltros() {
    setN1(TODOS)
    setN2(TODOS)
    setN3(TODOS)
    setN5(TODOS)
    push('Filtros limpos', 'info', 'Voltou para o total da coleção.')
  }

  function sincronizar() {
    setSincronizando(true)
    window.setTimeout(() => {
      setSincronizando(false)
      push(
        'Leitura do ERP atualizada',
        'ok',
        `${formatNum(OTB_CATEGORIAS.length)} categorias · sem divergência de verba.`,
      )
    }, 900)
  }

  function exportarCSV() {
    const cabecalho = [
      'Categoria',
      'N1',
      'N2',
      'N3',
      'Plano (R$ mi)',
      'LY (R$ mi)',
      'Var %',
      'OTB (R$ mi)',
      'ATB (R$ mi)',
      'Margem %',
      'Cobertura (semanas)',
    ]
    const corpo = linhas.map((l) => [
      l.categoria,
      l.n1,
      l.n2,
      l.n3,
      l.plano,
      l.ly,
      ((l.plano / l.ly - 1) * 100).toFixed(1),
      l.otb,
      l.atb,
      l.margem.toFixed(1),
      l.coberturaSemanas.toFixed(1),
    ])
    const total = [
      'TOTAL',
      '',
      '',
      '',
      totais.plano,
      totais.ly,
      totais.varPct.toFixed(1),
      totais.otb,
      totais.atb,
      totais.margem.toFixed(1),
      totais.coberturaSemanas.toFixed(1),
    ]
    // ponto e vírgula + vírgula decimal: é o que o Excel pt-BR espera
    const csv = [cabecalho, ...corpo, total]
      .map((linha) => linha.map((c) => String(c).replace('.', ',')).join(';'))
      .join('\n')

    // \uFEFF (BOM) faz o Excel pt-BR abrir os acentos corretamente
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = `otb-${COLECAO.nome.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    push('CSV exportado', 'ok', `${linhas.length} categorias + linha de total.`)
  }

  const colunas: Coluna<LinhaOTB>[] = [
    {
      chave: 'categoria',
      titulo: 'Categoria',
      valor: (l) => l.categoria,
      render: (l) => (
        <div className="min-w-0">
          <p className="font-semibold text-ink">{l.categoria}</p>
          <p className="text-[10.5px] text-muted">
            {l.n1} · {l.n2} · {l.n3}
          </p>
        </div>
      ),
    },
    {
      chave: 'plano',
      titulo: 'Plano',
      alinhar: 'dir',
      valor: (l) => l.plano,
      render: (l) => <span className="num font-semibold">{mi(l.plano)}</span>,
    },
    {
      chave: 'ly',
      titulo: 'Ano anterior',
      alinhar: 'dir',
      valor: (l) => l.ly,
      render: (l) => <span className="num">{mi(l.ly)}</span>,
    },
    {
      chave: 'var',
      titulo: 'Var %',
      alinhar: 'dir',
      valor: (l) => (l.plano / l.ly - 1) * 100,
      render: (l) => {
        const v = (l.plano / l.ly - 1) * 100
        return (
          <span className={`num font-semibold ${v >= 0 ? 'text-ok' : 'text-crit'}`}>
            {formatDelta(v)}
          </span>
        )
      },
    },
    {
      chave: 'otb',
      titulo: 'OTB',
      alinhar: 'dir',
      valor: (l) => l.otb,
      render: (l) => <span className="num">{mi(l.otb)}</span>,
    },
    {
      chave: 'atb',
      titulo: 'ATB',
      alinhar: 'dir',
      valor: (l) => l.atb,
      render: (l) => <span className="num text-muted">{mi(l.atb)}</span>,
    },
    {
      chave: 'margem',
      titulo: 'Margem',
      alinhar: 'dir',
      valor: (l) => l.margem,
      render: (l) => (
        <span
          className={`num font-semibold ${l.margem >= META_MARGEM_OTB ? 'text-ok' : 'text-warn'}`}
        >
          {formatPct(l.margem)}
        </span>
      ),
    },
    {
      chave: 'cobertura',
      titulo: 'Cobertura',
      alinhar: 'dir',
      valor: (l) => l.coberturaSemanas,
      render: (l) => <span className="num">{formatNum(l.coberturaSemanas, 1)}s</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="OTB — Open to Buy"
        subtitulo={`${COLECAO.rotulo} · verba aprovada por categoria · valores em R$ milhões`}
        acoes={
          <>
            <Button onClick={sincronizar} disabled={sincronizando} icone="⟳">
              {sincronizando ? 'Sincronizando…' : 'Sincronizar'}
            </Button>
            <Button variante="primario" onClick={exportarCSV} icone="⤓">
              Exportar CSV
            </Button>
          </>
        }
      />

      <Banner
        tom="info"
        titulo="Camada somente leitura"
        acoes={<StatusChip tom="info">há {OTB_ULTIMA_LEITURA_MIN} min</StatusChip>}
      >
        O OTB é aprovado no sistema corporativo e chega aqui pronto. Esta tela lê e compara — quem
        altera quantidade é o{' '}
        <Link to="/plano" className="font-semibold text-cea-blue hover:underline">
          Plano de Sortimento
        </Link>
        . Última leitura há {OTB_ULTIMA_LEITURA_MIN} minutos.
      </Banner>

      {/* ------------------------------------------------ filtro N1 a N7 --- */}
      <SectionCard
        titulo="Hierarquia mercadológica"
        subtitulo="O OTB é aprovado até N3; o detalhe de N4 a N7 vive no Plano de Sortimento"
        acoes={
          filtrado ? (
            <Button tamanho="sm" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          ) : undefined
        }
      >
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
          {NIVEIS_HIERARQUIA.map((nivel) => {
            const desabilitado = !nivel.ativo
            const valor =
              nivel.nivel === 'N1' ? n1 : nivel.nivel === 'N2' ? n2 : nivel.nivel === 'N3' ? n3 : n5
            const setar =
              nivel.nivel === 'N1'
                ? (v: string) => {
                    setN1(v)
                    setN2(TODOS)
                    setN3(TODOS)
                  }
                : nivel.nivel === 'N2'
                  ? (v: string) => {
                      setN2(v)
                      setN3(TODOS)
                    }
                  : nivel.nivel === 'N3'
                    ? setN3
                    : setN5
            const lista =
              nivel.nivel === 'N1'
                ? opcoes.n1
                : nivel.nivel === 'N2'
                  ? opcoes.n2
                  : nivel.nivel === 'N3'
                    ? opcoes.n3
                    : [...SEGMENTOS_N5]

            return (
              <label key={nivel.nivel} className="block text-[11px] font-semibold">
                <span className="mb-1 flex items-center gap-1 uppercase tracking-wide text-slate-400">
                  {nivel.nivel} · {nivel.rotulo}
                </span>
                <select
                  value={desabilitado ? TODOS : valor}
                  disabled={desabilitado}
                  onChange={(e) => setar(e.target.value)}
                  title={
                    desabilitado
                      ? `${nivel.nivel} (${nivel.rotulo}) é detalhado no Plano de Sortimento — o OTB é aprovado por nível agregado`
                      : undefined
                  }
                  className="focus-ring w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[12px] font-normal text-ink disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value={TODOS}>{desabilitado ? 'no Plano →' : 'Todos'}</option>
                  {lista.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
            )
          })}
        </div>
        {filtrado && (
          <p className="mt-3 border-t border-line pt-2.5 text-[12px] text-muted">
            Recorte ativo: <strong className="text-ink">{linhas.length}</strong> de{' '}
            {OTB_CATEGORIAS.length} categorias ·{' '}
            <strong className="text-ink">R$ {mi(totais.plano)} mi</strong> de plano
            {n5 !== TODOS && <> · segmento {n5}</>}
          </p>
        )}
      </SectionCard>

      {/* --------------------------------------------------------- KPIs --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Venda planejada"
          valor={formatBRLCompact(totais.plano * 1e6, 2)}
          sub={`${formatDelta(totais.varPct)} vs ano anterior`}
          tomSub={totais.varPct >= 0 ? 'alta' : 'baixa'}
          dica="Receita que a coleção precisa entregar na temporada, aprovada no OTB corporativo."
        />
        <KpiCard
          label="OTB"
          valor={formatBRLCompact(totais.otb * 1e6)}
          sub={`${formatPct((totais.otb / totais.plano) * 100)} da venda planejada`}
          tomSub="neutra"
          dica="Verba total disponível para compra na temporada, a preço de custo."
        />
        <KpiCard
          label="ATB"
          valor={formatBRLCompact(totais.atb * 1e6)}
          sub={`${formatPct((totais.atb / totais.otb) * 100)} do OTB ainda livre`}
          tomSub="alta"
          dica="Available to Buy: a parte do OTB ainda não comprometida, reservada para recompra de best sellers dentro da temporada."
        />
        <KpiCard
          label="Margem planejada"
          valor={formatPct(totais.margem)}
          sub={`Meta ${formatPct(META_MARGEM_OTB, 0)}`}
          tomSub={totais.margem >= META_MARGEM_OTB ? 'alta' : 'alerta'}
          dica="Margem bruta que o mix planejado entrega, ponderada pela venda de cada categoria."
        />
        <KpiCard
          label="Markdown planejado"
          valor={formatPct(OTB.markdownPlanejado)}
          sub="Verba de remarcação da temporada"
          tomSub="neutra"
          dica="Desconto médio que o plano já assume para escoar a coleção — entra no cálculo da margem."
        />
        <KpiCard
          label="Sell-through alvo"
          valor={formatPct(OTB.sellThroughAlvo, 0)}
          sub={`Cobertura ${formatNum(totais.coberturaSemanas, 1)} semanas`}
          tomSub="neutra"
          dica="Percentual da coleção que precisa ser vendido a preço cheio ou com markdown planejado até o fim da temporada."
        />
      </div>

      {/* ---------------------------------------------- tabela comparativa - */}
      <SectionCard
        titulo="Comparativo por categoria"
        subtitulo="Plano × ano anterior, verba e margem — R$ milhões"
        tag={<StatusChip tom="neutro">Somente leitura</StatusChip>}
        compacto
      >
        <DataTable
          colunas={colunas}
          dados={linhas}
          chaveLinha={(l) => l.categoria}
          ordemInicial={{ chave: 'plano', dir: 'desc' }}
          vazio="Nenhuma categoria neste recorte da hierarquia."
          rodape={
            <>
              <td className="px-3 py-2.5 text-[12px] uppercase tracking-wide">Total</td>
              <td className="num px-3 py-2.5 text-right">{mi(totais.plano)}</td>
              <td className="num px-3 py-2.5 text-right">{mi(totais.ly)}</td>
              <td className="num px-3 py-2.5 text-right text-ok">{formatDelta(totais.varPct)}</td>
              <td className="num px-3 py-2.5 text-right">{mi(totais.otb)}</td>
              <td className="num px-3 py-2.5 text-right">{mi(totais.atb)}</td>
              <td className="num px-3 py-2.5 text-right">{formatPct(totais.margem)}</td>
              <td className="num px-3 py-2.5 text-right">
                {formatNum(totais.coberturaSemanas, 1)}s
              </td>
            </>
          }
        />
      </SectionCard>

      {/* ------------------------------------------------------ gráficos --- */}
      <div className="grid gap-4 xl:grid-cols-2">
        <GraficoMensal />
        <GraficoComprometido linhas={linhas} totais={totais} />
        <GraficoEstoque />
        <GraficoMargem linhas={linhas} totais={totais} />
      </div>

      {/* -------------------------------------- indicadores para decisão --- */}
      <SectionCard
        titulo="Indicadores para decisão"
        subtitulo="O que esta leitura do OTB exige antes da emissão dos pedidos"
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {indicadores.map((i) => (
            <div
              key={i.titulo}
              className={`rounded-lg border p-3.5 ${
                i.tom === 'warn'
                  ? 'border-[#F6D8A0] bg-[var(--warn-soft)]'
                  : 'border-[#A7E8D0] bg-[var(--ok-soft)]'
              }`}
            >
              <div className="flex items-start gap-2">
                <span aria-hidden className={i.tom === 'warn' ? 'text-warn' : 'text-ok'}>
                  {i.tom === 'warn' ? '⚠' : '✓'}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-[13px] font-semibold ${
                      i.tom === 'warn' ? 'text-[#A15C00]' : 'text-[#0A7355]'
                    }`}
                  >
                    {i.titulo}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-snug text-slate-600">{i.texto}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ----------------------------------------------- OTB como insumo --- */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">OTB como insumo</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {OTB_INSUMOS.map((c) => (
            <Link
              key={c.rota}
              to={c.rota}
              className="focus-ring group card-base flex flex-col gap-2 p-4 transition hover:shadow-pop"
            >
              <p className="font-display text-[14px] font-semibold text-cea-deep">{c.titulo}</p>
              <p className="text-[12.5px] leading-snug text-slate-600">{c.texto}</p>
              <span className="mt-auto pt-1 text-[12px] font-semibold text-cea-blue">
                Abrir módulo{' '}
                <span aria-hidden className="transition group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
