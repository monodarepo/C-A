import { InputNumero } from './InputNumero'

type Props = {
  valor: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  rotulo: string
  sufixo?: string
  largura?: string
}

/** Quantidade com − / + ao lado do campo (lista de compras, grade). */
export function Stepper({
  valor,
  onChange,
  step = 1,
  min = 0,
  max,
  rotulo,
  sufixo,
  largura = '92px',
}: Props) {
  const botao =
    'focus-ring grid h-[26px] w-[22px] shrink-0 place-items-center rounded-md border border-line bg-white text-[13px] font-bold text-slate-500 transition hover:border-cea-blue/50 hover:text-cea-blue disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        className={botao}
        aria-label={`Diminuir ${rotulo}`}
        disabled={valor <= min}
        onClick={() => onChange(Math.max(min, valor - step))}
      >
        −
      </button>
      <InputNumero
        valor={valor}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        rotulo={rotulo}
        sufixo={sufixo}
        largura={largura}
      />
      <button
        type="button"
        className={botao}
        aria-label={`Aumentar ${rotulo}`}
        disabled={max !== undefined && valor >= max}
        onClick={() => onChange(max !== undefined ? Math.min(max, valor + step) : valor + step)}
      >
        +
      </button>
    </span>
  )
}
