import { useId } from 'react'

type Props = {
  valor: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  /** sufixo dentro do campo: "%", "pç", "packs" */
  sufixo?: string
  /** campo fora de faixa/validação — pinta a borda de âmbar */
  invalido?: boolean
  rotulo?: string
  largura?: string
  disabled?: boolean
  className?: string
}

/**
 * Célula numérica editável das tabelas de parâmetro (habilitadores, plano,
 * grade). Limpa o valor para número, respeita min/max e nunca deixa NaN entrar
 * no estado — um campo vazio vira o mínimo (ou 0).
 */
export function InputNumero({
  valor,
  onChange,
  min = 0,
  max,
  step = 1,
  sufixo,
  invalido,
  rotulo,
  largura = '72px',
  disabled,
  className = '',
}: Props) {
  const id = useId()

  function aplicar(bruto: string) {
    const limpo = Number(bruto.replace(',', '.'))
    if (Number.isNaN(limpo)) {
      onChange(min)
      return
    }
    const comLimite = Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, limpo))
    onChange(comLimite)
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} style={{ width: largura }}>
      {rotulo && (
        <label htmlFor={id} className="sr-only">
          {rotulo}
        </label>
      )}
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={valor}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={rotulo}
        aria-invalid={invalido}
        onChange={(e) => aplicar(e.target.value)}
        className={`num focus-ring w-full rounded-md border bg-white px-1.5 py-1 text-right text-[12.5px] font-semibold text-ink disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
          invalido ? 'border-warn bg-[var(--warn-soft)]' : 'border-line'
        }`}
      />
      {sufixo && <span className="shrink-0 text-[11px] text-muted">{sufixo}</span>}
    </span>
  )
}
