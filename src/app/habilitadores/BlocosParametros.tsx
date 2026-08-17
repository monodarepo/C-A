import { useMemo, useState } from 'react'
import { SectionCard } from '@/components/ui/SectionCard'
import { StatusChip } from '@/components/ui/StatusChip'
import { Button } from '@/components/ui/Button'
import { InputNumero } from '@/components/ui/InputNumero'
import { useToast } from '@/components/ui/Toast'
import { formatBRL, formatNum, formatPct } from '@/lib/format'
import {
  GABARITO_POR_SESSAO,
  PACK_ECOMM,
  PACK_LOJA,
  PIRAMIDE_PRECO,
  PORTES_GABARITO,
  PRECO_MEDIO_PIRAMIDE,
  SESSOES_GABARITO,
  VERBA_HABILITADORES,
  margemMediaPonderada,
  pecasPorSku,
  precoMedioPonderado,
  type FaixaPreco,
  type Porte5,
} from '@/data/derived'

/* =========================================== ① pirâmide de preço editável == */

export function BlocoPiramide() {
  const { push } = useToast()
  const [faixas, setFaixas] = useState<FaixaPreco[]>(PIRAMIDE_PRECO)

  const somaParticipacao = faixas.reduce((a, f) => a + f.participacao, 0)
  const fechou = Math.abs(somaParticipacao - 100) < 0.01
  const precoMedio = precoMedioPonderado(faixas)
  const margemMedia = margemMediaPonderada(faixas)

  function atualizar(id: FaixaPreco['id'], campo: 'participacao' | 'margem', v: number) {
    setFaixas((atual) => atual.map((f) => (f.id === id ? { ...f, [campo]: v } : f)))
  }

  function restaurar() {
    setFaixas(PIRAMIDE_PRECO)
    push('Pirâmide restaurada', 'info', 'Voltou para a leitura real do site.')
  }

  return (
    <SectionCard
      titulo="① Pirâmide de Preço"
      subtitulo="Faixas observadas em cea.com.br · edite participação e margem para ver o efeito no preço médio"
      tag={
        <StatusChip tom={fechou ? 'ok' : 'warn'}>
          soma {formatPct(somaParticipacao, 0)}
          {fechou ? '' : ' · precisa fechar 100%'}
        </StatusChip>
      }
      acoes={
        <Button tamanho="sm" onClick={restaurar}>
          Restaurar
        </Button>
      }
      compacto
    >
      <div className="scroll-x">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line bg-slate-50/80 text-[11px] uppercase tracking-wide text-muted">
              <th className="px-3 py-2 text-left">Faixa</th>
              <th className="px-3 py-2 text-left">Intervalo real</th>
              <th className="px-3 py-2 text-right">Preço ref.</th>
              <th className="px-3 py-2 text-right">Participação</th>
              <th className="px-3 py-2 text-right">Margem</th>
              <th className="px-3 py-2 text-right">Peças estimadas</th>
            </tr>
          </thead>
          <tbody>
            {faixas.map((f) => {
              const pecas = Math.round((VERBA_HABILITADORES.pecas * f.participacao) / 100)
              return (
                <tr key={f.id} className="border-b border-line/70 odd:bg-white even:bg-slate-50/50">
                  <td className="px-3 py-2">
                    <span className="font-semibold text-ink">{f.id}</span>{' '}
                    <span className="text-[11px] text-muted">{f.rotulo}</span>
                  </td>
                  <td className="num px-3 py-2 text-muted">
                    {formatBRL(f.min, 0)} – {formatBRL(f.max, 0)}
                  </td>
                  <td className="num px-3 py-2 text-right">{formatBRL(f.precoRef, 0)}</td>
                  <td className="px-3 py-2 text-right">
                    <InputNumero
                      valor={f.participacao}
                      onChange={(v) => atualizar(f.id, 'participacao', v)}
                      max={100}
                      sufixo="%"
                      invalido={!fechou}
                      rotulo={`Participação da faixa ${f.id}`}
                      className="justify-end"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <InputNumero
                      valor={f.margem}
                      onChange={(v) => atualizar(f.id, 'margem', v)}
                      max={100}
                      sufixo="%"
                      rotulo={`Margem da faixa ${f.id}`}
                      className="justify-end"
                    />
                  </td>
                  <td className="num px-3 py-2 text-right text-muted">{formatNum(pecas)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line bg-slate-50 font-semibold text-cea-deep">
              <td className="px-3 py-2.5 text-[12px] uppercase tracking-wide" colSpan={2}>
                Coleção
              </td>
              <td className="num px-3 py-2.5 text-right" title="Preço médio ponderado">
                {formatBRL(precoMedio, 0)}
              </td>
              <td className={`num px-3 py-2.5 text-right ${fechou ? '' : 'text-warn'}`}>
                {formatPct(somaParticipacao, 0)}
              </td>
              <td className="num px-3 py-2.5 text-right">{formatPct(margemMedia)}</td>
              <td className="num px-3 py-2.5 text-right">
                {formatNum(VERBA_HABILITADORES.pecas)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="border-t border-line px-3 py-2.5 text-[12px] text-muted">
        Preço médio ponderado <strong className="text-ink">{formatBRL(precoMedio, 0)}</strong>
        {Math.abs(precoMedio - PRECO_MEDIO_PIRAMIDE) < 1 ? (
          <> — bate com a leitura real de {formatBRL(PRECO_MEDIO_PIRAMIDE, 0)}.</>
        ) : (
          <>
            {' '}
            — a leitura real do site é {formatBRL(PRECO_MEDIO_PIRAMIDE, 0)}; a diferença vem das
            participações que você mudou.
          </>
        )}
      </div>
    </SectionCard>
  )
}

/* ================================================ ② gabarito de packs ==== */

export function BlocoGabarito() {
  const { push } = useToast()
  const [sessao, setSessao] = useState(SESSOES_GABARITO[0])
  const [packsPorSessao, setPacksPorSessao] = useState(GABARITO_POR_SESSAO)

  const linhas = packsPorSessao[sessao]

  const totais = useMemo(() => {
    const porPorte = Object.fromEntries(
      PORTES_GABARITO.map((p) => [p, linhas.reduce((a, l) => a + l.packs[p], 0)]),
    ) as Record<Porte5, number>
    return {
      porPorte,
      pecas: linhas.reduce((a, l) => a + pecasPorSku(l.packs), 0),
    }
  }, [linhas])

  function atualizar(faixa: string, porte: Porte5, v: number) {
    setPacksPorSessao((atual) => ({
      ...atual,
      [sessao]: atual[sessao].map((l) =>
        l.faixa === faixa ? { ...l, packs: { ...l.packs, [porte]: v } } : l,
      ),
    }))
  }

  function restaurar() {
    setPacksPorSessao((atual) => ({ ...atual, [sessao]: GABARITO_POR_SESSAO[sessao] }))
    push('Gabarito restaurado', 'info', `Voltou ao padrão da sessão ${sessao}.`)
  }

  return (
    <SectionCard
      titulo="② Gabarito de Packs"
      subtitulo={`Quantos packs cada porte de loja recebe por faixa · pack de loja ${PACK_LOJA} peças, pack de e-commerce ${PACK_ECOMM}`}
      acoes={
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Sessão
            <select
              value={sessao}
              onChange={(e) => {
                setSessao(e.target.value)
                push(`Sessão ${e.target.value}`, 'info', 'O gabarito padrão muda por sessão.')
              }}
              className="focus-ring rounded-lg border border-line bg-white px-2 py-1 text-[12px] font-normal normal-case text-ink"
            >
              {SESSOES_GABARITO.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <Button tamanho="sm" onClick={restaurar}>
            Restaurar
          </Button>
        </div>
      }
      compacto
    >
      <div className="scroll-x">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line bg-slate-50/80 text-[11px] uppercase tracking-wide text-muted">
              <th className="px-3 py-2 text-left">Faixa</th>
              {PORTES_GABARITO.map((p) => (
                <th key={p} className="px-3 py-2 text-right">
                  {p}
                </th>
              ))}
              <th className="px-3 py-2 text-right">Peças / SKU</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.faixa} className="border-b border-line/70 odd:bg-white even:bg-slate-50/50">
                <td className="px-3 py-2 font-semibold text-ink">{l.faixa}</td>
                {PORTES_GABARITO.map((p) => (
                  <td key={p} className="px-3 py-2 text-right">
                    <InputNumero
                      valor={l.packs[p]}
                      onChange={(v) => atualizar(l.faixa, p, v)}
                      max={20}
                      largura="58px"
                      rotulo={`Packs ${p} da faixa ${l.faixa}`}
                      className="justify-end"
                    />
                  </td>
                ))}
                <td className="num px-3 py-2 text-right font-semibold text-cea-deep">
                  {formatNum(pecasPorSku(l.packs))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line bg-slate-50 font-semibold text-cea-deep">
              <td className="px-3 py-2.5 text-[12px] uppercase tracking-wide">Total</td>
              {PORTES_GABARITO.map((p) => (
                <td key={p} className="num px-3 py-2.5 text-right">
                  {formatNum(totais.porPorte[p])}
                </td>
              ))}
              <td className="num px-3 py-2.5 text-right">{formatNum(totais.pecas)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="border-t border-line px-3 py-2.5">
        <p className="text-[12px] text-muted">
          Peças/SKU ={' '}
          <span className="num">
            (packs de P+M+G+GG) × {PACK_LOJA} + packs de e-commerce × {PACK_ECOMM}
          </span>{' '}
          · o gabarito define a profundidade por SKU, não o total da sessão.
        </p>
      </div>
    </SectionCard>
  )
}
