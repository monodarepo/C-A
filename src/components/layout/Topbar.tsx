import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { rotaPorPath } from '@/app/routes'
import { COLECAO, PLANNER } from '@/data/derived'
import { cea, iniciaisPessoa } from '@/lib/cea'
import { useToast } from '@/components/ui/Toast'
import { StatusChip } from '@/components/ui/StatusChip'

/** Coleções do seletor: a ativa (âncora) + as demais temporadas do snapshot. */
const SEASONS = cea.calendarioComercial_2026_27.find((e) => e.seasons)?.seasons ?? []
const OPCOES_COLECAO = [COLECAO.rotulo, ...SEASONS.filter((s) => s !== COLECAO.nome)]

/** Avisos do sino — badge 6 (âncora da Fase 0). */
const AVISOS = [
  { tom: 'crit' as const, texto: 'Ruptura na Camiseta Básica 1049412 em 12 lojas do Cluster B' },
  { tom: 'warn' as const, texto: 'Markdown sugerido para o Tricot Canelado 1083993 (−55%)' },
  { tom: 'warn' as const, texto: 'Plano estourou a banda do OTB em +3,6% (R$ 1,62 mi)' },
  { tom: 'info' as const, texto: 'Wide Leg 1033472 com oportunidade de recompra' },
  { tom: 'info' as const, texto: 'Line devolvido por 3 fornecedores aguarda double check' },
  { tom: 'ok' as const, texto: 'Push para o ERP concluído às 14:32 · 0 erros' },
]

