import type { ReactNode } from 'react'

export type Aba = {
  id: string
  rotulo: string
  /** contador ou ✓ ao lado do rótulo */
  badge?: ReactNode
}

type Props = {
  abas: Aba[]
  ativa: string
  onTrocar: (id: string) => void
  className?: string
}

/** Abas de navegação interna (Workflow|Calendário, Por Loja|Por Cluster...). */
export function Tabs({ abas, ativa, onTrocar, className = '' }: Props) {
  return (
    <div className={`scroll-x border-b border-line ${className}`} role="tablist">
      <div className="flex min-w-max items-center gap-1">
        {abas.map((a) => {
          const selecionada = a.id === ativa
          return (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={selecionada}
              onClick={() => onTrocar(a.id)}
              className={`focus-ring -mb-px flex items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition ${
                selecionada
                  ? 'border-b-cea-blue bg-cea-soft/60 text-cea-blue'
                  : 'border-b-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {a.rotulo}
              {a.badge !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    selecionada ? 'bg-cea-blue text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {a.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
