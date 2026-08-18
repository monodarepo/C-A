import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Icone } from '@/components/ui/Icone'
import { SectionCard } from '@/components/ui/SectionCard'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { Tabs } from '@/components/ui/Tabs'
import { ProductImage } from '@/components/ui/ProductImage'
import { useToast } from '@/components/ui/Toast'
import { usePlano } from '@/app/PlanoProvider'
import {
  CAPSULAS_MAPA,
  CARTELA_PAREDE,
  COLECAO,
  MAPA,
  SKUS_MAPA,
  ZONAS,
  piramideDaParede,
  totaisMapa,
  type BadgeMapa,
  type SkuMapa,
  type Zona,
} from '@/data/derived'
import { formatBRLCompact, formatNum, formatPP, formatPct, plural } from '@/lib/format'

/* badges do card: ícone de traço + cor semântica própria (o significado está
   no title/aria-label, nunca só na cor) */
const ICONE_BADGE: Record<BadgeMapa, { icone: JSX.Element; titulo: string }> = {
  destaque: {
    icone: <Icone nome="estrela" tamanho={11} className="text-warn" />,
    titulo: 'Destaque da parede',
  },
  novo: {
    icone: <Icone nome="ia" tamanho={11} className="text-cea-blue" />,
    titulo: 'Novo sem histórico',
  },
  repeat: {
    icone: <Icone nome="recalcular" tamanho={11} className="text-slate-500" />,
    titulo: 'Repeat / programa',
  },
  evento: {
    icone: <Icone nome="eventos" tamanho={11} className="text-cea-red" />,
    titulo: 'Vinculado a evento',
  },
}

const DESCRICAO_ZONA: Record<Zona, string> = {
  Vitrine: 'A fatia curada de cima: peça de maior preço, foto de campanha e mesa de entrada.',
  Dorsal: 'A espinha da temporada: está em toda loja, todo dia, e é reposta.',
  Need: 'Entra por evento, cápsula ou ciclo — janela curta e verba estratégica.',
}

