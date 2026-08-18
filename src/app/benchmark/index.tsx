import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/ui/KpiCard'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { useToast } from '@/components/ui/Toast'
import {
  BENCHMARK,
  CONCORRENTES_MONITORADOS,
  ESCOPO_BENCHMARK,
  GAP_MEDIO_COMPARAVEL,
  GAP_MEDIO_PARES,
  ITENS_COMPARAVEIS,
  MARCAS_COM_PRECO,
  MARCAS_PARES,
  MARCAS_VALOR,
  MOVIMENTOS_IA,
  TERMO_COLETA,
  type MovimentoIA,
} from '@/data/derived'
import { buscarAoVivo } from '@/lib/cea'
import { formatBRL, formatDelta, formatNum } from '@/lib/format'

type Coleta = {
  skus: number
  min: number
  max: number
  aoVivo: boolean
}

const COLETA_DO_SNAPSHOT: Coleta = { ...BENCHMARK.coletaSnapshot, aoVivo: false }

/** O líder de ticket entre os monitorados — a referência do KPI de gap. */
const PRECO_RENNER = MARCAS_COM_PRECO.reduce((a, m) => (m.precoMedio > a ? m.precoMedio : a), 0)

export default function BenchmarkPage() {
  const { push } = useToast()
  const [coleta, setColeta] = useState<Coleta>(COLETA_DO_SNAPSHOT)
  const [coletando, setColetando] = useState(false)

  async function atualizarColeta() {
    if (coletando) return
    setColetando(true)
    const r = await buscarAoVivo(TERMO_COLETA)
    const precos = r.produtos.map((p) => p.precoPor).filter((p): p is number => typeof p === 'number')

    if (r.fallback || precos.length === 0) {
      setColeta(COLETA_DO_SNAPSHOT)
      push(
        'Coleta ao vivo indisponível',
        'warn',
        `Sem resposta do catálogo — seguindo com o snapshot de ${formatNum(BENCHMARK.coletaSnapshot.skus)} SKUs.`,
      )
    } else {
      setColeta({
        skus: r.total || precos.length,
        min: Math.floor(Math.min(...precos)),
        max: Math.ceil(Math.max(...precos)),
        aoVivo: true,
      })
      push(
        'Coleta atualizada',
        'ok',
        `${formatNum(r.total || precos.length)} SKUs de "${TERMO_COLETA}" lidos do catálogo ao vivo.`,
      )
    }
    setColetando(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Benchmark de Mercado"
        subtitulo={`${CONCORRENTES_MONITORADOS.length} concorrentes monitorados · coleta de "${TERMO_COLETA}" e preço por peça comparável`}
        meta={
          <>
            <StatusChip tom={coleta.aoVivo ? 'ok' : 'neutro'}>
              {coleta.aoVivo ? 'Coleta ao vivo' : 'Snapshot local'}
            </StatusChip>
            <StatusChip tom="info">Cor do ano: {BENCHMARK.corDoAno}</StatusChip>
          </>
        }
        acoes={
          <Button variante="primario" onClick={atualizarColeta} disabled={coletando}>
            {coletando ? 'Coletando…' : 'Atualizar coleta'}
          </Button>
        }
      />

      <Banner tom="info" titulo="Escopo desta tela">
        <p>
          <strong>Serve para:</strong> {ESCOPO_BENCHMARK.servePara}
        </p>
        <p className="mt-1">
          <strong>Não confundir:</strong> {ESCOPO_BENCHMARK.naoConfundir}{' '}
          <Link to="/vivo" className="font-semibold text-cea-blue hover:underline">
            Ir para o Sortimento Vivo →
          </Link>
        </p>
      </Banner>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Ticket médio C&A"
          valor={formatBRL(BENCHMARK.ticketCA)}
          sub="posicionamento aspiracional"
          tomSub="neutra"
          dica="Ticket médio aproximado por transação, base do posicionamento no snapshot público."
        />
        <KpiCard
          label="Gap vs Renner"
          valor={formatDelta(BENCHMARK.gapVsRenner)}
          sub={`${formatBRL(BENCHMARK.ticketCA)} contra ${formatBRL(PRECO_RENNER)}`}
          tomSub="alerta"
          dica="Distância do nosso ticket contra o líder de ticket médio entre os monitorados."
        />
        <KpiCard
          label="Cor do ano"
          valor={BENCHMARK.corDoAno}
          sub="já presente na nossa cartela"
          tomSub="alta"
          seta="nenhuma"
          dica="Cor de tendência do ano — entra como cor de entrada dos lançamentos da cápsula."
        />
        <KpiCard
          label="Categoria em alta"
          valor={BENCHMARK.categoriaEmAlta}
          sub={`${formatNum(coleta.skus)} SKUs na coleta`}
          tomSub="neutra"
          dica="Categoria com maior movimento na coleta de mercado — onde a oferta cresce mais rápido."
        />
      </div>

      {/* ------------------------------------------------ coleta ao vivo -- */}
      <SectionCard
        titulo={`Coleta de mercado — "${TERMO_COLETA}"`}
        subtitulo="Amostra de catálogo usada para ler faixa de preço e amplitude de oferta"
        tag={
          <StatusChip tom={coleta.aoVivo ? 'ok' : 'neutro'}>
            {coleta.aoVivo ? 'ao vivo' : 'snapshot'}
          </StatusChip>
        }
        acoes={
          <Button tamanho="sm" onClick={atualizarColeta} disabled={coletando}>
            {coletando ? 'Coletando…' : 'Atualizar'}
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-slate-50/60 p-3.5">
            <p className="text-[11px] uppercase tracking-wide text-muted">SKUs coletados</p>
            <p className="num mt-1 font-display text-[24px] font-semibold text-cea-deep">
              {formatNum(coleta.skus)}
            </p>
            <p className="text-[11.5px] text-muted">
              {coleta.aoVivo ? 'lidos do catálogo agora' : 'do snapshot local'}
            </p>
          </div>
          <div className="rounded-lg border border-line bg-slate-50/60 p-3.5">
            <p className="text-[11px] uppercase tracking-wide text-muted">Faixa de preço</p>
            <p className="num mt-1 font-display text-[24px] font-semibold text-cea-deep">
              {formatBRL(coleta.min, 0)} – {formatBRL(coleta.max, 0)}
            </p>
            <p className="text-[11.5px] text-muted">
              amplitude de {formatNum(Math.round(coleta.max / coleta.min))}× entre piso e teto
            </p>
          </div>
          <div className="rounded-lg border border-line bg-slate-50/60 p-3.5">
            <p className="text-[11px] uppercase tracking-wide text-muted">Nossa posição</p>
            <p className="num mt-1 font-display text-[24px] font-semibold text-cea-deep">
              {formatDelta(GAP_MEDIO_PARES)}
            </p>
            <p className="text-[11.5px] text-muted">
              média das 6 peças comparáveis contra os pares aspirativos
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-slate-500">
          Snapshot local de {formatNum(BENCHMARK.coletaSnapshot.skus)} SKUs (faixa{' '}
          {formatBRL(BENCHMARK.coletaSnapshot.min, 0)}–{formatBRL(BENCHMARK.coletaSnapshot.max, 0)})
          · preços revalidados quando o catálogo responde.
        </p>
      </SectionCard>

      {/* --------------------------------------------- insights da IA -- */}
      <SectionCard
        titulo="Insights estratégicos da IA — 5 movimentos"
        subtitulo="Cada movimento sai de um fato do snapshot; a base está no pé do card"
      >
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {MOVIMENTOS_IA.map((m) => (
            <CardMovimento key={m.id} m={m} />
          ))}
        </div>
      </SectionCard>

      {/* -------------------------------------- concorrentes monitorados -- */}
      <SectionCard
        titulo="Concorrentes monitorados"
        subtitulo={`${CONCORRENTES_MONITORADOS.length} marcas · ${MARCAS_PARES.length} no bloco aspirativo/direto, ${MARCAS_VALOR.length} no bloco de valor`}
        compacto
      >
        <div className="scroll-x">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                <th className="px-3 py-2 text-left">Marca</th>
                <th className="px-3 py-2 text-left">Posicionamento</th>
                <th className="px-3 py-2 text-right">Preço médio</th>
                <th className="px-3 py-2 text-right">Nosso ticket vs marca</th>
                <th className="px-3 py-2 text-left">Observação</th>
              </tr>
            </thead>
            <tbody>
              {CONCORRENTES_MONITORADOS.map((c) => (
                <tr
                  key={c.marca}
                  className="border-b border-line/70 odd:bg-white even:bg-slate-50/50 hover:bg-cea-soft"
                >
                  <td className="px-3 py-2 font-semibold text-ink">{c.marca}</td>
                  <td className="px-3 py-2 text-[12px] text-slate-600">{c.tipo}</td>
                  <td className="num px-3 py-2 text-right">
                    {c.precoMedio === null ? (
                      <span className="text-[11.5px] text-slate-400">sem preço público</span>
                    ) : (
                      formatBRL(c.precoMedio)
                    )}
                  </td>
                  <td
                    className={`num px-3 py-2 text-right font-semibold ${
                      c.gapPct === null ? 'text-slate-400' : c.gapPct < 0 ? 'text-crit' : 'text-ok'
                    }`}
                  >
                    {c.gapPct === null ? '—' : formatDelta(c.gapPct)}
                  </td>
                  <td className="px-3 py-2 text-[12px] text-slate-600">{c.obs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-3 py-2 text-[11px] text-slate-400">
          Negativo = estamos mais baratos que a marca; positivo = mais caros. Shein não publica preço
          médio comparável, entra como pressão de mix e velocidade.
        </p>
      </SectionCard>

      {/* ------------------------------------------- peça comparável -- */}
      <SectionCard
        titulo="Preço médio por peça comparável"
        subtitulo="Coluna C&A com preço real praticado; concorrentes estimados pelo índice de posicionamento da marca"
        compacto
      >
        <div className="scroll-x">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                <th className="px-3 py-2 text-left">Peça comparável</th>
                <th className="bg-cea-soft px-3 py-2 text-right text-cea-blue">C&A</th>
                {MARCAS_COM_PRECO.map((m) => (
                  <th key={m.marca} className="px-3 py-2 text-right">
                    {m.marca}
                  </th>
                ))}
                <th className="px-3 py-2 text-right">Média pares</th>
                <th className="px-3 py-2 text-right">Δ vs pares</th>
                <th className="px-3 py-2 text-right">Δ vs mercado</th>
              </tr>
            </thead>
            <tbody>
              {ITENS_COMPARAVEIS.map((i) => (
                <tr
                  key={i.id}
                  className="border-b border-line/70 odd:bg-white even:bg-slate-50/50 hover:bg-cea-soft"
                >
                  <td className="max-w-[230px] px-3 py-2">
                    <p className="font-medium leading-snug text-ink">
                      {i.peca}
                      {i.promocional && (
                        <span className="text-crit" title="Etiqueta promocional na coleta">
                          {' '}
                          *
                        </span>
                      )}
                    </p>
                    {i.cod && (
                      <span className="num text-[10.5px] font-semibold text-slate-400">
                        ref {i.cod}
                      </span>
                    )}
                  </td>
                  <td className="num bg-cea-soft px-3 py-2 text-right font-semibold text-cea-blue">
                    {formatBRL(i.precoCA)}
                  </td>
                  {MARCAS_COM_PRECO.map((m) => (
                    <td key={m.marca} className="num px-3 py-2 text-right text-slate-600">
                      {formatBRL(i.precos[m.marca])}
                    </td>
                  ))}
                  <td className="num px-3 py-2 text-right">{formatBRL(i.mediaPares)}</td>
                  <td
                    className={`num px-3 py-2 text-right font-semibold ${i.deltaParesPct < 0 ? 'text-crit' : 'text-ok'}`}
                  >
                    {formatDelta(i.deltaParesPct)}
                  </td>
                  <td
                    className={`num px-3 py-2 text-right ${i.deltaPct > 0 ? 'text-ok' : 'text-crit'}`}
                  >
                    {formatDelta(i.deltaPct)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line bg-slate-50 font-semibold text-cea-deep">
                <td className="px-3 py-2.5 text-[12px] uppercase tracking-wide">Média das 6 peças</td>
                <td className="bg-cea-soft px-3 py-2.5" />
                <td colSpan={MARCAS_COM_PRECO.length + 1} />
                <td
                  className={`num px-3 py-2.5 text-right ${GAP_MEDIO_PARES < 0 ? 'text-crit' : 'text-ok'}`}
                >
                  {formatDelta(GAP_MEDIO_PARES)}
                </td>
                <td
                  className={`num px-3 py-2.5 text-right ${GAP_MEDIO_COMPARAVEL > 0 ? 'text-ok' : 'text-crit'}`}
                >
                  {formatDelta(GAP_MEDIO_COMPARAVEL)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="border-t border-line px-3 py-2.5 text-[11.5px] leading-relaxed text-slate-500">
          <p>
            <strong className="text-slate-600">Como ler os dois Δ:</strong> contra os pares
            aspirativos ({MARCAS_PARES.map((m) => m.marca).join(', ')}) estamos{' '}
            {formatDelta(GAP_MEDIO_PARES)} — espaço para trade-up. Contra o mercado inteiro, que
            inclui o bloco de valor ({MARCAS_VALOR.map((m) => m.marca).join(', ')}), estamos{' '}
            {formatDelta(GAP_MEDIO_COMPARAVEL)} — é a pressão por baixo. Média única dos dois blocos
            juntos esconde as duas leituras.
          </p>
          <p className="mt-1.5 text-slate-400">
            * Etiqueta promocional na coleta: comparar com ressalva. Preços de concorrente são
            estimativa do índice de posicionamento (preço médio da marca ÷ nosso ticket), não coleta
            peça a peça.
          </p>
        </div>
      </SectionCard>
    </div>
  )
}

const TOM_MOVIMENTO: Record<MovimentoIA['tom'], { chip: 'ok' | 'warn' | 'info'; rotulo: string }> = {
  oportunidade: { chip: 'ok', rotulo: 'Oportunidade' },
  defesa: { chip: 'info', rotulo: 'Defesa' },
  atencao: { chip: 'warn', rotulo: 'Atenção' },
}

function CardMovimento({ m }: { m: MovimentoIA }) {
  const t = TOM_MOVIMENTO[m.tom]
  return (
    <article className="flex flex-col rounded-lg border border-line bg-slate-50/60 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <span className="num text-[11px] font-bold text-cea-blue">{m.id}</span>
        <StatusChip tom={t.chip}>{t.rotulo}</StatusChip>
      </div>
      <h3 className="mt-1.5 text-[13px] font-semibold leading-snug text-cea-deep">{m.titulo}</h3>
      <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-slate-600">{m.texto}</p>
      <p className="mt-2.5 rounded-md bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-cea-deep">
        {m.impacto}
      </p>
      <p className="mt-2 border-t border-line pt-2 text-[11px] leading-snug text-slate-500">
        Base: {m.base}
      </p>
    </article>
  )
}
