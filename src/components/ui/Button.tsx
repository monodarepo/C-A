import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type VarianteBotao = 'primario' | 'secundario' | 'fantasma' | 'perigo'

const VARIANTES: Record<VarianteBotao, string> = {
  primario: 'bg-cea-blue text-white border-cea-blue hover:bg-cea-deep',
  secundario: 'bg-white text-cea-blue border-line hover:border-cea-blue/50 hover:bg-slate-50',
  fantasma: 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100',
  perigo: 'bg-cea-red text-white border-cea-red hover:brightness-90',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBotao
  icone?: ReactNode
  tamanho?: 'sm' | 'md'
}

/** Botão padrão do app. Toda ação dá feedback (regra 8) — quem chama garante. */
export function Button({
  variante = 'secundario',
  icone,
  tamanho = 'md',
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={`focus-ring inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        tamanho === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-[13px]'
      } ${VARIANTES[variante]} ${className}`}
    >
      {icone && <span aria-hidden>{icone}</span>}
      {children}
    </button>
  )
}