export default function MapaPage() {
  const { push } = useToast()
  const { decidir, decisoes } = usePlano()
  const [skus, setSkus] = useState<SkuMapa[]>(SKUS_MAPA)
  const [capsula, setCapsula] = useState<string>(CAPSULAS_MAPA[0].nome)
  const [zoom, setZoom] = useState(100)
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [zonaAlvo, setZonaAlvo] = useState<Zona | null>(null)

  const totais = useMemo(() => totaisMapa(skus), [skus])
  const piramide = useMemo(() => piramideDaParede(skus), [skus])
  const daCapsula = useMemo(() => skus.filter((s) => s.capsula === capsula), [skus, capsula])
  const pendentes = skus.filter((s) => !s.aprovado)

  /** Move o card de zona e grava a decisão no histórico compartilhado. */
  function moverZona(id: string, destino: Zona) {
    const sku = skus.find((s) => s.id === id)
    if (!sku || sku.zona === destino) return
    setSkus((atual) => atual.map((s) => (s.id === id ? { ...s, zona: destino } : s)))
    decidir({
      tipo: 'mapa',
      titulo: `${sku.produto} movido para ${destino}`,
      detalhe: `Saiu de ${sku.zona} na cápsula ${sku.capsula} · ${formatNum(sku.unidades)} un · ${formatBRLCompact(sku.valorVenda, 2)} a preço de venda.`,
    })
    push(`Movido para ${destino}`, 'ok', `${sku.produto} · cápsula ${sku.capsula}.`)
  }

  function aprovarPendentes() {
    if (!pendentes.length) {
      push('Nada pendente', 'info', 'Todos os SKUs da parede já estão aprovados.')
      return
    }
    setSkus((atual) => atual.map((s) => ({ ...s, aprovado: true })))
    decidir({
      tipo: 'mapa',
      titulo: `${plural(pendentes.length, 'SKU aprovado', 'SKUs aprovados')} na parede`,
      detalhe: `A parede de ${MAPA.parede} passou de ${formatPct(totais.aprovadosPct, 0)} para 100% aprovada.`,
    })
    push(
      'Pendentes aprovados',
      'ok',
      `${plural(pendentes.length, 'SKU liberado', 'SKUs liberados')} para o line.`,
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Mapa da Coleção"
        subtitulo={`${COLECAO.rotulo} · estilista ${MAPA.estilista} · parede de ${MAPA.parede}`}
        acoes={
          <>
            <Button
              icone={<Icone nome="baixar" tamanho={15} />}
              onClick={() =>
                push(
                  'Export simulado',
                  'info',
                  'Na versão real, a parede sai em PPTX com uma página por cápsula.',
                )
              }
            >
              Exportar PPTX
            </Button>
            <Button
              icone={<Icone nome="baixar" tamanho={15} />}
              onClick={() =>
                push('Export simulado', 'info', 'PDF de uma página com o board completo.')
              }
            >
              Exportar PDF
            </Button>
            <Button variante="primario" onClick={aprovarPendentes}>
              Aprovar Pendentes ({pendentes.length})
            </Button>
          </>
        }
      />

      {/* ------------------------------------------------------- stats ---- */}
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Stat rotulo="SKUs na parede" valor={formatNum(totais.skus)} />
        <Stat rotulo="Unidades" valor={formatNum(totais.unidades)} />
        <Stat
          rotulo="Valor de venda"
          valor={formatBRLCompact(totais.valorVenda, 1)}
          nota={`PV médio ${formatBRLCompact(totais.pvMedio)}`}
        />
        <Stat rotulo="Fornecedores" valor={formatNum(totais.fornecedores)} />
        <Stat
          rotulo="Aprovados"
          valor={formatPct(totais.aprovadosPct, 0)}
          nota={`${totais.aprovados} de ${totais.skus} SKUs`}
          tom={totais.aprovadosPct === 100 ? 'ok' : 'neutro'}
        />
      </div>

      {/* --------------------------------------------- pirâmide-alvo ---- */}
      <SectionCard
        titulo="Pirâmide-alvo da parede"
        subtitulo="Participação de SKUs por faixa contra o alvo dos habilitadores"
      >
        <div className="flex flex-wrap gap-2">
          {piramide.map((p) => {
            const desvio = p.pct - p.alvo
            const dentro = Math.abs(desvio) <= 5
            const acima = desvio > 0
            return (
              <span
                key={p.faixa}
                title={`${plural(p.skus, 'SKU')} · alvo ${p.alvo}% · ${
                  dentro ? 'dentro da banda' : acima ? 'acima do alvo' : 'abaixo do alvo'
                }`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
                  dentro
                    ? 'border-[#A7E8D0] bg-[var(--ok-soft)] text-[#0A7355]'
                    : acima
                      ? 'border-[#F6D8A0] bg-[var(--warn-soft)] text-[#A15C00]'
                      : 'border-slate-300 bg-slate-100 text-slate-600'
                }`}
              >
                {p.faixa} · {p.rotulo}
                <span className="num">{formatPct(p.pct, 0)}</span>
                <span className="num font-normal opacity-70">alvo {formatPct(p.alvo, 0)}</span>
                {!dentro && (
                  <span className="num" aria-label={acima ? 'acima do alvo' : 'abaixo do alvo'}>
                    {acima ? '▲' : '▼'} {formatPP(desvio, 0)}
                  </span>
                )}
              </span>
            )
          })}
        </div>
        <p className="mt-3 text-[12px] leading-snug text-muted">
          A parede está mais pesada na base do que o alvo: as faixas foram medidas em vestidos, e a
          cápsula Essenciais entra com básicos abaixo de {formatBRLCompact(69)}. É leitura para o
          comitê, não erro de cadastro.
        </p>
      </SectionCard>

      {/* ------------------------------------------------------- board ---- */}
      <SectionCard
        titulo="Parede de setembro"
        subtitulo="Arraste um card entre as zonas — cada movimento entra no histórico de decisões"
        acoes={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Zoom
              <input
                type="range"
                min={80}
                max={120}
                step={10}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Zoom do board"
                className="w-24 accent-[var(--cea-blue)]"
              />
              <span className="num w-8 text-slate-500">{zoom}%</span>
            </label>
          </div>
        }
      >
        <Tabs
          abas={CAPSULAS_MAPA.map((c) => ({
            id: c.nome,
            rotulo: c.nome,
            badge: skus.filter((s) => s.capsula === c.nome).length,
          }))}
          ativa={capsula}
          onTrocar={setCapsula}
          className="mb-4"
        />

        <div
          className="grid gap-3 lg:grid-cols-3"
          style={{ fontSize: `${zoom}%` }}
        >
          {ZONAS.map((zona) => {
            const cards = daCapsula.filter((s) => s.zona === zona)
            const unidades = cards.reduce((a, s) => a + s.unidades, 0)
            return (
              <div
                key={zona}
                onDragOver={(e) => {
                  e.preventDefault()
                  setZonaAlvo(zona)
                }}
                onDragLeave={() => setZonaAlvo((z) => (z === zona ? null : z))}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData('text/plain') || arrastando
                  if (id) moverZona(id, zona)
                  setArrastando(null)
                  setZonaAlvo(null)
                }}
                className={`rounded-card border-2 border-dashed p-3 transition ${
                  zonaAlvo === zona
                    ? 'border-cea-blue bg-cea-soft'
                    : 'border-line bg-slate-50/50'
                }`}
              >
                <header className="mb-2 border-b border-line pb-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[12px] font-bold uppercase tracking-wide text-cea-deep">
                      {zona}
                    </h3>
                    <span className="num text-[11px] text-muted">
                      {plural(cards.length, 'SKU')} · {formatNum(unidades)} un
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">
                    {DESCRICAO_ZONA[zona]}
                  </p>
                </header>

                {/* grade de 2: com a foto mandando no card, uma coluna só deixaria
                    cada peça com 480px de altura e mataria a leitura da parede */}
                <div className="grid grid-cols-2 gap-2">
                  {cards.map((s) => (
                    <article
                      key={s.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', s.id)
                        e.dataTransfer.effectAllowed = 'move'
                        setArrastando(s.id)
                      }}
                      onDragEnd={() => setArrastando(null)}
                      className={`group cursor-grab overflow-hidden rounded-lg border bg-card shadow-card transition duration-150 active:cursor-grabbing ${
                        arrastando === s.id
                          ? 'opacity-40'
                          : 'hover:-translate-y-0.5 hover:shadow-pop motion-reduce:hover:translate-y-0'
                      } ${s.aprovado ? 'border-line' : 'border-warn/60'}`}
                    >
                      {/* a foto é o card: ocupa a maior parte e é o que vende a peça */}
                      <div className="relative">
                        <ProductImage
                          cod={s.cod}
                          nome={s.produto}
                          cor={s.cor}
                          tamanho="card"
                          className="!rounded-none !border-0 w-full"
                        />
                        {!s.aprovado && (
                          <span className="absolute inset-x-0 top-0 bg-warn/90 py-0.5 text-center text-[9.5px] font-bold uppercase tracking-wide text-white">
                            pendente
                          </span>
                        )}
                        <span
                          className={`absolute right-1 flex flex-col items-end gap-0.5 ${
                            s.aprovado ? 'top-1' : 'top-6'
                          }`}
                        >
                          {s.badges.map((b) => (
                            <span
                              key={b}
                              title={ICONE_BADGE[b].titulo}
                              aria-label={ICONE_BADGE[b].titulo}
                              className="grid h-[18px] w-[18px] place-items-center rounded-full bg-white/90 text-[10px] shadow-sm"
                            >
                              {ICONE_BADGE[b].icone}
                            </span>
                          ))}
                        </span>
                        {s.cod && (
                          <span
                            className={`num absolute left-1 rounded bg-cea-deep/85 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 ${
                              s.aprovado ? 'top-1' : 'top-6'
                            }`}
                          >
                            ref {s.cod}
                          </span>
                        )}
                      </div>

                      <div className="p-2">
                        <p className="line-clamp-2 text-[11.5px] font-medium leading-tight text-ink">
                          {s.produto}
                        </p>
                        <p className="mt-0.5 text-[10.5px] capitalize text-muted">{s.cor}</p>
                        <footer className="mt-1.5 flex items-center justify-between gap-2 border-t border-line pt-1.5 text-[10px]">
                          <span className="num shrink-0 whitespace-nowrap text-muted">
                            {formatNum(s.unidades)} un
                          </span>
                          <span className="truncate text-[11px] text-slate-500" title={s.fornecedor}>
                            {s.fornecedor}
                          </span>
                        </footer>
                      </div>
                    </article>
                  ))}
                  {cards.length === 0 && (
                    <p className="col-span-2 py-6 text-center text-[11px] text-slate-400">
                      Arraste um card para cá
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </SectionCard>

      {/* ------------------------------------------- cartela + histórico -- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          titulo="Cartela da parede"
          subtitulo="Cores reais coletadas do catálogo — é a paleta que a coleção pode usar"
        >
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {CARTELA_PAREDE.map((c) => (
              <div key={c.cor} className="text-center">
                <span
                  className="block h-12 w-full rounded-lg border border-line"
                  style={{ background: c.hex }}
                  title={`${c.cor} · ${c.hex}`}
                />
                <p className="mt-1 truncate text-[10.5px] capitalize text-muted" title={c.cor}>
                  {c.cor}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          titulo="Decisões da parede"
          subtitulo="Movimentos de zona e aprovações desta sessão"
          tag={<StatusChip tom="neutro">{plural(decisoes.length, 'registro')}</StatusChip>}
        >
          {decisoes.length === 0 ? (
            <p className="rounded-lg border border-line bg-slate-50/60 p-4 text-[12.5px] leading-snug text-slate-600">
              Arraste um card entre as zonas para registrar a primeira decisão. O registro aparece
              aqui e também na Retroalimentação.
            </p>
          ) : (
            <ol className="space-y-2.5">
              {decisoes.slice(0, 8).map((d) => (
                <li key={d.id} className="border-b border-line/70 pb-2.5 last:border-0">
                  <p className="text-[12.5px] font-medium text-ink">{d.titulo}</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{d.detalhe}</p>
                  <p className="num mt-0.5 text-[11px] text-slate-400">
                    {d.autor} · {d.quando.toLocaleTimeString('pt-BR')}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

function Stat({
  rotulo,
  valor,
  nota,
  tom = 'neutro',
}: {
  rotulo: string
  valor: string
  nota?: string
  tom?: 'neutro' | 'ok'
}) {
  return (
    <div className={`card-base p-3 ${tom === 'ok' ? 'border-l-4 border-l-ok' : ''}`}>
      <p className="kpi-label">{rotulo}</p>
      <p className="num mt-1 font-display text-[19px] font-semibold leading-none text-cea-deep">
        {valor}
      </p>
      {nota && <p className="mt-1 text-[11px] text-muted">{nota}</p>}
    </div>
  )
}
