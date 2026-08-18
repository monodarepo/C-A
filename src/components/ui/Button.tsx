import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type VarianteBotao = 'primario' | 'secundario' | 'fantasma' | 'perigo'

const VARIANTES: Record<VarianteBotao, string> = {
  primario: 'bg-cea-blue text-white border-cea-blue shadow-sm hover:bg-cea-deep',
  secundario:
    'bg-white text-cea-blue border-line shadow-sm hover:border-line-forte hover:bg-slate-50',
  fantasma: 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100',
  perigo: 'bg-cea-red text-white border-cea-red shadow-sm hover:brightness-90',
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
      className={`focus-ring inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border font-semibold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 ${
        tamanho === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-[13px]'
      } ${VARIANTES[variante]} ${className}`}
    >
      {icone && <span aria-hidden>{icone}</span>}
      {children}
    </button>
  )
}
