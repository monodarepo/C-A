import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ROTAS } from '@/app/routes'

/**
 * As 21 telas entram por code-splitting (import dinâmico pelo slug da rota),
 * então o bundle inicial carrega só o shell.
 */
const TELAS = Object.fromEntries(
  ROTAS.map((r) => [r.path, lazy(() => import(`./app/${r.slug}/index.tsx`))]),
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
                <Suspense fallback={<Carregando />}>
                  <Tela />
                </Suspense>
              }
            />
          )
        })}
        <Route
          path="*"
          element={
            <Suspense fallback={<Carregando />}>
              <NotFound />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
