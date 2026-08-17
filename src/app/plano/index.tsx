import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/ui/KpiCard'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { Modal } from '@/components/ui/Modal'
import { InputNumero } from '@/components/ui/InputNumero'
import { useToast } from '@/components/ui/Toast'
import { ListaDeCompras } from './ListaDeCompras'
import { ReguaDeBanda } from './ReguaDeBanda'
import { usePlano } from '@/app/PlanoProvider'
import {
  CATEGORIAS_PLANO,
  COLECAO,
  ORIGENS_PLANO,
  PIRAMIDE_PRECO,
  PLANO,
  type LinhaPlano,
} from '@/data/derived'
import { formatBRL, formatBRLCompact, formatDelta, formatNum, formatPct } from '@/lib/format'

const TODOS = 'todos'

export default function PlanoPage() {
  const { push } = useToast()
  const {
    linhas,
    versao,
    setVersao,
    totais,
    totaisOriginal,
    totaisQualificado,
    banda,
    historico,
    incluirLinha,
    restaurar,
    recalcular,
  } = usePlano()

  const [sessao, setSessao] = useState(TODOS)
  const [categoria, setCategoria] = useState(TODOS)
  const [faixa, setFaixa] = useState(TODOS)
  const [origem, setOrigem] = useState<string>(TODOS)
  const [modalAberto, setModalAberto] = useState(false)

  // formulário da nova linha
  const [novoProduto, setNovoProduto] = useState('')
  const [novaCategoria, setNovaCategoria] = useState<string>(CATEGORIAS_PLANO[0])
  const [novoPv, setNovoPv] = useState(159.99)
  const [novaMargem, setNovaMargem] = useState(59)
  const [novaQtd, setNovaQtd] = useState(20_000)

  const sessoes = useMemo(() => [...new Set(linhas.map((l) => l.sessao))], [linhas])

  const filtradas = useMemo(
    () =>
      linhas.filter(
        (l) =>
          (sessao === TODOS || l.sessao === sessao) &&
          (categoria === TODOS || l.categoria === categoria) &&
          (faixa === TODOS || l.faixa === faixa) &&
          (origem === TODOS || l.origem === origem),
      ),
    [linhas, sessao, categoria, faixa, origem],
  )

  const filtrando = filtradas.length !== linhas.length

  function criarLinha() {
    const nome = novoProduto.trim()
    if (!nome) {
      push('Dê um nome ao item', 'warn')
      return
    }
    const nova: LinhaPlano = {
      id: `N${linhas.length + 1}`,
      ref: `NOVO-${String(linhas.length + 1).padStart(2, '0')}`,
      produto: nome,
      categoria: novaCategoria,
      sessao: 'Feminino',
      papel: 'Incluído manualmente',
      cor: 'A definir',
      faixa: PIRAMIDE_PRECO.find((f) => novoPv >= f.min && novoPv <= f.max)?.id ?? 'P3',
      clusterFoco: 'B',
      origem: 'Estratégia',
      pv: novoPv,
      margem: novaMargem,
      pc: Number((novoPv * (1 - novaMargem / 100)).toFixed(2)),
      qtd: novaQtd,
      qtdOriginal: 0,
      status: 'Novo',
      heroi: false,
      fontePreco: 'informado na inclusão manual',
    }
    incluirLinha(nova)
    setModalAberto(false)
    setNovoProduto('')
    push(
      'Item incluído no plano',
      'ok',
      `${nome} · ${formatNum(novaQtd)} pç · ${formatBRL(novaQtd * nova.pc, 0)} de investimento.`,
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Plano de Sortimento"
        subtitulo={`${COLECAO.rotulo} · ${formatNum(linhas.length)} linhas geradas automaticamente`}
        acoes={
          <>
            <Button icone="+" onClick={() => setModalAberto(true)}>
              Incluir item
            </Button>
            <Button
              onClick={() => {
                restaurar()
                push('Plano restaurado', 'info', 'Voltou às 14 linhas geradas e limpou o histórico.')
              }}
            >
              Restaurar
            </Button>
            <Button icone="⤓" onClick={() => exportarCSV(linhas, push)}>
              Exportar CSV
            </Button>
            <Button
              variante="primario"
              icone="⟳"
              onClick={() => {
                const { antes, depois } = recalcular()
                push(
                  'Plano recalculado',
                  'ok',
                  `Investimento de ${formatBRLCompact(antes, 2)} para ${formatBRLCompact(depois, 2)} — dentro do OTB do recorte.`,
                )
              }}
            >
              Recalcular plano
            </Button>
          </>
        }
      />

      {/* -------------------------------------------- chips de origem ---- */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          O plano nasce de
        </span>
        {ORIGENS_PLANO.map((o) => {
          const qtdLinhas = linhas.filter((l) => l.origem === o).length
          const ativa = origem === o
          return (
            <button
              key={o}
              type="button"
              onClick={() => setOrigem(ativa ? TODOS : o)}
              aria-pressed={ativa}
              title={`${qtdLinhas} linha(s) com origem ${o}`}
              className={`focus-ring rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                ativa
                  ? 'border-cea-blue bg-cea-blue text-white'
                  : 'border-line bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {o} <span className={ativa ? 'text-white/70' : 'text-slate-400'}>{qtdLinhas}</span>
            </button>
          )
        })}
      </div>

      {/* ------------------------------------------- estouro + régua ---- */}
      {banda.estourou ? (
        <Banner
          tom="warn"
          titulo={`Estouro de verba · ${formatDelta(banda.desvioPct)} (${formatBRLCompact(banda.desvio, 2)})`}
          acoes={
            <Button
              tamanho="sm"
              variante="primario"
              onClick={() => {
                const { depois } = recalcular()
                push('Plano ajustado ao OTB', 'ok', `Investimento em ${formatBRLCompact(depois, 2)}.`)
              }}
            >
              Ajustar ao OTB
            </Button>
          }
        >
          O investimento de {formatBRLCompact(banda.investimento, 2)} passou o teto de{' '}
          {formatBRLCompact(banda.teto, 2)} da banda. Precisa de compensação em{' '}
          <Link to="/retroalimentacao" className="font-semibold text-cea-blue hover:underline">
            Retroalimentação
          </Link>{' '}
          ou de aprovação de verba extra antes da emissão.
        </Banner>
      ) : (
        <Banner tom="ok" titulo="Plano dentro da banda de OTB">
          O investimento de {formatBRLCompact(banda.investimento, 2)} está entre o piso de{' '}
          {formatBRLCompact(banda.piso, 2)} e o teto de {formatBRLCompact(banda.teto, 2)}.
        </Banner>
      )}

      <ReguaDeBanda banda={banda} />

      {/* --------------------------------- toggle de versão + filtros ---- */}
      <SectionCard
        titulo="Recorte do plano"
        subtitulo="A versão define quais quantidades a lista mostra; os filtros recortam a hierarquia"
        acoes={
          <div className="flex items-center gap-1 rounded-lg border border-line bg-slate-50 p-0.5">
            {(['original', 'qualificado'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVersao(v)}
                aria-pressed={versao === v}
                className={`focus-ring rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
                  versao === v ? 'bg-white text-cea-blue shadow-card' : 'text-slate-500'
                }`}
              >
                {v === 'original' ? 'Plano Original' : 'Plano Qualificado'}
                {versao === v && v === 'qualificado' && <span aria-hidden> ✓</span>}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span className="mb-1 block">N1 · Departamento</span>
            <select
              value={sessao}
              onChange={(e) => setSessao(e.target.value)}
              className="focus-ring w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[12px] font-normal normal-case text-ink"
            >
              <option value={TODOS}>Todos</option>
              {sessoes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span className="mb-1 block">N3 · Categoria</span>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="focus-ring w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[12px] font-normal normal-case text-ink"
            >
              <option value={TODOS}>Todas</option>
              {CATEGORIAS_PLANO.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span className="mb-1 block">Faixa de preço</span>
            <select
              value={faixa}
              onChange={(e) => setFaixa(e.target.value)}
              className="focus-ring w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[12px] font-normal normal-case text-ink"
            >
              <option value={TODOS}>Todas</option>
              {PIRAMIDE_PRECO.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id} · {f.rotulo}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span className="mb-1 block">Origem</span>
            <select
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
              className="focus-ring w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[12px] font-normal normal-case text-ink"
            >
              <option value={TODOS}>Todas</option>
              {ORIGENS_PLANO.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        </div>
        {filtrando && (
          <p className="mt-3 border-t border-line pt-2.5 text-[12px] text-muted">
            Mostrando <strong className="text-ink">{filtradas.length}</strong> de {linhas.length}{' '}
            linhas.{' '}
            <button
              type="button"
              onClick={() => {
                setSessao(TODOS)
                setCategoria(TODOS)
                setFaixa(TODOS)
                setOrigem(TODOS)
              }}
              className="focus-ring rounded font-semibold text-cea-blue hover:underline"
            >
              Limpar filtros
            </button>
          </p>
        )}
      </SectionCard>

      {/* ------------------------------------------------------- KPIs ---- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Linhas do plano"
          valor={formatNum(linhas.length)}
          sub={versao === 'qualificado' ? 'Plano Qualificado' : 'Plano Original'}
          tomSub="neutra"
          dica="Cada linha é um produto-programa com quantidade, preço e margem planejados."
        />
        <KpiCard
          label="Peças"
          valor={formatNum(totais.pecas)}
          sub={
            versao === 'qualificado'
              ? `${formatDelta(((totais.pecas / totaisOriginal.pecas - 1) * 100) || 0)} vs Original`
              : 'baseline imutável'
          }
          tomSub={versao === 'qualificado' ? 'alta' : 'neutra'}
          dica="Volume total planejado para a temporada, somando todas as linhas."
        />
        <KpiCard
          label="Investimento"
          valor={formatBRLCompact(totais.investimento, 1)}
          sub={`OTB do recorte ${formatBRLCompact(PLANO.otbRecorte, 1)}`}
          tomSub={banda.estourou ? 'alerta' : 'alta'}
          dica="Soma de quantidade × preço de custo. É o que precisa caber na banda do OTB."
        />
        <KpiCard
          label="Margem do plano"
          valor={formatPct(totais.margem)}
          sub={`PC médio ${formatBRL(totais.pcMedio)}`}
          tomSub="neutra"
          dica="Margem bruta ponderada pela receita planejada de cada linha."
        />
      </div>

      {/* --------------------- impacto das alterações + line ---- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          titulo="Impacto das Alterações"
          subtitulo="Qualificado contra o baseline Original"
          tag={
            <StatusChip tom={historico.length ? 'info' : 'neutro'}>
              {historico.length} alteraç{historico.length === 1 ? 'ão' : 'ões'} nesta sessão
            </StatusChip>
          }
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            <Impacto
              rotulo="Peças"
              original={formatNum(totaisOriginal.pecas)}
              qualificado={formatNum(totaisQualificado.pecas)}
              delta={formatDelta((totaisQualificado.pecas / totaisOriginal.pecas - 1) * 100)}
              positivo={totaisQualificado.pecas >= totaisOriginal.pecas}
            />
            <Impacto
              rotulo="Investimento"
              original={formatBRLCompact(totaisOriginal.investimento, 2)}
              qualificado={formatBRLCompact(totaisQualificado.investimento, 2)}
              delta={formatBRLCompact(
                totaisQualificado.investimento - totaisOriginal.investimento,
                2,
              )}
              positivo={totaisQualificado.investimento >= totaisOriginal.investimento}
            />
            <Impacto
              rotulo="Margem"
              original={formatPct(totaisOriginal.margem)}
              qualificado={formatPct(totaisQualificado.margem)}
              delta={`${formatNum(totaisQualificado.margem - totaisOriginal.margem, 2)} p.p.`}
              positivo={totaisQualificado.margem >= totaisOriginal.margem}
            />
            <Impacto
              rotulo="PC médio"
              original={formatBRL(totaisOriginal.pcMedio)}
              qualificado={formatBRL(totaisQualificado.pcMedio)}
              delta={formatBRL(totaisQualificado.pcMedio - totaisOriginal.pcMedio)}
              positivo={totaisQualificado.pcMedio >= totaisOriginal.pcMedio}
            />
          </dl>
          <Link
            to="/versoes"
            className="focus-ring mt-3 inline-flex rounded text-[12px] font-semibold text-cea-blue hover:underline"
          >
            Abrir Versões &amp; Aprovação <span aria-hidden>→</span>
          </Link>
        </SectionCard>

        <SectionCard
          titulo="Comparação com o Line"
          subtitulo="Pedido planejado × retorno negociado com os fornecedores"
        >
          <div className="flex flex-col items-start gap-2 rounded-lg border border-line bg-slate-50/60 p-4">
            <StatusChip tom="neutro">Line ainda não devolvido</StatusChip>
            <p className="text-[12.5px] leading-snug text-slate-600">
              A comparação abre quando o line voltar dos fornecedores, com preço negociado e
              quantidade confirmada por referência. Até lá, o plano vale como pedido.
            </p>
            <Link
              to="/line"
              className="focus-ring rounded text-[12px] font-semibold text-cea-blue hover:underline"
            >
              Carregar Line devolvido <span aria-hidden>→</span>
            </Link>
          </div>
        </SectionCard>
      </div>

      <ListaDeCompras linhas={filtradas} />

      {/* --------------------------------------------- modal de inclusão -- */}
      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo="Incluir item no plano"
        subtitulo="A linha entra como Novo, sem baseline no Plano Original"
        rodape={
          <>
            <Button onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button variante="primario" onClick={criarLinha}>
              Incluir no plano
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-[12px] font-semibold text-muted">
            <span className="mb-1 block uppercase tracking-wide">Produto</span>
            <input
              value={novoProduto}
              onChange={(e) => setNovoProduto(e.target.value)}
              placeholder="Ex.: Vestido midi de laise manga bufante"
              className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-[13px] font-normal text-ink placeholder:text-slate-400"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-semibold text-muted">
              <span className="mb-1 block uppercase tracking-wide">Categoria</span>
              <select
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                className="focus-ring w-full rounded-lg border border-line bg-white px-2.5 py-2 text-[13px] font-normal text-ink"
              >
                {CATEGORIAS_PLANO.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] font-semibold text-muted">
              <span className="mb-1 block uppercase tracking-wide">Quantidade</span>
              <InputNumero
                valor={novaQtd}
                onChange={setNovaQtd}
                min={100}
                step={1000}
                sufixo="pç"
                largura="120px"
                rotulo="Quantidade da nova linha"
              />
            </label>
            <label className="block text-[12px] font-semibold text-muted">
              <span className="mb-1 block uppercase tracking-wide">Preço de venda</span>
              <InputNumero
                valor={novoPv}
                onChange={setNovoPv}
                min={1}
                step={10}
                sufixo="R$"
                largura="104px"
                rotulo="Preço de venda"
              />
            </label>
            <label className="block text-[12px] font-semibold text-muted">
              <span className="mb-1 block uppercase tracking-wide">Margem</span>
              <InputNumero
                valor={novaMargem}
                onChange={setNovaMargem}
                min={0}
                max={90}
                sufixo="%"
                largura="84px"
                rotulo="Margem da nova linha"
              />
            </label>
          </div>
          <p className="rounded-lg border border-line bg-slate-50/60 p-3 text-[12px] text-muted">
            Custo derivado: <strong className="num text-ink">{formatBRL(novoPv * (1 - novaMargem / 100))}</strong>{' '}
            por peça · investimento de{' '}
            <strong className="num text-ink">
              {formatBRL(novaQtd * novoPv * (1 - novaMargem / 100), 0)}
            </strong>
            .
          </p>
        </div>
      </Modal>
    </div>
  )
}

function Impacto({
  rotulo,
  original,
  qualificado,
  delta,
  positivo,
}: {
  rotulo: string
  original: string
  qualificado: string
  delta: string
  positivo: boolean
}) {
  return (
    <div className="rounded-lg border border-line bg-slate-50/60 p-3">
      <dt className="kpi-label">{rotulo}</dt>
      <dd className="num mt-1 text-[15px] font-semibold text-cea-deep">{qualificado}</dd>
      <dd className="num mt-0.5 text-[11.5px] text-muted">
        Original {original} ·{' '}
        <span className={positivo ? 'font-semibold text-ok' : 'font-semibold text-crit'}>
          {delta}
        </span>
      </dd>
    </div>
  )
}

/** CSV da lista de compras (separador e decimal no padrão pt-BR). */
function exportarCSV(
  linhas: LinhaPlano[],
  push: (t: string, tom?: 'ok' | 'info' | 'warn' | 'crit', d?: string) => void,
) {
  const cabecalho = [
    'Ref',
    'Produto',
    'Categoria',
    'Sessão',
    'Papel',
    'Cor',
    'Faixa',
    'Origem',
    'Status',
    'PC',
    'PV',
    'Margem %',
    'Qtd Original',
    'Qtd Qualificada',
    'Investimento',
  ]
  const corpo = linhas.map((l) => [
    l.ref,
    l.produto,
    l.categoria,
    l.sessao,
    l.papel,
    l.cor,
    l.faixa,
    l.origem,
    l.status,
    l.pc.toFixed(2),
    l.pv.toFixed(2),
    l.margem.toFixed(2),
    l.qtdOriginal,
    l.qtd,
    (l.qtd * l.pc).toFixed(2),
  ])
  const csv = [cabecalho, ...corpo]
    .map((linha) => linha.map((c) => String(c).replace('.', ',')).join(';'))
    .join('\n')
  // \uFEFF (BOM) para o Excel pt-BR abrir os acentos
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'plano-de-sortimento-verao-26-27.csv'
  a.click()
  URL.revokeObjectURL(url)
  push('CSV exportado', 'ok', `${linhas.length} linhas com quantidade original e qualificada.`)
}
