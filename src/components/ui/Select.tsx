import { forwardRef, type SelectHTMLAttributes } from 'react'
import { Icone } from './Icone'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  /** classes do invólucro (largura, margens); o <select> em si já vem estilizado */
  className?: string
}

/**
 * Select do design system — mesma anatomia dos inputs do Topbar (borda, raio,
 * focus-ring, chevron lucide). Substitui o <select> nativo nas barras de filtro,
 * que entregava altura e seta default de browser no meio das telas densas.
 */
export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { className = '', children, ...rest },
  ref,
) {
  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <select
        ref={ref}
        {...rest}
        className="focus-ring w-full appearance-none truncate rounded-lg border border-line bg-white py-[7px] pl-3 pr-8 text-[13px] text-ink transition-colors hover:border-line-forte disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        {children}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-2.5 text-slate-400">
        <Icone nome="chevronBaixo" tamanho={14} />
      </span>
    </span>
  )
})
