import { useMemo, useState } from 'react'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { SectionCard } from '@/components/ui/SectionCard'
import { StatusChip } from '@/components/ui/StatusChip'
import { useToast } from '@/components/ui/Toast'
import { formatDataCurta, segundaDaSemanaISO } from '@/lib/format'
import {
  ANO_CALENDARIO,
  AREAS,
  ATIVIDADES_CALENDARIO,
  CAMPANHAS,
  COLECOES_DO_CALENDARIO,
  CONFLITOS_CALENDARIO,
  CONTAGEM_POR_AREA,
  PREMISSAS_CALENDARIO,
  SEMANAS_NO_ANO,
  type Area,
  type Atividade,
  type Trilha,
} from '@/data/derived'

const TRILHAS: Trilha[] = ['Nacional', 'Importado']

const COR_AREA_BARRA: Record<Area, string> = {
  Estilo: 'bg-[#A855F7]',
  Planejamento: 'bg-cea-blue',
  Compras: 'bg-ok',
  Importação: 'bg-warn',
}

/** Semana em que cada mês começa — usada na régua superior do Gantt. */
const INICIO_DOS_MESES = Array.from({ length: 12 }, (_, m) => {
  const primeiro = new Date(Date.UTC(ANO_CALENDARIO, m, 1))
  return {
    mes: primeiro.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', ''),
    semana: Math.max(
      1,
      Math.floor((Date.UTC(ANO_CALENDARIO, m, 1) - Date.UTC(ANO_CALENDARIO, 0, 1)) / 604_800_000) +
        1,
    ),
  }
})

