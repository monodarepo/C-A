import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  LINHAS_LINE,
  LINHAS_PLANO,
  OCS_DO_LINE,
  PLANNER,
  PLANO,
  posicaoNaBanda,
  totaisPlano,
  type LinhaPlano,
  type PosicaoBanda,
  type TotaisPlano,
} from '@/data/derived'

/**
 * Estado vivo do Plano de Sortimento, compartilhado entre /plano, /versoes e
 * /retroalimentacao. Mudar uma quantidade no plano precisa aparecer como delta
 * no /versoes e como registro no histórico — por isso o estado mora aqui, e não
 * dentro de uma tela.
 */

export type VersaoAtiva = 'original' | 'qualificado'

/**
 * Decisões que não são mudança de quantidade: mover card de zona no Mapa,
 * transformar Need em Dorsal, compensar verba. Vivem no mesmo provider porque
 * a Retroalimentação mostra as três coisas juntas.
 */
export type Decisao = {
  id: string
  tipo: 'mapa' | 'evento' | 'compensacao'
  titulo: string
  detalhe: string
  autor: string
  quando: Date
  /** evento vinculado, quando houver */
  eventoId?: string
}

export type RegistroHistorico = {
  id: string
  linhaId: string
  ref: string
  produto: string
  campo: string
  de: number
  para: number
  autor: string
  quando: Date
  nota?: string
}

type Ctx = {
  linhas: LinhaPlano[]
  versao: VersaoAtiva
  setVersao: (v: VersaoAtiva) => void
  /** totais da versão exibida */
  totais: TotaisPlano
  totaisQualificado: TotaisPlano
  totaisOriginal: TotaisPlano
  banda: PosicaoBanda
  historico: RegistroHistorico[]
  decisoes: Decisao[]
  /** porteira da cadeia de compras: grade, emissão e distribuição dependem dela */
  lineCarregado: boolean
  carregarLine: () => void
  /** decisão por item do line: Aceitar ou Renegociar */
  decisoesLine: Record<string, 'Aceitar' | 'Renegociar'>
  decidirLine: (id: string, decisao: 'Aceitar' | 'Renegociar') => void
  ocsEmitidas: boolean
  emitirOCs: () => void
  aprovados: string[]
  alterarQtd: (id: string, qtd: number, nota?: string) => void
  incluirLinha: (linha: LinhaPlano) => void
  removerLinha: (id: string, nota?: string) => void
  restaurar: () => void
  /** reescala as quantidades para o investimento cair no alvo do OTB */
  recalcular: () => { antes: number; depois: number }
  aprovar: (chave: string) => void
  aprovarTodos: (chaves: string[]) => void
  registrar: (r: Omit<RegistroHistorico, 'id' | 'autor' | 'quando'>) => void
  decidir: (d: Omit<Decisao, 'id' | 'autor' | 'quando'>) => void
}

const PlanoCtx = createContext<Ctx | null>(null)

