import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/ui/KpiCard'
import { Banner } from '@/components/ui/Banner'
import { StatusChip } from '@/components/ui/StatusChip'
import { ProductImage } from '@/components/ui/ProductImage'
import { fotoDoProduto, marcaDaFoto, nomeExibivel } from '@/lib/fotos'
import { Tooltip } from '@/components/ui/Tooltip'
import { useToast } from '@/components/ui/Toast'
import {
  ESCOPO_PLM,
  ESTAGIOS_PLM,
  FASES_PLM,
  FICHAS_PLM,
  FICHA_DESTAQUE_PLM,
  GATILHOS_PLM,
  PIPELINE_ATENCAO,
  RESUMO_RISCO_PIPELINE,
  SKUS_SEM_LEITURA_PLM,
  TOTAL_CLASSIFICADO_PLM,
  COLECAO,
  fichaPorCod,
  type EstagioPLM,
  type FichaPLM,
  type ItemPipeline,
  type RiscoPLM,
} from '@/data/derived'
import { formatBRL, formatDelta, formatNum, formatPct, formatPP } from '@/lib/format'

export default function PlmPage() {
  const { push } = useToast()
  const [cod, setCod] = useState(FICHA_DESTAQUE_PLM)
  const [monitorando, setMonitorando] = useState<Record<string, boolean>>(
    Object.fromEntries(GATILHOS_PLM.map((g) => [g.id, g.monitorando])),
  )

  const ficha = fichaPorCod(cod)
  const ativos = GATILHOS_PLM.filter((g) => monitorando[g.id]).length

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="PLM — Ciclo de Vida"
        subtitulo={`${COLECAO.rotulo} · ${FASES_PLM.length} fases por produto, pipeline de risco e gatilhos automáticos`}
        meta={
          <>
            <StatusChip tom="info">
              {formatNum(TOTAL_CLASSIFICADO_PLM)} SKUs classificados
            </StatusChip>
            <StatusChip tom={ativos === GATILHOS_PLM.length ? 'ok' : 'warn'}>
              {ativos} de {GATILHOS_PLM.length} gatilhos monitorando
            </StatusChip>
          </>
        }
      />

      <Banner tom="info" titulo="Escopo desta tela">
        <p>
          <strong>Serve para:</strong> {ESCOPO_PLM.servePara}
        </p>
        <p className="mt-1">
          <strong>Não confundir:</strong> {ESCOPO_PLM.naoConfundir}{' '}
          <Link to="/pricing" className="font-semibold text-cea-blue hover:underline">
            Ir para o Pricing →
          </Link>
        </p>
      </Banner>

      {/* ------------------------------------------------ ficha destaque -- */}
      <SectionCard
        titulo="Ficha de ciclo de vida"
        subtitulo="Onde a peça está, como chegou aqui e o que ela ensina para a próxima coleção"
        acoes={
          <label className="flex items-center gap-2 text-[12px] text-muted">
            Produto
            <select
              value={cod}
              onChange={(e) => {
                const novo = e.target.value
                setCod(novo)
                const f = fichaPorCod(novo)
                push(
                  `${f.cod} · fase ${f.fase}/${FASES_PLM.length}`,
                  'info',
                  `${FASES_PLM[f.fase - 1].nome} · ${f.idadeSemanas} semanas em loja.`,
                )
              }}
              className="focus-ring max-w-[300px] rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-ink"
            >
              {FICHAS_PLM.map((f) => (
                <option key={f.cod} value={f.cod}>
                  {f.cod} — {f.nome} ({FASES_PLM[f.fase - 1].nome})
                </option>
              ))}
            </select>
          </label>
        }
      >
        <FichaProduto ficha={ficha} />
      </SectionCard>

      {/* --------------------------------------------- os 5 estágios -- */}
      <SectionCard
        titulo="Estágios do ciclo em loja"
        subtitulo={`As fases ${ESTAGIOS_PLM[0].fase} a ${ESTAGIOS_PLM[ESTAGIOS_PLM.length - 1].fase} — cada estágio tem sua estratégia e sua contagem de SKUs`}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {ESTAGIOS_PLM.map((e) => (
            <CardEstagio key={e.fase} e={e} ativo={ficha.fase === e.fase} />
          ))}
        </div>
        <p className="mt-3 border-t border-line pt-2.5 text-[11.5px] leading-relaxed text-slate-400">
          {formatNum(TOTAL_CLASSIFICADO_PLM)} dos {formatNum(COLECAO.skusAtivos)} SKUs ativos estão
          classificados. Os outros {formatNum(SKUS_SEM_LEITURA_PLM)} têm menos de 4 semanas em loja e
          ainda não fecham leitura de velocidade — entram na classificação na virada da semana.
        </p>
      </SectionCard>

      {/* --------------------------------------------------- pipeline -- */}
      <SectionCard
        titulo="Pipeline — peças que pedem decisão"
        subtitulo="Risco pela regra de cobertura e velocidade, a mesma que alimenta os gatilhos"
        tag={
          <div className="flex items-center gap-1.5">
            <ChipRisco risco="vermelho" n={RESUMO_RISCO_PIPELINE.vermelho} />
            <ChipRisco risco="amarelo" n={RESUMO_RISCO_PIPELINE.amarelo} />
            <ChipRisco risco="verde" n={RESUMO_RISCO_PIPELINE.verde} />
          </div>
        }
        compacto
      >
        <div className="scroll-x">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                <th className="px-3 py-2 text-center">Risco</th>
                <th className="px-3 py-2 text-left">Produto</th>
                <th className="px-3 py-2 text-left">Fase</th>
                <th className="px-3 py-2 text-right">Semanas</th>
                <th className="px-3 py-2 text-right">Cobertura</th>
                <th className="px-3 py-2 text-right">Sell-out</th>
                <th className="px-3 py-2 text-right">Velocidade</th>
                <th className="px-3 py-2 text-left">Ação sugerida</th>
              </tr>
            </thead>
            <tbody>
              {PIPELINE_ATENCAO.map((i) => (
                <LinhaPipeline key={i.produto} i={i} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-3 py-2 text-[11px] text-slate-400">
          Regra do risco: vermelho a partir de 20 semanas de cobertura ou velocidade ≤ −15%; amarelo
          a partir de 12 semanas ou velocidade negativa; verde no resto.
        </p>
      </SectionCard>

      {/* --------------------------------------------------- gatilhos -- */}
      <SectionCard
        titulo="Gatilhos automáticos"
        subtitulo="Regras SE/ENTÃO do motor de ciclo de vida — desligue uma e ela para de sugerir"
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {GATILHOS_PLM.map((g) => {
            const ligado = monitorando[g.id]
            return (
              <article
                key={g.id}
                className={`flex flex-col rounded-lg border p-3.5 ${
                  ligado ? 'border-line bg-slate-50/60' : 'border-dashed border-line bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="num text-[11px] font-bold text-cea-blue">{g.id}</span>
                    <h3 className="text-[13px] font-semibold leading-snug text-cea-deep">
                      {g.nome}
                    </h3>
                  </div>
                  <StatusChip tom={ligado ? 'ok' : 'neutro'}>
                    {ligado ? 'Monitorando' : 'Pausado'}
                  </StatusChip>
                </div>

                <pre className="mt-2.5 whitespace-pre-wrap rounded-md border border-line bg-white px-2.5 py-2 font-mono text-[11px] leading-relaxed text-slate-600">
                  <span className="font-bold text-cea-blue">SE</span> {g.se}
                  {'\n'}
                  <span className="font-bold text-cea-red">ENTÃO</span> {g.entao}
                </pre>

                <p className="mt-2 flex-1 text-[11.5px] leading-snug text-slate-500">{g.nota}</p>

                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2.5">
                  <span className="num text-[11.5px] text-muted">
                    {ligado
                      ? `${formatNum(g.alcance)} SKU(s) na mira hoje`
                      : `${formatNum(g.alcance)} SKU(s) sem cobertura da regra`}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ligado}
                    aria-label={`${ligado ? 'Pausar' : 'Reativar'} gatilho ${g.nome}`}
                    onClick={() => {
                      setMonitorando((atual) => ({ ...atual, [g.id]: !ligado }))
                      push(
                        `${g.id} · ${ligado ? 'pausado' : 'monitorando'}`,
                        ligado ? 'warn' : 'ok',
                        ligado
                          ? `A regra para de sugerir — ${formatNum(g.alcance)} SKU(s) saem da mira.`
                          : `A regra volta a avaliar ${formatNum(g.alcance)} SKU(s) por semana.`,
                      )
                    }}
                    className={`focus-ring relative h-[22px] w-[40px] shrink-0 rounded-full transition ${
                      ligado ? 'bg-ok' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-all ${
                        ligado ? 'left-[21px]' : 'left-[3px]'
                      }`}
                    />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}

/* ------------------------------------------------------ ficha do produto -- */

function FichaProduto({ ficha }: { ficha: FichaPLM }) {
  const fase = FASES_PLM[ficha.fase - 1]
  const aceleracao = ficha.velocidadeDepois - ficha.velocidadeAntes
  /* nome do catálogo só quando a coleta achou um resultado só: com lista
     ambígua não dá para afirmar qual dos candidatos é esta peça */
  const foto = fotoDoProduto(ficha.cod, ficha.nome)
  const nomeCatalogo = nomeExibivel(foto)
  const marca = marcaDaFoto(foto)

  return (
    <div className="space-y-4">
      {/* foto à esquerda, ao lado do bloco de identificação E do stepper */}
      <div className="grid gap-4 md:grid-cols-[200px_1fr]">
        <ProductImage
          cod={ficha.cod}
          nome={ficha.nome}
          categoria={ficha.categoria}
          cor={ficha.cor}
          tamanho="hero"
        />
        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="num text-[11.5px] font-semibold text-slate-400">ref {ficha.cod}</span>
            <StatusChip tom={ficha.bemSucedida ? 'ok' : 'info'}>
              Fase {ficha.fase} de {FASES_PLM.length} · {fase.nome}
            </StatusChip>
            {ficha.bemSucedida && <StatusChip tom="ok">Jornada bem-sucedida ✓</StatusChip>}
          </div>
          <h3 className="font-display text-[17px] font-semibold leading-tight text-cea-deep">
            {ficha.nome}
          </h3>
          <p className="text-[12.5px] text-muted">
            {ficha.categoria} · {ficha.cor} · {ficha.idadeSemanas} semanas em loja
          </p>
          {nomeCatalogo && (
            <p className="text-[11.5px] leading-snug text-slate-400">
              No catálogo: <span className="text-slate-500">{nomeCatalogo}</span>
              {marca && ` · ${marca}`}
            </p>
          )}
          <p className="num text-[13px]">
            {ficha.precoDe && (
              <span className="mr-1.5 text-muted line-through">{formatBRL(ficha.precoDe)}</span>
            )}
            <span className="font-semibold text-ink">{formatBRL(ficha.precoPor)}</span>
            {ficha.markdownPct && (
              <span className="ml-1.5 font-semibold text-cea-red">
                {formatDelta(ficha.markdownPct)}
              </span>
            )}
          </p>

          <StepperFases fase={ficha.fase} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Idade em loja"
          valor={`${formatNum(ficha.idadeSemanas)} sem`}
          sub={fase.nome.toLowerCase()}
          tomSub="neutra"
          dica="Semanas desde a primeira venda registrada — a régua de todas as leituras de velocidade."
        />
        <KpiCard
          label="Velocidade"
          valor={`${formatDelta(ficha.velocidadeAntes)} → ${formatDelta(ficha.velocidadeDepois)}`}
          sub={`${formatPP(aceleracao, 0)} no movimento`}
          tomSub={aceleracao > 0 ? 'alta' : aceleracao < 0 ? 'baixa' : 'neutra'}
          dica="Variação de venda semanal antes e depois do último movimento (markdown, reposição ou ampliação de cor)."
        />
        <KpiCard
          label="GMROI"
          valor={formatNum(ficha.gmroi, 2)}
          sub={ficha.gmroi >= 2.5 ? 'acima do piso de 2,5' : 'abaixo do piso de 2,5'}
          tomSub={ficha.gmroi >= 2.5 ? 'alta' : 'alerta'}
          dica="Margem bruta gerada por real investido em estoque. Piso de gestão da categoria: 2,5."
        />
        <KpiCard
          label="Pulmão"
          valor={ficha.pulmao === 0 ? 'zerado' : formatNum(ficha.pulmao)}
          sub={ficha.pulmao === 0 ? 'nada a escoar' : 'peças a escoar'}
          tomSub={ficha.pulmao === 0 ? 'alta' : 'neutra'}
          dica="Peças em estoque que ainda precisam sair. Pulmão zero na fase 8 é liquidação bem executada."
        />
        <KpiCard
          label="Sell-out"
          valor={formatPct(ficha.sellOut, 0)}
          sub={ficha.sellOut === 100 ? 'grade encerrada' : 'do total produzido'}
          tomSub={ficha.sellOut >= 70 ? 'alta' : ficha.sellOut < 30 ? 'neutra' : 'alerta'}
          dica="Percentual das peças produzidas que já foi vendido."
        />
      </div>

      <div className="rounded-lg border border-[#C7D4F0] bg-cea-soft p-3.5">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-cea-deep">
          Sugestão de aprendizado
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-slate-700">{ficha.aprendizado}</p>
      </div>
    </div>
  )
}

/** Trilha das 8 fases com a atual destacada. */
function StepperFases({ fase }: { fase: number }) {
  return (
    <ol className="scroll-x flex min-w-max items-stretch gap-1" aria-label="Fases do ciclo de vida">
      {FASES_PLM.map((f) => {
        const passada = f.n < fase
        const atual = f.n === fase
        return (
          <li key={f.n} className="min-w-fit flex-1">
            <div
              title={f.descricao}
              aria-current={atual ? 'step' : undefined}
              className={`h-full cursor-help rounded-lg border px-2.5 py-2 text-left transition ${
                atual
                  ? 'border-cea-blue bg-cea-blue text-white'
                  : passada
                    ? 'border-[#A7E8D0] bg-[var(--ok-soft)] text-[#0A7355]'
                    : 'border-line bg-white text-slate-400'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`num grid h-[17px] w-[17px] place-items-center rounded-full text-[10px] font-bold ${
                    atual ? 'bg-white text-cea-blue' : passada ? 'bg-ok text-white' : 'bg-slate-100'
                  }`}
                >
                  {passada ? '✓' : f.n}
                </span>
                <span className="whitespace-nowrap text-[11.5px] font-semibold leading-none">
                  {f.nome}
                </span>
              </div>
              <p
                className={`mt-1 text-[10px] leading-none ${atual ? 'text-white/70' : 'text-slate-400'}`}
              >
                {f.emLoja ? 'em loja' : 'pré-loja'}
              </p>
              <p className="sr-only">{f.descricao}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* --------------------------------------------------------------- estágios -- */

const BORDA_ESTAGIO: Record<EstagioPLM['tom'], string> = {
  info: 'border-l-cea-blue',
  ok: 'border-l-ok',
  warn: 'border-l-warn',
  crit: 'border-l-crit',
}

function CardEstagio({ e, ativo }: { e: EstagioPLM; ativo: boolean }) {
  return (
    <div
      className={`rounded-lg border border-l-[3px] bg-slate-50/60 p-3.5 ${BORDA_ESTAGIO[e.tom]} ${
        ativo ? 'border-cea-blue ring-2 ring-cea-blue/25' : 'border-line'
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[12.5px] font-semibold text-cea-deep">{e.nome}</p>
        <span className="num text-[10.5px] font-semibold text-slate-400">fase {e.fase}</span>
      </div>
      <p className="num mt-1 font-display text-[24px] font-semibold leading-none text-cea-deep">
        {formatNum(e.skus)}
      </p>
      <p className="text-[11px] text-muted">
        SKUs · {formatPct((e.skus / TOTAL_CLASSIFICADO_PLM) * 100, 0)} do total
      </p>
      <p className="mt-2 border-t border-line pt-2 text-[11.5px] leading-snug text-slate-600">
        {e.estrategia}
      </p>
    </div>
  )
}

/* --------------------------------------------------------------- pipeline -- */

const COR_RISCO: Record<RiscoPLM, { ponto: string; texto: string; rotulo: string }> = {
  verde: { ponto: 'text-ok', texto: 'text-ok', rotulo: 'Sob controle' },
  amarelo: { ponto: 'text-warn', texto: 'text-warn', rotulo: 'Atenção' },
  vermelho: { ponto: 'text-crit', texto: 'text-crit', rotulo: 'Crítico' },
}

function ChipRisco({ risco, n }: { risco: RiscoPLM; n: number }) {
  return (
    <span className="num inline-flex items-center gap-1 rounded-full border border-line bg-white px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-500">
      <span aria-hidden className={COR_RISCO[risco].ponto}>
        ●
      </span>
      {n}
    </span>
  )
}

function LinhaPipeline({ i }: { i: ItemPipeline }) {
  const c = COR_RISCO[i.risco]
  return (
    <tr className="border-b border-line/70 odd:bg-white even:bg-slate-50/50 hover:bg-cea-soft">
      <td className="px-3 py-2 text-center">
        <Tooltip texto={`${c.rotulo} · cobertura de ${i.cobertura} semanas`} lado="baixo">
          <span aria-label={c.rotulo} className={`text-[15px] leading-none ${c.ponto}`}>
            ●
          </span>
        </Tooltip>
      </td>
      <td className="max-w-[260px] px-3 py-2">
        <p className="font-medium leading-snug text-ink">{i.produto}</p>
        {i.cod && (
          <span className="num text-[10.5px] font-semibold text-slate-400">ref {i.cod}</span>
        )}
      </td>
      <td className="px-3 py-2 text-[12px] text-slate-600">
        {i.fase} · {FASES_PLM[i.fase - 1].nome}
      </td>
      <td className="num px-3 py-2 text-right text-muted">{formatNum(i.semanas)}</td>
      <td className={`num px-3 py-2 text-right font-semibold ${c.texto}`}>
        {formatNum(i.cobertura)} sem
      </td>
      <td className="num px-3 py-2 text-right">{formatPct(i.sellOut, 0)}</td>
      <td
        className={`num px-3 py-2 text-right font-semibold ${i.velocidade < 0 ? 'text-crit' : 'text-ok'}`}
      >
        {formatDelta(i.velocidade)}
      </td>
      <td className="max-w-[300px] px-3 py-2 text-[12px] leading-snug text-slate-600">{i.acao}</td>
    </tr>
  )
}
