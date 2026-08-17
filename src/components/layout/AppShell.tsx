import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastProvider } from '@/components/ui/Toast'
import { PlanoProvider } from '@/app/PlanoProvider'

/** A sidebar vira gaveta abaixo de 1100px (requisito de responsivo do CLAUDE.md). */
const LARGURA_COLAPSO = 1100

export function AppShell() {
  const { pathname } = useLocation()
  const [colapsada, setColapsada] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < LARGURA_COLAPSO,
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${LARGURA_COLAPSO - 1}px)`)
    const aplicar = () => setColapsada(mq.matches)
    aplicar()
    mq.addEventListener('change', aplicar)
    return () => mq.removeEventListener('change', aplicar)
  }, [])

  // troca de rota rola para o topo e fecha a gaveta
  useEffect(() => {
    window.scrollTo({ top: 0 })
    if (window.innerWidth < LARGURA_COLAPSO) setColapsada(true)
  }, [pathname])

  return (
    <ToastProvider>
      {/* o plano vive acima das rotas: /plano, /versoes e /retroalimentacao
          compartilham as mesmas linhas e o mesmo histórico */}
      <PlanoProvider>
        <div className="flex min-h-screen bg-bg">
          <Sidebar colapsada={colapsada} onFechar={() => setColapsada(true)} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar onAbrirMenu={() => setColapsada(false)} />
            <main className="min-w-0 flex-1 px-4 py-5 md:px-6">
              <Outlet />
            </main>
            <footer className="border-t border-line px-4 py-3 text-[11px] text-slate-400 md:px-6">
              Mockup executivo · dados públicos da C&amp;A + métricas simuladas determinísticas ·
              fictícios sinalizados nas telas
            </footer>
          </div>
        </div>
      </PlanoProvider>
    </ToastProvider>
  )
}