export function PlanoProvider({ children }: { children: ReactNode }) {
  const [linhas, setLinhas] = useState<LinhaPlano[]>(LINHAS_PLANO)
  const [versao, setVersao] = useState<VersaoAtiva>('qualificado')
  const [historico, setHistorico] = useState<RegistroHistorico[]>([])
  const [decisoes, setDecisoes] = useState<Decisao[]>([])
  const [lineCarregado, setLineCarregado] = useState(false)
  const [decisoesLine, setDecisoesLine] = useState<Record<string, 'Aceitar' | 'Renegociar'>>({})
  const [ocsEmitidas, setOcsEmitidas] = useState(false)
  const [aprovados, setAprovados] = useState<string[]>([])

  /**
   * Contador de registros por referência, não por tamanho da lista: dois
   * registros no mesmo lote de renderização não podem receber o mesmo id.
   */
  const proximoId = useRef(1)

  const registrar = useCallback((r: Omit<RegistroHistorico, 'id' | 'autor' | 'quando'>) => {
    const registro: RegistroHistorico = {
      ...r,
      id: `H${proximoId.current++}`,
      autor: PLANNER.nome,
      quando: new Date(),
    }
    setHistorico((atual) => [registro, ...atual])
  }, [])

  const decidir = useCallback((d: Omit<Decisao, 'id' | 'autor' | 'quando'>) => {
    const decisao: Decisao = {
      ...d,
      id: `D${proximoId.current++}`,
      autor: PLANNER.nome,
      quando: new Date(),
    }
    setDecisoes((atual) => [decisao, ...atual])
  }, [])

  /* Os três mutadores abaixo leem `linhas` do escopo e só então chamam
     setLinhas com um updater PURO. Registrar o histórico dentro do updater
     duplicava entradas — o React reexecuta updaters (StrictMode e renders
     concorrentes), e efeito colateral ali dentro roda mais de uma vez. */

  const alterarQtd = useCallback(
    (id: string, qtd: number, nota?: string) => {
      const linha = linhas.find((l) => l.id === id)
      if (!linha || linha.qtd === qtd) return
      setLinhas((atual) => atual.map((l) => (l.id === id ? { ...l, qtd } : l)))
      registrar({
        linhaId: id,
        ref: linha.ref,
        produto: linha.produto,
        campo: 'Quantidade',
        de: linha.qtd,
        para: qtd,
        nota,
      })
    },
    [linhas, registrar],
  )

  const incluirLinha = useCallback(
    (linha: LinhaPlano) => {
      setLinhas((atual) => [...atual, linha])
      registrar({
        linhaId: linha.id,
        ref: linha.ref,
        produto: linha.produto,
        campo: 'Linha incluída',
        de: 0,
        para: linha.qtd,
        nota: `${linha.categoria} · ${linha.papel}`,
      })
    },
    [registrar],
  )

  const removerLinha = useCallback(
    (id: string, nota?: string) => {
      const linha = linhas.find((l) => l.id === id)
      if (!linha) return
      setLinhas((atual) => atual.filter((l) => l.id !== id))
      registrar({
        linhaId: id,
        ref: linha.ref,
        produto: linha.produto,
        campo: 'Linha removida',
        de: linha.qtd,
        para: 0,
        nota,
      })
    },
    [linhas, registrar],
  )

  const restaurar = useCallback(() => {
    setLinhas(LINHAS_PLANO)
    setHistorico([])
    setDecisoes([])
    setAprovados([])
    setLineCarregado(false)
    setDecisoesLine({})
    setOcsEmitidas(false)
    proximoId.current = 1
  }, [])

  /**
   * "Recalcular plano": reescala as quantidades proporcionalmente para o
   * investimento cair no alvo do OTB. Não é enfeite — é a saída para o estouro.
   */
  const recalcular = useCallback(() => {
    const antes = totaisPlano(linhas).investimento
    const fator = PLANO.otbRecorte / antes
    const novas = linhas.map((l) => ({ ...l, qtd: Math.round(l.qtd * fator) }))
    const depois = totaisPlano(novas).investimento
    setLinhas(novas)
    registrar({
      linhaId: '—',
      ref: '—',
      produto: 'Plano inteiro',
      campo: 'Recálculo proporcional',
      de: Math.round(antes),
      para: Math.round(depois),
      nota: `Quantidades reescaladas em ${((fator - 1) * 100).toFixed(1)}% para caber no OTB do recorte`,
    })
    return { antes, depois }
  }, [linhas, registrar])

  const carregarLine = useCallback(() => {
    setLineCarregado(true)
    setDecisoesLine(
      Object.fromEntries(LINHAS_LINE.map((l) => [l.id, l.decisao])) as Record<
        string,
        'Aceitar' | 'Renegociar'
      >,
    )
    decidir({
      tipo: 'evento',
      titulo: 'Line devolvido carregado',
      detalhe: `${LINHAS_LINE.length} itens com preço negociado e quantidade confirmada pelos fornecedores.`,
    })
  }, [decidir])

  const decidirLine = useCallback(
    (id: string, decisao: 'Aceitar' | 'Renegociar') => {
      setDecisoesLine((atual) => ({ ...atual, [id]: decisao }))
      const item = LINHAS_LINE.find((l) => l.id === id)
      if (item) {
        decidir({
          tipo: 'evento',
          titulo: `${item.ref} · ${decisao}`,
          detalhe: `${item.produto} · ${item.fornecedor} · desvio de preço ${item.deltaPct > 0 ? '+' : ''}${item.deltaPct}%.`,
        })
      }
    },
    [decidir],
  )

  const emitirOCs = useCallback(() => {
    setOcsEmitidas(true)
    decidir({
      tipo: 'evento',
      titulo: `${OCS_DO_LINE.length} ordens de compra emitidas`,
      detalhe: `Integradas ao ERP · ${OCS_DO_LINE.reduce((a, o) => a + o.pecas, 0).toLocaleString('pt-BR')} peças.`,
    })
  }, [decidir])

  const aprovar = useCallback((chave: string) => {
    setAprovados((atual) => (atual.includes(chave) ? atual : [...atual, chave]))
  }, [])

  const aprovarTodos = useCallback((chaves: string[]) => {
    setAprovados(chaves)
  }, [])

  const valor = useMemo<Ctx>(() => {
    const totaisQualificado = totaisPlano(linhas)
    const totaisOriginal = totaisPlano(linhas, 'qtdOriginal')
    const totais = versao === 'qualificado' ? totaisQualificado : totaisOriginal
    return {
      linhas,
      versao,
      setVersao,
      totais,
      totaisQualificado,
      totaisOriginal,
      banda: posicaoNaBanda(totais.investimento),
      historico,
      decisoes,
      lineCarregado,
      carregarLine,
      decisoesLine,
      decidirLine,
      ocsEmitidas,
      emitirOCs,
      aprovados,
      alterarQtd,
      incluirLinha,
      removerLinha,
      restaurar,
      recalcular,
      aprovar,
      aprovarTodos,
      registrar,
      decidir,
    }
  }, [
    linhas,
    versao,
    historico,
    decisoes,
    lineCarregado,
    carregarLine,
    decisoesLine,
    decidirLine,
    ocsEmitidas,
    emitirOCs,
    aprovados,
    alterarQtd,
    incluirLinha,
    removerLinha,
    restaurar,
    recalcular,
    aprovar,
    aprovarTodos,
    registrar,
    decidir,
  ])

  return <PlanoCtx.Provider value={valor}>{children}</PlanoCtx.Provider>
}

/* Hook junto do provider de propósito: import único nas telas. */
// eslint-disable-next-line react-refresh/only-export-components
export function usePlano(): Ctx {
  const ctx = useContext(PlanoCtx)
  if (!ctx) throw new Error('usePlano precisa estar dentro de <PlanoProvider>')
  return ctx
}
