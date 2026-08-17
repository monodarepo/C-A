import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

/**
 * O build normal usa BrowserRouter. O build de página única (npm run build:pagina)
 * troca para HashRouter: nesse formato o arquivo é servido de um caminho
 * qualquer, sem servidor que reescreva rota, e /plano daria 404.
 */
const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* future flags: tiram os avisos de v7 do console e já alinham o comportamento */}
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </Router>
  </StrictMode>,
)
