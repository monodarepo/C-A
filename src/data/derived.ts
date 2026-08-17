/**
 * derived.ts — NÚMEROS-ÂNCORA + geradores simulados determinísticos.
 *
 * REGRA DE OURO 1: nenhum componente hardcoda número. Se uma tela precisa de um
 * valor novo, ele nasce aqui com o comentário da derivação.
 * REGRA DE OURO 2: tudo que é simulado usa mulberry32 com SEED fixo (2627), então
 * os números são idênticos em todo reload e batem entre telas.
 * REGRA DE OURO 3: os âncoras abaixo são canônicos (copiados do CLAUDE.md).
 */
import {
  cea,
  clusters,
  estilistas,
  fornecedores,
  lojasNomeadas,
  produtoPorCod,
  type LojaNomeada,
} from '@/lib/cea'
import { formatBRLCompact, formatDelta, formatNum, formatPct, formatPP } from '@/lib/format'

/* ================================================================= SEED ==== */

export const SEED = 2627

/** PRNG determinístico (mulberry32). Mesma seed ⇒ mesma sequência, sempre. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Ruído multiplicativo em torno de 1 (ex.: amplitude 0,08 ⇒ 0,92–1,08). */
function jitter(rand: () => number, amplitude: number): number {
  return 1 + (rand() * 2 - 1) * amplitude
}

/** Sorteio inteiro em [min, max]. */
function entre(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1))
}

