import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/ui/KpiCard'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { StatusChip } from '@/components/ui/StatusChip'
import { Tabs } from '@/components/ui/Tabs'
import { ProductImage } from '@/components/ui/ProductImage'
import { useToast } from '@/components/ui/Toast'
import {
  ARVORE_CADASTRO,
  CARDS_CLUSTER,
  CLIMAS_LOJA,
  HIERARQUIA_CORES,
  PAPEIS_COLECAO,
  PASSOS_CADASTRO,
  PENDENCIAS_CADASTRO,
  PIRAMIDE_PRECO,
  PORTES_LOJA,
  PRECO_MEDIO_PIRAMIDE,
  REDE,
  SCORE_CADASTRO,
  SESSOES_GABARITO,
  type NoCadastro,
} from '@/data/derived'
import { cea } from '@/lib/cea'
import { formatBRL, formatNum, formatPct } from '@/lib/format'

const ABAS = [
  { id: 'setor', rotulo: 'Cadastro de Setor' },
  { id: 'qualidade', rotulo: 'Qualidade de Cadastro' },
  { id: 'lojas', rotulo: 'Cadastro de Lojas' },
  { id: 'piramide', rotulo: 'Pirâmide' },
]

type Rascunho = {
  departamento: string
  categoria: string
  nome: string
  cor: string
  sessao: string
  papel: string
  faixa: string
}

const RASCUNHO_VAZIO: Rascunho = {
  departamento: ARVORE_CADASTRO[0].id,
  categoria: ARVORE_CADASTRO[0].filhos[0].nome,
  nome: '',
  cor: HIERARQUIA_CORES[0].nome,
  sessao: SESSOES_GABARITO[0],
  papel: PAPEIS_COLECAO[0],
  faixa: PIRAMIDE_PRECO[1].id,
}

