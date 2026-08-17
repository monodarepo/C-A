import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Toasts — infraestrutura da regra de ouro 8 ("nenhum clique morto").
 * Várias fases pedem feedback por toast (Sincronizar, Exportar, Gerar OCs...),
 * então o provider mora no AppShell e qualquer tela usa `useToast()`.
 */
export type TomToast = 'ok' | 'info' | 'warn' | 'crit'

type Toast = { id: number; texto: string; tom: TomToast; detalhe?: string }

type Ctx = { push: (texto: string, tom?: TomToast, detalhe?: string) => void }

const ToastCtx = createContext<Ctx | null>(null)

const TONS: Record<TomToast, string> = {
  ok: 'border-l-ok',
  info: 'border-l-cea-blue',
  warn: 'border-l-warn',
  crit: 'border-l-crit',
}

const ICONES: Record<TomToast, string> = { ok: '✓', info: 'ℹ', warn: '⚠', crit: '⛔' }

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
        {itens.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-card border border-line border-l-4 bg-card px-3.5 py-3 shadow-pop ${TONS[t.tom]}`}
          >
            <span aria-hidden className="text-sm font-bold text-cea-blue">
              {ICONES[t.tom]}
            </span>
            <div className="min-w-0 text-[13px]">
              <p className="font-semibold text-ink">{t.texto}</p>
              {t.detalhe && <p className="mt-0.5 leading-snug text-muted">{t.detalhe}</p>}
            </div>
          </div>
        ))}
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
