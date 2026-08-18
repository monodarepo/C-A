import { useMemo, useState, type ReactNode } from 'react'

export type Alinhamento = 'esq' | 'centro' | 'dir'

export type Coluna<T> = {
  chave: string
  titulo: ReactNode
  /** conteúdo da célula; se ausente usa `valor` */
  render?: (linha: T, indice: number) => ReactNode
  /** valor bruto usado para ordenar (e como fallback de render) */
  valor?: (linha: T) => string | number | null | undefined
  alinhar?: Alinhamento
  largura?: string
  ordenavel?: boolean
  className?: string
  titleAttr?: string
}

type Props<T> = {
  colunas: Coluna<T>[]
  dados: T[]
  chaveLinha: (linha: T, indice: number) => string
  onLinhaClick?: (linha: T) => void
  /** ordenação inicial: chave da coluna */
  ordemInicial?: { chave: string; dir: 'asc' | 'desc' }
  rodape?: ReactNode
  loading?: boolean
  linhasSkeleton?: number
  vazio?: ReactNode
  /** destaca uma linha (ex.: a loja selecionada) */
  linhaDestacada?: (linha: T) => boolean
  className?: string
}

const ALINHA: Record<Alinhamento, string> = {
  esq: 'text-left',
  centro: 'text-center',
  dir: 'text-right',
}

/** Tabela densa com zebra, hover e ordenação por coluna. */
export function DataTable<T>({
  colunas,
  dados,
  chaveLinha,
  onLinhaClick,
  ordemInicial,
  rodape,
  loading,
  linhasSkeleton = 6,
  vazio = 'Nada por aqui ainda.',
  linhaDestacada,
  className = '',
}: Props<T>) {
  const [ordem, setOrdem] = useState(ordemInicial ?? null)

  const ordenados = useMemo(() => {
    if (!ordem) return dados
    const col = colunas.find((c) => c.chave === ordem.chave)
    if (!col?.valor) return dados
    const fator = ordem.dir === 'asc' ? 1 : -1
    return [...dados].sort((a, b) => {
      const va = col.valor?.(a) ?? ''
      const vb = col.valor?.(b) ?? ''
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * fator
      return String(va).localeCompare(String(vb), 'pt-BR') * fator
    })
  }, [dados, ordem, colunas])

  function alternar(chave: string) {
    setOrdem((atual) =>
      atual?.chave === chave
        ? { chave, dir: atual.dir === 'asc' ? 'desc' : 'asc' }
        : { chave, dir: 'desc' },
    )
  }

  return (
    <div className={`scroll-x ${className}`}>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line bg-slate-50/50">
            {colunas.map((c) => {
              const ativo = ordem?.chave === c.chave
              const ordenavel = c.ordenavel ?? Boolean(c.valor)
              return (
                <th
                  key={c.chave}
                  scope="col"
                  style={c.largura ? { width: c.largura } : undefined}
                  className={`px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 ${ALINHA[c.alinhar ?? 'esq']}`}
                >
                  {ordenavel ? (
                    <button
                      type="button"
                      onClick={() => alternar(c.chave)}
                      className="focus-ring group inline-flex items-center gap-1 rounded uppercase hover:text-cea-blue"
                      title="Ordenar"
                    >
                      {c.titulo}
                      {/* seta visível só na coluna ordenada; nas demais aparece no hover */}
                      <span
                        aria-hidden
                        className={
                          ativo
                            ? 'text-cea-blue'
                            : 'text-slate-300 opacity-0 transition-opacity group-hover:opacity-100'
                        }
                      >
                        {ativo && ordem?.dir === 'asc' ? '↑' : '↓'}
                      </span>
                    </button>
                  ) : (
                    c.titulo
                  )}
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {loading &&
            Array.from({ length: linhasSkeleton }).map((_, i) => (
              <tr key={`sk-${i}`} className="border-b border-line/70">
                {colunas.map((c) => (
                  <td key={c.chave} className="px-3 py-2.5">
                    <div className="skeleton h-3.5 w-full" />
                  </td>
                ))}
              </tr>
            ))}

          {!loading && ordenados.length === 0 && (
            <tr>
              <td colSpan={colunas.length} className="px-3 py-8 text-center text-sm text-muted">
                {vazio}
              </td>
            </tr>
          )}

          {!loading &&
            ordenados.map((linha, i) => (
              <tr
                key={chaveLinha(linha, i)}
                onClick={onLinhaClick ? () => onLinhaClick(linha) : undefined}
                className={`border-b border-line/70 odd:bg-white even:bg-slate-50/50 ${
                  onLinhaClick ? 'cursor-pointer' : ''
                } ${
                  linhaDestacada?.(linha)
                    ? 'bg-cea-soft/70 even:bg-cea-soft/70'
                    : ''
                } transition hover:bg-cea-soft`}
              >
                {colunas.map((c) => (
                  <td
                    key={c.chave}
                    title={c.titleAttr}
                    className={`px-3 py-2.5 align-middle ${ALINHA[c.alinhar ?? 'esq']} ${c.className ?? ''}`}
                  >
                    {c.render ? c.render(linha, i) : (c.valor?.(linha) ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>

        {rodape && (
          <tfoot>
            <tr className="border-t-2 border-line bg-slate-50 font-semibold text-cea-deep">
              {rodape}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
