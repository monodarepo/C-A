import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Icone } from '@/components/ui/Icone'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/ui/KpiCard'
import { Banner } from '@/components/ui/Banner'
import { ProductImage } from '@/components/ui/ProductImage'
import { EmptyGate } from '@/components/ui/EmptyGate'
import { StatusChip } from '@/components/ui/StatusChip'
import { Tabs } from '@/components/ui/Tabs'
import { Select } from '@/components/ui/Select'
import { Barra } from '@/components/ui/Barra'
import { usePlano } from '@/app/PlanoProvider'
import {
  CASOS_CLIMA_FORA_DO_RECORTE,
  COLECAO,
  DISTRIBUICAO,
  DISTRIBUICAO_CELULAS,
  LOJAS_DISTRIBUICAO,
  LOJA_PADRAO_DISTRIBUICAO,
  RESUMO_ABAS_DISTRIBUICAO,
  REDE,
  TEMPLATES_GRADE,
  TOTAIS_DISTRIBUICAO,
  lojaPorNome,
} from '@/data/derived'
import { formatNum, formatPct, plural } from '@/lib/format'

const ABAS = [
  { id: 'loja', rotulo: 'Por loja' },
  { id: 'cluster', rotulo: 'Por cluster' },
  { id: 'pack', rotulo: 'Por pack' },
  { id: 'sessao', rotulo: 'Por sessão' },
  { id: 'coerencia', rotulo: 'Coerência' },
  { id: 'clima', rotulo: 'Quentes × Frias' },
  { id: 'lacunas', rotulo: 'Lacunas' },
]