/** Embaralha uma cópia do array de forma determinística (Fisher-Yates seedado). */
function embaralhar<T>(itens: T[], rand: () => number): T[] {
  const out = [...itens]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const soma = (ns: number[]) => ns.reduce((a, b) => a + b, 0)

/* ======================================================== 1. A COLEÇÃO ==== */

export const COLECAO = {
  nome: 'Verão 26-27',
  capsula: 'Tropicália',
  rotulo: 'Verão 26-27 | Tropicália',
  semana: 19,
  semanaWorkflow: 20, // o workflow (Fase 2) corre uma semana à frente do dashboard
  skusAtivos: 262,
  etapaAtual: 'Lista de Compras',
  entregas: 21,
} as const

/* ===================================================== 2. REDE DE LOJAS ==== */

export const REDE = {
  totalLojas: 335,
  cds: ['CD Barueri/Alphaville (SP)', 'CD Rio de Janeiro (RJ)'],
  sede: cea.rede.sede,
  /** A:42 · B:108 · C:158 · D:27 — participação de faturamento vem do JSON. */
  clusters: clusters.map((c) => ({
    ...c,
    /** "31%" → 31 (número, para cálculo) */
    partFatPct: Number(c.partFaturamento.replace('%', '')),
    convPct: Number(c.conv.replace('%', '')),
  })),
} as const

/** Distribuição regional da rede (âncora Fase 10). Soma 100%. */
export const DISTRIBUICAO_REGIONAL = [
  { regiao: 'Sudeste', pct: 50 },
  { regiao: 'Nordeste', pct: 25 },
  { regiao: 'Sul', pct: 13 },
  { regiao: 'Centro-Oeste', pct: 7 },
  { regiao: 'Norte', pct: 5 },
] as const

export type Regiao = (typeof DISTRIBUICAO_REGIONAL)[number]['regiao']

/** Participação % das vendas por cidade (âncora Fase 1). SP+RJ = 31%. */
export const TOP_CIDADES = [
  { cidade: 'São Paulo', pct: 19 },
  { cidade: 'Rio de Janeiro', pct: 12 },
  { cidade: 'Belo Horizonte', pct: 8 },
  { cidade: 'Salvador', pct: 7 },
  { cidade: 'Recife', pct: 6 },
] as const

/* ================================================ 3. FINANCEIRO REAL 2T26 == */

/** Fonte pública (release 2T26, 05/08/2026). NÃO alterar valores. */
export const FINANCEIRO_2T26 = {
  receitaConsolidada: 2_082_000_000,
  receitaVestuario: 1_895_000_000,
  varReceita: 1.2,
  varVestuario: 5.6,
  sssVestuario: 4.1,
  margemBrutaConsolidada: 58.1,
  margemBrutaVestuario: 59.1,
  trimestresExpansaoMargem: 20,
  ebitdaAjustado: 435_000_000,
  margemEbitda: 20.9,
  lucroAjustado: 130_000_000,
  digitalVendas: 154_300_000,
  digitalVar: 33.3,
  digitalShare: 7.7,
  capex: 119_600_000,
} as const

/* ============================================= 4. OTB VERÃO 26-27 (plano) == */

export const OTB = {
  vendaPlanejada: 2_180_000_000,
  otb: 890_000_000,
  atb: 228_000_000,
  margemPlanejada: 59.4,
  markdownPlanejado: 11.2,
  sellThroughAlvo: 78,
} as const

/* ================================== 5. PLANO DE SORTIMENTO (recorte demo) == */

export const PLANO = {
  linhas: 14,
  pecas: 1_208_400,
  investimento: 46_400_000,
  otbRecorte: 44_800_000,
  bandaPct: 3,
  /** ±3% sobre o alvo de 44,8 mi (arredondado como no CLAUDE.md). */
  piso: 43_500_000,
  teto: 46_100_000,
  estouroPct: 3.6,
  estouroValor: 1_620_000,
  margem: 59.2,
  /** baseline imutável do /versoes */
  original: { pecas: 1_156_000, investimento: 44_700_000 },
  /** verba do recorte "Feminino · Vestidos" nos Habilitadores */
  verbaHabilitadores: 42_500_000,
  custoMedioHabilitadores: 68.9,
  pecasHabilitadores: 616_800,
} as const

/* ================================================= 6. DASHBOARD EXECUTIVO == */

export const DASHBOARD = {
  sellThroughColecao: 63.8,
  sellThroughVsLY: 2.4,
  coberturaDias: 46,
  coberturaMeta: 60,
  margemRealizada: FINANCEIRO_2T26.margemBrutaVestuario,
  markdownAcumulado: 7.6,
  markdownLimite: 12,
  aderenciaIA: 84,
  erpStatus: 'OK',
  erpUltimoPush: '14:32',
  erpErros: 0,
  ceaPayShare: 24,
  digitalShare: FINANCEIRO_2T26.digitalShare,
  digitalVar: FINANCEIRO_2T26.digitalVar,
} as const

/* ==================================================== 7. SORTIMENTO VIVO == */

export const VIVO = {
  gmvDia: 24_600_000,
  gmvVar: 9.8,
  transacoes: 246_800,
  ticket: 99.7,
  upt: 1.52,
  conversao: 5.9,
  sellThroughDia: 4.4,
  rupturas: 38,
  bestMovers: 16,
  ordensCompra: 284,
  valorOCs: 8_200_000,
  markdownsAtivos: 6,
  markdownMedio: -38,
} as const

/* ================================================ 8. IN-SEASON HISTÓRICO == */

export const HISTORICO = {
  receita: 118_400_000,
  pecas: 1_243_500,
  ticket: 95.22,
  margem: 59.1,
  digitalShare: 7.7,
  varVsLY: 5,
} as const

/* ======================================== 9. PIRÂMIDE DE PREÇO (vestidos) == */

export type FaixaPreco = {
  id: 'P1' | 'P2' | 'P3' | 'P4' | 'P5'
  rotulo: string
  min: number
  max: number
  precoRef: number
  participacao: number
  margem: number
}

/** Faixas REAIS observadas em cea.com.br (641 SKUs de vestido midi). */
export const PIRAMIDE_PRECO: FaixaPreco[] = [
  { id: 'P1', rotulo: 'Entrada', min: 69, max: 119, precoRef: 99, participacao: 28, margem: 54 },
  { id: 'P2', rotulo: 'Acessível', min: 139, max: 179, precoRef: 159, participacao: 30, margem: 58 },
  { id: 'P3', rotulo: 'Médio', min: 189, max: 219, precoRef: 199, participacao: 24, margem: 61 },
  { id: 'P4', rotulo: 'Premium', min: 239, max: 259, precoRef: 249, participacao: 13, margem: 64 },
  { id: 'P5', rotulo: 'Top', min: 260, max: 440, precoRef: 319, participacao: 5, margem: 66 },
]

/** Preço médio ponderado da pirâmide — âncora R$ 172 (fecha em 171,9). */
export const PRECO_MEDIO_PIRAMIDE = 172

export function precoMedioPonderado(faixas: FaixaPreco[]): number {
  const total = soma(faixas.map((f) => f.participacao))
  if (!total) return 0
  return soma(faixas.map((f) => f.precoRef * f.participacao)) / total
}

export function margemMediaPonderada(faixas: FaixaPreco[]): number {
  const total = soma(faixas.map((f) => f.participacao))
  if (!total) return 0
  return soma(faixas.map((f) => f.margem * f.participacao)) / total
}

/* ============================================== 10. MARKDOWNS E HERÓIS ==== */

/** Remarcações REAIS capturadas no site. */
export const MARKDOWNS_REAIS = [-63, -55, -53, -47, -32, -28] as const

/** Os 8 produtos-âncora que atravessam as telas (códigos reais). */
export const HEROIS = [
  { cod: '1049412', papel: 'NOS/Dorsal — 22 cores' },
  { cod: '1046556', papel: 'Premium básico (trade-up)' },
  { cod: '1033472', papel: 'Core do programa wide leg' },
  { cod: '1099133', papel: 'Novo sem histórico' },
  { cod: '1075684', papel: 'Dorsal verão — 6 cores' },
  { cod: '1086292', papel: 'Vitrine/festa' },
  { cod: '1096942', papel: 'Evento — laise vermelha' },
  { cod: '7413962', papel: 'NOS íntimo — grade crítica' },
] as const

export const HEROIS_CODS = HEROIS.map((h) => h.cod)

/* ======================================================== 11. BENCHMARK == */

export const BENCHMARK = {
  ticketCA: cea.benchmark['posicionamentoC&A'].ticketMedioAprox, // 108
  gapVsRenner: -16, // 108 vs 129
  corDoAno: 'Mocha',
  categoriaEmAlta: 'Vestido Midi',
  coletaSnapshot: { skus: 641, min: 39, max: 440 },
} as const

/* ================================================== 12. PESSOAS (fictícias) */

export const PLANNER = cea.ficticios.planner // Mariana Alves — Planejamento

/* ====================================== 13. FROTA DE LOJAS (simulada) ==== */

export type Cluster = 'A' | 'B' | 'C' | 'D'
export type Clima = 'Quente' | 'Híbrida Quente' | 'Híbrida Fria' | 'Fria'
export type Porte = 'P' | 'M' | 'G' | 'GG'

export type Loja = {
  id: string
  nome: string
  cidade: string
  uf: string
  regiao: Regiao
  cluster: Cluster
  clusterNome: string
  clima: Clima
  porte: Porte
  /** true = localização real listada no snapshot; métricas seguem simuladas */
  nomeada: boolean
  faturamentoMes: number
  vendaDia: number
  /** peças vendidas em 30 dias */
  venda30d: number
  /** peças em estoque */
  estoque: number
  /** estoque/venda em meses */
  ev: number
  coberturaDias: number
  rupturaPct: number
  ticket: number
  sellThrough: number
  conversao: number
  vsLY: number
}

/**
 * Faturamento mensal da frota física.
 * Derivação: GMV do dia (âncora Sortimento Vivo, R$ 24,6 mi) menos a fatia
 * digital (7,7%) ⇒ R$ 22,71 mi/dia em loja física × 30 dias.
 * Fica acima da média do 2T26 (R$ 1,895 bi ÷ 3 = R$ 631,7 mi/mês) porque o dia
 * medido no Sortimento Vivo é de pico de temporada — coerente com o release.
 */
export const FATURAMENTO_MES_REDE =
  VIVO.gmvDia * (1 - FINANCEIRO_2T26.digitalShare / 100) * 30

/** Peças por transação e clima/porte por UF alimentam o gerador abaixo. */
const UPT_POR_CLUSTER: Record<Cluster, number> = { A: 2.3, B: 2.1, C: 2.0, D: 2.6 }
const ST_BASE_POR_CLUSTER: Record<Cluster, number> = { A: 67, B: 64, C: 61, D: 72 }
const RUPTURA_BASE_POR_CLUSTER: Record<Cluster, number> = { A: 2.4, B: 3.0, C: 3.8, D: 2.1 }

const CLIMA_POR_UF: Record<string, Clima> = {
  RS: 'Fria',
  SC: 'Fria',
  PR: 'Fria',
  SP: 'Híbrida Fria',
  MG: 'Híbrida Fria',
  DF: 'Híbrida Fria',
  RJ: 'Híbrida Quente',
  ES: 'Híbrida Quente',
  GO: 'Híbrida Quente',
  MS: 'Híbrida Quente',
  MT: 'Híbrida Quente',
  BA: 'Quente',
  PE: 'Quente',
  CE: 'Quente',
  MA: 'Quente',
  PB: 'Quente',
  RN: 'Quente',
  AL: 'Quente',
  SE: 'Quente',
  PI: 'Quente',
  AM: 'Quente',
  PA: 'Quente',
  RO: 'Quente',
  AC: 'Quente',
  AP: 'Quente',
  TO: 'Quente',
  RR: 'Quente',
}

const REGIAO_POR_UF: Record<string, Regiao> = {
  SP: 'Sudeste',
  RJ: 'Sudeste',
  MG: 'Sudeste',
  ES: 'Sudeste',
  BA: 'Nordeste',
  PE: 'Nordeste',
  CE: 'Nordeste',
  MA: 'Nordeste',
  PB: 'Nordeste',
  RN: 'Nordeste',
  AL: 'Nordeste',
  SE: 'Nordeste',
  PI: 'Nordeste',
  PR: 'Sul',
  RS: 'Sul',
  SC: 'Sul',
  DF: 'Centro-Oeste',
  GO: 'Centro-Oeste',
  MT: 'Centro-Oeste',
  MS: 'Centro-Oeste',
  AM: 'Norte',
  PA: 'Norte',
  RO: 'Norte',
  AC: 'Norte',
  AP: 'Norte',
  TO: 'Norte',
  RR: 'Norte',
}

/** Praças por região: capitais/metrópoles (clusters A e B) e interior (cluster C). */
const PRACAS: Record<Regiao, { capitais: [string, string][]; interior: [string, string][] }> = {
  Sudeste: {
    capitais: [
      ['São Paulo', 'SP'],
      ['Rio de Janeiro', 'RJ'],
      ['Belo Horizonte', 'MG'],
      ['Vitória', 'ES'],
      ['Guarulhos', 'SP'],
      ['Osasco', 'SP'],
      ['Santo André', 'SP'],
      ['São Bernardo do Campo', 'SP'],
      ['Niterói', 'RJ'],
      ['Contagem', 'MG'],
      ['Vila Velha', 'ES'],
      ['Nova Iguaçu', 'RJ'],
    ],
    interior: [
      ['Campinas', 'SP'],
      ['Ribeirão Preto', 'SP'],
      ['São José dos Campos', 'SP'],
      ['Sorocaba', 'SP'],
      ['Santos', 'SP'],
      ['Piracicaba', 'SP'],
      ['Bauru', 'SP'],
      ['São José do Rio Preto', 'SP'],
      ['Jundiaí', 'SP'],
      ['Limeira', 'SP'],
      ['Franca', 'SP'],
      ['Marília', 'SP'],
      ['Presidente Prudente', 'SP'],
      ['Araçatuba', 'SP'],
      ['Taubaté', 'SP'],
      ['Indaiatuba', 'SP'],
      ['Uberlândia', 'MG'],
      ['Juiz de Fora', 'MG'],
      ['Montes Claros', 'MG'],
      ['Uberaba', 'MG'],
      ['Governador Valadares', 'MG'],
      ['Poços de Caldas', 'MG'],
      ['Campos dos Goytacazes', 'RJ'],
      ['Petrópolis', 'RJ'],
      ['Volta Redonda', 'RJ'],
      ['Cabo Frio', 'RJ'],
      ['Cachoeiro de Itapemirim', 'ES'],
      ['Linhares', 'ES'],
    ],
  },
  Nordeste: {
    capitais: [
      ['Salvador', 'BA'],
      ['Recife', 'PE'],
      ['Fortaleza', 'CE'],
      ['São Luís', 'MA'],
      ['João Pessoa', 'PB'],
      ['Natal', 'RN'],
      ['Maceió', 'AL'],
      ['Aracaju', 'SE'],
      ['Teresina', 'PI'],
      ['Jaboatão dos Guararapes', 'PE'],
      ['Olinda', 'PE'],
    ],
    interior: [
      ['Feira de Santana', 'BA'],
      ['Vitória da Conquista', 'BA'],
      ['Camaçari', 'BA'],
      ['Juazeiro', 'BA'],
      ['Ilhéus', 'BA'],
      ['Caruaru', 'PE'],
      ['Petrolina', 'PE'],
      ['Garanhuns', 'PE'],
      ['Sobral', 'CE'],
      ['Juazeiro do Norte', 'CE'],
      ['Maracanaú', 'CE'],
      ['Imperatriz', 'MA'],
      ['Campina Grande', 'PB'],
      ['Mossoró', 'RN'],
      ['Arapiraca', 'AL'],
      ['Parnaíba', 'PI'],
      ['Lagarto', 'SE'],
    ],
  },
  Sul: {
    capitais: [
      ['Curitiba', 'PR'],
      ['Porto Alegre', 'RS'],
      ['Florianópolis', 'SC'],
      ['Canoas', 'RS'],
      ['São José', 'SC'],
    ],
    interior: [
      ['Londrina', 'PR'],
      ['Maringá', 'PR'],
      ['Cascavel', 'PR'],
      ['Ponta Grossa', 'PR'],
      ['Foz do Iguaçu', 'PR'],
      ['Caxias do Sul', 'RS'],
      ['Pelotas', 'RS'],
      ['Santa Maria', 'RS'],
      ['Passo Fundo', 'RS'],
      ['Novo Hamburgo', 'RS'],
      ['Joinville', 'SC'],
      ['Blumenau', 'SC'],
      ['Chapecó', 'SC'],
      ['Criciúma', 'SC'],
      ['Itajaí', 'SC'],
    ],
  },
  'Centro-Oeste': {
    capitais: [
      ['Brasília', 'DF'],
      ['Goiânia', 'GO'],
      ['Campo Grande', 'MS'],
      ['Cuiabá', 'MT'],
      ['Taguatinga', 'DF'],
    ],
    interior: [
      ['Anápolis', 'GO'],
      ['Aparecida de Goiânia', 'GO'],
      ['Rio Verde', 'GO'],
      ['Rondonópolis', 'MT'],
      ['Sinop', 'MT'],
      ['Várzea Grande', 'MT'],
      ['Dourados', 'MS'],
      ['Três Lagoas', 'MS'],
    ],
  },
  Norte: {
    capitais: [
      ['Manaus', 'AM'],
      ['Belém', 'PA'],
      ['Palmas', 'TO'],
      ['Porto Velho', 'RO'],
      ['Macapá', 'AP'],
      ['Rio Branco', 'AC'],
      ['Boa Vista', 'RR'],
      ['Ananindeua', 'PA'],
    ],
    interior: [
      ['Santarém', 'PA'],
      ['Marabá', 'PA'],
      ['Castanhal', 'PA'],
      ['Parintins', 'AM'],
      ['Ji-Paraná', 'RO'],
      ['Araguaína', 'TO'],
      ['Gurupi', 'TO'],
    ],
  },
}

const SUFIXOS = [
  'Shopping',
  'Centro',
  'Shopping Center',
  'Boulevard',
  'Plaza Shopping',
  'Shopping Norte',
  'Shopping Sul',
  'Via Center',
]

/** Em cidade que já tem loja real no snapshot, evita nome quase-homônimo
 *  (ex.: não gerar "C&A Salvador Shopping Center" ao lado de "C&A Salvador Shopping"). */
const SUFIXOS_DISTINTOS = ['Centro', 'Boulevard', 'Plaza Shopping', 'Via Center', 'Shopping Norte', 'Shopping Sul']

/**
 * Lojas reais (nomeadas) são flagships: pesam mais no faturamento que uma loja
 * gerada do mesmo cluster, então o Top 10 da rede é formado por endereços reais.
 */
const PESO_FLAGSHIP: Record<Cluster, number> = { A: 2.1, B: 1.6, C: 1.3, D: 1.2 }

/** Cidade das lojas nomeadas — o JSON traz só nome fantasia + UF. */
const CIDADE_DAS_NOMEADAS: Record<string, string> = {
  'C&A Shopping Eldorado': 'São Paulo',
  'C&A Center Norte': 'São Paulo',
  'C&A MorumbiShopping': 'São Paulo',
  'C&A Shopping Ibirapuera': 'São Paulo',
  'C&A Center 3 — Paulista': 'São Paulo',
  'C&A Shopping Aricanduva': 'São Paulo',
  'C&A Metrô Tatuapé': 'São Paulo',
  'C&A Shopping Interlagos': 'São Paulo',
  'C&A NorteShopping': 'Rio de Janeiro',
  'C&A BarraShopping': 'Rio de Janeiro',
  'C&A Rio Sul': 'Rio de Janeiro',
  'C&A Madureira Shopping': 'Rio de Janeiro',
  'C&A BH Shopping': 'Belo Horizonte',
  'C&A Shopping Del Rey': 'Belo Horizonte',
  'C&A Palladium Curitiba': 'Curitiba',
  'C&A Praia de Belas': 'Porto Alegre',
  'C&A Salvador Shopping': 'Salvador',
  'C&A Shopping da Bahia': 'Salvador',
  'C&A Shopping Recife': 'Recife',
  'C&A RioMar Recife': 'Recife',
  'C&A Iguatemi Bosque': 'Fortaleza',
  'C&A Conjunto Nacional': 'Brasília',
  'C&A ParkShopping': 'Brasília',
  'C&A Manauara Shopping': 'Manaus',
}

/**
 * Expande as 24 lojas nomeadas do JSON para as 335 da rede.
 * Marginais EXATAS por construção: 42/108/158/27 por cluster e
 * 50/25/13/7/5% por região (Sudeste 168 · NE 84 · Sul 44 · CO 23 · Norte 16).
 */
function gerarFrota(): Loja[] {
  const rand = mulberry32(SEED)

  // --- 1. slots restantes por cluster e por região -------------------------
  const metaCluster: Record<Cluster, number> = { A: 42, B: 108, C: 158, D: 27 }
  const metaRegiao = Object.fromEntries(
    DISTRIBUICAO_REGIONAL.map((r) => [
      r.regiao,
      Math.round((REDE.totalLojas * r.pct) / 100),
    ]),
  ) as Record<Regiao, number>

  const nomeadas: LojaNomeada[] = lojasNomeadas
  for (const l of nomeadas) {
    metaCluster[l.cluster as Cluster] -= 1
    metaRegiao[REGIAO_POR_UF[l.uf]] -= 1
  }

  const slotsCluster = embaralhar(
    (Object.keys(metaCluster) as Cluster[]).flatMap((c) =>
      Array.from({ length: metaCluster[c] }, () => c),
    ),
    rand,
  )
  const slotsRegiao = embaralhar(
    (Object.keys(metaRegiao) as Regiao[]).flatMap((r) =>
      Array.from({ length: metaRegiao[r] }, () => r),
    ),
    rand,
  )

  // --- 2. identidade das lojas -------------------------------------------
  const usados = new Set<string>()
  const cursor: Record<string, number> = {}

  function proximaPraca(regiao: Regiao, cluster: Cluster): [string, string] {
    // A e B são "Capitais"; C é "Interior"; D (outlet) circula nos dois.
    const pool =
      cluster === 'C'
        ? PRACAS[regiao].interior
        : cluster === 'D'
          ? [...PRACAS[regiao].interior, ...PRACAS[regiao].capitais]
          : PRACAS[regiao].capitais
    const chave = `${regiao}:${cluster}`
    const i = cursor[chave] ?? entre(rand, 0, pool.length - 1)
    cursor[chave] = i + 1
    return pool[i % pool.length]
  }

  const cidadesReais = new Set(Object.values(CIDADE_DAS_NOMEADAS))

  function nomeUnico(cidade: string, cluster: Cluster): string {
    const base = cluster === 'D' ? [`Outlet ${cidade}`, `${cidade} Saldão`] : []
    const sufixos = cidadesReais.has(cidade) ? SUFIXOS_DISTINTOS : SUFIXOS
    const candidatos = [...base, ...sufixos.map((s) => `${cidade} ${s}`)]
    for (const c of candidatos) {
      const nome = `C&A ${c}`
      if (!usados.has(nome)) return nome
    }
    let n = 2
    while (usados.has(`C&A ${cidade} Shopping ${n}`)) n++
    return `C&A ${cidade} Shopping ${n}`
  }

  type Base = Omit<
    Loja,
    | 'faturamentoMes'
    | 'vendaDia'
    | 'venda30d'
    | 'estoque'
    | 'ev'
    | 'coberturaDias'
    | 'rupturaPct'
    | 'ticket'
    | 'sellThrough'
    | 'conversao'
    | 'vsLY'
    | 'porte'
  >

  const bases: Base[] = []

  for (const l of nomeadas) {
    const cluster = l.cluster as Cluster
    const cidade = CIDADE_DAS_NOMEADAS[l.nome] ?? l.nome.replace(/^C&A\s+/, '')
    usados.add(l.nome)
    bases.push({
      id: '',
      nome: l.nome,
      cidade,
      uf: l.uf,
      regiao: REGIAO_POR_UF[l.uf],
      cluster,
      clusterNome: clusters.find((c) => c.id === cluster)?.nome ?? '',
      clima: CLIMA_POR_UF[l.uf],
      nomeada: true,
    })
  }

  for (let i = 0; i < slotsCluster.length; i++) {
    const cluster = slotsCluster[i]
    const regiao = slotsRegiao[i]
    const [cidade, uf] = proximaPraca(regiao, cluster)
    const nome = nomeUnico(cidade, cluster)
    usados.add(nome)
    bases.push({
      id: '',
      nome,
      cidade,
      uf,
      regiao,
      cluster,
      clusterNome: clusters.find((c) => c.id === cluster)?.nome ?? '',
      clima: CLIMA_POR_UF[uf],
      nomeada: false,
    })
  }

  // --- 3. métricas cruas + calibração pelos âncoras ------------------------
  const cru = bases.map((b) => ({
    base: b,
    fatRaw:
      jitter(rand, b.cluster === 'A' ? 0.3 : 0.35) * (b.nomeada ? PESO_FLAGSHIP[b.cluster] : 1),
    ticketRaw: jitter(rand, 0.09),
    stRaw: ST_BASE_POR_CLUSTER[b.cluster] * jitter(rand, 0.07),
    coberturaRaw: DASHBOARD.coberturaDias * jitter(rand, 0.22),
    rupturaRaw: RUPTURA_BASE_POR_CLUSTER[b.cluster] * jitter(rand, 0.3),
    convRaw:
      (REDE.clusters.find((c) => c.id === b.cluster)?.convPct ?? 15) * jitter(rand, 0.12),
    vsLYRaw: FINANCEIRO_2T26.sssVestuario + (rand() * 2 - 1) * 6.5,
  }))

  // 3a. faturamento: cada cluster fecha na sua participação do JSON
  const fatPorCluster: Record<Cluster, number> = { A: 0, B: 0, C: 0, D: 0 }
  for (const c of REDE.clusters) {
    fatPorCluster[c.id as Cluster] = (FATURAMENTO_MES_REDE * c.partFatPct) / 100
  }
  const somaRawPorCluster: Record<Cluster, number> = { A: 0, B: 0, C: 0, D: 0 }
  for (const r of cru) somaRawPorCluster[r.base.cluster] += r.fatRaw

  // 3b. ticket: média do cluster = ticketMedio do JSON
  const somaTicketRaw: Record<Cluster, number> = { A: 0, B: 0, C: 0, D: 0 }
  const contagem: Record<Cluster, number> = { A: 0, B: 0, C: 0, D: 0 }
  for (const r of cru) {
    somaTicketRaw[r.base.cluster] += r.ticketRaw
    contagem[r.base.cluster] += 1
  }

  const parcial = cru.map((r) => {
    const cl = r.base.cluster
    const faturamentoMes = (fatPorCluster[cl] * r.fatRaw) / somaRawPorCluster[cl]
    const ticketAlvo = clusters.find((c) => c.id === cl)?.ticketMedio ?? 100
    const ticket = (ticketAlvo * contagem[cl] * r.ticketRaw) / somaTicketRaw[cl]
    const precoMedioPeca = ticket / UPT_POR_CLUSTER[cl]
    const venda30d = Math.round(faturamentoMes / precoMedioPeca)
    return { ...r, faturamentoMes, ticket, venda30d }
  })

  // 3c. sell-through: média ponderada por peças = 63,8% (âncora)
  const totalPecas = soma(parcial.map((p) => p.venda30d))
  const stPonderado = soma(parcial.map((p) => p.stRaw * p.venda30d)) / totalPecas
  const ajusteST = DASHBOARD.sellThroughColecao - stPonderado

  // 3d. cobertura: estoque total / venda diária total = 46 dias (âncora)
  const vendaDiaPecas = parcial.map((p) => p.venda30d / 30)
  const estoqueRaw = parcial.map((p, i) => vendaDiaPecas[i] * p.coberturaRaw)
  const fatorEstoque =
    (DASHBOARD.coberturaDias * soma(vendaDiaPecas)) / soma(estoqueRaw)

  // 3e. vs LY: média ponderada por faturamento = SSS +4,1% (âncora)
  const vsLYPonderado =
    soma(parcial.map((p) => p.vsLYRaw * p.faturamentoMes)) / FATURAMENTO_MES_REDE
  const ajusteVsLY = FINANCEIRO_2T26.sssVestuario - vsLYPonderado

  const frota = parcial
    .map((p, i) => {
      const estoque = Math.round(estoqueRaw[i] * fatorEstoque)
      const venda30d = p.venda30d
      const loja: Loja = {
        ...p.base,
        porte: 'M',
        faturamentoMes: Math.round(p.faturamentoMes),
        vendaDia: Math.round(p.faturamentoMes / 30),
        venda30d,
        estoque,
        ev: Number((estoque / venda30d).toFixed(2)),
        coberturaDias: Math.round((estoque / (venda30d / 30)) * 10) / 10,
        rupturaPct: Number(p.rupturaRaw.toFixed(1)),
        ticket: Number(p.ticket.toFixed(2)),
        sellThrough: Number((p.stRaw + ajusteST).toFixed(1)),
        conversao: Number(p.convRaw.toFixed(1)),
        vsLY: Number((p.vsLYRaw + ajusteVsLY).toFixed(1)),
      }
      return loja
    })
    .sort((a, b) => b.faturamentoMes - a.faturamentoMes)

  // --- 4. porte por quartil de faturamento + id sequencial ----------------
  const q = frota.length / 4
  frota.forEach((l, i) => {
    l.porte = i < q ? 'GG' : i < q * 2 ? 'G' : i < q * 3 ? 'M' : 'P'
    l.id = `L${String(i + 1).padStart(3, '0')}`
  })

  return frota
}

/** As 335 lojas — geradas uma única vez por sessão (determinístico). */
export const LOJAS: Loja[] = gerarFrota()

export function lojaPorNome(nome: string): Loja | undefined {
  return LOJAS.find((l) => l.nome === nome)
}

/** Loja default do módulo de Distribuição (Fase 7). */
export const LOJA_PADRAO_DISTRIBUICAO = 'C&A Shopping Eldorado'

/** Top N lojas por faturamento (LOJAS já vem ordenado). */
export function topLojas(n = 10): Loja[] {
  return LOJAS.slice(0, n)
}

export function lojasPorCluster(cluster: Cluster): Loja[] {
  return LOJAS.filter((l) => l.cluster === cluster)
}

/** Agregados da frota — usados nos KPIs e como autoteste dos âncoras. */
export const AGREGADOS_FROTA = {
  lojas: LOJAS.length,
  faturamentoMes: soma(LOJAS.map((l) => l.faturamentoMes)),
  vendaDia: soma(LOJAS.map((l) => l.vendaDia)),
  pecas30d: soma(LOJAS.map((l) => l.venda30d)),
  estoque: soma(LOJAS.map((l) => l.estoque)),
  get coberturaDias() {
    return this.estoque / (this.pecas30d / 30)
  },
  get ticketMedio() {
    return this.faturamentoMes / soma(LOJAS.map((l) => l.faturamentoMes / l.ticket))
  },
  get sellThrough() {
    return soma(LOJAS.map((l) => l.sellThrough * l.venda30d)) / this.pecas30d
  },
  porRegiao: DISTRIBUICAO_REGIONAL.map((r) => ({
    regiao: r.regiao,
    pctAncora: r.pct,
    lojas: LOJAS.filter((l) => l.regiao === r.regiao).length,
    faturamentoMes: soma(
      LOJAS.filter((l) => l.regiao === r.regiao).map((l) => l.faturamentoMes),
    ),
  })),
  porCluster: REDE.clusters.map((c) => ({
    id: c.id,
    nome: c.nome,
    lojasAncora: c.lojas,
    lojas: LOJAS.filter((l) => l.cluster === c.id).length,
    faturamentoMes: soma(
      LOJAS.filter((l) => l.cluster === c.id).map((l) => l.faturamentoMes),
    ),
  })),
}

/* ================================== 14. SÉRIES PARA GRÁFICOS (seedadas) === */

/** Receita trimestral REAL do snapshot, pronta para Recharts. */
export const SERIE_TRIMESTRAL = Object.entries(cea['financeiro']['seriesTrimestrais_receita_R$'])
  .map(([tri, receita]) => ({
    tri,
    receita,
    sss: cea.financeiro.seriesTrimestrais_sssVestuario[tri] ?? null,
  }))

/**
 * Sparkline determinística de 12 pontos para qualquer KPI.
 * Mesma chave ⇒ mesma curva, em qualquer tela.
 */
export function serieSparkline(
  chave: string,
  valorFinal: number,
  variacaoPct = 8,
  pontos = 12,
): { i: number; v: number }[] {
  let h = 0x811c9dc5
  for (let i = 0; i < chave.length; i++) {
    h ^= chave.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  const rand = mulberry32((SEED + Math.abs(h)) >>> 0)
  const inicio = valorFinal / (1 + variacaoPct / 100)
  const passo = (valorFinal - inicio) / (pontos - 1)
  return Array.from({ length: pontos }, (_, i) => {
    const tendencia = inicio + passo * i
    const ruido = i === pontos - 1 ? 1 : jitter(rand, 0.05)
    return { i, v: Number((tendencia * ruido).toFixed(2)) }
  })
}

/* ============================ 15. DASHBOARD — ATRIBUTOS DA SEMANA (Fase 1) == */

/**
 * Leitura de atributos da semana (dimensões N3–N7).
 * Os valores lidos (cor, tecido, padronagem, comprimento, manga) são os da
 * cartela REAL do snapshot (`atributosReais`); os deltas são a leitura da
 * semana do mockup. `validarAtributosSemana()` garante que nenhum valor citado
 * saiu da cartela oficial.
 */
export type LeituraAtributo = {
  dimensao: string
  nivel: string
  valor: string
  /** participação no mix, quando a leitura é de share */
  share: number | null
  delta: number | null
  unidadeDelta: string
  /** termos da cartela real que sustentam a leitura */
  fonte: { lista: keyof typeof cea.atributosReais; termos: string[] }
}

export const ATRIBUTOS_SEMANA: LeituraAtributo[] = [
  {
    dimensao: 'Cor mais vendida',
    nivel: 'N7 · Cor',
    valor: 'Marrom / Mocha',
    share: 18,
    delta: 9,
    unidadeDelta: 'YoY',
    fonte: { lista: 'coresCartela', termos: ['marrom', 'mocha'] },
  },
  {
    dimensao: 'Tecido líder',
    nivel: 'N5 · Material',
    valor: 'Viscose com Linho',
    share: null,
    delta: 11,
    unidadeDelta: 'de sell-through',
    fonte: { lista: 'materiais', termos: ['viscose+linho'] },
  },
  {
    dimensao: 'Padronagem',
    nivel: 'N6 · Padronagem',
    valor: 'Floral Pequeno',
    share: null,
    delta: 8,
    unidadeDelta: 'vs mercado',
    fonte: { lista: 'padronagens', termos: ['floral pequeno'] },
  },
  {
    dimensao: 'Comprimento (vestido)',
    nivel: 'N4 · Comprimento',
    valor: 'Midi',
    share: 51,
    delta: null,
    unidadeDelta: 'do mix',
    fonte: { lista: 'decotes', termos: [] },
  },
  {
    dimensao: 'Manga',
    nivel: 'N6 · Manga',
    valor: 'Curta · Bufante',
    share: null,
    delta: -5,
    unidadeDelta: 'na manga longa',
    fonte: { lista: 'mangas', termos: ['curta', 'bufante'] },
  },
]

/** Autoteste: todo termo citado existe na cartela real do JSON. */
export function validarAtributosSemana(): string[] {
  const erros: string[] = []
  for (const a of ATRIBUTOS_SEMANA) {
    const cartela = cea.atributosReais[a.fonte.lista] ?? []
    for (const t of a.fonte.termos) {
      if (!cartela.includes(t)) erros.push(`"${t}" não está em atributosReais.${a.fonte.lista}`)
    }
  }
  return erros
}

/* ================================ 16. DASHBOARD — RANKING DE ESTILISTAS ==== */

export type LinhaEstilista = {
  nome: string
  time: string
  pecas: number
  vendido: number
  sellThrough: number
  /** variação vs LY, em % */
  tendencia: number
}

/** Peças vendidas da coleção = plano × sell-through da coleção (âncoras). */
export const PECAS_VENDIDAS_COLECAO = Math.round(
  (PLANO.pecas * DASHBOARD.sellThroughColecao) / 100,
)

/** "29,99–55,99" → 42.99 (média do "coração" da faixa observada no site). */
function coracaoMedio(faixa: string): number {
  const [a, b] = faixa.split('–').map((s) => Number(s.trim().replace('.', '').replace(',', '.')))
  return (a + b) / 2
}

const CORACAO_CAMISETA_M = coracaoMedio(
  String(cea.piramidePrecoObservada.camisetasMasculinas.coracao),
)
const CORACAO_SUTIA = coracaoMedio(String(cea.piramidePrecoObservada.sutias.coracao))
const CORACAO_INFANTIL = coracaoMedio(String(cea.piramidePrecoObservada.infantilCamisetas.coracao))

const faixa = (id: FaixaPreco['id']) => PIRAMIDE_PRECO.find((f) => f.id === id)!.precoRef

/**
 * Preço médio por peça de cada time, ancorado em preços REAIS do snapshot:
 * faixas da pirâmide de vestidos e o "coração" de cada categoria observada.
 */
const PRECO_MEDIO_POR_TIME: Record<string, number> = {
  'Sr. Feminino Casual': faixa('P2'), // 159 — acessível, o miolo do feminino
  'Denim Lab / &jeans': faixa('P3'), // 199 — jeans senta na faixa média
  'Festa & Vestidos': faixa('P4'), // 249 — premium
  // 199,99 — preço real do vestido de tule Mindse7 no snapshot
  'Mindse7 Studio': cea.produtos.find((p) => p.marca === 'Mindse7')?.precoPor ?? faixa('P3'),
  'ACE Performance': (faixa('P1') + faixa('P2')) / 2, // 129 — esportivo entre entrada e acessível
  'Infantil & Licenças': CORACAO_INFANTIL, // 47,99
  'Íntimo & Básicos': (CORACAO_SUTIA + CORACAO_CAMISETA_M) / 2, // 56,49
}

/** Participação de cada time nas peças da coleção (mix de sortimento). */
const MIX_POR_TIME: Record<string, number> = {
  'Sr. Feminino Casual': 24,
  'Íntimo & Básicos': 20,
  'Infantil & Licenças': 16,
  'Denim Lab / &jeans': 15,
  'Festa & Vestidos': 12,
  'Mindse7 Studio': 8,
  'ACE Performance': 5,
}

/**
 * Ranking de estilistas (pessoas FICTÍCIAS do snapshot).
 * Calibrado para: soma das peças = peças vendidas da coleção e sell-through
 * ponderado = 63,8% (âncora do dashboard).
 */
function gerarRankingEstilistas(): LinhaEstilista[] {
  const rand = mulberry32(SEED + 101)

  const cru = estilistas.map((e) => ({
    ...e,
    pesoRaw: (MIX_POR_TIME[e.time] ?? 10) * jitter(rand, 0.12),
    stRaw: DASHBOARD.sellThroughColecao * jitter(rand, 0.11),
    tendenciaRaw: FINANCEIRO_2T26.sssVestuario + (rand() * 2 - 1) * 11,
  }))

  const somaPesos = soma(cru.map((c) => c.pesoRaw))
  const comPecas = cru.map((c) => ({
    ...c,
    pecas: Math.round((PECAS_VENDIDAS_COLECAO * c.pesoRaw) / somaPesos),
  }))

  // sell-through ponderado por peças precisa fechar no âncora
  const totalPecas = soma(comPecas.map((c) => c.pecas))
  const stPonderado = soma(comPecas.map((c) => c.stRaw * c.pecas)) / totalPecas
  const ajusteST = DASHBOARD.sellThroughColecao - stPonderado

  return comPecas
    .map((c) => ({
      nome: c.nome,
      time: c.time,
      pecas: c.pecas,
      vendido: Math.round(c.pecas * (PRECO_MEDIO_POR_TIME[c.time] ?? faixa('P2'))),
      sellThrough: Number((c.stRaw + ajusteST).toFixed(1)),
      tendencia: Number(c.tendenciaRaw.toFixed(1)),
    }))
    .sort((a, b) => b.vendido - a.vendido)
}

export const RANKING_ESTILISTAS: LinhaEstilista[] = gerarRankingEstilistas()

export const TOTAIS_ESTILISTAS = {
  pecas: soma(RANKING_ESTILISTAS.map((e) => e.pecas)),
  vendido: soma(RANKING_ESTILISTAS.map((e) => e.vendido)),
  get sellThrough() {
    return soma(RANKING_ESTILISTAS.map((e) => e.sellThrough * e.pecas)) / this.pecas
  },
  get precoMedio() {
    return this.vendido / this.pecas
  },
}

/* =============================== 17. DASHBOARD — FOLLOW-UP DE FORNECEDOR == */

export type StatusFornecedor = 'OK' | 'ATENÇÃO' | 'CRÍTICO'

export type LinhaFornecedor = {
  fornecedor: string
  pedidos: number
  atrasos: number
  /** % de pedidos entregues no prazo */
  otdPct: number
  status: StatusFornecedor
  observacao: string
}

/**
 * Carteira por fornecedor: os atrasos NÃO são sorteados, são fixos por
 * fornecedor para casarem com a observação — um fornecedor "OK" não pode
 * carregar um texto dizendo que trava a emissão. Só o volume de pedidos é
 * seedado. Observações citam referências REAIS do catálogo; os fornecedores
 * são FICTÍCIOS (snapshot.ficticios) e a tela sinaliza isso.
 */
const CARTEIRA_POR_FORNECEDOR: Record<string, { atrasos: number; observacao: string }> = {
  'Renda Fina Ltda': {
    atrasos: 4,
    observacao: 'Grade do Sutiã Renda 7413962 incompleta nos tamanhos B e C.',
  },
  'Denim União': {
    atrasos: 3,
    observacao: 'Aprovação de cor pendente na Wide Leg Patchwork 1099133 — trava a emissão.',
  },
  'Malharia Santa Clara': {
    atrasos: 2,
    observacao: 'Tricot canelado em liquidação — sem reposição prevista para a virada.',
  },
  'Global Sourcing Ásia': {
    atrasos: 2,
    observacao: 'Importado com lead time de 90 dias — cronograma no limite da janela.',
  },
  'Têxtil Horizonte': {
    atrasos: 1,
    observacao: 'Camiseta Básica 1049412 exige acerto de grade tamanho a tamanho na reposição.',
  },
  'Confecções Aurora': {
    atrasos: 0,
    observacao: 'Vestido Linho 1075684 (6 cores) confirmado para D-15 no CD Barueri.',
  },
  'Nordeste Malhas': {
    atrasos: 0,
    observacao: 'Malha de básicos dentro do prazo; capacidade extra oferecida para o verão.',
  },
}

/**
 * Volume de pedidos por fornecedor, calibrado para somar as 284 ordens de
 * compra do âncora do Sortimento Vivo.
 * Status é REGRA, não sorteio: 0 atrasos = OK, 1–2 = ATENÇÃO, 3+ = CRÍTICO.
 */
function gerarFollowUpFornecedores(): LinhaFornecedor[] {
  const rand = mulberry32(SEED + 202)

  const cru = fornecedores.map((f) => ({
    fornecedor: f,
    pesoRaw: jitter(rand, 0.35),
    atrasos: CARTEIRA_POR_FORNECEDOR[f]?.atrasos ?? 0,
  }))

  const somaPesos = soma(cru.map((c) => c.pesoRaw))
  const linhas = cru.map((c) => {
    const pedidos = Math.round((VIVO.ordensCompra * c.pesoRaw) / somaPesos)
    const status: StatusFornecedor = c.atrasos === 0 ? 'OK' : c.atrasos <= 2 ? 'ATENÇÃO' : 'CRÍTICO'
    return {
      fornecedor: c.fornecedor,
      pedidos,
      atrasos: c.atrasos,
      otdPct: Number((((pedidos - c.atrasos) / pedidos) * 100).toFixed(1)),
      status,
      observacao: CARTEIRA_POR_FORNECEDOR[c.fornecedor]?.observacao ?? '',
    }
  })

  // sobra/falta do arredondamento vai para o maior fornecedor, para fechar 284
  const diferenca = VIVO.ordensCompra - soma(linhas.map((l) => l.pedidos))
  if (diferenca !== 0) {
    const maior = linhas.reduce((a, b) => (b.pedidos > a.pedidos ? b : a))
    maior.pedidos += diferenca
    maior.otdPct = Number((((maior.pedidos - maior.atrasos) / maior.pedidos) * 100).toFixed(1))
  }

  const ordem: Record<StatusFornecedor, number> = { 'CRÍTICO': 0, 'ATENÇÃO': 1, OK: 2 }
  return linhas.sort((a, b) => ordem[a.status] - ordem[b.status] || b.pedidos - a.pedidos)
}

export const FOLLOWUP_FORNECEDORES: LinhaFornecedor[] = gerarFollowUpFornecedores()

/* ==================================== 18. DASHBOARD — ALERTAS CRÍTICOS ==== */

export type Alerta = {
  id: string
  tom: 'crit' | 'warn' | 'info'
  tipo: string
  cod: string
  produto: string
  texto: string
  metrica: string
  rota: string
  cta: string
}

/** 3 alertas com deep-link, cada um ancorado num produto real do snapshot. */
export const ALERTAS_CRITICOS: Alerta[] = [
  {
    id: 'ruptura-1049412',
    tom: 'crit',
    tipo: 'Ruptura de dorsal',
    cod: '1049412',
    produto: produtoPorCod('1049412')?.nome ?? '',
    texto:
      'Hero NOS de 22 cores com grade furada nas lojas de maior giro. Reposição tamanho a tamanho é o gargalo.',
    metrica: `${VIVO.rupturas} rupturas ativas na rede`,
    rota: '/vivo',
    cta: 'Ver no Sortimento Vivo',
  },
  {
    id: 'markdown-1083993',
    tom: 'warn',
    tipo: 'Markdown sugerido',
    cod: '1083993',
    produto: produtoPorCod('1083993')?.nome ?? '',
    texto:
      'Slow seller esgotado após remarcação profunda — o aprendizado de preço vale para o restante do tricot.',
    metrica: `de ${formatBRLCompact(produtoPorCod('1083993')?.precoDe ?? 0)} para ${formatBRLCompact(
      produtoPorCod('1083993')?.precoPor ?? 0,
    )} (${produtoPorCod('1083993')?.desc})`,
    rota: '/pricing',
    cta: 'Abrir Pricing & Markdown',
  },
  {
    id: 'recompra-1033472',
    tom: 'info',
    tipo: 'Oportunidade de recompra',
    cod: '1033472',
    produto: produtoPorCod('1033472')?.nome ?? '',
    texto:
      'Core do programa wide leg girando acima da meta de sell-through — há espaço de ATB antes do fechamento.',
    metrica: `ATB disponível: ${formatBRLCompact(OTB.atb)}`,
    rota: '/plano',
    cta: 'Abrir Plano de Sortimento',
  },
]

/* ======================================= 19. DASHBOARD — RESUMO DA IA ===== */

export type BulletResumo = { titulo: string; texto: string }

/**
 * Resumo executivo "gerado" pela IA: 4 bullets montados a partir dos âncoras.
 * Nada aqui é texto solto com número digitado — todos vêm das constantes.
 */
export function resumoIA(): BulletResumo[] {
  const folgaMarkdown = DASHBOARD.markdownLimite - DASHBOARD.markdownAcumulado
  const folgaCobertura = DASHBOARD.coberturaMeta - DASHBOARD.coberturaDias

  return [
    {
      titulo: 'A coleção gira mais rápido do que o planejado',
      texto: `Sell-through em ${formatPct(DASHBOARD.sellThroughColecao)} (${formatPP(
        DASHBOARD.sellThroughVsLY,
      )} vs LY) com cobertura de ${formatNum(DASHBOARD.coberturaDias)} dias contra meta de ${formatNum(
        DASHBOARD.coberturaMeta,
      )} — ${formatNum(folgaCobertura)} dias a menos de pulmão. O risco desta semana é ruptura de dorsal, não excesso.`,
    },
    {
      titulo: 'Margem sustentada com folga promocional',
      texto: `Margem realizada de ${formatPct(
        DASHBOARD.margemRealizada,
      )} no ${FINANCEIRO_2T26.trimestresExpansaoMargem}º trimestre consecutivo de expansão, e markdown acumulado em ${formatPct(
        DASHBOARD.markdownAcumulado,
      )} contra limite de ${formatPct(DASHBOARD.markdownLimite, 0)} — restam ${formatPct(
        folgaMarkdown,
      )} de verba de remarcação.`,
    },
    {
      titulo: 'Digital e C&A Pay puxando a conversão',
      texto: `Digital em ${formatPct(DASHBOARD.digitalShare)} das vendas (${formatDelta(
        DASHBOARD.digitalVar,
      )}) e C&A Pay em ${formatPct(
        DASHBOARD.ceaPayShare,
        0,
      )} dos pagamentos, com ticket de ${formatBRLCompact(VIVO.ticket)} no dia. A aderência da distribuição sugerida pela IA está em ${formatPct(
        DASHBOARD.aderenciaIA,
        0,
      )} para ${formatNum(COLECAO.skusAtivos)} SKUs em ${formatNum(REDE.totalLojas)} lojas.`,
    },
    {
      titulo: 'O plano estourou a banda do OTB',
      texto: `O recorte em aprovação soma ${formatBRLCompact(
        PLANO.investimento,
      )} contra OTB de ${formatBRLCompact(PLANO.otbRecorte)}: ${formatDelta(
        PLANO.estouroPct,
      )} (${formatBRLCompact(PLANO.estouroValor, 2)}) acima do teto de ${formatBRLCompact(
        PLANO.teto,
      )}. Precisa de compensação antes da emissão dos pedidos.`,
    },
  ]
}
