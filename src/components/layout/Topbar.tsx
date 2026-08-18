import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { rotaPorPath } from '@/app/routes'
import { AVISOS_TOPBAR, COLECAO, PLANNER } from '@/data/derived'
import { cea, iniciaisPessoa } from '@/lib/cea'
import { useToast } from '@/components/ui/Toast'
import { StatusChip } from '@/components/ui/StatusChip'
import { Icone, type NomeIcone } from '@/components/ui/Icone'

/** Coleções do seletor: a ativa (âncora) + as demais temporadas do snapshot. */
const SEASONS = cea.calendarioComercial_2026_27.find((e) => e.seasons)?.seasons ?? []
const OPCOES_COLECAO = [COLECAO.rotulo, ...SEASONS.filter((s) => s !== COLECAO.nome)]

/** Avisos do sino — badge 6 (âncora da Fase 0). Textos montados em derived.ts. */
const AVISOS = AVISOS_TOPBAR

export function Topbar({ onAbrirMenu }: { onAbrirMenu: () => void }) {
  const { pathname } = useLocation()
  const { push } = useToast()
  const rota = rotaPorPath(pathname)
  const [aberto, setAberto] = useState<null | 'sino' | 'ajuda' | 'config' | 'perfil'>(null)
  const [busca, setBusca] = useState('')
  const [colecao, setColecao] = useState<string>(COLECAO.rotulo)
  const campoBusca = useRef<HTMLInputElement>(null)

  /* ⌘K / Ctrl+K foca a busca de qualquer lugar — atalho padrão de mercado */
  useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        campoBusca.current?.focus()
      }
      if (e.key === 'Escape') campoBusca.current?.blur()
    }
    window.addEventListener('keydown', atalho)
    return () => window.removeEventListener('keydown', atalho)
  }, [])

  function alternar(painel: typeof aberto) {
    setAberto((atual) => (atual === painel ? null : painel))
  }

  return (
    <header className="sticky top-0 z-20 flex min-h-[56px] flex-wrap items-center gap-3 border-b border-line bg-card/95 px-4 py-2 backdrop-blur md:px-5">
      <button
        type="button"
        onClick={onAbrirMenu}
        aria-label="Abrir menu"
        className="focus-ring grid h-8 w-8 place-items-center rounded-lg border border-line text-slate-600 min-[1100px]:hidden"
      >
        <Icone nome="menu" />
      </button>

      {/* breadcrumb */}
      <nav aria-label="Trilha" className="min-w-0 flex-1 text-[13px]">
        <ol className="flex items-center gap-1 text-muted">
          <li>
            <Link to="/" className="focus-ring rounded text-slate-500 hover:text-cea-blue">
              Plano de Sortimento
            </Link>
          </li>
          {rota && rota.path !== '/' && (
            <>
              <li aria-hidden className="text-slate-300">
                <Icone nome="chevronDir" tamanho={13} />
              </li>
              <li className="hidden text-slate-400 sm:block">{rota.grupo}</li>
              <li aria-hidden className="hidden text-slate-300 sm:block">
                <Icone nome="chevronDir" tamanho={13} />
              </li>
              <li className="truncate font-semibold text-ink">{rota.nav}</li>
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
        <label className="relative flex w-full items-center sm:w-[280px]">
          <span aria-hidden className="pointer-events-none absolute left-2.5 text-slate-400">
            <Icone nome="busca" tamanho={15} />
          </span>
          <input
            ref={campoBusca}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar referência ou produto"
            aria-label="Buscar"
            className="focus-ring w-full rounded-lg border border-line bg-slate-50/80 py-[7px] pl-8 pr-12 text-[13px] transition-colors placeholder:text-slate-400 hover:border-line-forte focus:bg-white"
          />
          <kbd
            aria-hidden
            className="pointer-events-none absolute right-2 hidden rounded border border-line bg-white px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400 sm:block"
          >
            ⌘K
          </kbd>
        </label>
      </form>

      <label className="relative flex items-center">
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
          className="focus-ring appearance-none rounded-lg border border-line bg-white py-[7px] pl-3 pr-8 text-[12.5px] font-semibold text-cea-deep transition-colors hover:border-line-forte"
        >
          {OPCOES_COLECAO.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none absolute right-2.5 text-slate-400">
          <Icone nome="chevronBaixo" tamanho={14} />
        </span>
      </label>

      <span aria-hidden className="hidden h-5 w-px bg-line sm:block" />

      <div className="flex items-center gap-0.5">
        <IconeBotao
          rotulo="Avisos"
          nome="sino"
          badge={AVISOS.length}
          ativo={aberto === 'sino'}
          onClick={() => alternar('sino')}
        />
        <IconeBotao
          rotulo="Configurações"
          nome="config"
          ativo={aberto === 'config'}
          onClick={() => alternar('config')}
        />
        <IconeBotao
          rotulo="Ajuda"
          nome="ajuda"
          ativo={aberto === 'ajuda'}
          onClick={() => alternar('ajuda')}
        />
        <button
          type="button"
          onClick={() => alternar('perfil')}
          aria-label={PLANNER.nome}
          title={`${PLANNER.nome} — ${PLANNER.area}`}
          className="focus-ring ml-1.5 grid h-8 w-8 place-items-center rounded-full bg-cea-deep text-[11px] font-bold text-white ring-2 ring-white transition hover:ring-cea-blue/20"
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
          <div className="absolute right-4 top-[54px] z-40 w-[330px] rounded-xl border border-line bg-card p-3.5 shadow-pop">
            {aberto === 'sino' && (
              <>
                <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Avisos da semana {COLECAO.semana}
                </p>
                <ul className="space-y-2.5">
                  {AVISOS.map((a) => (
                    <li key={a.texto} className="flex items-start gap-2 text-[12.5px] leading-snug">
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
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Configurações
                </p>
                <p>
                  Coleção ativa: <strong className="text-ink">{colecao}</strong>
                </p>
                <p>
                  Origem dos dados: <strong className="text-ink">snapshot de {cea.meta.dataColeta}</strong>{' '}
                  · catálogo revalidado quando o conector responde.
                </p>
                <p>Fuso: America/São_Paulo · Moeda: BRL · Idioma: pt-BR</p>
              </div>
            )}

            {aberto === 'ajuda' && (
              <div className="space-y-2 text-[13px] leading-snug text-slate-600">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Ajuda
                </p>
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
                <p>
                  {PLANNER.area} · Coleção {colecao}
                </p>
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
  nome,
  rotulo,
  badge,
  ativo,
  onClick,
}: {
  nome: NomeIcone
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
      className={`focus-ring relative grid h-8 w-8 place-items-center rounded-lg transition-colors ${
        ativo ? 'bg-cea-soft text-cea-blue' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      <Icone nome={nome} tamanho={17} />
      {badge ? (
        <span className="absolute right-0.5 top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-cea-red px-0.5 text-[8.5px] font-bold leading-none text-white ring-2 ring-white">
          {badge}
        </span>
      ) : null}
    </button>
  )
}
