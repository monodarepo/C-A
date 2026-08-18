import type { ReactNode } from 'react'
import { Button } from './Button'
import { Icone } from './Icone'
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
  icone = <Icone nome="caixaVazia" tamanho={22} />,
  titulo,
  texto,
  nota,
  cta,
  assinatura = true,
  className = '',
}: Props) {
  return (
    <div
      className={`card-base flex min-h-[52vh] flex-col items-center justify-center gap-3 px-6 py-14 text-center ${className}`}
    >
      <span
        aria-hidden
        className="grid h-14 w-14 place-items-center rounded-2xl bg-cea-soft text-xl text-cea-blue"
      >
        {icone}
      </span>
      <h3 className="font-display text-base font-semibold text-cea-deep">{titulo}</h3>
      {texto && <p className="max-w-md text-sm leading-snug text-muted">{texto}</p>}
      {cta && (
        <Button variante="primario" icone={cta.icone} onClick={cta.onClick} className="mt-1">
          {cta.rotulo}
        </Button>
      )}
      {nota && <p className="text-xs text-slate-500">{nota}</p>}
      {assinatura && <p className="mt-1 text-xs text-slate-400">{TOM_DE_VOZ.vazio}</p>}
    </div>
  )
}
