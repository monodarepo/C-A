import { Link } from 'react-router-dom'
import { TOM_DE_VOZ } from '@/lib/cea'

export default function NotFound() {
  return (
    <div className="card-base mx-auto mt-10 max-w-lg px-6 py-12 text-center">
      <p className="font-display text-4xl font-bold text-cea-blue">
        4<span className="text-cea-red">0</span>4
      </p>
      <h1 className="mt-3 font-display text-lg font-semibold text-cea-deep">
        Essa arara está vazia
      </h1>
      <p className="mt-2 text-sm leading-snug text-muted">
        A rota que você tentou abrir não existe no plano de sortimento. Volte para o dashboard e
        siga pela sidebar.
      </p>
      <Link
        to="/"
        className="focus-ring mt-5 inline-flex rounded-lg bg-cea-blue px-4 py-2 text-[13px] font-semibold text-white hover:bg-cea-deep"
      >
        Ir para o Dashboard
      </Link>
      <p className="mt-6 text-xs text-slate-400">{TOM_DE_VOZ.vazio}</p>
    </div>
  )
}
