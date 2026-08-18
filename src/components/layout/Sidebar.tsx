import { NavLink } from 'react-router-dom'
import { GRUPOS, ROTAS, type Grupo } from '@/app/routes'
import { LogoCea } from './LogoCea'
import { Icone } from '@/components/ui/Icone'
import { iniciaisPessoa } from '@/lib/cea'
import { PLANNER, REDE } from '@/data/derived'

/** Os dois grupos "soltos" do fim não recebem cabeçalho de seção. */
const SEM_CABECALHO: Grupo[] = ['Dashboard Executivo', 'Transversais']

type Props = {
  colapsada: boolean
  onFechar: () => void
}

/**
 * Sidebar navy — a assinatura visual do shell. O navy vem do azul-marinho da
 * marca; toda a tinta sobre ele é branca com alfa (nunca cinza, que suja).
 * O item ativo ganha a barra vermelha da moldura do logo: o único vermelho
 * permanente da interface, e por isso lê como marca, não como alerta.
 */
export function Sidebar({ colapsada, onFechar }: Props) {
  return (
    <>
      {/* overlay no modo gaveta (<1100px) */}
      {!colapsada && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={onFechar}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[1px] min-[1100px]:hidden"
        />
      )}

      <aside
        style={{ background: 'linear-gradient(180deg, var(--nav-topo) 0%, var(--nav-base) 100%)' }}
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] shrink-0 flex-col transition-transform min-[1100px]:sticky min-[1100px]:top-0 min-[1100px]:h-screen min-[1100px]:translate-x-0 ${
          colapsada ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div
          className="flex items-center gap-3 px-4 pb-4 pt-4"
          style={{ borderBottom: '1px solid var(--nav-linha)' }}
        >
          <LogoCea altura={30} />
          <div className="min-w-0 leading-tight">
            <p
              className="truncate font-display text-[13px] font-semibold tracking-tight"
              style={{ color: 'var(--nav-ink)' }}
            >
              Plano de Sortimento
            </p>
            <p className="truncate text-[10.5px]" style={{ color: 'var(--nav-muted)' }}>
              {REDE.totalLojas} lojas · Brasil
            </p>
          </div>
        </div>

        <nav
          className="scroll-nav min-h-0 flex-1 overflow-y-auto px-2.5 py-3"
          aria-label="Navegação principal"
        >
          {GRUPOS.map((grupo) => {
            const itens = ROTAS.filter((r) => r.grupo === grupo)
            if (!itens.length) return null
            return (
              <div key={grupo} className="mb-4">
                {!SEM_CABECALHO.includes(grupo) && (
                  <p
                    className="px-2.5 pb-1.5 pt-1 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: 'var(--nav-apagado)' }}
                  >
                    {grupo}
                  </p>
                )}
                <ul className="space-y-px">
                  {itens.map((r) => (
                    <li key={r.path} className="relative">
                      <NavLink
                        to={r.path}
                        onClick={onFechar}
                        className={({ isActive }) =>
                          `sidebar-item focus-ring group relative flex h-9 items-center gap-2.5 rounded-lg pl-3 pr-2.5 text-[13px] transition-colors duration-150 ${
                            isActive ? 'sidebar-item-ativo font-medium' : ''
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span
                                aria-hidden
                                className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-cea-red"
                              />
                            )}
                            <Icone nome={r.icone} className="sidebar-icone" />
                            <span className="truncate">{r.nav}</span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </nav>

        <footer
          className="flex items-center gap-2.5 px-4 py-3.5"
          style={{ borderTop: '1px solid var(--nav-linha)' }}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[11px] font-bold text-cea-deep">
            {iniciaisPessoa(PLANNER.nome)}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[12px] font-semibold" style={{ color: 'var(--nav-ink)' }}>
              {PLANNER.nome}
            </p>
            <p className="truncate text-[10.5px]" style={{ color: 'var(--nav-muted)' }}>
              {PLANNER.area}
            </p>
          </div>
        </footer>
      </aside>
    </>
  )
}
