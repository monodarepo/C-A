import { SectionCard } from '@/components/ui/SectionCard'
import { StatusChip, type TomChip } from '@/components/ui/StatusChip'
import { ProductImage } from '@/components/ui/ProductImage'
import { Stepper } from '@/components/ui/Stepper'
import { Button } from '@/components/ui/Button'
import { formatBRL, formatNum, formatPct } from '@/lib/format'
import { totaisPlano, type LinhaPlano, type StatusLinha } from '@/data/derived'
import { usePlano } from '@/app/PlanoProvider'

const TOM_STATUS: Record<StatusLinha, TomChip> = {
  Dorsal: 'marca',
  Repeat: 'info',
  Novo: 'ok',
  Evento: 'warn',
}

/** Passo do stepper: 1% da quantidade da linha, arredondado a centenas. */
function passoDaLinha(qtd: number): number {
  return Math.max(100, Math.round((qtd * 0.01) / 100) * 100)
}

export function ListaDeCompras({ linhas }: { linhas: LinhaPlano[] }) {
  const { alterarQtd, removerLinha, versao } = usePlano()
  const totais = totaisPlano(linhas, versao === 'original' ? 'qtdOriginal' : 'qtd')
  const editavel = versao === 'qualificado'

  return (
    <SectionCard
      titulo="Lista de Compras"
      subtitulo={`${linhas.length} linhas · ${formatNum(totais.pecas)} peças · altere a quantidade para ver a régua e os KPIs reagirem`}
      tag={
        editavel ? (
          <StatusChip tom="ok">Editável</StatusChip>
        ) : (
          <StatusChip tom="neutro">Original · somente leitura</StatusChip>
        )
      }
      compacto
    >
      <div className="scroll-x">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Foto</th>
              <th className="px-3 py-2 text-left">Ref</th>
              <th className="px-3 py-2 text-left">Produto</th>
              <th className="px-3 py-2 text-left">Categoria</th>
              <th className="px-3 py-2 text-left">Papel</th>
              <th className="px-3 py-2 text-left">Cor</th>
              <th className="px-3 py-2 text-right">PC</th>
              <th className="px-3 py-2 text-right">PV</th>
              <th className="px-3 py-2 text-right">M%</th>
              <th className="px-3 py-2 text-right">Qtd</th>
              <th className="px-3 py-2 text-right">Investimento</th>
              {editavel && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const qtd = editavel ? l.qtd : l.qtdOriginal
              const delta = l.qtd - l.qtdOriginal
              return (
                <tr
                  key={l.id}
                  className="border-b border-line/70 odd:bg-white even:bg-slate-50/50 hover:bg-cea-soft"
                >
                  <td className="px-3 py-2">
                    <StatusChip tom={TOM_STATUS[l.status]}>{l.status}</StatusChip>
                  </td>
                  <td className="px-3 py-2">
                    <ProductImage
                      cod={l.ref}
                      nome={l.produto}
                      categoria={l.categoria}
                      cor={l.cor}
                    />
                  </td>
                  <td className="num px-3 py-2 text-[12px] font-semibold text-slate-500">
                    {l.ref}
                  </td>
                  <td className="px-3 py-2">
                    <p className="max-w-[240px] font-medium leading-snug text-ink">{l.produto}</p>
                    {delta !== 0 && (
                      <p className="num mt-0.5 text-[10.5px] font-semibold text-cea-blue">
                        {delta > 0 ? '+' : '−'}
                        {formatNum(Math.abs(delta))} pç vs Original
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-[12px] text-slate-600">{l.categoria}</td>
                  <td className="px-3 py-2">
                    <span className="text-[11.5px] leading-snug text-muted">{l.papel}</span>
                  </td>
                  <td className="px-3 py-2 text-[12px] text-slate-600">{l.cor}</td>
                  <td className="num px-3 py-2 text-right" title={l.fontePreco}>
                    {formatBRL(l.pc)}
                  </td>
                  <td className="num px-3 py-2 text-right" title={l.fontePreco}>
                    {formatBRL(l.pv)}
                  </td>
                  <td className="num px-3 py-2 text-right">{formatPct(l.margem)}</td>
                  <td className="px-3 py-2 text-right">
                    {editavel ? (
                      <Stepper
                        valor={l.qtd}
                        onChange={(v) => alterarQtd(l.id, v)}
                        step={passoDaLinha(l.qtd)}
                        min={0}
                        rotulo={`Quantidade de ${l.produto}`}
                      />
                    ) : (
                      <span className="num">{formatNum(qtd)}</span>
                    )}
                  </td>
                  <td className="num px-3 py-2 text-right font-semibold text-cea-deep">
                    {formatBRL(qtd * l.pc, 0)}
                  </td>
                  {editavel && (
                    <td className="px-3 py-2 text-right">
                      <Button
                        tamanho="sm"
                        variante="fantasma"
                        onClick={() => removerLinha(l.id, 'Removida na lista de compras')}
                        aria-label={`Remover ${l.produto}`}
                        title="Remover linha do plano"
                      >
                        ✕
                      </Button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line bg-slate-50 font-semibold text-cea-deep">
              <td className="px-3 py-2.5 text-[12px] uppercase tracking-wide" colSpan={7}>
                Total do plano
              </td>
              <td className="num px-3 py-2.5 text-right">{formatBRL(totais.pcMedio)}</td>
              <td className="num px-3 py-2.5 text-right">{formatBRL(totais.pvMedio)}</td>
              <td className="num px-3 py-2.5 text-right">{formatPct(totais.margem)}</td>
              <td className="num px-3 py-2.5 text-right">{formatNum(totais.pecas)}</td>
              <td className="num px-3 py-2.5 text-right">{formatBRL(totais.investimento, 0)}</td>
              {editavel && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="border-t border-line px-3 py-2 text-[11px] text-slate-400">
        PC e PV planejados: passe o mouse na célula para ver a origem do preço. As oito primeiras
        linhas são referências reais do catálogo; o passo do stepper é 1% da quantidade da linha.
      </p>
    </SectionCard>
  )
}