export default function CadastroPage() {
  const { push } = useToast()
  const [aba, setAba] = useState('setor')
  const [aberto, setAberto] = useState<string[]>(['feminino'])
  const [wizard, setWizard] = useState(false)
  const [passo, setPasso] = useState(1)
  const [rascunho, setRascunho] = useState<Rascunho>(RASCUNHO_VAZIO)
  /** cadastros criados nesta sessão, por departamento */
  const [novos, setNovos] = useState<Record<string, { nome: string; detalhe?: string }[]>>({})

  const departamento = ARVORE_CADASTRO.find((n) => n.id === rascunho.departamento)!
  const podeAvancar = passo < 3 ? (passo === 1 ? rascunho.nome.trim().length > 2 : true) : true
  const totalNovos = Object.values(novos).reduce((a, v) => a + v.length, 0)

  function concluir() {
    setNovos((n) => ({
      ...n,
      [rascunho.departamento]: [
        ...(n[rascunho.departamento] ?? []),
        { nome: rascunho.nome.trim(), detalhe: `${rascunho.categoria} · ${rascunho.papel}` },
      ],
    }))
    setAberto((a) => (a.includes(rascunho.departamento) ? a : [...a, rascunho.departamento]))
    setWizard(false)
    setPasso(1)
    push(
      'Cadastro criado',
      'ok',
      `${rascunho.nome.trim()} entrou em ${departamento.nome} › ${rascunho.categoria}, grade ${rascunho.sessao}, faixa ${rascunho.faixa}.`,
    )
    setRascunho(RASCUNHO_VAZIO)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Cadastro de Produtos"
        subtitulo={`Hierarquia mercadológica real da C&A · ${formatNum(ARVORE_CADASTRO.length)} ramos, ${formatNum(ARVORE_CADASTRO.reduce((a, n) => a + n.filhos.length, 0))} categorias e ${formatNum(HIERARQUIA_CORES.length)} cores de cartela`}
        meta={
          <>
            <StatusChip tom={SCORE_CADASTRO >= 90 ? 'ok' : 'warn'}>
              Qualidade {formatPct(SCORE_CADASTRO, 0)}
            </StatusChip>
            <StatusChip tom="warn">
              {formatNum(PENDENCIAS_CADASTRO.length)} pendência(s)
            </StatusChip>
            {totalNovos > 0 && (
              <StatusChip tom="ok">{formatNum(totalNovos)} cadastro(s) nesta sessão</StatusChip>
            )}
          </>
        }
        acoes={
          <Button
            variante="primario"
            onClick={() => {
              setWizard(true)
              setPasso(1)
            }}
          >
            + Novo cadastro
          </Button>
        }
      />

      <Tabs abas={ABAS} ativa={aba} onTrocar={setAba} />

      {/* ================================================ cadastro de setor */}
      {aba === 'setor' && (
        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <SectionCard
            titulo="Árvore mercadológica"
            subtitulo={cea.arvoreMercadologica.hierarquiaN1N7_paraOApp}
            compacto
          >
            <ul className="divide-y divide-line">
              {ARVORE_CADASTRO.map((no) => (
                <RamoCadastro
                  key={no.id}
                  no={no}
                  aberto={aberto.includes(no.id)}
                  novos={novos[no.id] ?? []}
                  onToggle={() =>
                    setAberto((a) =>
                      a.includes(no.id) ? a.filter((x) => x !== no.id) : [...a, no.id],
                    )
                  }
                />
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            titulo="Hierarquia de cores"
            subtitulo={`Cartela real de ${formatNum(HIERARQUIA_CORES.length)} cores — o N7 da árvore é a variante de cor`}
          >
            <ul className="space-y-1.5">
              {HIERARQUIA_CORES.map((c) => (
                <li key={c.nome} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="h-6 w-9 shrink-0 rounded border border-line"
                    style={{ background: c.hex }}
                  />
                  <span className="flex-1 text-[12.5px] capitalize text-ink">{c.nome}</span>
                  <span className="num text-[11px] text-muted">{c.hex}</span>
                  <span
                    className="num w-14 text-right text-[11px] text-slate-400"
                    title={`${c.produtos} produto(s) do catálogo usam esta cor`}
                  >
                    {formatNum(c.produtos)} pç
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-snug text-slate-400">
              Cores vêm da cartela real coletada no site. O hex é o tom aproximado usado no
              placeholder de foto quando o conector não responde.
            </p>
          </SectionCard>
        </div>
      )}

      {/* ============================================ qualidade de cadastro */}
      {aba === 'qualidade' && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Score de qualidade"
              valor={formatPct(SCORE_CADASTRO, 0)}
              sub="campos obrigatórios preenchidos"
              tomSub="alta"
              dica="Percentual de campos obrigatórios preenchidos no cadastro dos SKUs ativos."
            />
            <KpiCard
              label="Pendências abertas"
              valor={formatNum(PENDENCIAS_CADASTRO.length)}
              sub={`${formatNum(PENDENCIAS_CADASTRO.filter((p) => p.severidade === 'Crítica').length)} crítica(s)`}
              tomSub="alerta"
              dica="Referências com campo obrigatório vazio que travam alguma etapa do processo."
            />
            <KpiCard
              label="Ramos da árvore"
              valor={formatNum(ARVORE_CADASTRO.length)}
              sub={`${formatNum(ARVORE_CADASTRO.reduce((a, n) => a + n.filhos.length, 0))} categorias`}
              tomSub="neutra"
              dica="Departamentos e linhas cadastrados na hierarquia mercadológica."
            />
            <KpiCard
              label="Cores na cartela"
              valor={formatNum(HIERARQUIA_CORES.length)}
              sub="variantes possíveis no N7"
              tomSub="neutra"
              dica="Cartela de cores real usada como último nível da hierarquia."
            />
          </div>

          <SectionCard
            titulo="Pendências de cadastro"
            subtitulo="Cada linha aponta uma referência real cujo campo citado está vazio no catálogo"
            compacto
          >
            <div className="scroll-x">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-slate-50/80 text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-3 py-2 text-left">Severidade</th>
                    <th className="px-3 py-2 text-left">Ref</th>
                    <th className="px-3 py-2 text-left">Produto</th>
                    <th className="px-3 py-2 text-left">Campo vazio</th>
                    <th className="px-3 py-2 text-left">O que trava</th>
                  </tr>
                </thead>
                <tbody>
                  {PENDENCIAS_CADASTRO.map((p) => (
                    <tr
                      key={p.cod}
                      className="border-b border-line/70 odd:bg-white even:bg-slate-50/50 hover:bg-cea-soft"
                    >
                      <td className="px-3 py-2">
                        <StatusChip
                          tom={
                            p.severidade === 'Crítica'
                              ? 'crit'
                              : p.severidade === 'Alta'
                                ? 'warn'
                                : 'neutro'
                          }
                        >
                          {p.severidade}
                        </StatusChip>
                      </td>
                      <td className="num px-3 py-2 text-[12px] font-semibold text-slate-500">
                        {p.cod}
                      </td>
                      <td className="max-w-[280px] px-3 py-2 font-medium leading-snug text-ink">
                        {p.produto}
                      </td>
                      <td className="px-3 py-2">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-cea-deep">
                          {p.campo}
                        </code>
                      </td>
                      <td className="max-w-[380px] px-3 py-2 text-[12px] leading-snug text-slate-600">
                        {p.impacto}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <Banner tom="info" titulo="Como este score é medido">
            O score é a qualidade do cadastro no ERP, que o snapshot do site não consegue medir — o
            que falta aqui falta porque a coleta não trouxe, não porque a C&A não cadastrou. As três
            pendências acima, essas sim, são verificáveis: cada uma aponta uma referência real cujo
            campo citado está mesmo ausente no catálogo coletado.
          </Banner>
        </div>
      )}

      {/* ============================================== cadastro de lojas */}
      {aba === 'lojas' && (
        <div className="space-y-5">
          <SectionCard
            titulo="Padrão de cadastro de loja"
            subtitulo="Os campos que toda loja precisa ter para entrar na clusterização e na distribuição"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <BlocoCampo
                titulo="Cluster"
                itens={REDE.clusters.map((c) => `${c.id} — ${c.nome}`)}
                nota="Define sortimento, gabarito de grade e profundidade de markdown."
              />
              <BlocoCampo
                titulo="Porte"
                itens={[...PORTES_LOJA]}
                nota="Entra no peso de alocação: loja GG recebe mais packs que loja P."
              />
              <BlocoCampo
                titulo="Clima"
                itens={[...CLIMAS_LOJA]}
                nota="Bloqueia peça de verão em loja de clima frio na distribuição."
              />
              <BlocoCampo
                titulo="Centro de distribuição"
                itens={[...REDE.cds]}
                nota="Define a janela de reposição e o prazo de entrega da OC."
              />
            </div>
          </SectionCard>

          <SectionCard
            titulo="Malha atual"
            subtitulo={`${formatNum(REDE.totalLojas)} lojas distribuídas nos ${formatNum(REDE.clusters.length)} clusters`}
            acoes={
              <Link
                to="/lojas"
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-cea-blue px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-cea-deep"
              >
                Cadastrar loja <span aria-hidden>→</span>
              </Link>
            }
            compacto
          >
            <div className="scroll-x">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-slate-50/80 text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-3 py-2 text-left">Cluster</th>
                    <th className="px-3 py-2 text-left">Perfil</th>
                    <th className="px-3 py-2 text-right">Lojas</th>
                    <th className="px-3 py-2 text-right">Ticket médio</th>
                    <th className="px-3 py-2 text-right">Conversão</th>
                    <th className="px-3 py-2 text-right">% do faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {CARDS_CLUSTER.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-line/70 odd:bg-white even:bg-slate-50/50 hover:bg-cea-soft"
                    >
                      <td className="px-3 py-2">
                        <StatusChip tom="neutro">{c.id}</StatusChip>
                      </td>
                      <td className="px-3 py-2 font-medium text-ink">{c.nome}</td>
                      <td className="num px-3 py-2 text-right font-semibold">
                        {formatNum(c.lojas)}
                      </td>
                      <td className="num px-3 py-2 text-right">{formatBRL(c.ticketMedio)}</td>
                      <td className="num px-3 py-2 text-right">{formatPct(c.conversao)}</td>
                      <td className="num px-3 py-2 text-right">
                        {formatPct(c.partFaturamento, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-line bg-slate-50 font-semibold text-cea-deep">
                    <td className="px-3 py-2.5 text-[12px] uppercase tracking-wide" colSpan={2}>
                      Rede
                    </td>
                    <td className="num px-3 py-2.5 text-right">{formatNum(REDE.totalLojas)}</td>
                    <td colSpan={2} />
                    <td className="num px-3 py-2.5 text-right">
                      {formatPct(
                        CARDS_CLUSTER.reduce((a, c) => a + c.partFaturamento, 0),
                        0,
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ====================================================== pirâmide */}
      {aba === 'piramide' && (
        <SectionCard
          titulo="Pirâmide de preço — P1 a P5"
          subtitulo="Espelho da faixa cadastrada nos Habilitadores; aqui é somente leitura"
          tag={<StatusChip tom="neutro">read-only</StatusChip>}
          acoes={
            <Link
              to="/habilitadores"
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-cea-blue hover:bg-slate-50"
            >
              Editar nos Habilitadores <span aria-hidden>→</span>
            </Link>
          }
          compacto
        >
          <div className="scroll-x">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line bg-slate-50/80 text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 text-left">Faixa</th>
                  <th className="px-3 py-2 text-left">Perfil</th>
                  <th className="px-3 py-2 text-right">De</th>
                  <th className="px-3 py-2 text-right">Até</th>
                  <th className="px-3 py-2 text-right">Preço de referência</th>
                  <th className="px-3 py-2 text-left">Participação</th>
                  <th className="px-3 py-2 text-right">Margem</th>
                </tr>
              </thead>
              <tbody>
                {PIRAMIDE_PRECO.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-line/70 odd:bg-white even:bg-slate-50/50 hover:bg-cea-soft"
                  >
                    <td className="px-3 py-2">
                      <StatusChip tom="neutro">{f.id}</StatusChip>
                    </td>
                    <td className="px-3 py-2 font-medium text-ink">{f.rotulo}</td>
                    <td className="num px-3 py-2 text-right text-muted">{formatBRL(f.min, 0)}</td>
                    <td className="num px-3 py-2 text-right text-muted">{formatBRL(f.max, 0)}</td>
                    <td className="num px-3 py-2 text-right font-semibold">
                      {formatBRL(f.precoRef, 0)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(f.participacao / 30) * 100}%`,
                              background: 'var(--viz-azul)',
                            }}
                          />
                        </div>
                        <span className="num text-[11.5px] text-muted">
                          {formatPct(f.participacao, 0)}
                        </span>
                      </div>
                    </td>
                    <td className="num px-3 py-2 text-right">{formatPct(f.margem, 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-line bg-slate-50 font-semibold text-cea-deep">
                  <td className="px-3 py-2.5 text-[12px] uppercase tracking-wide" colSpan={4}>
                    Preço médio ponderado
                  </td>
                  <td className="num px-3 py-2.5 text-right">
                    {formatBRL(PRECO_MEDIO_PIRAMIDE, 0)}
                  </td>
                  <td className="num px-3 py-2.5">
                    {formatPct(
                      PIRAMIDE_PRECO.reduce((a, f) => a + f.participacao, 0),
                      0,
                    )}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="border-t border-line px-3 py-2 text-[11px] text-slate-400">
            Faixas observadas no catálogo real de vestidos — é a mesma pirâmide que o Mapa da
            Coleção usa para classificar cada peça.
          </p>
        </SectionCard>
      )}

      {/* ------------------------------------------------------- wizard -- */}
      <Modal
        aberto={wizard}
        onFechar={() => setWizard(false)}
        titulo={`Novo cadastro — passo ${passo} de ${PASSOS_CADASTRO.length}`}
        subtitulo={PASSOS_CADASTRO[passo - 1].nota}
        largura="md"
        rodape={
          <>
            <Button onClick={() => (passo === 1 ? setWizard(false) : setPasso(passo - 1))}>
              {passo === 1 ? 'Cancelar' : 'Voltar'}
            </Button>
            <Button
              variante="primario"
              disabled={!podeAvancar}
              onClick={() => (passo === PASSOS_CADASTRO.length ? concluir() : setPasso(passo + 1))}
            >
              {passo === PASSOS_CADASTRO.length ? 'Concluir cadastro' : 'Avançar'}
            </Button>
          </>
        }
      >
        <ol className="mb-4 flex gap-1.5">
          {PASSOS_CADASTRO.map((p) => (
            <li key={p.id} className="flex-1">
              <div
                className={`rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold ${
                  p.id === passo
                    ? 'border-cea-blue bg-cea-blue text-white'
                    : p.id < passo
                      ? 'border-[#A7E8D0] bg-[var(--ok-soft)] text-[#0A7355]'
                      : 'border-line bg-white text-slate-400'
                }`}
              >
                {p.id < passo ? '✓' : p.id}. {p.nome}
              </div>
            </li>
          ))}
        </ol>

        {passo === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <CampoSelect
              rotulo="Departamento"
              valor={rascunho.departamento}
              opcoes={ARVORE_CADASTRO.map((n) => ({ v: n.id, r: n.nome }))}
              onChange={(v) =>
                setRascunho({
                  ...rascunho,
                  departamento: v,
                  categoria: ARVORE_CADASTRO.find((n) => n.id === v)!.filhos[0].nome,
                })
              }
            />
            <CampoSelect
              rotulo="Categoria"
              valor={rascunho.categoria}
              opcoes={departamento.filhos.map((f) => ({ v: f.nome, r: f.nome }))}
              onChange={(v) => setRascunho({ ...rascunho, categoria: v })}
            />
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Nome do produto
              </span>
              <input
                value={rascunho.nome}
                placeholder="Vestido midi de linho decote quadrado"
                onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })}
                className="focus-ring w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12.5px] text-ink"
              />
            </label>
            <CampoSelect
              rotulo="Cor da variante (N7)"
              valor={rascunho.cor}
              opcoes={HIERARQUIA_CORES.map((c) => ({ v: c.nome, r: c.nome }))}
              onChange={(v) => setRascunho({ ...rascunho, cor: v })}
              className="sm:col-span-2"
            />
          </div>
        )}

        {passo === 2 && (
          <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
            {/* prévia da peça: a cor escolhida no passo 1 já aparece aqui */}
            <div>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Prévia
              </span>
              <ProductImage
                nome={rascunho.nome || 'Peça sem nome'}
                categoria={rascunho.categoria}
                cor={rascunho.cor}
                tamanho="card"
                rotulo
              />
            </div>
            <div className="space-y-3">
              <CampoSelect
                rotulo="Sessão de grade"
                valor={rascunho.sessao}
                opcoes={SESSOES_GABARITO.map((s) => ({ v: s, r: s }))}
                onChange={(v) => setRascunho({ ...rascunho, sessao: v })}
              />
              <Banner tom="info">
                A sessão define a curva de tamanhos e o gabarito de packs por porte de loja. É o que
                a tela de Grade usa depois para abrir a quantidade do line tamanho a tamanho.
              </Banner>
            </div>
          </div>
        )}

        {passo === 3 && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <CampoSelect
                rotulo="Papel na coleção (N5)"
                valor={rascunho.papel}
                opcoes={PAPEIS_COLECAO.map((p) => ({ v: p, r: p }))}
                onChange={(v) => setRascunho({ ...rascunho, papel: v })}
              />
              <CampoSelect
                rotulo="Faixa de preço"
                valor={rascunho.faixa}
                opcoes={PIRAMIDE_PRECO.map((f) => ({
                  v: f.id,
                  r: `${f.id} — ${f.rotulo} (${formatBRL(f.min, 0)}–${formatBRL(f.max, 0)})`,
                }))}
                onChange={(v) => setRascunho({ ...rascunho, faixa: v })}
              />
            </div>
            <div className="rounded-lg border border-[#C7D4F0] bg-cea-soft p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-cea-deep">
                Resumo do cadastro
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-slate-700">
                <strong>{rascunho.nome || '(sem nome)'}</strong> entra em {departamento.nome} ›{' '}
                {rascunho.categoria}, na cor {rascunho.cor}, com grade de {rascunho.sessao}, papel{' '}
                {rascunho.papel} e faixa {rascunho.faixa} (preço de referência{' '}
                {formatBRL(PIRAMIDE_PRECO.find((f) => f.id === rascunho.faixa)!.precoRef, 0)}).
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ------------------------------------------------------------ auxiliares -- */

function RamoCadastro({
  no,
  aberto,
  novos,
  onToggle,
}: {
  no: NoCadastro
  aberto: boolean
  novos: { nome: string; detalhe?: string }[]
  onToggle: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberto}
        className="focus-ring flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-cea-soft"
      >
        <span aria-hidden className="text-[10px] text-cea-blue">
          {aberto ? '▾' : '▸'}
        </span>
        <span className="flex-1 text-[13px] font-semibold text-cea-deep">{no.nome}</span>
        {novos.length > 0 && <StatusChip tom="ok">+{formatNum(novos.length)}</StatusChip>}
        <span className="num text-[11px] text-muted">
          {formatNum(no.filhos.length + novos.length)} categorias
        </span>
      </button>

      {aberto && (
        <div className="space-y-3 border-t border-line bg-slate-50/50 px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {[...no.filhos, ...novos].map((f, i) => (
              <span
                key={`${f.nome}-${i}`}
                title={f.detalhe}
                className={`rounded-md border px-2 py-1 text-[11.5px] ${
                  i >= no.filhos.length
                    ? 'border-[#A7E8D0] bg-[var(--ok-soft)] font-semibold text-[#0A7355]'
                    : 'border-line bg-white text-slate-600'
                }`}
              >
                {f.nome}
              </span>
            ))}
          </div>

          {no.atributos?.map((a) => (
            <div key={a.grupo}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {a.grupo}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {a.termos.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-white px-1.5 py-0.5 text-[11px] text-slate-500 ring-1 ring-line"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {no.nota && (
            <p className="border-t border-line pt-2 text-[11.5px] leading-snug text-slate-500">
              {no.nota}
            </p>
          )}
        </div>
      )}
    </li>
  )
}

function BlocoCampo({
  titulo,
  itens,
  nota,
}: {
  titulo: string
  itens: string[]
  nota: string
}) {
  return (
    <div className="rounded-lg border border-line bg-slate-50/60 p-3.5">
      <p className="text-[12.5px] font-semibold text-cea-deep">{titulo}</p>
      <ul className="mt-1.5 space-y-0.5">
        {itens.map((i) => (
          <li key={i} className="text-[11.5px] text-slate-600">
            · {i}
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t border-line pt-2 text-[11px] leading-snug text-slate-400">
        {nota}
      </p>
    </div>
  )
}

function CampoSelect({
  rotulo,
  valor,
  opcoes,
  onChange,
  className = '',
}: {
  rotulo: string
  valor: string
  opcoes: { v: string; r: string }[]
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
        {rotulo}
      </span>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-ink"
      >
        {opcoes.map((o) => (
          <option key={o.v} value={o.v}>
            {o.r}
          </option>
        ))}
      </select>
    </label>
  )
}
