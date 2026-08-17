import { lazy, Suspense, type ComponentType } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ErroDeRota } from '@/app/ErroDeRota'
import { ROTAS } from '@/app/routes'

/**
 * As 21 telas entram por code-splitting, então o bundle inicial carrega só o
 * shell. O mapa vem de import.meta.glob (resolvido pelo Vite em build-time) —
 * mais previsível que um import() com template literal.
 */
const MODULOS = import.meta.glob<{ default: ComponentType }>('./app/*/index.tsx')

const TELAS = Object.fromEntries(
  ROTAS.map((r) => {
    const carregar = MODULOS[`./app/${r.slug}/index.tsx`]
    if (!carregar) throw new Error(`Tela não encontrada para a rota ${r.path} (slug "${r.slug}")`)
    return [r.path, lazy(carregar)]
  }),
)

const NotFound = lazy(() => import('@/app/NotFound'))

function Carregando() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando tela">
      <div className="skeleton h-7 w-72" />
      <div className="skeleton h-4 w-96" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
      </div>
      <div className="skeleton h-64" />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {ROTAS.map((r) => {
          const Tela = TELAS[r.path]
          return (
            <Route
              key={r.path}
              path={r.path}
              element={
                <ErroDeRota rota={r.path}>
                  <Suspense fallback={<Carregando />}>
                    <Tela />
                  </Suspense>
                </ErroDeRota>
              }
            />
          )
        })}
        <Route
          path="*"
          element={
            <ErroDeRota rota="404">
              <Suspense fallback={<Carregando />}>
                <NotFound />
              </Suspense>
            </ErroDeRota>
          }
        />
      </Route>
    </Routes>
  )
}
