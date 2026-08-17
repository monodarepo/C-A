import type { ReactNode } from 'react'
import { Button } from './Button'
import { TOM_DE_VOZ } from '@/lib/cea'

type Props = {
  icone?: ReactNode
  titulo: string
  texto?: ReactNode
  /** nota discreta (ex.: "Demo · devolução simulada de 14 itens") */
  nota?: ReactNode
  cta?: { rotulo: string; onClick: () => void; icone?: ReactNode }
  /** mostra a assinatura de marca no pé (tom de voz C&A) */
  assinatura?: boolean
  className?: string
}

/**
 * Estado vazio / porteira de fluxo (ex.: "carregue o Line antes de montar as grades").
 * Microcopy no tom C&A — nunca lorem ipsum.
 */
export function EmptyGate({
  icone = '📋',
  titulo,
  texto,
  nota,
  cta,
  assinatura = true,
  className = '',
}: Props) {
  return (
    <div
      className={`card-base flex flex-col items-center justify-center gap-3 px-6 py-14 text-center ${className}`}
    >
      <span aria-hidden className="grid h-12 w-12 place-items-center rounded-full bg-cea-soft text-xl">
        {icone}
      </span>
      <h3 className="font-display text-base font-semibold text-cea-deep">{titulo}</h3>
      {texto && <p className="max-w-md text-sm leading-snug text-muted">{texto}</p>}
      {cta && (
        <Button variante="primario" icone={cta.icone} onClick={cta.onClick} className="mt-1">
          {cta.rotulo}
        </Button>
      )}
      {nota && <p className="text-[11px] uppercase tracking-wide text-slate-400">{nota}</p>}
      {assinatura && <p className="mt-1 text-xs text-slate-400">{TOM_DE_VOZ.vazio}</p>}
    </div>
  )
}
