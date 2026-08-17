import { Component, type ErrorInfo, type ReactNode } from 'react'
import { TOM_DE_VOZ } from '@/lib/cea'

type Props = { children: ReactNode; rota: string }
type State = { erro: Error | null }

/**
 * Rede de proteção por rota. Um chunk que não baixa (rede oscilando na
 * apresentação) deixaria a tela presa no skeleton para sempre — aqui isso vira
 * uma mensagem com botão de recarregar. A demo nunca fica em branco.
 */
export class ErroDeRota extends Component<Props, State> {
  state: State = { erro: null }

  static getDerivedStateFromError(erro: Error): State {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error(`[rota ${this.props.rota}]`, erro, info.componentStack)
  }

  componentDidUpdate(anterior: Props) {
    // trocou de rota depois do erro? limpa o estado e tenta renderizar de novo
    if (anterior.rota !== this.props.rota && this.state.erro) this.setState({ erro: null })
  }

  render() {
    if (!this.state.erro) return this.props.children

    return (
      <div className="card-base mx-auto mt-6 max-w-lg px-6 py-10 text-center">
        <span aria-hidden className="text-2xl">
          🧵
        </span>
        <h1 className="mt-3 font-display text-lg font-semibold text-cea-deep">
          Essa tela não terminou de carregar
        </h1>
        <p className="mt-2 text-sm leading-snug text-muted">
          O carregamento de <code className="rounded bg-slate-100 px-1">{this.props.rota}</code> foi
          interrompido. Recarregar normalmente resolve.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="focus-ring mt-5 inline-flex rounded-lg bg-cea-blue px-4 py-2 text-[13px] font-semibold text-white hover:bg-cea-deep"
        >
          Recarregar a tela
        </button>
        <p className="mt-6 text-xs text-slate-400">{TOM_DE_VOZ.vazio}</p>
      </div>
    )
  }
}
