import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Icone } from '@/components/ui/Icone'
import { SectionCard } from '@/components/ui/SectionCard'
import { EmptyGate } from '@/components/ui/EmptyGate'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { usePlano } from '@/app/PlanoProvider'
import {
  COLECAO,
  LINHAS_LINE,
  TEMPLATES_GRADE,
  ajustarAoPack,
  distribuirPelaCurva,
  multiploDoPack,
  templateDaLinha,
  type TemplateGrade,
} from '@/data/derived'
import { formatNum, formatPct, plural } from '@/lib/format'

export default function GradePage() {
  const { push } = useToast()
  const navigate = useNavigate()
  const { lineCarregado, linhas } = usePlano()
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [quantidades, setQuantidades] = useState<Record<string, number>>({})
  const [mostrarTodas, setMostrarTodas] = useState(false)

  /** Cada item da grade parte da quantidade retornada no line. */
  const itens = useMemo(
    () =>
      LINHAS_LINE.map((l) => {
        const linha = linhas.find((p) => p.ref === l.ref)
        const template = templateDaLinha(linha?.categoria ?? 'Camisetas')
        const qtd = quantidades[l.id] ?? l.qtdRetornada
        return {
          id: l.id,
          ref: l.ref,
          produto: l.produto,
          categoria: linha?.categoria ?? '—',
          template,
          qtd,
          porTamanho: distribuirPelaCurva(qtd, template),
          ok: multiploDoPack(qtd, template),
          packs: Math.floor(qtd / template.pecasPorPack),
        }
      }),
    [linhas, quantidades],
  )

  const foraDoMultiplo = itens.filter((i) => !i.ok)

  if (!lineCarregado) {
    return (
      <div className="space-y-5">
        <PageHeader
          titulo="Grade de Tamanhos"
          subtitulo={`${COLECAO.rotulo} · curvas padrão por sessão e distribuição de peças por tamanho`}
        />
        <EmptyGate
          icone={<Icone nome="grade" tamanho={22} />}
          titulo="Carregue o Line antes de montar as grades"
          texto="A grade parte da quantidade que o fornecedor confirmou, não da planejada. Sem o line devolvido não há o que distribuir por tamanho."
          nota="A cadeia é Line → Grade → Emissão → Distribuição"
          cta={{
            rotulo: 'Ir para o Line',
            icone: <Icone nome="seta" tamanho={15} />,
            onClick: () => navigate('/line'),
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Grade de Tamanhos"
        subtitulo={`${COLECAO.rotulo} · ${itens.length} itens do line distribuídos pelas curvas padrão`}
        meta={
          <>
            <StatusChip tom={foraDoMultiplo.length ? 'warn' : 'ok'}>
              {foraDoMultiplo.length
                ? `${foraDoMultiplo.length} fora do múltiplo de pack`
                : 'Todas as quantidades fecham em packs'}
            </StatusChip>
          </>
        }
        acoes={
          <Link
            to="/emissao"
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-cea-blue px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-cea-deep"
          >
            Emitir pedidos <span aria-hidden>→</span>
          </Link>
        }
      />

      <SectionCard
        titulo="Cadastro de grade padrão"
        subtitulo={`${TEMPLATES_GRADE.length} templates, um por sessão — a curva define quantas peças de cada tamanho entram no pack`}
        acoes={
          <Button tamanho="sm" onClick={() => setDrawerAberto(true)}>
            Ver curvas
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {TEMPLATES_GRADE.map((t) => (
            <div key={t.id} className="rounded-lg border border-line bg-slate-50/60 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[12.5px] font-semibold text-cea-deep">{t.nome}</p>
                <span className="num text-[11px] font-semibold text-cea-blue">
                  pack {t.pecasPorPack}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted">{t.sessao}</p>
              <div className="mt-2 flex gap-1">
                {t.tamanhos.map((tam, i) => (
                  <span
                    key={tam}
                    title={`${tam}: ${formatPct(t.curva[i], 0)} da curva`}
                    className="flex-1 rounded bg-white px-1 py-1 text-center"
                  >
                    <span className="block text-[10px] font-medium uppercase text-slate-500">
                      {tam}
                    </span>
                    <span className="num mt-0.5 block text-[11px] font-semibold text-slate-700">
                      {formatPct(t.curva[i], 0)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {foraDoMultiplo.length > 0 && (
        <SectionCard
          titulo="Ajuste necessário"
          subtitulo={`${formatNum(foraDoMultiplo.length)} de ${formatNum(itens.length)} ${foraDoMultiplo.length === 1 ? 'item não fecha' : 'itens não fecham'} em packs inteiros — o line devolve a quantidade que o fornecedor conseguiu, não múltiplos de pack`}
          acoes={
            <Button
              variante="primario"
              tamanho="sm"
              onClick={() => {
                const ajustes = Object.fromEntries(
                  foraDoMultiplo.map((i) => [i.id, ajustarAoPack(i.qtd, i.template)]),
                )
                const pecasAntes = foraDoMultiplo.reduce((a, i) => a + i.qtd, 0)
                const pecasDepois = Object.values(ajustes).reduce((a, v) => a + v, 0)
                setQuantidades((atual) => ({ ...atual, ...ajustes }))
                push(
                  plural(foraDoMultiplo.length, 'item ajustado', 'itens ajustados'),
                  'ok',
                  `+${plural(pecasDepois - pecasAntes, 'peça')} para fechar todos os packs.`,
                )
              }}
            >
              Ajustar todos ({foraDoMultiplo.length})
            </Button>
          }
        >
          <ul className="space-y-1.5">
            {(mostrarTodas ? foraDoMultiplo : foraDoMultiplo.slice(0, 4)).map((i) => {
              const sobra = i.qtd % i.template.pecasPorPack
              return (
                <li
                  key={i.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-line border-l-2 border-l-warn bg-white py-2 pl-3 pr-2"
                >
                  <p className="min-w-0 truncate text-[12.5px] text-ink">
                    <span className="font-medium">{i.produto}</span>
                    <span className="num text-muted">
                      {' '}
                      · {sobra === 1 ? 'sobra' : 'sobram'} {plural(sobra, 'pç', 'pç')} · pack{' '}
                      {formatNum(i.template.pecasPorPack)}
                    </span>
                  </p>
                  <Button
                    tamanho="sm"
                    onClick={() => {
                      const ajustado = ajustarAoPack(i.qtd, i.template)
                      setQuantidades((atual) => ({ ...atual, [i.id]: ajustado }))
                      push(
                        'Quantidade ajustada',
                        'ok',
                        `${formatNum(i.qtd)} → ${plural(ajustado, 'peça')} (${plural(ajustado / i.template.pecasPorPack, 'pack')}).`,
                      )
                    }}
                  >
                    Ajustar para {formatNum(ajustarAoPack(i.qtd, i.template))}
                  </Button>
                </li>
              )
            })}
          </ul>
          {foraDoMultiplo.length > 4 && (
            <div className="mt-2">
              <Button variante="fantasma" tamanho="sm" onClick={() => setMostrarTodas((v) => !v)}>
                {mostrarTodas ? 'Mostrar menos' : `Ver todas (${foraDoMultiplo.length})`}
              </Button>
            </div>
          )}
        </SectionCard>
      )}

      <SectionCard
        titulo="Distribuição por tamanho"
        subtitulo="Quantidade do line aberta pela curva do template — edite para ver a curva recalcular"
        compacto
      >
        <div className="scroll-x">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                <th className="px-3 py-2 text-left">Ref</th>
                <th className="px-3 py-2 text-left">Produto</th>
                <th className="px-3 py-2 text-left">Template</th>
                <th className="px-3 py-2 text-right">Quantidade</th>
                <th className="px-3 py-2 text-right">Packs</th>
                <th className="px-3 py-2 text-center" colSpan={6}>
                  Peças por tamanho
                </th>
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.id} className="border-b border-line/70 odd:bg-white even:bg-slate-50/50">
                  <td className="num px-3 py-2 text-[12px] font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      {!i.ok && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-warn"
                          title="Fora do múltiplo de pack"
                        />
                      )}
                      {i.ref}
                    </span>
                  </td>
                  <td className="max-w-[190px] px-3 py-2 font-medium leading-snug text-ink">
                    {i.produto}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-[11.5px] text-slate-600">{i.template.nome}</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <InputQuantidade
                      valor={i.qtd}
                      onChange={(v) => setQuantidades((atual) => ({ ...atual, [i.id]: v }))}
                      invalido={!i.ok}
                      rotulo={`Quantidade de ${i.produto}`}
                    />
                  </td>
                  <td className="num px-3 py-2 text-right font-semibold text-cea-deep">
                    {formatNum(i.packs)}
                  </td>
                  {i.template.tamanhos.map((tam, idx) => (
                    <td key={tam} className="px-2 py-2 text-center">
                      <span className="block text-[10px] font-semibold uppercase text-slate-400">
                        {tam}
                      </span>
                      <span className="num block text-[12px] text-ink">
                        {formatNum(i.porTamanho[idx])}
                      </span>
                    </td>
                  ))}
                  {/* templates de 4 tamanhos ocupam 2 colunas vazias */}
                  {i.template.tamanhos.length < 6 &&
                    Array.from({ length: 6 - i.template.tamanhos.length }).map((_, k) => (
                      <td key={`vazio-${k}`} className="px-2 py-2 text-center text-slate-300">
                        —
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-3 py-2 text-[11px] text-slate-400">
          A curva sempre fecha o total exato: a sobra do arredondamento vai para o tamanho de maior
          participação, o miolo da grade.
        </p>
      </SectionCard>

      {/* ------------------------------------------------ drawer de curvas -- */}
      <Modal
        aberto={drawerAberto}
        onFechar={() => setDrawerAberto(false)}
        titulo="Curvas de grade padrão"
        subtitulo="A curva é a participação de cada tamanho dentro do pack"
        largura="lg"
        rodape={
          <Button variante="primario" onClick={() => setDrawerAberto(false)}>
            Fechar
          </Button>
        }
      >
        <div className="space-y-4">
          {TEMPLATES_GRADE.map((t) => (
            <CurvaTemplate key={t.id} template={t} />
          ))}
        </div>
      </Modal>
    </div>
  )
}

function CurvaTemplate({ template }: { template: TemplateGrade }) {
  const maior = Math.max(...template.curva)
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[13px] font-semibold text-cea-deep">{template.nome}</p>
        <span className="text-[11px] text-muted">
          {template.sessao} · pack de {template.pecasPorPack} peças
        </span>
      </div>
      <div className="mt-3 flex items-end gap-2" style={{ height: 84 }}>
        {template.tamanhos.map((tam, i) => (
          <div key={tam} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="num text-[10.5px] font-semibold text-slate-500">
              {formatPct(template.curva[i], 0)}
            </span>
            <div
              className="w-full rounded-t bg-cea-blue"
              style={{ height: `${(template.curva[i] / maior) * 56}px` }}
            />
            <span className="text-[10.5px] font-semibold text-slate-600">{tam}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Campo de quantidade com formato-no-blur: em repouso exibe o número com
 * separador de milhar (formatNum); no foco mostra o valor cru para edição.
 * Mesma anatomia visual do InputNumero — o número guardado no estado não muda,
 * só a exibição.
 */
function InputQuantidade({
  valor,
  onChange,
  invalido,
  rotulo,
}: {
  valor: number
  onChange: (v: number) => void
  invalido?: boolean
  rotulo?: string
}) {
  const [focado, setFocado] = useState(false)
  const [rascunho, setRascunho] = useState('')

  function aplicar(bruto: string) {
    const limpo = Number(bruto.replace(/\./g, '').replace(',', '.'))
    if (!Number.isNaN(limpo)) onChange(Math.max(0, Math.round(limpo)))
  }

  return (
    <span className="inline-flex w-[104px] items-center justify-end">
      <input
        type="text"
        inputMode="numeric"
        value={focado ? rascunho : formatNum(valor)}
        aria-label={rotulo}
        aria-invalid={invalido}
        onFocus={() => {
          setRascunho(String(valor))
          setFocado(true)
        }}
        onChange={(e) => {
          setRascunho(e.target.value)
          aplicar(e.target.value)
        }}
        onBlur={() => {
          setFocado(false)
          if (rascunho.trim() === '') onChange(0)
        }}
        className={`num focus-ring w-full rounded-md border bg-white px-1.5 py-1 text-right text-[12.5px] font-semibold text-ink ${
          invalido ? 'border-warn bg-[var(--warn-soft)]' : 'border-line'
        }`}
      />
    </span>
  )
}
