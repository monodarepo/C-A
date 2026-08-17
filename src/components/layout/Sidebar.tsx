import { NavLink } from 'react-router-dom'
import { GRUPOS, ROTAS, type Grupo } from '@/app/routes'
import { LogoCea } from './LogoCea'
import { iniciaisPessoa } from '@/lib/cea'
import { PLANNER, REDE } from '@/data/derived'

/** Os dois grupos "soltos" do fim não recebem cabeçalho de seção. */
const SEM_CABECALHO: Grupo[] = ['Dashboard Executivo', 'Transversais']

type Props = {
  colapsada: boolean
  onFechar: () => void
}

export function Sidebar({ colapsada, onFechar }: Props) {
  return (
    <>
      {/* overlay no modo gaveta (<1100px) */}
      {!colapsada && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={onFechar}
          className="fixed inset-0 z-30 bg-slate-900/30 min-[1100px]:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] shrink-0 flex-col border-r border-line bg-card transition-transform min-[1100px]:sticky min-[1100px]:top-0 min-[1100px]:h-screen min-[1100px]:translate-x-0 ${
          colapsada ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-3.5 py-3.5">
          <LogoCea altura={24} />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-[12.5px] font-semibold tracking-tight text-cea-deep">
              Plano de Sortimento
            </p>
            <p className="truncate text-[11px] text-muted">{REDE.totalLojas} lojas · Brasil</p>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="Navegação principal">
          {GRUPOS.map((grupo) => {
            const itens = ROTAS.filter((r) => r.grupo === grupo)
            if (!itens.length) return null
            return (
              <div key={grupo} className="mb-3">
                {!SEM_CABECALHO.includes(grupo) && (
                  <p className="px-2.5 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {grupo}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {itens.map((r) => (
                    <li key={r.path}>
                      <NavLink
                        to={r.path}
                        onClick={onFechar}
                        className={({ isActive }) =>
                          `focus-ring flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition ${
                            isActive
                              ? 'bg-cea-soft font-semibold text-cea-blue'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`
                        }
                      >
                        <span aria-hidden className="w-4 text-center text-[13px] text-cea-blue/70">
                          {r.icone}
                        </span>
                        <span className="truncate">{r.nav}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </nav>

        <footer className="flex items-center gap-2.5 border-t border-line px-3 py-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cea-blue text-[11px] font-bold text-white">
            {iniciaisPessoa(PLANNER.nome)}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[12px] font-semibold text-ink">{PLANNER.nome}</p>
            <p className="truncate text-[11px] text-muted">{PLANNER.area}</p>
          </div>
        </footer>
      </aside>
    </>
  )
}