export function AbaCalendario() {
  const { push } = useToast()
  const [colecoesAtivas, setColecoesAtivas] = useState<string[]>(COLECOES_DO_CALENDARIO)
  const [areasAtivas, setAreasAtivas] = useState<Area[]>(AREAS)
  const [deslocamentos, setDeslocamentos] = useState<Record<string, number>>({})
  const [resolvidos, setResolvidos] = useState<string[]>([])
  const [ignorados, setIgnorados] = useState<string[]>([])
  const [selecionada, setSelecionada] = useState<Atividade | null>(null)

  /** Atividades já com os deslocamentos aplicados pelas sugestões aceitas. */
  const atividades = useMemo(
    () =>
      ATIVIDADES_CALENDARIO.map((a) => {
        const d = deslocamentos[a.id] ?? 0
        return d === 0
          ? a
          : {
              ...a,
              semanaInicio: Math.max(1, Math.min(SEMANAS_NO_ANO, a.semanaInicio + d)),
              semanaFim: Math.max(1, Math.min(SEMANAS_NO_ANO, a.semanaFim + d)),
            }
      }),
    [deslocamentos],
  )

  const filtradas = useMemo(
    () =>
      atividades.filter(
        (a) => colecoesAtivas.includes(a.colecao) && areasAtivas.includes(a.area),
      ),
    [atividades, colecoesAtivas, areasAtivas],
  )

  const conflitosAbertos = CONFLITOS_CALENDARIO.filter(
    (c) => !resolvidos.includes(c.id) && !ignorados.includes(c.id),
  )

  function alternarColecao(nome: string) {
    setColecoesAtivas((atual) =>
      atual.includes(nome) ? atual.filter((c) => c !== nome) : [...atual, nome],
    )
  }

  function alternarArea(area: Area) {
    setAreasAtivas((atual) =>
      atual.includes(area) ? atual.filter((a) => a !== area) : [...atual, area],
    )
  }

  function aplicarSugestao(id: string) {
    const conflito = CONFLITOS_CALENDARIO.find((c) => c.id === id)
    if (!conflito) return
    const alvo = ATIVIDADES_CALENDARIO.find((a) => a.id === conflito.atividadeId)
    setDeslocamentos((atual) => ({ ...atual, [conflito.atividadeId]: conflito.deslocamento }))
    setResolvidos((atual) => [...atual, id])
    push(
      'Sugestão aplicada',
      'ok',
      `${alvo?.nome} foi ${conflito.deslocamento > 0 ? 'adiada' : 'antecipada'} em ${Math.abs(conflito.deslocamento)} semanas.`,
    )
  }

  function ignorarConflito(id: string) {
    setIgnorados((atual) => [...atual, id])
    push('Conflito ignorado', 'warn', 'Ele sai do painel, mas o calendário não muda.')
  }

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------- contagens --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {CONTAGEM_POR_AREA.map((c) => (
          <button
            key={c.area}
            type="button"
            onClick={() => alternarArea(c.area)}
            aria-pressed={areasAtivas.includes(c.area)}
            className={`card-base focus-ring p-3.5 text-left transition ${
              areasAtivas.includes(c.area) ? '' : 'opacity-45'
            } hover:shadow-pop`}
          >
            <div className="flex items-center gap-2">
              <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${COR_AREA_BARRA[c.area]}`} />
              <span className="kpi-label">{c.area}</span>
            </div>
            <p className="mt-1.5 font-display text-[22px] font-semibold leading-none text-cea-deep">
              {c.total}
            </p>
            <p className="mt-1 text-[11px] text-muted">atividades no ano</p>
          </button>
        ))}

        <div
          className={`card-base border-l-4 p-3.5 ${
            conflitosAbertos.length > 0 ? 'border-l-warn' : 'border-l-ok'
          }`}
        >
          <span className="kpi-label">Conflitos abertos</span>
          <p
            className={`mt-1.5 font-display text-[22px] font-semibold leading-none ${
              conflitosAbertos.length > 0 ? 'text-warn' : 'text-ok'
            }`}
          >
            {conflitosAbertos.length}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            {conflitosAbertos.length > 0 ? 'exigem decisão' : 'calendário sem sobreposição'}
          </p>
        </div>
      </div>

      {/* --------------------------------------------------------- filtros --- */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          Coleções
        </span>
        {COLECOES_DO_CALENDARIO.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => alternarColecao(c)}
            aria-pressed={colecoesAtivas.includes(c)}
            className={`focus-ring rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
              colecoesAtivas.includes(c)
                ? 'border-cea-blue bg-cea-blue text-white'
                : 'border-line bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
        <span className="ml-2 text-[11px] text-muted">
          {filtradas.length} de {ATIVIDADES_CALENDARIO.length} atividades
        </span>
      </div>

      {/* ----------------------------------------------------------- gantt --- */}
      <SectionCard
        titulo={`Calendário de Processos de Compras · ${ANO_CALENDARIO}`}
        subtitulo="52 semanas · clique numa barra para ver a atividade · barras curtas mostram só a cor da área"
        compacto
        acoes={
          <span className="flex flex-wrap items-center gap-2.5 text-[10.5px] text-muted">
            {AREAS.map((a) => (
              <span key={a} className="flex items-center gap-1">
                <span aria-hidden className={`h-2 w-2 rounded-full ${COR_AREA_BARRA[a]}`} />
                {a}
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span aria-hidden className="h-2 w-2 rounded-full bg-cea-red/90" />
              Campanha real
            </span>
          </span>
        }
      >
        <div className="scroll-x p-3">
          <div className="min-w-[1100px]">
            {/* régua de meses */}
            <div className="mb-1 flex">
              <div className="w-[150px] shrink-0" />
              <div
                className="grid flex-1 text-[10px] font-bold uppercase tracking-wide text-slate-400"
                style={{ gridTemplateColumns: `repeat(${SEMANAS_NO_ANO}, minmax(0, 1fr))` }}
              >
                {INICIO_DOS_MESES.map((m, i) => (
                  <span
                    key={m.mes}
                    className="border-l border-line/70 pl-1"
                    style={{
                      gridColumn: `${m.semana} / ${
                        i === 11 ? SEMANAS_NO_ANO + 1 : INICIO_DOS_MESES[i + 1].semana
                      }`,
                    }}
                  >
                    {m.mes}
                  </span>
                ))}
              </div>
            </div>

            {/* linha de campanhas (dados reais do snapshot) */}
            <LinhaGantt rotulo="Campanhas" destaque>
              {CAMPANHAS.map((c, i) => (
                <div
                  key={c.nome}
                  title={`${c.nome} · semanas ${c.semanaInicio}–${c.semanaFim}${c.obs ? ` · ${c.obs}` : ''}`}
                  className={`flex h-5 items-center overflow-hidden rounded px-1.5 text-[9.5px] font-bold ${
                    c.real ? 'bg-cea-red/90 text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                  style={{
                    gridColumn: `${c.semanaInicio} / ${c.semanaFim + 1}`,
                    gridRow: (i % 2) + 1,
                  }}
                >
                  <span className="truncate">{c.nome}</span>
                </div>
              ))}
            </LinhaGantt>

            {/* uma linha por coleção × trilha */}
            {COLECOES_DO_CALENDARIO.filter((c) => colecoesAtivas.includes(c)).map((colecao) =>
              TRILHAS.map((trilha) => {
                const barras = filtradas.filter(
                  (a) => a.colecao === colecao && a.trilha === trilha,
                )
                return (
                  <LinhaGantt
                    key={`${colecao}-${trilha}`}
                    rotulo={trilha === 'Nacional' ? colecao : ''}
                    sub={trilha}
                  >
                    {barras.map((a, i) => {
                      // barra de 1–2 semanas não cabe texto legível: fica só a cor
                      // (o nome está no title e no clique).
                      const cabeRotulo = a.semanaFim - a.semanaInicio + 1 >= 3
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setSelecionada(a)}
                          title={`${a.nome} · semanas ${a.semanaInicio}–${a.semanaFim}`}
                          className={`focus-ring flex h-4 items-center overflow-hidden rounded px-1 text-[9px] font-semibold text-white transition hover:brightness-110 ${COR_AREA_BARRA[a.area]} ${
                            deslocamentos[a.id] ? 'ring-2 ring-warn ring-offset-1' : ''
                          }`}
                          style={{
                            gridColumn: `${a.semanaInicio} / ${a.semanaFim + 1}`,
                            gridRow: (i % 3) + 1,
                          }}
                        >
                          {cabeRotulo && <span className="truncate">{a.nome}</span>}
                          {!cabeRotulo && <span className="sr-only">{a.nome}</span>}
                        </button>
                      )
                    })}
                  </LinhaGantt>
                )
              }),
            )}
          </div>
        </div>
        <p className="border-t border-line px-3 py-2 text-[11px] text-slate-400">
          O Gantt cobre o ano civil de {ANO_CALENDARIO}: atividades do Inverno 2 que avançam para{' '}
          {ANO_CALENDARIO + 1} aparecem encostadas na semana {SEMANAS_NO_ANO}. Campanhas em vermelho
          vêm do calendário comercial real da C&amp;A; a liquidação de janeiro é a janela padrão do
          varejo.
        </p>
      </SectionCard>

      {selecionada && (
        <Banner
          tom="info"
          titulo={selecionada.nome}
          acoes={
            <Button tamanho="sm" onClick={() => setSelecionada(null)}>
              Fechar
            </Button>
          }
        >
          {selecionada.colecao} · trilha {selecionada.trilha} · área {selecionada.area} · semanas{' '}
          {selecionada.semanaInicio} a {selecionada.semanaFim} (
          {formatDataCurta(segundaDaSemanaISO(selecionada.semanaInicio))} –{' '}
          {formatDataCurta(segundaDaSemanaISO(selecionada.semanaFim))})
        </Banner>
      )}

      {/* ------------------------------------------------------- conflitos --- */}
      <SectionCard
        titulo="Conflitos detectados"
        subtitulo="Sobreposições entre coleções que disputam a mesma equipe ou o mesmo CD"
        tag={
          <StatusChip tom={conflitosAbertos.length > 0 ? 'warn' : 'ok'}>
            {conflitosAbertos.length} aberto{conflitosAbertos.length === 1 ? '' : 's'}
          </StatusChip>
        }
      >
        {conflitosAbertos.length === 0 ? (
          <p className="py-2 text-sm text-muted">
            Nenhum conflito aberto. As barras deslocadas ficam marcadas em âmbar no Gantt.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {conflitosAbertos.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-[#F6D8A0] bg-[var(--warn-soft)] p-3.5"
              >
                <p className="text-[13px] font-semibold text-[#A15C00]">{c.titulo}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-slate-600">{c.descricao}</p>
                <p className="mt-2 text-[12px] font-semibold text-ink">Sugestão: {c.sugestao}</p>
                <div className="mt-3 flex gap-2">
                  <Button variante="primario" tamanho="sm" onClick={() => aplicarSugestao(c.id)}>
                    Aplicar sugestão
                  </Button>
                  <Button tamanho="sm" onClick={() => ignorarConflito(c.id)}>
                    Ignorar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ------------------------------------------------------- premissas --- */}
      <SectionCard
        titulo="Premissas do Calendário"
        subtitulo="O que define as janelas acima"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PREMISSAS_CALENDARIO.map((p) => (
            <div key={p.titulo} className="rounded-lg border border-line bg-slate-50/60 p-3">
              <p className="text-[12.5px] font-semibold text-cea-deep">{p.titulo}</p>
              <p className="mt-1 text-[12px] leading-snug text-slate-600">{p.texto}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

/** Uma faixa do Gantt: rótulo fixo à esquerda + grade de 52 semanas. */
function LinhaGantt({
  rotulo,
  sub,
  destaque,
  children,
}: {
  rotulo: string
  sub?: string
  destaque?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`flex border-t border-line ${destaque ? 'bg-slate-50/80' : ''}`}>
      <div className="w-[150px] shrink-0 px-2 py-2">
        {rotulo && (
          <p
            className={`text-[11.5px] font-semibold leading-tight ${
              destaque ? 'uppercase tracking-wide text-cea-red' : 'text-ink'
            }`}
          >
            {rotulo}
          </p>
        )}
        {sub && <p className="text-[10.5px] text-muted">{sub}</p>}
      </div>
      <div
        className="grid flex-1 gap-y-1 py-2"
        style={{
          gridTemplateColumns: `repeat(${SEMANAS_NO_ANO}, minmax(0, 1fr))`,
          backgroundImage:
            'repeating-linear-gradient(to right, var(--border) 0 1px, transparent 1px calc(100% / 52))',
        }}
      >
        {children}
      </div>
    </div>
  )
}