export default function DistribuicaoPage() {
  const navigate = useNavigate()
  const { lineCarregado } = usePlano()
  const [aba, setAba] = useState('loja')
  const [lojaId, setLojaId] = useState(
    lojaPorNome(LOJA_PADRAO_DISTRIBUICAO)?.id ?? LOJAS_DISTRIBUICAO[0].id,
  )

  const loja = LOJAS_DISTRIBUICAO.find((l) => l.id === lojaId) ?? LOJAS_DISTRIBUICAO[0]
  const celulasDaLoja = useMemo(
    () => DISTRIBUICAO_CELULAS.filter((c) => c.lojaId === lojaId),
    [lojaId],
  )

  const porCluster = useMemo(() => {
    const mapa = new Map<string, { lojas: Set<string>; packs: number; pecas: number; lacunas: number }>()
    for (const c of DISTRIBUICAO_CELULAS) {
      const l = LOJAS_DISTRIBUICAO.find((x) => x.id === c.lojaId)!
      const atual = mapa.get(l.cluster) ?? { lojas: new Set(), packs: 0, pecas: 0, lacunas: 0 }
      atual.lojas.add(l.id)
      atual.packs += c.packs
      atual.pecas += c.pecas
      if (c.packs === 0) atual.lacunas += 1
      mapa.set(l.cluster, atual)
    }
    return [...mapa.entries()]
      .map(([cluster, v]) => ({
        cluster,
        lojas: v.lojas.size,
        packs: v.packs,
        pecas: v.pecas,
        lacunas: v.lacunas,
      }))
      .sort((a, b) => b.pecas - a.pecas)
  }, [])

  const porPack = useMemo(
    () =>
      TEMPLATES_GRADE.map((t) => {
        const celulas = DISTRIBUICAO_CELULAS.filter((c) => c.templateId === t.id)
        return {
          template: t,
          skus: new Set(celulas.map((c) => c.linhaId)).size,
          packs: celulas.reduce((a, c) => a + c.packs, 0),
          pecas: celulas.reduce((a, c) => a + c.pecas, 0),
        }
      }).filter((x) => x.skus > 0),
    [],
  )

  const porSessao = useMemo(() => {
    const mapa = new Map<string, { skus: Set<string>; packs: number; pecas: number }>()
    for (const c of DISTRIBUICAO_CELULAS) {
      const atual = mapa.get(c.categoria) ?? { skus: new Set(), packs: 0, pecas: 0 }
      atual.skus.add(c.linhaId)
      atual.packs += c.packs
      atual.pecas += c.pecas
      mapa.set(c.categoria, atual)
    }
    return [...mapa.entries()]
      .map(([categoria, v]) => ({ categoria, skus: v.skus.size, packs: v.packs, pecas: v.pecas }))
      .sort((a, b) => b.pecas - a.pecas)
  }, [])

  const lacunas = useMemo(() => DISTRIBUICAO_CELULAS.filter((c) => c.packs === 0), [])

  const climaQuenteVsFria = useMemo(() => {
    const grupos = [
      { rotulo: 'Clima quente', climas: ['Quente', 'Híbrida Quente'] },
      { rotulo: 'Clima frio', climas: ['Fria', 'Híbrida Fria'] },
    ]
    return grupos.map((g) => {
      const lojas = LOJAS_DISTRIBUICAO.filter((l) => g.climas.includes(l.clima))
      const celulas = DISTRIBUICAO_CELULAS.filter((c) => lojas.some((l) => l.id === c.lojaId))
      const pecas = celulas.reduce((a, c) => a + c.pecas, 0)
      return {
        ...g,
        lojas: lojas.length,
        pecas,
        pecasPorLoja: lojas.length ? Math.round(pecas / lojas.length) : 0,
        lacunas: celulas.filter((c) => c.packs === 0).length,
      }
    })
  }, [])

  if (!lineCarregado) {
    return (
      <div className="space-y-5">
        <PageHeader
          titulo="Distribuição por Loja"
          subtitulo={`${COLECAO.rotulo} · snapshot da alocação: packs, coerência de clima e lacunas`}
        />
        <EmptyGate
          icone={<Icone nome="distribuicao" tamanho={22} />}
          titulo="Distribuição ainda não calculada"
          texto="A alocação é feita sobre a quantidade que entrou em pedido. Sem line devolvido não existe carga para distribuir."
          nota="A cadeia é Line → Grade → Emissão → Distribuição"
          cta={{ rotulo: 'Ir para o Line', icone: <Icone nome="seta" tamanho={15} />, onClick: () => navigate('/line') }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Distribuição por Loja"
        subtitulo={`${COLECAO.rotulo} · ${formatNum(DISTRIBUICAO.lojas)} lojas do recorte · ${formatNum(DISTRIBUICAO.skus)} SKUs`}
        meta={
          <>
            <StatusChip tom="neutro">Somente leitura</StatusChip>
            <StatusChip tom={TOTAIS_DISTRIBUICAO.lacunas > 0 ? 'warn' : 'ok'}>
              {plural(TOTAIS_DISTRIBUICAO.lacunas, 'lacuna')}
            </StatusChip>
          </>
        }
      />

      <Banner tom="info" titulo="Camada de leitura">
        A alocação é executada no sistema corporativo. Esta tela é o snapshot do resultado: mostra
        onde cada pack foi, onde a regra de clima bloqueou e o que ficou sem cobertura. Alterar
        quantidade continua sendo no Plano de Sortimento.
      </Banner>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Lojas"
          valor={formatNum(TOTAIS_DISTRIBUICAO.lojas)}
          sub={`de ${formatNum(REDE.totalLojas)} na rede`}
          tomSub="neutra"
          dica="Recorte de lojas desta onda de distribuição — as de maior faturamento da rede."
        />
        <KpiCard
          label="SKUs"
          valor={formatNum(TOTAIS_DISTRIBUICAO.skus)}
          sub="do plano aprovado"
          tomSub="neutra"
          dica="Cada linha do plano vira um SKU distribuível depois da grade."
        />
        <KpiCard
          label="Peças alocadas"
          valor={formatNum(TOTAIS_DISTRIBUICAO.pecas)}
          sub="nesta onda"
          tomSub="neutra"
          dica="Total de peças que saem do CD para as lojas do recorte."
        />
        <KpiCard
          label="Packs"
          valor={formatNum(TOTAIS_DISTRIBUICAO.packs)}
          sub={`${formatNum(TOTAIS_DISTRIBUICAO.pecas / TOTAIS_DISTRIBUICAO.packs, 2)} peças por pack`}
          tomSub="neutra"
          dica="A loja recebe packs fechados, nunca peça solta — o pack é o múltiplo da grade."
        />
        <KpiCard
          label="Aderência IA"
          valor={formatPct(TOTAIS_DISTRIBUICAO.aderenciaIA, 0)}
          sub="sugestão mantida"
          tomSub="alta"
          dica="Quanto da alocação sugerida pelo modelo foi mantida sem ajuste manual."
        />
        <KpiCard
          label="Lacunas"
          valor={formatNum(TOTAIS_DISTRIBUICAO.lacunas)}
          sub="células sem alocação"
          tomSub={TOTAIS_DISTRIBUICAO.lacunas > 0 ? 'alerta' : 'alta'}
          dica="Combinação loja × SKU que ficou sem pack. Toda lacuna precisa de justificativa."
        />
      </div>

      <SectionCard compacto>
        <Tabs abas={ABAS} ativa={aba} onTrocar={setAba} />

        <div className="p-4">
          {/* ---------------------------------------------------- por loja -- */}
          {aba === 'loja' && (
            <>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <span className="mb-1 block">Loja</span>
                  <Select
                    value={lojaId}
                    onChange={(e) => setLojaId(e.target.value)}
                    className="min-w-[260px] font-normal normal-case tracking-normal"
                  >
                    {LOJAS_DISTRIBUICAO.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome} — Cluster {l.cluster} · Clima {l.clima}
                      </option>
                    ))}
                  </Select>
                </label>
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
                  <StatusChip tom="info">Cluster {loja.cluster}</StatusChip>
                  <StatusChip tom="neutro">Clima {loja.clima}</StatusChip>
                  <span className="num">
                    {formatNum(celulasDaLoja.reduce((a, c) => a + c.pecas, 0))} peças ·{' '}
                    {formatNum(celulasDaLoja.reduce((a, c) => a + c.packs, 0))} packs
                  </span>
                </div>
              </div>

              <div className="scroll-x">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                      <th className="px-3 py-2 text-left">Ref</th>
                      <th className="px-3 py-2 text-left">Produto</th>
                      <th className="px-3 py-2 text-left">Sessão</th>
                      <th className="px-3 py-2 text-left">Cor</th>
                      <th className="px-3 py-2 text-left">Clima do SKU</th>
                      <th className="px-3 py-2 text-right">Packs</th>
                      <th className="px-3 py-2 text-right">Peças</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {celulasDaLoja.map((c) => (
                      <tr
                        key={c.linhaId}
                        className={`border-b border-line/70 ${
                          c.bloqueado ? 'bg-[var(--warn-soft)]' : 'odd:bg-white even:bg-slate-50/50'
                        }`}
                      >
                        <td className="num px-3 py-2 text-[12px] font-semibold text-slate-500">
                          {c.ref}
                        </td>
                        <td className="max-w-[220px] px-3 py-2">
                          <div className="flex items-center gap-2">
                            <ProductImage
                              cod={c.ref}
                              nome={c.produto}
                              categoria={c.categoria}
                              cor={c.cor}
                              lado={34}
                            />
                            <span className="font-medium leading-snug text-ink">{c.produto}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[12px] text-slate-600">{c.categoria}</td>
                        <td className="px-3 py-2 text-[12px] text-slate-600">{c.cor}</td>
                        <td className="px-3 py-2">
                          <StatusChip
                            tom={c.climaSku === 'Quente' ? 'warn' : 'neutro'}
                          >
                            {c.climaSku}
                          </StatusChip>
                        </td>
                        <td className="num px-3 py-2 text-right">{formatNum(c.packs)}</td>
                        <td className="num px-3 py-2 text-right font-semibold text-cea-deep">
                          {formatNum(c.pecas)}
                        </td>
                        <td className="px-3 py-2">
                          {c.bloqueado ? (
                            <span
                              title={`SKU de clima ${c.climaSku} não vai para loja de clima ${loja.clima}`}
                              className="text-[11.5px] font-bold uppercase text-warn"
                            >
                              ⚠ Bloqueio clima
                            </span>
                          ) : (
                            <span className="text-[11.5px] font-bold uppercase text-ok">
                              ✓ Distribuído
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ------------------------------------------------- por cluster -- */}
          {aba === 'cluster' && (
            <div className="scroll-x">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-2 text-left">Cluster</th>
                    <th className="px-3 py-2 text-right">Lojas</th>
                    <th className="px-3 py-2 text-right">Packs</th>
                    <th className="px-3 py-2 text-right">Peças</th>
                    <th className="px-3 py-2 text-right">Peças por loja</th>
                    <th className="px-3 py-2 text-right">Lacunas</th>
                    <th className="px-3 py-2 text-left" style={{ width: '25%' }}>
                      Participação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {porCluster.map((c) => (
                    <tr key={c.cluster} className="border-b border-line/70 odd:bg-white even:bg-slate-50/50">
                      <td className="px-3 py-2 font-semibold text-ink">
                        Cluster {c.cluster}
                        <span className="ml-1.5 text-[11px] font-normal text-muted">
                          {REDE.clusters.find((x) => x.id === c.cluster)?.nome}
                        </span>
                      </td>
                      <td className="num px-3 py-2 text-right">{formatNum(c.lojas)}</td>
                      <td className="num px-3 py-2 text-right">{formatNum(c.packs)}</td>
                      <td className="num px-3 py-2 text-right font-semibold">
                        {formatNum(c.pecas)}
                      </td>
                      <td className="num px-3 py-2 text-right text-muted">
                        {formatNum(Math.round(c.pecas / c.lojas))}
                      </td>
                      <td
                        className={`num px-3 py-2 text-right ${c.lacunas ? 'font-semibold text-warn' : 'text-slate-400'}`}
                      >
                        {c.lacunas || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <Barra
                          valor={c.pecas}
                          max={TOTAIS_DISTRIBUICAO.pecas}
                          rotulo={formatPct((c.pecas / TOTAIS_DISTRIBUICAO.pecas) * 100, 0)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ---------------------------------------------------- por pack -- */}
          {aba === 'pack' && (
            <div className="scroll-x">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-2 text-left">Template de grade</th>
                    <th className="px-3 py-2 text-left">Tamanhos</th>
                    <th className="px-3 py-2 text-right">Peças por pack</th>
                    <th className="px-3 py-2 text-right">SKUs</th>
                    <th className="px-3 py-2 text-right">Packs</th>
                    <th className="px-3 py-2 text-right">Peças</th>
                  </tr>
                </thead>
                <tbody>
                  {porPack.map((p) => (
                    <tr
                      key={p.template.id}
                      className="border-b border-line/70 odd:bg-white even:bg-slate-50/50"
                    >
                      <td className="px-3 py-2 font-semibold text-ink">{p.template.nome}</td>
                      <td className="px-3 py-2 text-[12px] text-slate-600">
                        {p.template.tamanhos.join(' · ')}
                      </td>
                      <td className="num px-3 py-2 text-right">{p.template.pecasPorPack}</td>
                      <td className="num px-3 py-2 text-right">{formatNum(p.skus)}</td>
                      <td className="num px-3 py-2 text-right">{formatNum(p.packs)}</td>
                      <td className="num px-3 py-2 text-right font-semibold">
                        {formatNum(p.pecas)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-line bg-slate-50 font-semibold text-cea-deep">
                    <td className="px-3 py-2.5 text-[12px] uppercase tracking-wide" colSpan={4}>
                      Total
                    </td>
                    <td className="num px-3 py-2.5 text-right">
                      {formatNum(TOTAIS_DISTRIBUICAO.packs)}
                    </td>
                    <td className="num px-3 py-2.5 text-right">
                      {formatNum(TOTAIS_DISTRIBUICAO.pecas)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* -------------------------------------------------- por sessão -- */}
          {aba === 'sessao' && (
            <div className="scroll-x">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-2 text-left">Sessão</th>
                    <th className="px-3 py-2 text-right">SKUs</th>
                    <th className="px-3 py-2 text-right">Packs</th>
                    <th className="px-3 py-2 text-right">Peças</th>
                    <th className="px-3 py-2 text-left" style={{ width: '30%' }}>
                      Participação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {porSessao.map((s) => (
                    <tr
                      key={s.categoria}
                      className="border-b border-line/70 odd:bg-white even:bg-slate-50/50"
                    >
                      <td className="px-3 py-2 font-semibold text-ink">{s.categoria}</td>
                      <td className="num px-3 py-2 text-right">{formatNum(s.skus)}</td>
                      <td className="num px-3 py-2 text-right">{formatNum(s.packs)}</td>
                      <td className="num px-3 py-2 text-right font-semibold">
                        {formatNum(s.pecas)}
                      </td>
                      <td className="px-3 py-2">
                        <Barra
                          valor={s.pecas}
                          max={TOTAIS_DISTRIBUICAO.pecas}
                          rotulo={formatPct((s.pecas / TOTAIS_DISTRIBUICAO.pecas) * 100, 0)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ------------------------------------------------- coerência -- */}
          {aba === 'coerencia' && (
            <div className="space-y-4">
              <p className="text-[13px] leading-relaxed text-slate-600">
                {RESUMO_ABAS_DISTRIBUICAO.find((r) => r.aba === 'Coerência')?.texto}
              </p>
              <div className="rounded-lg border border-line bg-slate-50/60 p-3.5">
                <p className="text-[12.5px] font-semibold text-cea-deep">Regra ativa</p>
                <p className="mt-1 text-[12.5px] leading-snug text-slate-600">
                  SKU de clima <strong>Quente</strong> não é distribuído em loja de clima{' '}
                  <strong>Fria</strong> nem <strong>Híbrida Fria</strong>. Hoje isso bloqueia{' '}
                  {plural(TOTAIS_DISTRIBUICAO.lacunas, 'célula')} — as lojas de clima frio do recorte.
                </p>
              </div>
              <div>
                <p className="mb-2 text-[12.5px] font-semibold text-ink">
                  Casos conhecidos fora deste recorte de {formatNum(DISTRIBUICAO.skus)} SKUs
                </p>
                <ul className="space-y-2">
                  {CASOS_CLIMA_FORA_DO_RECORTE.map((c) => (
                    <li
                      key={c.produto}
                      className="flex items-start justify-between gap-3 rounded-lg border border-line p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-ink">{c.produto}</p>
                        <p className="text-[11.5px] text-muted">{c.nota}</p>
                      </div>
                      <StatusChip tom="warn">{c.clima}</StatusChip>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* --------------------------------------------- quentes × frias -- */}
          {aba === 'clima' && (
            <div className="space-y-4">
              <p className="text-[13px] leading-relaxed text-slate-600">
                {RESUMO_ABAS_DISTRIBUICAO.find((r) => r.aba === 'Quentes × Frias')?.texto}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {climaQuenteVsFria.map((g) => (
                  <div key={g.rotulo} className="rounded-lg border border-line bg-slate-50/60 p-3.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[12.5px] font-semibold text-cea-deep">{g.rotulo}</p>
                      <span className="num text-[11px] text-muted">{plural(g.lojas, 'loja')}</span>
                    </div>
                    <p className="num mt-1.5 font-display text-[19px] font-semibold text-cea-deep">
                      {formatNum(g.pecasPorLoja)}
                    </p>
                    <p className="text-[11px] text-muted">peças por loja</p>
                    <p className="num mt-2 border-t border-line pt-2 text-[11.5px] text-muted">
                      {formatNum(g.pecas)} peças no total ·{' '}
                      <span className={g.lacunas ? 'font-semibold text-warn' : ''}>
                        {plural(g.lacunas, 'lacuna')}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- lacunas -- */}
          {aba === 'lacunas' && (
            <div className="space-y-3">
              <p className="text-[13px] leading-relaxed text-slate-600">
                {RESUMO_ABAS_DISTRIBUICAO.find((r) => r.aba === 'Lacunas')?.texto}
              </p>
              <div className="scroll-x">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-line bg-slate-50/50 text-[10.5px] uppercase tracking-wider text-slate-400">
                      <th className="px-3 py-2 text-left">Loja</th>
                      <th className="px-3 py-2 text-left">Cluster · clima</th>
                      <th className="px-3 py-2 text-left">Ref</th>
                      <th className="px-3 py-2 text-left">Produto</th>
                      <th className="px-3 py-2 text-left">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lacunas.map((c) => {
                      const l = LOJAS_DISTRIBUICAO.find((x) => x.id === c.lojaId)!
                      return (
                        <tr
                          key={`${c.lojaId}-${c.linhaId}`}
                          className="border-b border-line/70 odd:bg-white even:bg-slate-50/50"
                        >
                          <td className="px-3 py-2 font-medium text-ink">{l.nome}</td>
                          <td className="px-3 py-2 text-[12px] text-slate-600">
                            {l.cluster} · {l.clima}
                          </td>
                          <td className="num px-3 py-2 text-[12px] font-semibold text-slate-500">
                            {c.ref}
                          </td>
                          <td className="max-w-[220px] px-3 py-2 leading-snug text-slate-600">
                            {c.produto}
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-[11.5px] font-bold uppercase text-warn">
                              ⚠ Bloqueio clima
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <p className="text-[11.5px] text-slate-400">
        Templates de grade em uso: {TEMPLATES_GRADE.map((t) => `${t.nome} (pack ${t.pecasPorPack})`).join(' · ')}. O pack é
        o múltiplo que a loja recebe — a distribuição nunca quebra pack.
      </p>
    </div>
  )
}