export function Topbar({ onAbrirMenu }: { onAbrirMenu: () => void }) {
  const { pathname } = useLocation()
  const { push } = useToast()
  const rota = rotaPorPath(pathname)
  const [aberto, setAberto] = useState<null | 'sino' | 'ajuda' | 'config' | 'perfil'>(null)
  const [busca, setBusca] = useState('')
  const [colecao, setColecao] = useState<string>(COLECAO.rotulo)

  function alternar(painel: typeof aberto) {
    setAberto((atual) => (atual === painel ? null : painel))
  }

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-line bg-card/95 px-4 py-2.5 backdrop-blur">
      <button
        type="button"
        onClick={onAbrirMenu}
        aria-label="Abrir menu"
        className="focus-ring rounded-lg border border-line px-2 py-1.5 text-sm text-slate-600 min-[1100px]:hidden"
      >
        ☰
      </button>

      {/* breadcrumb */}
      <nav aria-label="Trilha" className="min-w-0 flex-1 text-[13px]">
        <ol className="flex items-center gap-1.5 text-muted">
          <li>
            <Link to="/" className="focus-ring rounded hover:text-cea-blue">
              Plano de Sortimento
            </Link>
          </li>
          {rota && rota.path !== '/' && (
            <>
              <li aria-hidden>/</li>
              <li className="truncate">
                <span className="text-slate-400">{rota.grupo}</span>
                <span aria-hidden className="mx-1.5 text-slate-300">
                  /
                </span>
                <span className="font-semibold text-ink">{rota.nav}</span>
              </li>
            </>
          )}
        </ol>
      </nav>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!busca.trim()) {
            push('Digite um produto, referência ou loja', 'warn')
            return
          }
          push(`Busca por "${busca.trim()}"`, 'info', 'Use os filtros de cada módulo para refinar.')
        }}
        className="order-last flex w-full items-center gap-2 sm:order-none sm:w-auto"
      >
        <label className="relative flex items-center">
          <span aria-hidden className="absolute left-2.5 text-xs text-slate-400">
            ⌕
          </span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar referência, produto ou loja"
            aria-label="Buscar"
            className="focus-ring w-full rounded-lg border border-line bg-slate-50 py-1.5 pl-7 pr-3 text-[13px] placeholder:text-slate-400 sm:w-[260px]"
          />
        </label>
      </form>

      <label className="flex items-center gap-1.5">
        <span className="sr-only">Coleção ativa</span>
        <select
          value={colecao}
          onChange={(e) => {
            setColecao(e.target.value)
            push(
              `Coleção ativa: ${e.target.value}`,
              e.target.value === COLECAO.rotulo ? 'ok' : 'info',
              e.target.value === COLECAO.rotulo
                ? `Semana ${COLECAO.semana} · ${COLECAO.skusAtivos} SKUs ativos`
                : 'Demo: os dados exibidos seguem a coleção âncora.',
            )
          }}
          className="focus-ring rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] font-semibold text-cea-deep"
        >
          {OPCOES_COLECAO.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-1">
        <IconeBotao
          rotulo="Avisos"
          badge={AVISOS.length}
          ativo={aberto === 'sino'}
          onClick={() => alternar('sino')}
        >
          🔔
        </IconeBotao>
        <IconeBotao
          rotulo="Configurações"
          ativo={aberto === 'config'}
          onClick={() => alternar('config')}
        >
          ⚙
        </IconeBotao>
        <IconeBotao rotulo="Ajuda" ativo={aberto === 'ajuda'} onClick={() => alternar('ajuda')}>
          ?
        </IconeBotao>
        <button
          type="button"
          onClick={() => alternar('perfil')}
          aria-label={PLANNER.nome}
          title={`${PLANNER.nome} — ${PLANNER.area}`}
          className="focus-ring ml-1 grid h-8 w-8 place-items-center rounded-full bg-cea-blue text-[11px] font-bold text-white"
        >
          {iniciaisPessoa(PLANNER.nome)}
        </button>
      </div>

      {aberto && (
        <>
          <button
            type="button"
            aria-label="Fechar painel"
            onClick={() => setAberto(null)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="absolute right-4 top-[52px] z-40 w-[320px] rounded-card border border-line bg-card p-3 shadow-pop">
            {aberto === 'sino' && (
              <>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Avisos da semana {COLECAO.semana}
                </p>
                <ul className="space-y-2">
                  {AVISOS.map((a) => (
                    <li key={a.texto} className="flex items-start gap-2 text-[13px] leading-snug">
                      <StatusChip tom={a.tom} ponto>
                        {a.tom === 'crit'
                          ? 'crítico'
                          : a.tom === 'warn'
                            ? 'atenção'
                            : a.tom === 'ok'
                              ? 'ok'
                              : 'info'}
                      </StatusChip>
                      <span className="flex-1 text-slate-600">{a.texto}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {aberto === 'config' && (
              <div className="space-y-2 text-[13px] text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Configurações
                </p>
                <p>
                  Coleção ativa: <strong className="text-ink">{colecao}</strong>
                </p>
                <p>
                  Conector VTEX: <strong className="text-ink">opcional</strong> — a demo funciona
                  offline com o snapshot de {cea.meta.dataColeta}.
                </p>
                <p>Fuso: America/São_Paulo · Moeda: BRL · Idioma: pt-BR</p>
              </div>
            )}

            {aberto === 'ajuda' && (
              <div className="space-y-2 text-[13px] leading-snug text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Ajuda</p>
                <p>
                  Mockup navegável de planejamento de sortimento. Os indicadores financeiros e o
                  catálogo são públicos da C&amp;A; métricas por loja/SKU são simuladas de forma
                  determinística.
                </p>
                <p>Passe o mouse no “?” de cada KPI para ver a definição do indicador.</p>
              </div>
            )}

            {aberto === 'perfil' && (
              <div className="space-y-2 text-[13px] text-slate-600">
                <p className="font-semibold text-ink">{PLANNER.nome}</p>
                <p>{PLANNER.area} · Coleção {colecao}</p>
                <button
                  type="button"
                  onClick={() => {
                    setAberto(null)
                    push('Sessão mantida', 'info', 'Demo executiva — sem autenticação real.')
                  }}
                  className="focus-ring rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  )
}

function IconeBotao({
  children,
  rotulo,
  badge,
  ativo,
  onClick,
}: {
  children: ReactNode
  rotulo: string
  badge?: number
  ativo?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      title={rotulo}
      aria-expanded={ativo}
      className={`focus-ring relative grid h-8 w-8 place-items-center rounded-lg text-[13px] transition ${
        ativo ? 'bg-cea-soft text-cea-blue' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-cea-red px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  )
}
