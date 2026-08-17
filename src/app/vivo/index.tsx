import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/ui/KpiCard'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { Sparkline } from '@/components/ui/Sparkline'
import { useToast } from '@/components/ui/Toast'
import {
  ALERTAS_EXCESSO,
  ALERTAS_EXCESSO_TOTAL,
  ALERTAS_FALTA,
  COLECAO,
  PAINEL_RITMO,
  STATUS_RITMO,
  TICKS_VIVO,
  VIVO,
  serieSparkline,
  type AlertaSortimento,
} from '@/data/derived'
import { formatBRL, formatBRLCompact, formatDelta, formatNum, formatPct } from '@/lib/format'

/** Um tick a cada 5 segundos, como manda a spec da fase. */
const INTERVALO_MS = 5000

export default function VivoPage() {
  const { push } = useToast()
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)
  const [segundos, setSegundos] = useState(0)
  const [aoVivo, setAoVivo] = useState(true)
  const [verTodosExcessos, setVerTodosExcessos] = useState(false)

  useEffect(() => {
    if (!aoVivo) return
    const id = window.setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [aoVivo])

  useEffect(() => {
    if (!aoVivo) return
    const id = window.setInterval(() => {
      setTick((t) => t + 1)
      setSegundos(0)
    }, INTERVALO_MS)
    return () => window.clearInterval(id)
  }, [aoVivo])

  /** Os KPIs partem do âncora e recebem os deltas seedados de cada tick. */
  const acumulado = useMemo(() => {
    let gmv = 0
    let transacoes = 0
    let pecas = 0
    for (let i = 0; i < tick; i++) {
      const t = TICKS_VIVO[i % TICKS_VIVO.length]
      gmv += t.gmv
      transacoes += t.transacoes
      pecas += t.pecas
    }
    return { gmv, transacoes, pecas }
  }, [tick])

  const gmv = VIVO.gmvDia + acumulado.gmv
  const transacoes = VIVO.transacoes + acumulado.transacoes
  const ticket = gmv / transacoes
  const excessosVisiveis = verTodosExcessos ? ALERTAS_EXCESSO : ALERTAS_EXCESSO.slice(0, 5)

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Sortimento Vivo"
        subtitulo={`${COLECAO.rotulo} · leitura do dia em tempo real, da venda ao alerta de reposição`}
        meta={
          <>
            <StatusChip tom={aoVivo ? 'crit' : 'neutro'}>
              <span className={aoVivo ? 'animate-pulse' : ''} aria-hidden>
                ●
              </span>{' '}
              {aoVivo ? 'LIVE' : 'PAUSADO'}
            </StatusChip>
            <span className="num text-[11.5px] text-muted">
              atualizado há {formatNum(segundos)}s · {formatNum(tick)} atualizações
            </span>
          </>
        }
        acoes={
          <Button
            onClick={() => {
              setAoVivo((v) => !v)
              push(
                aoVivo ? 'Atualização pausada' : 'Atualização retomada',
                aoVivo ? 'warn' : 'ok',
                aoVivo
                  ? 'Os números congelam no último tick — útil para ler com calma.'
                  : `Novo tick a cada ${INTERVALO_MS / 1000}s.`,
              )
            }}
          >
            {aoVivo ? 'Pausar' : 'Retomar'}
          </Button>
        }
      />

      {/* ------------------------------------------------------ KPIs vivos -- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="GMV do dia"
          /* valor cheio, não compacto: em milhões com 2 casas o tick de 5s
             (≈ R$ 1,4 mil) não apareceria, e o crachá LIVE promete movimento */
          valor={<span className="whitespace-nowrap text-[22px]">{formatBRL(gmv, 0)}</span>}
          sub={
            tick > 0
              ? `+${formatBRLCompact(acumulado.gmv, 1)} desde que abriu · ${formatDelta(VIVO.gmvVar)} vs LY`
              : `${formatDelta(VIVO.gmvVar)} vs mesmo dia LY`
          }
          tomSub="alta"
          dica="Venda bruta do dia somando físico e digital, atualizada a cada tick de 5s."
          extra={<Sparkline dados={serieSparkline('vivo-gmv', gmv, 9)} />}
        />
        <KpiCard
          label="Transações"
          valor={formatNum(transacoes)}
          sub={tick > 0 ? `+${formatNum(acumulado.transacoes)} cupons no período` : 'cupons no dia'}
          tomSub="neutra"
          dica="Número de cupons fechados hoje na rede."
          extra={<Sparkline dados={serieSparkline('vivo-tx', transacoes, 7)} />}
        />
        <KpiCard
          label="Ticket médio"
          valor={formatBRL(ticket)}
          sub="GMV ÷ transações"
          tomSub="neutra"
          dica="Valor médio por cupom — sobe quando o mix pesa para peça de maior preço."
          extra={<Sparkline dados={serieSparkline('vivo-ticket', ticket, 4)} />}
        />
        <KpiCard
          label="UPT"
          valor={formatNum(VIVO.upt, 2)}
          sub="peças por transação"
          tomSub="neutra"
          dica="Unidades por cupom: mede o quanto o cliente leva junto."
          extra={<Sparkline dados={serieSparkline('vivo-upt', VIVO.upt, 5)} />}
        />
        <KpiCard
          label="Conversão"
          valor={formatPct(VIVO.conversao)}
          sub="do fluxo de loja"
          tomSub="neutra"
          dica="Cupons ÷ visitantes contados na porta."
          extra={<Sparkline dados={serieSparkline('vivo-conv', VIVO.conversao, 6)} />}
        />
        <KpiCard
          label="Sell-through do dia"
          valor={formatPct(VIVO.sellThroughDia)}
          sub="do estoque exposto"
          tomSub="neutra"
          dica="Peças vendidas hoje sobre o que está exposto em loja — é leitura do dia, diferente da cobertura da coleção."
          extra={<Sparkline dados={serieSparkline('vivo-st', VIVO.sellThroughDia, 8)} />}
        />
      </div>

      {/* ----------------------------------------------- cards de ação -- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardAcao
          icone="⚠"
          tom="crit"
          titulo="Rupturas agora"
          valor={formatNum(VIVO.rupturas)}
          detalhe={`em ${formatNum(ALERTAS_FALTA.length)} referências`}
          cta="Ver faltas"
          onClick={() =>
            document.getElementById('alertas-falta')?.scrollIntoView({ behavior: 'smooth' })
          }
        />
        <CardAcao
          icone="▲"
          tom="ok"
          titulo="Best movers"
          valor={formatNum(VIVO.bestMovers)}
          detalhe="acelerando acima do plano"
          cta="Ver histórico"
          onClick={() => navigate('/historico')}
        />
        <CardAcao
          icone="⎙"
          tom="info"
          titulo="Ordens de compra"
          valor={formatNum(VIVO.ordensCompra)}
          detalhe={`${formatBRLCompact(VIVO.valorOCs, 1)} em carteira`}
          cta="Ver emissão"
          onClick={() => navigate('/emissao')}
        />
        <CardAcao
          icone="▼"
          tom="warn"
          titulo="Markdowns ativos"
          valor={formatNum(VIVO.markdownsAtivos)}
          detalhe={`profundidade média ${formatDelta(VIVO.markdownMedio)}`}
          cta="Ir para Pricing"
          onClick={() => navigate('/pricing')}
        />
      </div>

      {/* --------------------------------- plano × venda × estoque × carteira */}
      <SectionCard
        titulo="Plano × Venda × Estoque × Carteira"
        subtitulo={`Semana ${COLECAO.semana} de ${PAINEL_RITMO.semanasRestantes + COLECAO.semana} da estação — a leitura que decide repor, segurar ou remarcar`}
      >
        <div className="grid gap-3 lg:grid-cols-3">
          <BlocoRitmo
            titulo="Plano × Venda"
            valor={formatPct(PAINEL_RITMO.aderencia)}
            status={STATUS_RITMO.venda}
            linhas={[
              ['Plano de venda da estação', `${formatNum(PAINEL_RITMO.planoVenda)} pç`],
              ['Vendido até agora', `${formatNum(PAINEL_RITMO.vendido)} pç`],
              [
                'Estação percorrida',
                `${formatPct(PAINEL_RITMO.estacaoPercorrida)} (${COLECAO.semana}/${PAINEL_RITMO.semanasRestantes + COLECAO.semana} sem)`,
              ],
              ['Vantagem sobre o calendário', `${formatDelta(PAINEL_RITMO.vantagem)} p.p.`],
            ]}
            nota={`O plano prevê vender ${formatPct(PAINEL_RITMO.fatiaVendavel)} do que foi comprado dentro da estação; o resto já nasce previsto para liquidação e carry-over.`}
          />
          <BlocoRitmo
            titulo="Estoque × Venda"
            valor={`${formatNum(PAINEL_RITMO.cobertura, 1)} sem`}
            status={STATUS_RITMO.estoque}
            linhas={[
              ['Disponível (loja + CD + carteira)', `${formatNum(PAINEL_RITMO.disponivel)} pç`],
              ['Venda semanal (últimas 4 sem)', `${formatNum(PAINEL_RITMO.vendaSemanal)} pç`],
              ['Média da estação', `${formatNum(PAINEL_RITMO.vendaMediaEstacao)} pç/sem`],
              ['Semanas restantes', `${formatNum(PAINEL_RITMO.semanasRestantes)} sem`],
            ]}
            nota="Cobertura acima das semanas restantes é normal aqui: parte do disponível ainda vai virar liquidação planejada."
          />
          <BlocoRitmo
            titulo="Carteira × Necessidade"
            valor={`+${formatNum(PAINEL_RITMO.excesso)} pç`}
            status={STATUS_RITMO.carteira}
            linhas={[
              ['Necessidade até o fim da estação', `${formatNum(PAINEL_RITMO.necessidade)} pç`],
              ['Disponível', `${formatNum(PAINEL_RITMO.disponivel)} pç`],
              ['Excesso à frente', `${formatNum(PAINEL_RITMO.excesso)} pç`],
              ['Em semanas de venda', `${formatNum(PAINEL_RITMO.excessoSemanas, 1)} sem`],
            ]}
            nota="É o número que pede ação: cancelar ou reprogramar entrega vale mais que remarcar depois."
          />
        </div>
      </SectionCard>

      {/* ------------------------------------------------------- alertas -- */}
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          titulo="Alertas de falta"
          subtitulo={`${formatNum(ALERTAS_FALTA.length)} referências somando as ${formatNum(VIVO.rupturas)} rupturas do dia`}
          tag={<StatusChip tom="crit">{formatNum(ALERTAS_FALTA.length)}</StatusChip>}
          compacto
          className="scroll-mt-4"
        >
          <div id="alertas-falta">
            <ListaAlertas
              itens={ALERTAS_FALTA}
              tipo="falta"
              onAcao={(a) => {
                navigate('/distribuicao')
                push(
                  'Reposição encaminhada',
                  'ok',
                  `${a.produto} · ${formatNum(a.lojas)} loja(s) na fila de reposição por tamanho.`,
                )
              }}
            />
          </div>
        </SectionCard>

        <SectionCard
          titulo="Alertas de excesso"
          subtitulo={`${formatNum(ALERTAS_EXCESSO_TOTAL)} referências com cobertura acima da janela da estação`}
          tag={<StatusChip tom="warn">{formatNum(ALERTAS_EXCESSO_TOTAL)}</StatusChip>}
          acoes={
            <Button tamanho="sm" onClick={() => setVerTodosExcessos((v) => !v)}>
              {verTodosExcessos
                ? 'Mostrar 5'
                : `Ver todos (${formatNum(ALERTAS_EXCESSO_TOTAL - 5)} a mais)`}
            </Button>
          }
          compacto
        >
          <ListaAlertas
            itens={excessosVisiveis}
            tipo="excesso"
            onAcao={(a) => {
              navigate('/pricing')
              push(
                'Aberto no Pricing',
                'info',
                `${a.produto} · ${formatNum(Math.round(a.cobertura))} dias de cobertura pedem ação de preço.`,
              )
            }}
          />
        </SectionCard>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ auxiliares -- */

const TOM_CARD = {
  crit: { borda: 'border-l-crit', icone: 'text-crit' },
  warn: { borda: 'border-l-warn', icone: 'text-warn' },
  ok: { borda: 'border-l-ok', icone: 'text-ok' },
  info: { borda: 'border-l-cea-blue', icone: 'text-cea-blue' },
} as const

function CardAcao({
  icone,
  tom,
  titulo,
  valor,
  detalhe,
  cta,
  onClick,
}: {
  icone: string
  tom: keyof typeof TOM_CARD
  titulo: string
  valor: string
  detalhe: string
  cta: string
  onClick: () => void
}) {
  const t = TOM_CARD[tom]
  return (
    <div className={`card-base border-l-[3px] p-4 ${t.borda}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="kpi-label">{titulo}</p>
          <p className="num mt-1 font-display text-[26px] font-semibold leading-none text-cea-deep">
            {valor}
          </p>
          <p className="mt-1 text-[11.5px] text-muted">{detalhe}</p>
        </div>
        <span aria-hidden className={`text-[17px] ${t.icone}`}>
          {icone}
        </span>
      </div>
      <Button tamanho="sm" className="mt-3 w-full" onClick={onClick}>
        {cta}
      </Button>
    </div>
  )
}

function BlocoRitmo({
  titulo,
  valor,
  status,
  linhas,
  nota,
}: {
  titulo: string
  valor: string
  status: { rotulo: string; tom: 'ok' | 'warn' | 'crit' }
  linhas: [string, string][]
  nota: string
}) {
  return (
    <div className="flex flex-col rounded-lg border border-line bg-slate-50/60 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12.5px] font-semibold text-cea-deep">{titulo}</p>
        <StatusChip tom={status.tom}>{status.rotulo}</StatusChip>
      </div>
      <p className="num mt-1.5 font-display text-[27px] font-semibold leading-none text-cea-deep">
        {valor}
      </p>
      <dl className="mt-3 space-y-1.5 border-t border-line pt-2.5">
        {linhas.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 text-[11.5px]">
            <dt className="text-muted">{k}</dt>
            <dd className="num shrink-0 font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2.5 flex-1 border-t border-line pt-2 text-[11px] leading-snug text-slate-400">
        {nota}
      </p>
    </div>
  )
}

const TOM_SEVERIDADE = {
  Crítica: 'crit',
  Alta: 'warn',
  Média: 'neutro',
} as const

function ListaAlertas({
  itens,
  tipo,
  onAcao,
}: {
  itens: AlertaSortimento[]
  tipo: 'falta' | 'excesso'
  onAcao: (a: AlertaSortimento) => void
}) {
  return (
    <ul className="divide-y divide-line">
      {itens.map((a) => (
        <li key={a.id} className="px-4 py-2.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-[200px] flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusChip tom={TOM_SEVERIDADE[a.severidade]}>{a.severidade}</StatusChip>
                <p className="text-[12.5px] font-medium leading-snug text-ink">{a.produto}</p>
              </div>
              <p className="num mt-0.5 text-[11px] text-muted">
                {a.cod ? `ref ${a.cod} · ` : ''}
                {a.cor} · {formatNum(a.lojas)} loja(s) · {formatNum(a.pecas)} pç ·{' '}
                <span className={tipo === 'falta' ? 'text-crit' : 'text-warn'}>
                  {formatNum(a.cobertura, 1)} d de cobertura
                </span>
              </p>
            </div>
            <Button tamanho="sm" onClick={() => onAcao(a)}>
              {tipo === 'falta' ? 'Repor' : 'Remarcar'}
            </Button>
          </div>
          <p className="mt-1 text-[11.5px] leading-snug text-slate-500">{a.nota}</p>
        </li>
      ))}
    </ul>
  )
}
