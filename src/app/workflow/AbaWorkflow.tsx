import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { StatusChip } from '@/components/ui/StatusChip'
import { useToast } from '@/components/ui/Toast'
import { iniciaisPessoa } from '@/lib/cea'
import { formatDataCurta, plural, segundaDaSemanaISO } from '@/lib/format'
import { Icone } from '@/components/ui/Icone'
import {
  AREAS,
  COLECAO,
  ENTREGAS_WORKFLOW,
  ETAPAS_WORKFLOW,
  RESPONSAVEIS,
  type Area,
  type Entrega,
  type StatusEtapa,
} from '@/data/derived'

const COR_AREA: Record<Area, string> = {
  Estilo: 'bg-[#F3E8FF] text-[#6B21A8] border-[#E3D0F8]',
  Planejamento: 'bg-cea-soft text-cea-blue border-[#C7D4F0]',
  Compras: 'bg-[var(--ok-soft)] text-[#0A7355] border-[#A7E8D0]',
  Importação: 'bg-[var(--warn-soft)] text-[#A15C00] border-[#F6D8A0]',
}

const ESTILO_COLUNA: Record<StatusEtapa, string> = {
  concluida: 'border-t-ok',
  atual: 'border-t-cea-blue',
  pendente: 'border-t-slate-300',
}

const SEMANAS_SELECIONAVEIS = [18, 19, 20, 21, 22, 23, 24]

