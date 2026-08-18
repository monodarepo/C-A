import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, Check, Info, OctagonAlert } from 'lucide-react'

/**
 * Toasts — infraestrutura da regra de ouro 8 ("nenhum clique morto").
 * Várias fases pedem feedback por toast (Sincronizar, Exportar, Gerar OCs...),
 * então o provider mora no AppShell e qualquer tela usa `useToast()`.
 */
export type TomToast = 'ok' | 'info' | 'warn' | 'crit'

type Toast = { id: number; texto: string; tom: TomToast; detalhe?: string }

type Ctx = { push: (texto: string, tom?: TomToast, detalhe?: string) => void }

const ToastCtx = createContext<Ctx | null>(null)

/* chip do ícone: círculo suave na cor semântica — o ícone carrega o estado,
   nunca só a cor (acessibilidade) */
const CHIP: Record<TomToast, { caixa: string; Icone: typeof Check }> = {
  ok: { caixa: 'bg-[var(--ok-soft)] text-[#0A7355]', Icone: Check },
  info: { caixa: 'bg-cea-soft text-cea-blue', Icone: Info },
  warn: { caixa: 'bg-[var(--warn-soft)] text-[#A15C00]', Icone: AlertTriangle },
  crit: { caixa: 'bg-[var(--crit-soft)] text-[#A8060F]', Icone: OctagonAlert },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<Toast[]>([])

  const push = useCallback((texto: string, tom: TomToast = 'ok', detalhe?: string) => {
    const id = Date.now() + Math.random()
    setItens((atual) => [...atual, { id, texto, tom, detalhe }])
    window.setTimeout(() => setItens((atual) => atual.filter((t) => t.id !== id)), 4000)
  }, [])

  const valor = useMemo(() => ({ push }), [push])

  return (
    <ToastCtx.Provider value={valor}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[min(360px,90vw)] flex-col gap-2"
      >
        {itens.map((t) => {
          const chip = CHIP[t.tom]
          return (
            <div
              key={t.id}
              className="toast-entrando pointer-events-auto flex items-start gap-2.5 rounded-xl border border-line bg-card px-3.5 py-3 shadow-pop"
            >
              <span
                aria-hidden
                className={`mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full ${chip.caixa}`}
              >
                <chip.Icone size={13} strokeWidth={2.25} />
              </span>
              <div className="min-w-0 text-[13px]">
                <p className="font-semibold text-ink">{t.texto}</p>
                {t.detalhe && <p className="mt-0.5 leading-snug text-muted">{t.detalhe}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

/* Provider e hook moram juntos de propósito (import único em todas as telas);
   o custo é só perder fast-refresh neste arquivo. */
// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): Ctx {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return ctx
}
