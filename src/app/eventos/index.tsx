import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Icone } from '@/components/ui/Icone'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/ui/KpiCard'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { Modal } from '@/components/ui/Modal'
import { InputNumero } from '@/components/ui/InputNumero'
import { useToast } from '@/components/ui/Toast'
import { usePlano } from '@/app/PlanoProvider'
import {
  COLECAO,
  EVENTOS_CICLOS,
  ITENS_NEED,
  RESUMO_EVENTOS,
  type EventoCiclo,
  type TipoEvento,
} from '@/data/derived'
import { formatBRLCompact, formatNum, formatPct, plural } from '@/lib/format'

const TIPOS: TipoEvento[] = ['EVENTO', 'COMERCIAL', 'CÁPSULA', 'CICLO', 'VITRINE']

const TOM_TIPO: Record<TipoEvento, 'warn' | 'info' | 'violeta' | 'ok' | 'neutro'> = {
  EVENTO: 'warn',
  COMERCIAL: 'info',
  'CÁPSULA': 'violeta',
  CICLO: 'ok',
  VITRINE: 'neutro',
}

export default function EventosPage() {
  const { push } = useToast()
  const { decidir, decisoes } = usePlano()
  const [eventos, setEventos] = useState<EventoCiclo[]>(EVENTOS_CICLOS)
  const [needs, setNeeds] = useState(ITENS_NEED)
  const [selecionado, setSelecionado] = useState<string>(EVENTOS_CICLOS[0].id)

  const [modalNovo, setModalNovo] = useState(false)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoEvento>('EVENTO')
  const [verba, setVerba] = useState(0)
  const [janela, setJanela] = useState('')

  const [modalDorsal, setModalDorsal] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')

  const resumo = useMemo(
    () => ({
      verba: eventos.reduce((a, e) => a + e.verba, 0),
      ativos: eventos.filter((e) => e.ativo).length,
      total: eventos.length,
      emVitrine: eventos.filter((e) => e.emVitrine).length,
    }),
    [eventos],
  )

  function alternarAtivo(id: string) {
    const ev = eventos.find((e) => e.id === id)
    if (!ev) return
    setEventos((atual) => atual.map((e) => (e.id === id ? { ...e, ativo: !e.ativo } : e)))
    decidir({
      tipo: 'evento',
      titulo: `${ev.nome} ${ev.ativo ? 'desativado' : 'ativado'}`,
      detalhe: `${ev.tipo} · janela ${ev.janela}`,
      eventoId: id,
    })
    push(
      `${ev.nome} ${ev.ativo ? 'desativado' : 'ativado'}`,
      ev.ativo ? 'warn' : 'ok',
      ev.ativo ? 'Sai do plano da temporada.' : 'Volta a consumir verba estratégica.',
    )
  }

  function criarEvento() {
    const limpo = nome.trim()
    if (!limpo) {
      push('Dê um nome ao evento', 'warn')
      return
    }
    const novo: EventoCiclo = {
      id: `EV${eventos.length + 1}`,
      nome: limpo,
      tipo,
      ativo: true,
      verba,
      janela: janela.trim() || 'A definir',
      emVitrine: tipo === 'VITRINE',
      nota: 'Criado nesta sessão.',
    }
    setEventos((atual) => [...atual, novo])
    setModalNovo(false)
    setNome('')
    setVerba(0)
    setJanela('')
    decidir({
      tipo: 'evento',
      titulo: `Evento criado: ${limpo}`,
      detalhe: `${tipo} · verba ${formatBRLCompact(verba, 2)} · janela ${novo.janela}`,
      eventoId: novo.id,
    })
    push('Evento criado', 'ok', `${limpo} entra como ${tipo} ativo.`)
  }

  function tornarDorsal() {
    const item = needs.find((n) => n.id === modalDorsal)
    if (!item) return
    const nota = motivo.trim()
    if (!nota) {
      push('Explique o motivo', 'warn', 'Virar dorsal muda a reposição da temporada inteira.')
      return
    }
    const ev = eventos.find((e) => e.id === item.eventoId)
    setNeeds((atual) => atual.filter((n) => n.id !== item.id))
    decidir({
      tipo: 'evento',
      titulo: `${item.produto} passou de Need para Dorsal`,
      detalhe: `${formatNum(item.pecas)} peças · originado em ${ev?.nome ?? 'evento'} · ${nota}`,
      eventoId: item.eventoId,
    })
    setModalDorsal(null)
    setMotivo('')
    push(
      'Agora é dorsal',
      'ok',
      `${item.produto} entra na reposição contínua · ${formatNum(item.pecas)} pç.`,
    )
  }

  const eventoSelecionado = eventos.find((e) => e.id === selecionado)

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Eventos & Ciclos"
        subtitulo={`${COLECAO.rotulo} · calendário comercial, cápsulas licenciadas e ciclos de tendência`}
        acoes={
          <Button variante="primario" icone={<Icone nome="mais" tamanho={15} />} onClick={() => setModalNovo(true)}>
            Novo evento
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Verba estratégica"
          valor={formatBRLCompact(resumo.verba, 2)}
          sub="reservada para eventos"
          tomSub="neutra"
          dica="Verba separada do dorsal para bancar inclusões de evento, cápsula e ciclo."
        />
        <KpiCard
          label="Eventos ativos"
          valor={`${formatNum(resumo.ativos)} / ${formatNum(resumo.total)}`}
          sub={`${resumo.total - resumo.ativos} fora da temporada`}
          tomSub="neutra"
          dica="Somente eventos ativos consomem verba e entram no plano da coleção."
        />
        <KpiCard
          label="Em vitrine"
          valor={formatNum(resumo.emVitrine)}
          sub="eventos com peça na mesa de entrada"
          tomSub="neutra"
          dica="Evento em vitrine ocupa espaço nobre de loja e concorre com a coleção base."
        />
        <KpiCard
          label="Mix Need → Dorsal"
          valor={formatPct(RESUMO_EVENTOS.mixNeedParaDorsal, 0)}
          sub={`${needs.length} itens ainda em Need`}
          tomSub="neutra"
          dica="Quanto do que entrou como necessidade pontual virou reposição contínua na temporada."
        />
      </div>

      {/* ------------------------------------------------ grid de eventos -- */}
      <SectionCard
        titulo="Eventos e ciclos da temporada"
        subtitulo="Clique num card para selecioná-lo; o botão de status ativa ou desativa"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {eventos.map((e) => {
            const ativoNoCard = e.id === selecionado
            return (
              <div
                key={e.id}
                className={`flex h-full flex-col rounded-lg border p-3.5 transition ${
                  ativoNoCard ? 'border-cea-blue shadow-pop' : 'border-line'
                } ${e.ativo ? 'bg-card' : 'bg-slate-50 opacity-70'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelecionado(e.id)}
                    className="focus-ring min-w-0 flex-1 rounded text-left"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusChip tom={TOM_TIPO[e.tipo]}>{e.tipo}</StatusChip>
                      {e.emVitrine && <StatusChip tom="neutro">vitrine</StatusChip>}
                      {!e.ativo && <StatusChip tom="neutro">inativo</StatusChip>}
                    </div>
                    <p className="mt-1.5 font-display text-[14px] font-semibold leading-tight text-cea-deep">
                      {e.nome}
                    </p>
                    <p className="num mt-0.5 text-[11px] text-muted">{e.janela}</p>
                  </button>
                  {e.verba > 0 && (
                    <span className="num shrink-0 text-[12px] font-semibold text-warn">
                      {formatBRLCompact(e.verba, 2)}
                    </span>
                  )}
                </div>
                <p className="mb-2.5 mt-2 text-[11.5px] leading-snug text-slate-600">{e.nota}</p>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2">
                  {e.ref && (
                    <span className="num text-[11px] font-semibold text-slate-400">{e.ref}</span>
                  )}
                  <Button
                    tamanho="sm"
                    variante={e.ativo ? 'fantasma' : 'secundario'}
                    onClick={() => alternarAtivo(e.id)}
                    className="ml-auto"
                  >
                    {e.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </SectionCard>

      {/* -------------------------------------------------- Need / NID ---- */}
      <SectionCard
        titulo="Need / NID em avaliação"
        subtitulo="Itens que entraram por necessidade pontual e estão girando como dorsal"
        tag={<StatusChip tom={needs.length ? 'info' : 'ok'}>{needs.length} em avaliação</StatusChip>}
      >
        {needs.length === 0 ? (
          <p className="rounded-lg border border-[#A7E8D0] bg-[var(--ok-soft)] p-4 text-[12.5px] leading-snug text-slate-600">
            Todos os itens avaliados viraram dorsal nesta sessão. As decisões estão no histórico
            abaixo e na Retroalimentação.
          </p>
        ) : (
          <ul className="space-y-2">
            {needs.map((n) => {
              const ev = eventos.find((e) => e.id === n.eventoId)
              return (
                <li
                  key={n.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-slate-50/60 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {ev && <StatusChip tom={TOM_TIPO[ev.tipo]}>{ev.nome}</StatusChip>}
                      {n.ref && (
                        <span className="num text-[11px] font-semibold text-slate-400">
                          {n.ref}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12.5px] font-medium leading-snug text-ink">
                      {n.produto}
                    </p>
                    <p className="text-[11.5px] leading-snug text-muted">{n.motivoNeed}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="num text-[12px] text-muted">{formatNum(n.pecas)} pç</span>
                    <Button tamanho="sm" onClick={() => setModalDorsal(n.id)}>
                      Tornar Dorsal
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </SectionCard>

      {/* ----------------------------------------------- histórico ---- */}
      <SectionCard
        titulo="Histórico de decisões"
        subtitulo="Ativações, criações e migrações Need → Dorsal desta sessão"
        tag={
          <StatusChip tom="neutro">
            {decisoes.length === 0 ? 'Nenhum registro' : plural(decisoes.length, 'registro')}
          </StatusChip>
        }
      >
        {decisoes.length === 0 ? (
          <p className="rounded-lg border border-line bg-slate-50/60 p-4 text-[12.5px] leading-snug text-slate-600">
            Nenhuma decisão nesta sessão. Ative um evento ou promova um item de Need para Dorsal.
          </p>
        ) : (
          <ol className="space-y-2.5">
            {decisoes.map((d) => {
              const ev = eventos.find((e) => e.id === d.eventoId)
              return (
                <li key={d.id} className="border-b border-line/70 pb-2.5 last:border-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip tom={d.tipo === 'evento' ? 'warn' : 'info'}>{d.tipo}</StatusChip>
                    {ev && <span className="text-[11px] text-muted">{ev.nome}</span>}
                    <p className="text-[12.5px] font-medium text-ink">{d.titulo}</p>
                  </div>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{d.detalhe}</p>
                  <p className="num mt-0.5 text-[11px] text-slate-400">
                    {d.autor} · {d.quando.toLocaleTimeString('pt-BR')}
                  </p>
                </li>
              )
            })}
          </ol>
        )}
      </SectionCard>

      {/* -------------------------------------------- modal novo evento --- */}
      <Modal
        aberto={modalNovo}
        onFechar={() => setModalNovo(false)}
        titulo="Novo evento ou ciclo"
        subtitulo="Entra ativo e passa a concorrer pela verba estratégica"
        rodape={
          <>
            <Button onClick={() => setModalNovo(false)}>Cancelar</Button>
            <Button variante="primario" onClick={criarEvento}>
              Criar evento
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-[12px] font-semibold text-muted">
            <span className="mb-1 block uppercase tracking-wide">Nome</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Cápsula Festas Junho"
              className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-[13px] font-normal text-ink placeholder:text-slate-400"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-[12px] font-semibold text-muted">
              <span className="mb-1 block uppercase tracking-wide">Tipo</span>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoEvento)}
                className="focus-ring w-full rounded-lg border border-line bg-white px-2.5 py-2 text-[13px] font-normal text-ink"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] font-semibold text-muted">
              <span className="mb-1 block uppercase tracking-wide">Verba</span>
              <InputNumero
                valor={verba}
                onChange={setVerba}
                min={0}
                step={10_000}
                sufixo="R$"
                largura="120px"
                rotulo="Verba do evento"
              />
            </label>
            <label className="block text-[12px] font-semibold text-muted">
              <span className="mb-1 block uppercase tracking-wide">Janela</span>
              <input
                value={janela}
                onChange={(e) => setJanela(e.target.value)}
                placeholder="Ex.: Jun/2026"
                className="focus-ring w-full rounded-lg border border-line px-2.5 py-2 text-[13px] font-normal text-ink placeholder:text-slate-400"
              />
            </label>
          </div>
        </div>
      </Modal>

      {/* ------------------------------------------- modal tornar dorsal -- */}
      <Modal
        aberto={modalDorsal !== null}
        onFechar={() => {
          setModalDorsal(null)
          setMotivo('')
        }}
        titulo="Tornar dorsal"
        subtitulo={
          needs.find((n) => n.id === modalDorsal)?.produto ??
          'O item passa a ser reposto continuamente'
        }
        rodape={
          <>
            <Button
              onClick={() => {
                setModalDorsal(null)
                setMotivo('')
              }}
            >
              Cancelar
            </Button>
            <Button variante="primario" onClick={tornarDorsal}>
              Confirmar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="rounded-lg border border-[#F6D8A0] bg-[var(--warn-soft)] p-3 text-[12.5px] leading-snug text-slate-600">
            Virar dorsal tira o item da janela do evento e o coloca na reposição contínua da
            temporada. Isso muda grade, distribuição e cobertura — por isso o motivo é obrigatório.
          </p>
          <label className="block text-[12px] font-semibold text-muted">
            <span className="mb-1 block uppercase tracking-wide">Motivo da decisão</span>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Ex.: sell-through de 71% em três semanas fora da janela do evento"
              className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-[13px] font-normal text-ink placeholder:text-slate-400"
            />
          </label>
          {eventoSelecionado && (
            <p className="text-[11.5px] text-muted">
              A decisão fica vinculada ao evento de origem do item.
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