export function AbaWorkflow() {
  const { push } = useToast()
  const [responsavel, setResponsavel] = useState('todos')
  const [semana, setSemana] = useState<number>(COLECAO.semanaWorkflow)
  const [extras, setExtras] = useState<Entrega[]>([])
  const [modalAberto, setModalAberto] = useState(false)

  // formulário da nova entrega
  const [titulo, setTitulo] = useState('')
  const [areaNova, setAreaNova] = useState<Area>('Compras')
  const [responsavelNovo, setResponsavelNovo] = useState(RESPONSAVEIS[0].nome)
  const [etapaNova, setEtapaNova] = useState(ETAPAS_WORKFLOW[4].numero)

  const todas = useMemo(() => [...ENTREGAS_WORKFLOW, ...extras], [extras])

  const visiveis = useMemo(
    () => (responsavel === 'todos' ? todas : todas.filter((e) => e.responsavel === responsavel)),
    [todas, responsavel],
  )

  const responsaveisComEntrega = useMemo(() => {
    const nomes = new Set(todas.map((e) => e.responsavel))
    return RESPONSAVEIS.filter((r) => nomes.has(r.nome))
  }, [todas])

  /** Entrega atrasada = prazo antes da semana de referência e etapa não concluída. */
  function atrasada(e: Entrega): boolean {
    const etapa = ETAPAS_WORKFLOW.find((x) => x.numero === e.etapa)
    return e.semana < semana && etapa?.status !== 'concluida'
  }

  const totalAtrasadas = visiveis.filter(atrasada).length
  const etapaAtual = ETAPAS_WORKFLOW.find((e) => e.status === 'atual')!

  function criarEntrega() {
    const limpo = titulo.trim()
    if (!limpo) {
      push('Dê um nome para a entrega', 'warn')
      return
    }
    const nova: Entrega = {
      id: `N${extras.length + 1}`,
      etapa: etapaNova,
      titulo: limpo,
      responsavel: responsavelNovo,
      area: areaNova,
      semana,
      comentarios: 0,
      anexos: 0,
      refs: [],
    }
    setExtras((atual) => [...atual, nova])
    setModalAberto(false)
    setTitulo('')
    push(
      'Entrega criada',
      'ok',
      `"${limpo}" entrou em ${ETAPAS_WORKFLOW.find((x) => x.numero === etapaNova)?.nome} · demo em memória.`,
    )
  }

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------- controles --- */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[12px] font-semibold text-muted">
            <span className="mb-1 block uppercase tracking-wide">Responsável</span>
            <Select
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              className="min-w-[220px] font-medium"
            >
              <option value="todos">Todos ({todas.length})</option>
              {responsaveisComEntrega.map((r) => (
                <option key={r.nome} value={r.nome}>
                  {r.nome} — {r.area}
                </option>
              ))}
            </Select>
          </label>

          <label className="text-[12px] font-semibold text-muted">
            <span className="mb-1 block uppercase tracking-wide">Semana de referência</span>
            <Select
              value={semana}
              onChange={(e) => {
                setSemana(Number(e.target.value))
                push(`Semana ${e.target.value}`, 'info', 'Os prazos foram recalculados.')
              }}
              className="font-medium"
            >
              {SEMANAS_SELECIONAVEIS.map((s) => (
                <option key={s} value={s}>
                  Semana {s} · {formatDataCurta(segundaDaSemanaISO(s))}
                </option>
              ))}
            </Select>
          </label>

          {totalAtrasadas > 0 && (
            <StatusChip tom="warn" ponto className="mb-1.5">
              {plural(totalAtrasadas, 'entrega')} com prazo vencido
            </StatusChip>
          )}
        </div>

        <Button variante="primario" icone={<Icone nome="mais" tamanho={15} />} onClick={() => setModalAberto(true)}>
          Nova Entrega
        </Button>
      </div>

      {/* ---------------------------------------------------------- kanban --- */}
      <div className="scroll-x pb-2">
        {/* items-start: cada coluna tem a altura do seu conteúdo — a distribuição
            de entregas é muito desigual e colunas esticadas ficariam ocas. */}
        <div className="flex min-w-max items-start gap-3">
          {ETAPAS_WORKFLOW.map((etapa) => {
            const cards = visiveis.filter((e) => e.etapa === etapa.numero)
            return (
              <section
                key={etapa.numero}
                className={`flex w-[248px] shrink-0 flex-col rounded-card border border-line border-t-[3px] bg-slate-50/60 ${ESTILO_COLUNA[etapa.status]}`}
              >
                <header className="border-b border-line px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400">
                      {String(etapa.numero).padStart(2, '0')}
                    </span>
                    {etapa.status === 'concluida' && (
                      <span aria-label="concluída" className="text-[11px] font-bold text-ok">
                        ✓
                      </span>
                    )}
                    {etapa.status === 'atual' && (
                      <span className="text-[10px] font-bold uppercase text-cea-blue">← atual</span>
                    )}
                  </div>
                  <h3
                    className={`mt-0.5 text-[12.5px] font-semibold leading-tight ${
                      etapa.status === 'atual' ? 'uppercase text-cea-blue' : 'text-ink'
                    }`}
                  >
                    {etapa.nome}
                  </h3>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
                    {plural(cards.length, 'entrega')}
                  </p>
                </header>

                <div className="flex min-h-[80px] flex-col gap-2 p-2">
                  {cards.map((e) => (
                    <article
                      key={e.id}
                      className="rounded-lg border border-line bg-card p-2.5 shadow-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${COR_AREA[e.area]}`}
                        >
                          {e.area}
                        </span>
                        {atrasada(e) && (
                          <span
                            title={`Prazo na semana ${e.semana}`}
                            className="text-[9.5px] font-bold uppercase text-warn"
                          >
                            atrasada
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 text-[12.5px] font-medium leading-snug text-ink">
                        {e.titulo}
                      </p>

                      {e.refs.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {e.refs.map((r) => (
                            <span
                              key={r}
                              className="num rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}

                      <footer className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2">
                        <span
                          title={e.responsavel}
                          className="grid h-6 w-6 place-items-center rounded-full bg-cea-blue text-[9.5px] font-bold text-white"
                        >
                          {iniciaisPessoa(e.responsavel)}
                        </span>
                        <div className="flex items-center gap-2 text-[10.5px] text-muted">
                          {e.comentarios > 0 && (
                            <span title={`${e.comentarios} comentários`}>💬 {e.comentarios}</span>
                          )}
                          {e.anexos > 0 && <span title={`${e.anexos} anexos`}>📎 {e.anexos}</span>}
                          <span className="num" title={`Semana ${e.semana}`}>
                            {formatDataCurta(segundaDaSemanaISO(e.semana))}
                          </span>
                        </div>
                      </footer>
                    </article>
                  ))}

                  {cards.length === 0 && (
                    <p className="px-1 py-3 text-center text-[11px] text-slate-400">
                      Sem entregas nesta etapa
                    </p>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        Etapa atual: <strong className="text-slate-500">{etapaAtual.nome}</strong> · pessoas
        fictícias, referências de produto reais.
      </p>

      {/* ---------------------------------------------- modal nova entrega --- */}
      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo="Nova entrega"
        subtitulo={`${COLECAO.rotulo} · o card entra no quadro em memória (demo)`}
        rodape={
          <>
            <Button onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button variante="primario" onClick={criarEntrega}>
              Criar entrega
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-[12px] font-semibold text-muted">
            <span className="mb-1 block uppercase tracking-wide">O que precisa ser entregue</span>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Definir profundidade da cápsula de festa"
              className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-[13px] font-normal text-ink placeholder:text-slate-400"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-[12px] font-semibold text-muted">
              <span className="mb-1 block uppercase tracking-wide">Etapa</span>
              <Select
                value={etapaNova}
                onChange={(e) => setEtapaNova(Number(e.target.value))}
                className="w-full font-normal"
              >
                {ETAPAS_WORKFLOW.map((e) => (
                  <option key={e.numero} value={e.numero}>
                    {String(e.numero).padStart(2, '0')} · {e.nome}
                  </option>
                ))}
              </Select>
            </label>

            <label className="block text-[12px] font-semibold text-muted">
              <span className="mb-1 block uppercase tracking-wide">Área</span>
              <Select
                value={areaNova}
                onChange={(e) => setAreaNova(e.target.value as Area)}
                className="w-full font-normal"
              >
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </label>

            <label className="block text-[12px] font-semibold text-muted">
              <span className="mb-1 block uppercase tracking-wide">Responsável</span>
              <Select
                value={responsavelNovo}
                onChange={(e) => setResponsavelNovo(e.target.value)}
                className="w-full font-normal"
              >
                {RESPONSAVEIS.map((r) => (
                  <option key={r.nome} value={r.nome}>
                    {r.nome}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <p className="text-[12px] text-muted">
            Prazo na semana {semana} ({formatDataCurta(segundaDaSemanaISO(semana))}), a semana de
            referência selecionada no quadro.
          </p>
        </div>
      </Modal>
    </div>
  )
}
