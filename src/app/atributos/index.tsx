import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { StatusChip } from '@/components/ui/StatusChip'
import { InputNumero } from '@/components/ui/InputNumero'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import {
  COLECAO,
  EXEMPLO_PADRONAGEM,
  HABILITADORES_VS_ATRIBUTOS,
  JANELAS_OTIMIZACAO,
  PECAS_EXEMPLO_PADRONAGEM,
  TAXONOMIA_ATRIBUTOS,
} from '@/data/derived'
import { formatNum, formatPct } from '@/lib/format'

export default function AtributosPage() {
  const { push } = useToast()
  const { pathname } = useLocation()
  const [pecas, setPecas] = useState<number>(PECAS_EXEMPLO_PADRONAGEM)
  const [mix, setMix] = useState(EXEMPLO_PADRONAGEM)
  const [janela, setJanela] = useState<string>(JANELAS_OTIMIZACAO[0].janela)

  const somaMix = mix.reduce((a, p) => a + p.pct, 0)
  const coerente = Math.abs(somaMix - 100) < 0.01

  /** Distribui as peças pelo mix; a sobra do arredondamento vai para o maior. */
  const linhas = useMemo(() => {
    const calc = mix.map((p) => ({ ...p, pecas: Math.round((pecas * p.pct) / 100) }))
    const diferenca = pecas - calc.reduce((a, l) => a + l.pecas, 0)
    if (diferenca !== 0 && calc.length) {
      const maior = calc.reduce((a, b) => (b.pct > a.pct ? b : a))
      maior.pecas += diferenca
    }
    return calc
  }, [mix, pecas])

  /** Taxonomia distribuída em 3 colunas equilibradas por número de termos. */
  const colunas = useMemo(() => {
    const grupos = [...TAXONOMIA_ATRIBUTOS].sort((a, b) => b.termos.length - a.termos.length)
    const cols: (typeof TAXONOMIA_ATRIBUTOS)[] = [[], [], []]
    const pesos = [0, 0, 0]
    for (const g of grupos) {
      const menor = pesos.indexOf(Math.min(...pesos))
      cols[menor].push(g)
      pesos[menor] += g.termos.length + 2 // +2 pelo cabeçalho do grupo
    }
    return cols
  }, [])

  const totalTermos = TAXONOMIA_ATRIBUTOS.reduce((a, g) => a + g.termos.length, 0)

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Atributos de Produto"
        subtitulo={`${COLECAO.rotulo} · taxonomia N3–N7 e janela de otimização do mix`}
        meta={
          <>
            <StatusChip tom="info">{formatNum(totalTermos)} termos na cartela</StatusChip>
            <StatusChip tom="neutro">Cartela real do catálogo</StatusChip>
          </>
        }
      />

      {/* ------------------------------------- habilitadores × atributos --- */}
      <div className="grid gap-4 lg:grid-cols-2">
        {HABILITADORES_VS_ATRIBUTOS.map((box, i) => (
          <div
            key={box.titulo}
            className={`card-base border-l-4 p-4 ${i === 0 ? 'border-l-cea-blue' : 'border-l-cea-red'}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-[15px] font-semibold text-cea-deep">{box.titulo}</h2>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {box.subtitulo}
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-snug text-slate-600">{box.texto}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {box.chips.map((c) => (
                <StatusChip key={c} tom={i === 0 ? 'info' : 'neutro'}>
                  {c}
                </StatusChip>
              ))}
            </div>
            {/* nada de link para a própria tela (regra 8: nenhum clique morto) */}
            {box.rota === pathname ? (
              <p className="mt-3 text-[12px] font-semibold text-muted">Você está aqui</p>
            ) : (
              <Link
                to={box.rota}
                className="focus-ring mt-3 inline-flex rounded text-[12px] font-semibold text-cea-blue hover:underline"
              >
                Abrir {box.titulo} <span aria-hidden>→</span>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* ---------------------------------------------------- taxonomia --- */}
      <SectionCard
        titulo="Taxonomia de atributos"
        subtitulo="Cartela real coletada em cea.com.br — é o vocabulário que o plano pode usar"
        tag={<StatusChip tom="info">Dimensões N3–N7</StatusChip>}
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {colunas.map((coluna, i) => (
            <div key={i} className="space-y-4">
              {coluna.map((g) => (
                <div key={g.grupo}>
                  <div className="flex items-baseline justify-between gap-2 border-b border-line pb-1.5">
                    <h3 className="text-[12.5px] font-semibold text-ink">{g.grupo}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {g.nivel} · {g.termos.length}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {g.termos.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-line bg-slate-50 px-2 py-0.5 text-[11.5px] text-slate-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* --------------------------------------- janela de otimização --- */}
      <SectionCard
        titulo="Janela de otimização"
        subtitulo="Onde mexer em atributo gera resultado — e onde só gera ruptura"
      >
        <div className="flex flex-wrap gap-2">
          {JANELAS_OTIMIZACAO.map((j) => {
            const ativa = j.janela === janela
            return (
              <button
                key={j.janela}
                type="button"
                onClick={() => {
                  setJanela(j.janela)
                  push(
                    `Janela: ${j.janela}`,
                    j.recomendada ? 'ok' : 'warn',
                    j.recomendada ? 'Janela recomendada para otimizar atributo.' : j.texto,
                  )
                }}
                aria-pressed={ativa}
                className={`focus-ring flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                  ativa
                    ? 'border-cea-blue bg-cea-blue text-white'
                    : 'border-line bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {j.janela}
                {j.recomendada && (
                  <span aria-label="recomendada" className={ativa ? 'text-white' : 'text-ok'}>
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-3 rounded-lg border border-line bg-slate-50/60 p-3">
          <p className="text-[12.5px] leading-snug text-slate-600">
            {JANELAS_OTIMIZACAO.find((j) => j.janela === janela)?.texto}
          </p>
        </div>

        {/* exemplo de padronagem */}
        <div className="mt-5 border-t border-line pt-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-[13px] font-semibold text-ink">
                Exemplo: mix de padronagem da sessão
              </h3>
              <p className="text-[12px] text-muted">
                Distribua o volume da sessão pelas padronagens da cartela real
              </p>
            </div>
            <div className="flex items-end gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <span className="mb-1 block">Peças da sessão</span>
                <InputNumero
                  valor={pecas}
                  onChange={setPecas}
                  min={100}
                  max={999_999}
                  step={100}
                  sufixo="pç"
                  largura="104px"
                  rotulo="Peças da sessão"
                />
              </label>
              <Button
                tamanho="sm"
                onClick={() => {
                  setMix(EXEMPLO_PADRONAGEM)
                  setPecas(PECAS_EXEMPLO_PADRONAGEM)
                  push('Mix restaurado', 'info', 'Voltou ao exemplo de referência.')
                }}
              >
                Restaurar
              </Button>
            </div>
          </div>

          <div className="scroll-x mt-3">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-2 text-left">Padronagem</th>
                  <th className="px-3 py-2 text-right">Participação</th>
                  <th className="px-3 py-2 text-right">Peças</th>
                  <th className="px-3 py-2 text-left" style={{ width: '35%' }}>
                    Peso no mix
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr
                    key={l.padronagem}
                    className="border-b border-line/70 odd:bg-white even:bg-slate-50/50"
                  >
                    <td className="px-3 py-2 font-medium capitalize text-ink">{l.padronagem}</td>
                    <td className="px-3 py-2 text-right">
                      <InputNumero
                        valor={l.pct}
                        onChange={(v) =>
                          setMix((atual) =>
                            atual.map((p) =>
                              p.padronagem === l.padronagem ? { ...p, pct: v } : p,
                            ),
                          )
                        }
                        max={100}
                        sufixo="%"
                        invalido={!coerente}
                        rotulo={`Participação de ${l.padronagem}`}
                        className="justify-end"
                      />
                    </td>
                    <td className="num px-3 py-2 text-right font-semibold text-cea-deep">
                      {formatNum(l.pecas)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-cea-blue"
                          style={{ width: `${Math.min(100, l.pct)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-line bg-slate-50 font-semibold text-cea-deep">
                  <td className="px-3 py-2.5 text-[12px] uppercase tracking-wide">Sessão</td>
                  <td className={`num px-3 py-2.5 text-right ${coerente ? '' : 'text-warn'}`}>
                    {formatPct(somaMix, 0)}
                  </td>
                  <td className="num px-3 py-2.5 text-right">
                    {formatNum(linhas.reduce((a, l) => a + l.pecas, 0))}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusChip tom={coerente ? 'ok' : 'warn'}>
                      {coerente
                        ? 'quantidade coerente'
                        : `soma ${formatPct(somaMix, 0)} — ajuste para 100%`}
                    </StatusChip>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
