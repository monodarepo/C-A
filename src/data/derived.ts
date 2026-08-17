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
  calendario,
  cartelaCores,
  cea,
  clusters,
  concorrentes,
  produtos,
  estilistas,
  fornecedores,
  lojasNomeadas,
  placeholderFor,
  produtoPorCod,
  type LojaNomeada,
  type Produto,
} from '@/lib/cea'
import {
  dataDoSnapshot,
  formatBRL,
  formatBRLCompact,
  formatDelta,
  formatNum,
  formatPct,
  formatPP,
  semanaISO,
} from '@/lib/format'

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

/** Arredonda para N casas — usado onde o número entra em comparação de âncora. */
function arredondar(v: number, casas = 1): number {
  const f = 10 ** casas
  return Math.round(v * f) / f
}

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
  /**
   * R$ 46,42 mi — e não 46,40. O CLAUDE.md traz três âncoras que só fecham
   * entre si com esse valor exato: o plano exibido como "R$ 46,4M", o estouro
   * de "+R$ 1,62 mi" e os "+3,6%" sobre o OTB de 44,8.
   *   46,42 − 44,80 = 1,62 ✓   46,42 ÷ 44,80 − 1 = +3,6% ✓   exibe 46,4 ✓
   * Com 46,40 exato, o estouro cairia para 1,60 e contradiria o âncora.
   * O autoteste (npm run verificar) prova que os três continuam reconciliados.
   */
  investimento: 46_420_000,
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

/* ============================= 20. WORKFLOW DA COLEÇÃO — 16 ETAPAS ======== */

export type StatusEtapa = 'concluida' | 'atual' | 'pendente'

export type Etapa = { numero: number; nome: string; status: StatusEtapa }

/**
 * As 16 etapas do processo de compra, na ordem e com os status da spec.
 * A etapa atual é a Lista de Compras (âncora COLECAO.etapaAtual).
 */
export const ETAPAS_WORKFLOW: Etapa[] = [
  'Workshop Planejamento',
  'Atualização do Plano',
  'Workshop Estilo',
  'Análise Performance',
  'Lista de Compras',
  'Mapa da Coleção',
  'Double Check',
  'Montagem Line',
  'Negociação',
  'Emissão Pedidos',
  'Aprovações',
  'Agendamento',
  'Entrega CD',
  'Envio Lojas',
  'Acompanhamento',
  'Ajustes do Plano',
].map((nome, i) => {
  const indiceAtual = 4 // Lista de Compras é a 5ª etapa
  return {
    numero: i + 1,
    nome,
    status: i < indiceAtual ? 'concluida' : i === indiceAtual ? 'atual' : 'pendente',
  } as Etapa
})

/* -------------------------------------------------- áreas e responsáveis -- */

export type Area = 'Estilo' | 'Planejamento' | 'Compras' | 'Importação'

export const AREAS: Area[] = ['Estilo', 'Planejamento', 'Compras', 'Importação']

/** Quem responde por cada área (pessoas FICTÍCIAS do snapshot). */
export const RESPONSAVEIS: { nome: string; area: Area; time: string }[] = [
  { nome: PLANNER.nome, area: 'Planejamento', time: PLANNER.area },
  ...estilistas.map((e) => ({
    nome: e.nome,
    area: (e.time.includes('Denim') || e.time.includes('Infantil') ? 'Compras' : 'Estilo') as Area,
    time: e.time,
  })),
  { nome: 'Sérgio Matos', area: 'Importação', time: 'Importação & Sourcing' },
]

/* ------------------------------------------------ 21 entregas do kanban -- */

export type Entrega = {
  id: string
  etapa: number
  titulo: string
  responsavel: string
  area: Area
  /** semana ISO do prazo — o seletor de semana da tela compara com esta */
  semana: number
  comentarios: number
  anexos: number
  /** referências reais citadas no card */
  refs: string[]
}

/**
 * As 21 entregas da coleção (âncora COLECAO.entregas), distribuídas pelas
 * etapas. Os cards citam referências REAIS do catálogo.
 */
export const ENTREGAS_WORKFLOW: Entrega[] = [
  // etapas concluídas
  { id: 'E01', etapa: 1, titulo: 'Premissas de verba e sazonalidade fechadas', responsavel: PLANNER.nome, area: 'Planejamento', semana: 12, comentarios: 4, anexos: 2, refs: [] },
  { id: 'E02', etapa: 1, titulo: 'Calendário de compras validado com Importação', responsavel: 'Sérgio Matos', area: 'Importação', semana: 12, comentarios: 2, anexos: 1, refs: [] },
  { id: 'E03', etapa: 2, titulo: 'Plano revisado após leitura do 1T26', responsavel: PLANNER.nome, area: 'Planejamento', semana: 14, comentarios: 6, anexos: 3, refs: [] },
  { id: 'E04', etapa: 3, titulo: 'Cartela Tropicália aprovada (mocha + floral pequeno)', responsavel: 'Helena Prado', area: 'Estilo', semana: 15, comentarios: 9, anexos: 5, refs: [] },
  { id: 'E05', etapa: 3, titulo: 'Cápsula Mindse7 definida', responsavel: 'Théo Lima', area: 'Estilo', semana: 16, comentarios: 3, anexos: 4, refs: [] },
  { id: 'E06', etapa: 4, titulo: 'Leitura de best e slow sellers do verão anterior', responsavel: PLANNER.nome, area: 'Planejamento', semana: 17, comentarios: 5, anexos: 2, refs: ['1083993'] },
  { id: 'E07', etapa: 4, titulo: 'Performance de wide leg por lavagem', responsavel: 'Rafael Nunes', area: 'Compras', semana: 18, comentarios: 4, anexos: 3, refs: ['1033472'] },
  // etapa atual — Lista de Compras
  { id: 'E08', etapa: 5, titulo: 'Lista de compras do dorsal de básicos', responsavel: 'Letícia Ramos', area: 'Compras', semana: 20, comentarios: 7, anexos: 2, refs: ['1049412', '1046556'] },
  { id: 'E09', etapa: 5, titulo: 'Recompra da Wide Leg 100% algodão', responsavel: 'Rafael Nunes', area: 'Compras', semana: 20, comentarios: 5, anexos: 1, refs: ['1033472'] },
  { id: 'E10', etapa: 5, titulo: 'Programa de 6 cores do vestido de linho', responsavel: 'Helena Prado', area: 'Estilo', semana: 20, comentarios: 8, anexos: 4, refs: ['1075684'] },
  { id: 'E11', etapa: 5, titulo: 'Grade do sutiã de renda por tamanho', responsavel: 'Letícia Ramos', area: 'Compras', semana: 21, comentarios: 3, anexos: 2, refs: ['7413962'] },
  { id: 'E12', etapa: 5, titulo: 'Quantidades da vitrine de festa', responsavel: 'Júlia Sales', area: 'Estilo', semana: 21, comentarios: 6, anexos: 3, refs: ['1086292', '1096942'] },
  // etapas pendentes
  { id: 'E13', etapa: 6, titulo: 'Parede de setembro — zonas Vitrine/Dorsal/Need', responsavel: 'Helena Prado', area: 'Estilo', semana: 22, comentarios: 2, anexos: 6, refs: [] },
  { id: 'E14', etapa: 7, titulo: 'Double check de coerência de clima por cluster', responsavel: PLANNER.nome, area: 'Planejamento', semana: 23, comentarios: 1, anexos: 1, refs: ['1096942'] },
  { id: 'E15', etapa: 8, titulo: 'Montagem do line com 3 fornecedores', responsavel: 'Rafael Nunes', area: 'Compras', semana: 24, comentarios: 0, anexos: 2, refs: [] },
  { id: 'E16', etapa: 9, titulo: 'Negociação de preço do patchwork', responsavel: 'Rafael Nunes', area: 'Compras', semana: 25, comentarios: 2, anexos: 1, refs: ['1099133'] },
  { id: 'E17', etapa: 10, titulo: 'OC da Wide Leg para o CD Barueri', responsavel: 'Rafael Nunes', area: 'Compras', semana: 26, comentarios: 1, anexos: 2, refs: ['1033472'] },
  { id: 'E18', etapa: 11, titulo: 'Aprovação de cor do patchwork bicolor', responsavel: 'Helena Prado', area: 'Estilo', semana: 26, comentarios: 4, anexos: 3, refs: ['1099133'] },
  { id: 'E19', etapa: 12, titulo: 'Agendamento de recebimento no CD RJ', responsavel: 'Sérgio Matos', area: 'Importação', semana: 28, comentarios: 0, anexos: 1, refs: [] },
  { id: 'E20', etapa: 13, titulo: 'Entrega do vestido de linho — D-15', responsavel: 'Sérgio Matos', area: 'Importação', semana: 30, comentarios: 3, anexos: 2, refs: ['1075684'] },
  { id: 'E21', etapa: 15, titulo: 'Acompanhamento de reposição de NOS', responsavel: 'Letícia Ramos', area: 'Compras', semana: 32, comentarios: 2, anexos: 1, refs: ['1049412', '7413962'] },
]

/* ==================== 21. CALENDÁRIO ANUAL DE COMPRAS (Gantt 52 semanas) == */

export const ANO_CALENDARIO = 2026
export const SEMANAS_NO_ANO = 52

export type Trilha = 'Nacional' | 'Importado'

export type Campanha = {
  nome: string
  semanaInicio: number
  semanaFim: number
  /** true = confirmada em fonte pública (release/site), false = janela padrão de varejo */
  real: boolean
  obs?: string
}

/** Meses do snapshot → janela de semanas ISO do mês em 2026. */
const MES_PARA_NUMERO: Record<string, number> = {
  Jan: 1, Fev: 2, Mar: 3, Abr: 4, Mai: 5, Jun: 6,
  Jul: 7, Ago: 8, Set: 9, Out: 10, Nov: 11, Dez: 12,
}

function semanasDoMes(mes: string): [number, number] {
  const m = MES_PARA_NUMERO[mes]
  const primeiro = new Date(Date.UTC(ANO_CALENDARIO, m - 1, 1))
  const ultimo = new Date(Date.UTC(ANO_CALENDARIO, m, 0))
  return [semanaISO(primeiro), Math.min(semanaISO(ultimo), SEMANAS_NO_ANO)]
}

/**
 * Linha CAMPANHAS do Gantt, derivada do calendário comercial REAL do snapshot.
 * Datas exatas viram janela de 3 semanas (2 de preparação + a semana do evento),
 * convenção de campanha no varejo. Eventos de mês/período usam o mês inteiro.
 */
export const CAMPANHAS: Campanha[] = [
  // liquidação de janeiro: janela padrão pós-Natal, não vem do snapshot
  { nome: 'Liquidação de Verão', semanaInicio: 1, semanaFim: 4, real: false },
  ...calendario
    .filter((e): e is typeof e & { evento: string } => Boolean(e.evento))
    .map((e) => {
      if (e.data) {
        const semana = semanaISO(dataDoSnapshot(e.data))
        return {
          nome: e.evento,
          semanaInicio: Math.max(1, semana - 2),
          semanaFim: semana,
          real: true,
          obs: e.obs,
        }
      }
      if (e.periodo) {
        // "Jun–Jul/2026" → do início de junho ao fim de julho
        const [de, ate] = e.periodo.replace(/\/\d+/, '').split('–')
        const [ini] = semanasDoMes(de.trim())
        const [, fim] = semanasDoMes(ate.trim())
        return { nome: e.evento, semanaInicio: ini, semanaFim: fim, real: true, obs: e.obs }
      }
      const [ini, fim] = semanasDoMes(e.mes ?? 'Jan')
      return { nome: e.evento, semanaInicio: ini, semanaFim: fim, real: true, obs: e.obs }
    }),
].sort((a, b) => a.semanaInicio - b.semanaInicio)

/* ------------------------------------------------- atividades do Gantt --- */

export type Atividade = {
  id: string
  colecao: string
  trilha: Trilha
  area: Area
  nome: string
  semanaInicio: number
  semanaFim: number
}

/** Pool de atividades por área, com deslocamento e duração em semanas. */
const MODELO_ATIVIDADES: Record<Area, { nome: string; offset: number; duracao: number; trilha: Trilha }[]> = {
  Estilo: [
    { nome: 'Workshop de Estilo', offset: 0, duracao: 2, trilha: 'Nacional' },
    { nome: 'Pesquisa de tendência', offset: 1, duracao: 3, trilha: 'Nacional' },
    { nome: 'Cartela de cores', offset: 3, duracao: 2, trilha: 'Nacional' },
    { nome: 'Mapa da Coleção', offset: 5, duracao: 3, trilha: 'Nacional' },
    { nome: 'Double check de estilo', offset: 8, duracao: 1, trilha: 'Nacional' },
    { nome: 'Aprovação de cor importada', offset: 6, duracao: 2, trilha: 'Importado' },
  ],
  Planejamento: [
    { nome: 'Workshop de Planejamento', offset: 0, duracao: 2, trilha: 'Nacional' },
    { nome: 'Atualização do Plano', offset: 2, duracao: 2, trilha: 'Nacional' },
    { nome: 'Análise de performance', offset: 3, duracao: 2, trilha: 'Nacional' },
    { nome: 'Habilitadores e clusterização', offset: 5, duracao: 2, trilha: 'Nacional' },
    { nome: 'Retroalimentação do plano', offset: 9, duracao: 2, trilha: 'Nacional' },
  ],
  Compras: [
    { nome: 'Lista de Compras', offset: 6, duracao: 3, trilha: 'Nacional' },
    { nome: 'Montagem do Line', offset: 9, duracao: 2, trilha: 'Nacional' },
    { nome: 'Negociação nacional', offset: 10, duracao: 2, trilha: 'Nacional' },
    { nome: 'Emissão de pedidos', offset: 12, duracao: 2, trilha: 'Nacional' },
    { nome: 'Lista de Compras importada', offset: 2, duracao: 3, trilha: 'Importado' },
    { nome: 'Negociação importada', offset: 5, duracao: 3, trilha: 'Importado' },
    { nome: 'Emissão de pedidos importados', offset: 8, duracao: 2, trilha: 'Importado' },
  ],
  Importação: [
    { nome: 'Sourcing Ásia', offset: 0, duracao: 4, trilha: 'Importado' },
    { nome: 'Aprovação de amostra', offset: 4, duracao: 2, trilha: 'Importado' },
    { nome: 'Reserva de container', offset: 9, duracao: 1, trilha: 'Importado' },
    { nome: 'Booking e embarque', offset: 10, duracao: 2, trilha: 'Importado' },
    { nome: 'Trânsito marítimo', offset: 12, duracao: 6, trilha: 'Importado' },
    { nome: 'Desembaraço aduaneiro', offset: 18, duracao: 2, trilha: 'Importado' },
    { nome: 'Inspeção de qualidade', offset: 20, duracao: 1, trilha: 'Importado' },
    { nome: 'Entrega no CD', offset: 21, duracao: 1, trilha: 'Importado' },
    { nome: 'Envio para lojas', offset: 22, duracao: 2, trilha: 'Importado' },
  ],
}

/**
 * As 4 coleções do calendário. A contagem por área é explícita para fechar
 * exatamente os cards-âncora da tela: Estilo 23 · Planejamento 17 ·
 * Compras 26 · Importação 36 (102 atividades no ano).
 */
const COLECOES_CALENDARIO: {
  nome: string
  semanaInicio: number
  quantidades: Record<Area, number>
}[] = [
  { nome: 'Verão 1 · 26-27', semanaInicio: 3, quantidades: { Estilo: 6, Planejamento: 4, Compras: 7, Importação: 9 } },
  { nome: 'Verão 2 · 27', semanaInicio: 15, quantidades: { Estilo: 6, Planejamento: 4, Compras: 7, Importação: 9 } },
  { nome: 'Inverno 1 · 27', semanaInicio: 24, quantidades: { Estilo: 6, Planejamento: 5, Compras: 6, Importação: 9 } },
  { nome: 'Inverno 2 · 27', semanaInicio: 33, quantidades: { Estilo: 5, Planejamento: 4, Compras: 6, Importação: 9 } },
]

export const COLECOES_DO_CALENDARIO = COLECOES_CALENDARIO.map((c) => c.nome)

function gerarAtividades(): Atividade[] {
  const out: Atividade[] = []
  for (const col of COLECOES_CALENDARIO) {
    for (const area of AREAS) {
      const modelos = MODELO_ATIVIDADES[area].slice(0, col.quantidades[area])
      modelos.forEach((m, i) => {
        const inicio = Math.min(col.semanaInicio + m.offset, SEMANAS_NO_ANO)
        out.push({
          id: `${col.nome}-${area}-${i}`,
          colecao: col.nome,
          trilha: m.trilha,
          area,
          nome: m.nome,
          semanaInicio: inicio,
          semanaFim: Math.min(inicio + m.duracao - 1, SEMANAS_NO_ANO),
        })
      })
    }
  }
  return out
}

export const ATIVIDADES_CALENDARIO: Atividade[] = gerarAtividades()

/** Cards de contagem do topo do calendário: 23 / 17 / 26 / 36. */
export const CONTAGEM_POR_AREA = AREAS.map((area) => ({
  area,
  total: ATIVIDADES_CALENDARIO.filter((a) => a.area === area).length,
}))

/* --------------------------------------------------------- conflitos ----- */

export type Conflito = {
  id: string
  titulo: string
  descricao: string
  atividadeId: string
  /** semanas a deslocar quando a sugestão é aplicada */
  deslocamento: number
  sugestao: string
}

/**
 * Os 2 conflitos abertos do âncora. Cada um aponta para uma atividade real do
 * Gantt: aplicar a sugestão desloca a barra e o conflito desaparece.
 */
export const CONFLITOS_CALENDARIO: Conflito[] = [
  {
    id: 'C1',
    titulo: 'Estilo em duas coleções na mesma semana',
    descricao:
      'O Workshop de Estilo do Inverno 1 abre na mesma semana em que o Mapa da Coleção do Verão 2 precisa fechar. A mesma equipe de estilo responde pelos dois.',
    atividadeId: 'Inverno 1 · 27-Estilo-0',
    deslocamento: 2,
    sugestao: 'Adiar o Workshop de Estilo do Inverno 1 em 2 semanas',
  },
  {
    id: 'C2',
    titulo: 'Recebimento no CD durante a Black Friday',
    descricao:
      'A entrega no CD do Inverno 2 cai na janela de Black Friday, quando os dois CDs operam no limite para reposição de loja.',
    atividadeId: 'Inverno 2 · 27-Importação-7',
    deslocamento: -3,
    sugestao: 'Antecipar a entrega no CD em 3 semanas',
  },
]

/* -------------------------------------------------------- premissas ------ */

export const PREMISSAS_CALENDARIO: { titulo: string; texto: string }[] = [
  {
    titulo: 'Lead time nacional de 45 dias',
    texto:
      'Da emissão do pedido à entrega no CD. Fornecedores de malha e jeans do Nordeste e do Sul operam nessa janela.',
  },
  {
    titulo: 'Lead time importado de 90 dias',
    texto:
      'Sourcing na Ásia, trânsito marítimo e desembaraço. É o que empurra a lista de compras importada para antes da nacional.',
  },
  {
    titulo: 'Coleção de 120 dias em loja',
    texto:
      'O segmento N5 separa a coleção (120 dias) do dorsal/NOS, que é reposto continuamente e não entra neste calendário.',
  },
  {
    titulo: 'Dois CDs, uma janela',
    texto:
      'Barueri e Rio de Janeiro compartilham o pico de recebimento. Duas coleções não podem descarregar na mesma semana.',
  },
]

/* ================================= 22. OTB — COMPARATIVO POR CATEGORIA ==== */

export type LinhaOTB = {
  categoria: string
  /** caminho na árvore mercadológica REAL (validado contra o JSON) */
  n1: string
  n2: string
  n3: string
  /** R$ milhões */
  plano: number
  ly: number
  otb: number
  atb: number
  margem: number
  coberturaSemanas: number
  /** participação do segmento N5 "Coleção 120d" (o resto é Dorsal/NOS) */
  pctColecao: number
}

/**
 * Comparativo do OTB por categoria (R$ milhões).
 *
 * ATENÇÃO — os valores de TOP MALHA (512 · 486 · +5,3% · 208 · 59,8% · 10,2s) e
 * da linha TOTAL (2.180 · 2.030 · 890 · 59,4%) são os âncoras da spec. O
 * blueprint §4.2, que traria as demais linhas, não estava disponível: as 7
 * categorias intermediárias foram derivadas para FECHAR exatamente nos totais
 * âncora (plano 2.180 · LY 2.030 · OTB 890 · ATB 228 · margem ponderada 59,4%),
 * usando a árvore mercadológica real. Se o blueprint aparecer, é só substituir
 * esta tabela — o autoteste garante que os totais continuam fechando.
 */
export const OTB_CATEGORIAS: LinhaOTB[] = [
  { categoria: 'Top Malha', n1: 'Feminino', n2: 'Roupas', n3: 'Blusas e Camisetas', plano: 512, ly: 486, otb: 208, atb: 48, margem: 59.8, coberturaSemanas: 10.2, pctColecao: 45 },
  { categoria: 'Jeans', n1: 'Jeans', n2: '&jeans', n3: 'Calças Femininas', plano: 386, ly: 352, otb: 158, atb: 42, margem: 61.2, coberturaSemanas: 11.4, pctColecao: 72 },
  { categoria: 'Masculino', n1: 'Masculino', n2: 'Roupas', n3: 'Camisetas e Regatas', plano: 336, ly: 318, otb: 136, atb: 32, margem: 56.8, coberturaSemanas: 10.8, pctColecao: 52 },
  { categoria: 'Vestidos', n1: 'Feminino', n2: 'Roupas', n3: 'Vestidos', plano: 298, ly: 281, otb: 122, atb: 34, margem: 60.5, coberturaSemanas: 9.6, pctColecao: 88 },
  { categoria: 'Infantil', n1: 'Infantil', n2: '4 a 12 anos', n3: 'Blusas', plano: 274, ly: 262, otb: 112, atb: 28, margem: 57.4, coberturaSemanas: 9.2, pctColecao: 61 },
  { categoria: 'Moda Íntima', n1: 'Feminino', n2: 'Moda Íntima', n3: 'Sutiãs e Tops', plano: 158, ly: 151, otb: 62, atb: 16, margem: 62.3, coberturaSemanas: 13.1, pctColecao: 24 },
  { categoria: 'Alfaiataria', n1: 'Feminino', n2: 'Roupas', n3: 'Alfaiataria', plano: 122, ly: 108, otb: 50, atb: 14, margem: 59.9, coberturaSemanas: 12.2, pctColecao: 79 },
  { categoria: 'Esportivo ACE', n1: 'Esportivo', n2: 'ACE', n3: 'Leggings', plano: 94, ly: 72, otb: 42, atb: 14, margem: 55.8, coberturaSemanas: 8.7, pctColecao: 66 },
]

/** Meta de margem do vestuário (fonte pública: financeiro.usoNoApp). */
export const META_MARGEM_OTB = 59

export type TotaisOTB = {
  plano: number
  ly: number
  varPct: number
  otb: number
  atb: number
  comprometido: number
  margem: number
  coberturaSemanas: number
}

/** Totais do comparativo — sempre calculados das linhas, nunca digitados. */
export function totaisOTB(linhas: LinhaOTB[]): TotaisOTB {
  const plano = soma(linhas.map((l) => l.plano))
  const ly = soma(linhas.map((l) => l.ly))
  const otb = soma(linhas.map((l) => l.otb))
  const atb = soma(linhas.map((l) => l.atb))
  return {
    plano,
    ly,
    varPct: ly ? (plano / ly - 1) * 100 : 0,
    otb,
    atb,
    comprometido: otb - atb,
    margem: plano ? soma(linhas.map((l) => l.margem * l.plano)) / plano : 0,
    coberturaSemanas: plano ? soma(linhas.map((l) => l.coberturaSemanas * l.plano)) / plano : 0,
  }
}

export const TOTAIS_OTB = totaisOTB(OTB_CATEGORIAS)

/** Níveis da hierarquia N1–N7 (texto do snapshot). O OTB é aprovado até N3. */
export const NIVEIS_HIERARQUIA = [
  { nivel: 'N1', rotulo: 'Departamento', ativo: true },
  { nivel: 'N2', rotulo: 'Público / Linha', ativo: true },
  { nivel: 'N3', rotulo: 'Categoria', ativo: true },
  { nivel: 'N4', rotulo: 'Subcategoria', ativo: false },
  { nivel: 'N5', rotulo: 'Segmento', ativo: true },
  { nivel: 'N6', rotulo: 'Programa', ativo: false },
  { nivel: 'N7', rotulo: 'Variante (cor)', ativo: false },
] as const

export const SEGMENTOS_N5 = ['Coleção 120d', 'Dorsal / NOS'] as const

/** Recorte do OTB por segmento N5 — divide cada categoria pelo seu pctColecao. */
export function recortarPorSegmento(
  linhas: LinhaOTB[],
  segmento: (typeof SEGMENTOS_N5)[number] | 'todos',
): LinhaOTB[] {
  if (segmento === 'todos') return linhas
  const fator = (l: LinhaOTB) =>
    segmento === 'Coleção 120d' ? l.pctColecao / 100 : 1 - l.pctColecao / 100
  return linhas.map((l) => ({
    ...l,
    plano: Math.round(l.plano * fator(l)),
    ly: Math.round(l.ly * fator(l)),
    otb: Math.round(l.otb * fator(l)),
    atb: Math.round(l.atb * fator(l)),
  }))
}

/* ---------------------------------------------- curva mensal AGO–FEV ----- */

export type MesOTB = {
  mes: string
  plano: number
  ly: number
  /** estoque projetado de fim de mês, R$ milhões */
  estoque: number
}

/**
 * Sazonalidade do verão 26-27 (R$ milhões). Soma = âncoras 2.180 e 2.030, e
 * DEZ fecha em 402 × 371 (+8,4%), o exemplo de tooltip da spec.
 */
export const OTB_MENSAL: MesOTB[] = [
  { mes: 'AGO', plano: 248, ly: 236, estoque: 612 },
  { mes: 'SET', plano: 272, ly: 258, estoque: 638 },
  { mes: 'OUT', plano: 306, ly: 288, estoque: 690 },
  { mes: 'NOV', plano: 358, ly: 332, estoque: 742 },
  { mes: 'DEZ', plano: 402, ly: 371, estoque: 668 },
  { mes: 'JAN', plano: 336, ly: 306, estoque: 520 },
  { mes: 'FEV', plano: 258, ly: 239, estoque: 432 },
]

/** Semanas por mês (365/12/7) — converte venda mensal em venda semanal. */
const SEMANAS_POR_MES = 4.345

/** Mensal com crescimento % e cobertura em semanas, ambos DERIVADOS. */
export const OTB_MENSAL_CALCULADO = OTB_MENSAL.map((m) => ({
  ...m,
  crescimento: Number(((m.plano / m.ly - 1) * 100).toFixed(1)),
  coberturaSemanas: Number((m.estoque / (m.plano / SEMANAS_POR_MES)).toFixed(1)),
}))

/* ------------------------------------------ indicadores para decisão ----- */

export type IndicadorDecisao = { tom: 'warn' | 'ok'; titulo: string; texto: string }

/** 2 alertas + 1 sucesso, todos calculados da tabela e dos âncoras. */
export function indicadoresOTB(linhas: LinhaOTB[] = OTB_CATEGORIAS): IndicadorDecisao[] {
  const t = totaisOTB(linhas)
  const abaixoDaMeta = linhas.filter((l) => l.margem < META_MARGEM_OTB)
  const pesoAbaixo = t.plano ? (soma(abaixoDaMeta.map((l) => l.plano)) / t.plano) * 100 : 0
  const folgaMarkdown = OTB.markdownPlanejado - DASHBOARD.markdownAcumulado
  const atbSobreOtb = t.otb ? (t.atb / t.otb) * 100 : 0
  const maiorCobertura = [...linhas].sort((a, b) => b.coberturaSemanas - a.coberturaSemanas)[0]

  return [
    {
      tom: 'warn',
      titulo: `${abaixoDaMeta.length} categorias abaixo da meta de margem`,
      texto: `${abaixoDaMeta.map((l) => l.categoria).join(', ')} planejam margem abaixo dos ${formatPct(META_MARGEM_OTB, 0)} de meta e respondem por ${formatPct(pesoAbaixo)} do plano. O mix pressiona a margem consolidada de ${formatPct(t.margem)} — ou o preço sobe, ou o custo cai antes da emissão.`,
    },
    {
      tom: 'warn',
      titulo: 'Verba de remarcação sem folga se o sell-through não vier',
      texto: `O plano prevê markdown de ${formatPct(OTB.markdownPlanejado)} contra ${formatPct(DASHBOARD.markdownAcumulado)} já realizados — ${formatPP(folgaMarkdown)} de folga para o resto da temporada, condicionados ao sell-through alvo de ${formatPct(OTB.sellThroughAlvo, 0)}. ${maiorCobertura.categoria} entra com ${formatNum(maiorCobertura.coberturaSemanas, 1)} semanas de cobertura, a maior da tabela.`,
    },
    {
      tom: 'ok',
      titulo: 'ATB preservado para reagir dentro da temporada',
      texto: `Dos ${formatBRLCompact(t.otb * 1e6)} de OTB, ${formatBRLCompact(t.atb * 1e6)} seguem como ATB — ${formatPct(atbSobreOtb)} da verba livre para recompra de best sellers, contra ${formatBRLCompact(t.comprometido * 1e6)} já comprometidos.`,
    },
  ]
}

/** Rodapé "OTB como insumo" — 3 módulos que consomem esta camada. */
export const OTB_INSUMOS: { titulo: string; texto: string; rota: string }[] = [
  {
    titulo: 'Plano de Sortimento',
    texto:
      'A verba por categoria vira linhas de compra com quantidade, preço e margem. É lá que a banda de OTB é testada.',
    rota: '/plano',
  },
  {
    titulo: 'Distribuição',
    texto:
      'O plano aprovado é quebrado por cluster e loja, respeitando packs e coerência de clima.',
    rota: '/distribuicao',
  },
  {
    titulo: 'Emissão de Pedidos',
    texto: 'O comprometido desta tela é o que já virou ordem de compra integrada ao ERP.',
    rota: '/emissao',
  },
]

/** Minutos desde a última leitura do ERP (âncora da spec). */
export const OTB_ULTIMA_LEITURA_MIN = 18

/**
 * Autoteste da hierarquia do OTB: confere que N1 é um departamento REAL do
 * snapshot e que N2/N3 aparecem na árvore mercadológica ou nas categorias dos
 * produtos reais. Evita categoria inventada passando batido na tabela.
 */
export function validarHierarquiaOTB(): string[] {
  const erros: string[] = []
  const arvore = cea.arvoreMercadologica

  // No JSON o nível N2 aparece como CHAVE do objeto ("roupas", "modaIntima"),
  // não como item de array — daí a normalização camelCase → "Moda Íntima".
  const rotuloDaChave = (k: string) =>
    ({
      roupas: 'Roupas',
      modaIntima: 'Moda Íntima',
      modaEsportiva: 'Moda Esportiva',
      modaPraia: 'Moda Praia',
    })[k] ?? k

  const termosDaArvore = new Set<string>([
    ...arvore.departamentos,
    ...Object.keys(arvore.feminino).map(rotuloDaChave),
    ...Object.keys(arvore.masculino).map(rotuloDaChave),
    ...Object.values(arvore.feminino).flat(),
    ...Object.values(arvore.masculino).flat(),
    ...arvore.infantil.faixas,
    ...arvore.infantil.marcas,
    ...arvore.jeans.fitsReais,
    ...arvore.jeans.linhas,
    ...arvore.beleza,
    // categorias e marcas que só aparecem nos produtos reais
    ...cea.produtos.map((p) => p.cat),
    ...cea.produtos.flatMap((p) => (p.marca ? [p.marca] : [])),
    ...cea.marcas.proprias.map((m) => m.split(' (')[0]),
  ])

  for (const l of OTB_CATEGORIAS) {
    if (!arvore.departamentos.includes(l.n1)) {
      erros.push(`N1 "${l.n1}" (${l.categoria}) não é um departamento do snapshot`)
    }
    for (const [nivel, valor] of [
      ['N2', l.n2],
      ['N3', l.n3],
    ] as const) {
      if (!termosDaArvore.has(valor)) {
        erros.push(`${nivel} "${valor}" (${l.categoria}) não existe na árvore mercadológica`)
      }
    }
  }
  return erros
}

/* ========================= 23. HABILITADORES DE SORTIMENTO (Fase 4) ======= */

/** Recorte da tela: a sessão em que os habilitadores estão sendo parametrizados. */
export const RECORTE_HABILITADORES = { n1: 'Feminino', n3: 'Vestidos' } as const

/**
 * Card de verba do recorte. R$ 42,5 mi ÷ R$ 68,90 de custo médio ≈ 616.800 peças
 * (os três âncoras do CLAUDE.md fecham entre si).
 */
export const VERBA_HABILITADORES = {
  verba: PLANO.verbaHabilitadores,
  custoMedio: PLANO.custoMedioHabilitadores,
  pecas: PLANO.pecasHabilitadores,
  margem: 59,
} as const

/* ------------------------------------------- ② gabarito de packs por porte - */

export type Porte5 = 'P' | 'M' | 'G' | 'GG' | 'E-comm'

export const PORTES_GABARITO: Porte5[] = ['P', 'M', 'G', 'GG', 'E-comm']

/**
 * Tamanho do pack. Um pack de loja fecha a curva de 6 tamanhos; o pack de
 * e-commerce é mais profundo (8 peças), porque o CD atende cauda longa.
 * Estes dois números são o que faz P1 (2·3·4·5·6 packs) render exatamente as
 * 132 peças/SKU do âncora: (2+3+4+5)×6 + 6×8 = 132.
 */
export const PACK_LOJA = 6
export const PACK_ECOMM = 8

export type LinhaGabarito = { faixa: FaixaPreco['id']; packs: Record<Porte5, number> }

/**
 * Gabarito por sessão: quantos packs cada porte de loja recebe, por faixa de
 * preço. Faixa mais barata entra mais profunda; o topo da pirâmide é raso.
 */
export const GABARITO_POR_SESSAO: Record<string, LinhaGabarito[]> = {
  Vestidos: [
    { faixa: 'P1', packs: { P: 2, M: 3, G: 4, GG: 5, 'E-comm': 6 } },
    { faixa: 'P2', packs: { P: 2, M: 3, G: 4, GG: 4, 'E-comm': 5 } },
    { faixa: 'P3', packs: { P: 1, M: 2, G: 3, GG: 4, 'E-comm': 4 } },
    { faixa: 'P4', packs: { P: 1, M: 2, G: 2, GG: 3, 'E-comm': 3 } },
    { faixa: 'P5', packs: { P: 1, M: 1, G: 2, GG: 2, 'E-comm': 2 } },
  ],
  'Blusas e Camisetas': [
    { faixa: 'P1', packs: { P: 3, M: 4, G: 6, GG: 7, 'E-comm': 8 } },
    { faixa: 'P2', packs: { P: 3, M: 4, G: 5, GG: 6, 'E-comm': 6 } },
    { faixa: 'P3', packs: { P: 2, M: 3, G: 4, GG: 4, 'E-comm': 5 } },
    { faixa: 'P4', packs: { P: 1, M: 2, G: 2, GG: 3, 'E-comm': 3 } },
    { faixa: 'P5', packs: { P: 1, M: 1, G: 1, GG: 2, 'E-comm': 2 } },
  ],
  Alfaiataria: [
    { faixa: 'P1', packs: { P: 1, M: 2, G: 2, GG: 3, 'E-comm': 4 } },
    { faixa: 'P2', packs: { P: 1, M: 2, G: 3, GG: 3, 'E-comm': 4 } },
    { faixa: 'P3', packs: { P: 1, M: 2, G: 3, GG: 3, 'E-comm': 3 } },
    { faixa: 'P4', packs: { P: 1, M: 1, G: 2, GG: 2, 'E-comm': 3 } },
    { faixa: 'P5', packs: { P: 1, M: 1, G: 1, GG: 2, 'E-comm': 2 } },
  ],
}

export const SESSOES_GABARITO = Object.keys(GABARITO_POR_SESSAO)

/** Peças por SKU: packs de loja × 6 + packs de e-commerce × 8. */
export function pecasPorSku(packs: Record<Porte5, number>): number {
  const deLoja = (['P', 'M', 'G', 'GG'] as Porte5[]).reduce((a, p) => a + packs[p], 0)
  return deLoja * PACK_LOJA + packs['E-comm'] * PACK_ECOMM
}

/* ----------------------------------------- ③ clusterização de verba -------- */

export type CelulaVerba = {
  id: string
  porte: 'P' | 'M' | 'G' | 'GG' | 'E-commerce'
  clima: 'Quente' | 'Fria' | '—'
  pct: number
}

/**
 * Distribuição default da verba: 8 células porte × clima + e-commerce.
 * Soma 100% (82% físico + 18% e-commerce, âncora da spec).
 */
export const CLUSTERIZACAO_DEFAULT: CelulaVerba[] = [
  { id: 'GG-quente', porte: 'GG', clima: 'Quente', pct: 14 },
  { id: 'GG-fria', porte: 'GG', clima: 'Fria', pct: 10 },
  { id: 'G-quente', porte: 'G', clima: 'Quente', pct: 13 },
  { id: 'G-fria', porte: 'G', clima: 'Fria', pct: 9 },
  { id: 'M-quente', porte: 'M', clima: 'Quente', pct: 12 },
  { id: 'M-fria', porte: 'M', clima: 'Fria', pct: 8 },
  { id: 'P-quente', porte: 'P', clima: 'Quente', pct: 10 },
  { id: 'P-fria', porte: 'P', clima: 'Fria', pct: 6 },
  { id: 'ecommerce', porte: 'E-commerce', clima: '—', pct: 18 },
]

/* ------------------------------------------- ④ Dorsal × Need/NID ---------- */

export type MesDorsal = {
  mes: string
  /** % do sortimento que é dorsal em loja de clima quente */
  dorsalQuente: number
  /** idem, clima frio */
  dorsalFrio: number
}

/**
 * Curva de dorsal de setembro a fevereiro. Começa em 92/88 (entrada de verão,
 * quase tudo dorsal) e termina em 55/50 (virada de estação, espaço para Need) —
 * os dois extremos são âncoras da spec.
 * A média das 12 células (71,1%) é o que produz DORSAL R$ 30,2 mi (71%) e
 * NEED R$ 12,3 mi (29%) sobre a verba de R$ 42,5 mi.
 */
export const DORSAL_NEED_DEFAULT: MesDorsal[] = [
  { mes: 'Set', dorsalQuente: 92, dorsalFrio: 88 },
  { mes: 'Out', dorsalQuente: 84, dorsalFrio: 80 },
  { mes: 'Nov', dorsalQuente: 77, dorsalFrio: 72 },
  { mes: 'Dez', dorsalQuente: 70, dorsalFrio: 66 },
  { mes: 'Jan', dorsalQuente: 62, dorsalFrio: 57 },
  { mes: 'Fev', dorsalQuente: 55, dorsalFrio: 50 },
]

export type ResumoDorsal = {
  dorsalPct: number
  dorsalValor: number
  needPct: number
  needValor: number
  mesesComFolga: number
  totalMeses: number
}

/**
 * Um mês tem "folga" quando ainda sobra espaço para reagir: precisa ter Need
 * maior que zero e dorsal em no máximo 95% (acima disso o mês está travado).
 */
export function resumoDorsalNeed(meses: MesDorsal[]): ResumoDorsal {
  const celulas = meses.flatMap((m) => [m.dorsalQuente, m.dorsalFrio])
  const dorsalPct = celulas.length ? soma(celulas) / celulas.length : 0
  const verba = VERBA_HABILITADORES.verba
  const dorsalValor = (verba * dorsalPct) / 100
  return {
    dorsalPct,
    dorsalValor,
    needPct: 100 - dorsalPct,
    needValor: verba - dorsalValor,
    mesesComFolga: meses.filter(
      (m) => m.dorsalQuente <= 95 && m.dorsalFrio <= 95 && m.dorsalQuente < 100,
    ).length,
    totalMeses: meses.length,
  }
}

export const RESUMO_DORSAL_DEFAULT = resumoDorsalNeed(DORSAL_NEED_DEFAULT)

/** Boxes explicativos do bloco ④. */
export const EXPLICACAO_DORSAL_NEED = [
  {
    titulo: 'Dorsal',
    texto:
      'A espinha do sortimento: o que precisa estar em loja todo dia da temporada, em toda loja que vende a categoria. Entra cedo, é reposto e não depende de evento.',
  },
  {
    titulo: 'Need / NID',
    texto:
      'O que entra para atender uma necessidade específica — evento, cápsula, ciclo de tendência ou virada de estação. Need é planejado; NID (Need It Down) é a reação dentro da temporada.',
  },
] as const

/* ==================================== 24. ATRIBUTOS DE PRODUTO (Fase 4) === */

/** Os dois conceitos que a tela existe para separar. */
export const HABILITADORES_VS_ATRIBUTOS = [
  {
    titulo: 'Habilitadores',
    subtitulo: 'Quanto e como comprar',
    texto:
      'Parâmetros de verba e profundidade: pirâmide de preço, gabarito de packs, clusterização e a divisão Dorsal × Need. Respondem "quanto investir e em que profundidade".',
    chips: ['Pirâmide de preço', 'Gabarito de packs', 'Clusterização de verba', 'Dorsal × Need'],
    rota: '/habilitadores',
  },
  {
    titulo: 'Atributos',
    subtitulo: 'O que o produto é',
    texto:
      'Características do produto em si, nos níveis N3 a N7: fit, tecido, padronagem, cor, decote, manga, licença. Respondem "qual produto comprar", não quanto.',
    chips: ['Fit', 'Tecido', 'Padronagem', 'Cor', 'Licença'],
    rota: '/atributos',
  },
] as const

/** Taxonomia em 3 colunas, toda vinda da cartela REAL do snapshot. */
export const TAXONOMIA_ATRIBUTOS: { grupo: string; nivel: string; termos: string[] }[] = [
  { grupo: 'Fits de calça', nivel: 'N4', termos: cea.atributosReais.fitsCalca },
  { grupo: 'Lavagens de jeans', nivel: 'N6', termos: cea.atributosReais.lavagensJeans },
  { grupo: 'Decotes', nivel: 'N6', termos: cea.atributosReais.decotes },
  { grupo: 'Mangas', nivel: 'N6', termos: cea.atributosReais.mangas },
  { grupo: 'Materiais', nivel: 'N5', termos: cea.atributosReais.materiais },
  { grupo: 'Padronagens', nivel: 'N6', termos: cea.atributosReais.padronagens },
  { grupo: 'Cartela de cores', nivel: 'N7', termos: cea.atributosReais.coresCartela },
  { grupo: 'Fits reais de jeans', nivel: 'N4', termos: cea.arvoreMercadologica.jeans.fitsReais },
  { grupo: 'Licenças infantis', nivel: 'N6', termos: cea.marcas.licencasInfantil },
]

/** Janelas de otimização — onde faz sentido otimizar atributo. */
export const JANELAS_OTIMIZACAO = [
  {
    janela: 'Coleção 120d',
    recomendada: true,
    texto: 'Atributo muda a cada coleção: é aqui que otimizar padronagem e cor vira margem.',
  },
  {
    janela: 'Dorsal / NOS',
    recomendada: false,
    texto: 'Dorsal é estável por definição. Mexer em atributo aqui quebra a reposição.',
  },
  {
    janela: 'Evento / cápsula',
    recomendada: false,
    texto: 'A janela é curta e o atributo já vem definido pelo tema do evento.',
  },
] as const

/** Exemplo de otimização de padronagem (âncoras: 6.200 pç · Liso 46% → 2.852). */
export const PECAS_EXEMPLO_PADRONAGEM = 6200

export const EXEMPLO_PADRONAGEM: { padronagem: string; pct: number }[] = [
  { padronagem: 'liso', pct: 46 },
  { padronagem: 'floral pequeno', pct: 18 },
  { padronagem: 'listrado', pct: 11 },
  { padronagem: 'poá', pct: 9 },
  { padronagem: 'animal print', pct: 9 },
  { padronagem: 'xadrez', pct: 7 },
]

/** Distribui as peças do exemplo pelas padronagens, com sobra no maior item. */
export function distribuirPadronagem(pecas = PECAS_EXEMPLO_PADRONAGEM) {
  const linhas = EXEMPLO_PADRONAGEM.map((p) => ({
    ...p,
    pecas: Math.round((pecas * p.pct) / 100),
  }))
  const diferenca = pecas - soma(linhas.map((l) => l.pecas))
  if (diferenca !== 0) linhas[0].pecas += diferenca
  return linhas
}

/** Autoteste: as padronagens do exemplo existem na cartela real. */
export function validarExemploPadronagem(): string[] {
  const cartela = cea.atributosReais.padronagens
  return EXEMPLO_PADRONAGEM.filter((p) => !cartela.includes(p.padronagem)).map(
    (p) => `padronagem "${p.padronagem}" não está em atributosReais.padronagens`,
  )
}

/* ============================== 25. PLANO DE SORTIMENTO (Fase 5) ========== */

export type OrigemPlano =
  | 'OTB'
  | 'Habilitadores'
  | 'Atributos'
  | 'Histórico'
  | 'Best/Slow'
  | 'Estratégia'
  | 'Benchmark'
  | 'Eventos/Ciclos'

export const ORIGENS_PLANO: OrigemPlano[] = [
  'OTB',
  'Habilitadores',
  'Atributos',
  'Histórico',
  'Best/Slow',
  'Estratégia',
  'Benchmark',
  'Eventos/Ciclos',
]

export type StatusLinha = 'Dorsal' | 'Repeat' | 'Novo' | 'Evento'

export type LinhaPlano = {
  id: string
  ref: string
  produto: string
  categoria: string
  sessao: string
  papel: string
  cor: string
  faixa: FaixaPreco['id']
  clusterFoco: Cluster
  origem: OrigemPlano
  /** preço de venda planejado */
  pv: number
  margem: number
  /** preço de custo — derivado de pv × (1 − margem) */
  pc: number
  qtd: number
  /** quantidade do Plano Original (baseline imutável) */
  qtdOriginal: number
  status: StatusLinha
  heroi: boolean
  /** de onde veio o PV, quando o snapshot não traz preço */
  fontePreco: string
}

/**
 * As 5 categorias do plano — é o nível em que o /versoes aprova
 * ("X de 5 aprovados").
 */
export const CATEGORIAS_PLANO = [
  'Vestidos',
  'Jeans',
  'Camisetas',
  'Moda Íntima',
  'Infantil & Esportivo',
] as const

const faixaDoPreco = (pv: number): FaixaPreco['id'] =>
  PIRAMIDE_PRECO.find((f) => pv >= f.min && pv <= f.max)?.id ??
  (pv < PIRAMIDE_PRECO[0].min ? 'P1' : 'P5')

/**
 * Semente das 14 linhas: 8 heróis reais + 6 do catálogo.
 * `pv` vem do preço REAL quando o snapshot tem; quando o produto é
 * `hidratar: true` (sem preço no snapshot), usa o preço de referência da faixa
 * da pirâmide, e `fontePreco` registra a escolha.
 */
type SementeLinha = Omit<LinhaPlano, 'pc' | 'qtd' | 'qtdOriginal' | 'faixa'> & { peso: number }

const precoDaFaixa = (id: FaixaPreco['id']) => PIRAMIDE_PRECO.find((f) => f.id === id)!.precoRef

const SEMENTES: SementeLinha[] = [
  // ---------------------------------------------------------- 8 heróis ----
  {
    id: 'L01', ref: '1049412', produto: 'Camiseta básica de algodão manga curta',
    categoria: 'Camisetas', sessao: 'Masculino', papel: 'NOS / Dorsal', cor: 'Preto +22 cores',
    clusterFoco: 'B', origem: 'Histórico', pv: 29.99, margem: 62, status: 'Dorsal',
    heroi: true, fontePreco: 'preço real do site', peso: 26,
  },
  {
    id: 'L02', ref: '1046556', produto: 'Camiseta algodão peruano bold manga curta',
    categoria: 'Camisetas', sessao: 'Masculino', papel: 'Premium básico (trade-up)',
    cor: 'Branco', clusterFoco: 'A', origem: 'Benchmark', pv: 55.99, margem: 58,
    status: 'Repeat', heroi: true, fontePreco: 'preço real do site', peso: 7,
  },
  {
    id: 'L03', ref: '1033472', produto: 'Calça wide leg jeans cintura alta',
    categoria: 'Jeans', sessao: 'Jeans', papel: 'Core do programa wide leg', cor: 'Azul claro',
    clusterFoco: 'B', origem: 'Best/Slow', pv: precoDaFaixa('P2'), margem: 61,
    status: 'Repeat', heroi: true, fontePreco: 'sem preço no snapshot — faixa P2 da pirâmide',
    peso: 11,
  },
  {
    id: 'L04', ref: '1099133', produto: 'Calça super wide leg com recortes bicolor patchwork',
    categoria: 'Jeans', sessao: 'Jeans', papel: 'Novo sem histórico', cor: 'Azul bicolor',
    clusterFoco: 'A', origem: 'Atributos', pv: precoDaFaixa('P3'), margem: 59,
    status: 'Novo', heroi: true, fontePreco: 'sem preço no snapshot — faixa P3 da pirâmide',
    peso: 4,
  },
  {
    id: 'L05', ref: '1075684', produto: 'Vestido midi com linho decote quadrado',
    categoria: 'Vestidos', sessao: 'Feminino', papel: 'Dorsal verão — 6 cores',
    cor: 'Natural/Bege +5', clusterFoco: 'B', origem: 'Habilitadores', pv: 159.99, margem: 60,
    status: 'Dorsal', heroi: true, fontePreco: 'preço real do site', peso: 9,
  },
  {
    id: 'L06', ref: '1086292', produto: 'Vestido midi halterneck linho bordado floral',
    categoria: 'Vestidos', sessao: 'Feminino', papel: 'Vitrine / festa', cor: 'Bege/Amarelo',
    clusterFoco: 'A', origem: 'Estratégia', pv: precoDaFaixa('P4'), margem: 64,
    status: 'Novo', heroi: true, fontePreco: 'sem preço no snapshot — faixa P4 da pirâmide',
    peso: 3,
  },
  {
    id: 'L07', ref: '1096942', produto: 'Vestido midi peplum de laise com recorte',
    categoria: 'Vestidos', sessao: 'Feminino', papel: 'Evento — Dia dos Namorados',
    cor: 'Vermelho', clusterFoco: 'A', origem: 'Eventos/Ciclos', pv: precoDaFaixa('P3'),
    margem: 62, status: 'Evento', heroi: true,
    fontePreco: 'sem preço no snapshot — faixa P3 da pirâmide', peso: 3,
  },
  {
    id: 'L08', ref: '7413962', produto: 'Sutiã meia taça canelado com renda',
    categoria: 'Moda Íntima', sessao: 'Feminino', papel: 'NOS íntimo — grade crítica',
    cor: 'Preto', clusterFoco: 'C', origem: 'Histórico', pv: 69.99, margem: 64,
    status: 'Dorsal', heroi: true, fontePreco: 'coração da faixa de sutiãs do snapshot',
    peso: 12,
  },
  // ------------------------------------------ 6 linhas do catálogo --------
  {
    id: 'L09', ref: 'CAT-01', produto: 'Vestido midi algodão decote quadrado básico',
    categoria: 'Vestidos', sessao: 'Feminino', papel: 'P1 entrada / básico dorsal',
    cor: 'Verde +4', clusterFoco: 'C', origem: 'OTB', pv: 99.99, margem: 56,
    status: 'Dorsal', heroi: false, fontePreco: 'preço real do site', peso: 8,
  },
  {
    id: 'L10', ref: 'CAT-02', produto: 'Sutiã renda sem bojo', categoria: 'Moda Íntima',
    sessao: 'Feminino', papel: 'Programa 6 cores', cor: 'Preto +6', clusterFoco: 'C',
    origem: 'Habilitadores', pv: 59.99, margem: 63, status: 'Repeat', heroi: false,
    fontePreco: 'preço real do site', peso: 9,
  },
  {
    id: 'L11', ref: 'CAT-03', produto: 'Camiseta infantil capivara com glitter',
    categoria: 'Infantil & Esportivo', sessao: 'Infantil', papel: 'Best seller lúdico',
    cor: 'Off white', clusterFoco: 'C', origem: 'Best/Slow', pv: 59.99, margem: 57,
    status: 'Repeat', heroi: false, fontePreco: 'preço real do site', peso: 7,
  },
  {
    id: 'L12', ref: 'CAT-04', produto: 'Vestido midi sem alça tule franzido poá — Mindse7',
    categoria: 'Vestidos', sessao: 'Feminino', papel: 'Cápsula jovem', cor: 'Off white',
    clusterFoco: 'A', origem: 'Atributos', pv: 199.99, margem: 61, status: 'Novo',
    heroi: false, fontePreco: 'preço real do site', peso: 2,
  },
  {
    id: 'L13', ref: 'CAT-05', produto: 'Legging ACE poliamida cintura alta',
    categoria: 'Infantil & Esportivo', sessao: 'Esportivo', papel: 'Marca própria esportiva',
    cor: 'Preto', clusterFoco: 'A', origem: 'Estratégia',
    pv: (precoDaFaixa('P1') + precoDaFaixa('P2')) / 2, margem: 58, status: 'Novo',
    heroi: false, fontePreco: 'sem preço no snapshot — média das faixas P1 e P2', peso: 4,
  },
  {
    id: 'L14', ref: '1114492', produto: 'Calça wide leg jeans com brilhos cintura alta',
    categoria: 'Jeans', sessao: 'Jeans', papel: 'Ciclo de tendência', cor: 'Preto',
    clusterFoco: 'B', origem: 'Benchmark', pv: precoDaFaixa('P3'), margem: 60,
    status: 'Novo', heroi: false, fontePreco: 'sem preço no snapshot — faixa P3 da pirâmide',
    peso: 3,
  },
]

/**
 * Distribui `total` unidades entre os itens de modo que a média ponderada de
 * `valor` caia em `mediaAlvo`. Separa os itens abaixo e acima da média e
 * resolve a fatia de cada grupo — é o que permite fechar dois âncoras ao mesmo
 * tempo (soma de peças E investimento).
 */
function alocarComMedia(
  itens: { peso: number; valor: number }[],
  total: number,
  mediaAlvo: number,
): number[] {
  const baratos = itens.map((it, i) => ({ ...it, i })).filter((it) => it.valor <= mediaAlvo)
  const caros = itens.map((it, i) => ({ ...it, i })).filter((it) => it.valor > mediaAlvo)
  if (!baratos.length || !caros.length) {
    // todos do mesmo lado da média: rateio simples pelo peso
    const somaPesos = soma(itens.map((i) => i.peso))
    return itens.map((it) => Math.round((total * it.peso) / somaPesos))
  }

  const media = (grupo: typeof baratos) =>
    soma(grupo.map((g) => g.peso * g.valor)) / soma(grupo.map((g) => g.peso))
  const mBaratos = media(baratos)
  const mCaros = media(caros)
  // fração das unidades que vai para o grupo caro
  const f = Math.min(1, Math.max(0, (mediaAlvo - mBaratos) / (mCaros - mBaratos)))

  const qtds = new Array(itens.length).fill(0)
  const distribuir = (grupo: typeof baratos, unidades: number) => {
    const somaPesos = soma(grupo.map((g) => g.peso))
    grupo.forEach((g) => {
      qtds[g.i] = Math.round((unidades * g.peso) / somaPesos)
    })
  }
  distribuir(caros, total * f)
  distribuir(baratos, total * (1 - f))

  // sobra do arredondamento vai para a maior linha
  const diferenca = total - soma(qtds)
  if (diferenca !== 0) {
    const maior = qtds.indexOf(Math.max(...qtds))
    qtds[maior] += diferenca
  }
  return qtds
}

/**
 * As 14 linhas do Plano Qualificado.
 *
 * Como os âncoras se amarram: margem ponderada de 59,2% implica que
 * investimento = receita × (1 − 0,592). Com investimento em R$ 46,4 mi e
 * 1.208.400 peças, o PV médio do plano fica em R$ 94,11 — perto do preço médio
 * por peça do histórico (R$ 95,22), o que mantém as telas coerentes.
 * Então: as quantidades são alocadas para fechar as peças E o PV médio; as
 * margens recebem um deslocamento uniforme para a média ponderada bater 59,2%;
 * e o PC sai de pv × (1 − margem) — o investimento cai no âncora por
 * construção.
 */
function gerarLinhasPlano(): LinhaPlano[] {
  const pvMedioAlvo = PLANO.investimento / (1 - PLANO.margem / 100) / PLANO.pecas

  const qtds = alocarComMedia(
    SEMENTES.map((s) => ({ peso: s.peso, valor: s.pv })),
    PLANO.pecas,
    pvMedioAlvo,
  )

  // margem ponderada pela receita precisa fechar no âncora do plano
  const receita = soma(SEMENTES.map((s, i) => s.pv * qtds[i]))
  const margemPonderada = soma(SEMENTES.map((s, i) => s.margem * s.pv * qtds[i])) / receita
  const ajuste = PLANO.margem - margemPonderada

  const linhas = SEMENTES.map((s, i) => {
    const margem = Number((s.margem + ajuste).toFixed(2))
    const resto = { ...s, peso: undefined } as Omit<SementeLinha, 'peso'> & { peso?: number }
    delete resto.peso
    return {
      ...resto,
      margem,
      faixa: faixaDoPreco(s.pv),
      pc: Number((s.pv * (1 - margem / 100)).toFixed(2)),
      qtd: qtds[i],
      qtdOriginal: qtds[i], // ajustado abaixo pelas qualificações
    } satisfies LinhaPlano
  })

  // ------------------------------------------------------ qualificações ---
  // O Plano Original é o baseline: 1.156.000 peças e R$ 44,7 mi. A diferença
  // até o Qualificado são as 7 qualificações abaixo, alocadas para fechar
  // exatamente as duas pontas (peças e investimento).
  const deltaPecas = PLANO.pecas - PLANO.original.pecas
  const deltaInvestimento = PLANO.investimento - PLANO.original.investimento
  const pcMedioDelta = deltaInvestimento / deltaPecas

  const idsQualificados = ['L01', 'L03', 'L05', 'L07', 'L09', 'L11', 'L12']
  const alvos = idsQualificados.map((id) => linhas.find((l) => l.id === id)!)
  const deltas = alocarComMedia(
    alvos.map((l) => ({ peso: Math.max(1, l.qtd / 1000), valor: l.pc })),
    deltaPecas,
    pcMedioDelta,
  )

  alvos.forEach((l, i) => {
    l.qtdOriginal = l.qtd - deltas[i]
  })

  return linhas
}

export const LINHAS_PLANO: LinhaPlano[] = gerarLinhasPlano()

/** Motivo de cada qualificação, para a tabela "Alterações vs Original". */
export const MOTIVOS_QUALIFICACAO: Record<string, string> = {
  L01: 'Ruptura recorrente no dorsal de 22 cores — profundidade elevada por tamanho.',
  L03: 'Sell-through acima da meta no wide leg 100% algodão: recompra aprovada.',
  L05: 'Programa de 6 cores confirmado pela cartela de verão (viscose com linho).',
  L07: 'Vinculado ao Dia dos Namorados — verba estratégica de evento.',
  L09: 'Entrada P1 reforçada para sustentar o ticket dos clusters C e D.',
  L11: 'Best seller lúdico do infantil repetido com glitter na mesma curva.',
  L12: 'Cápsula Mindse7 incluída na leitura de atributo (tule + poá).',
}

/** Totais do plano — sempre calculados das linhas. */
export type TotaisPlano = {
  linhas: number
  pecas: number
  investimento: number
  receita: number
  margem: number
  pcMedio: number
  pvMedio: number
}

export function totaisPlano(
  linhas: LinhaPlano[],
  usar: 'qtd' | 'qtdOriginal' = 'qtd',
): TotaisPlano {
  const pecas = soma(linhas.map((l) => l[usar]))
  const investimento = soma(linhas.map((l) => l[usar] * l.pc))
  const receita = soma(linhas.map((l) => l[usar] * l.pv))
  return {
    linhas: linhas.length,
    pecas,
    investimento,
    receita,
    margem: receita ? (1 - investimento / receita) * 100 : 0,
    pcMedio: pecas ? investimento / pecas : 0,
    pvMedio: pecas ? receita / pecas : 0,
  }
}

export const TOTAIS_PLANO_QUALIFICADO = totaisPlano(LINHAS_PLANO)
export const TOTAIS_PLANO_ORIGINAL = totaisPlano(LINHAS_PLANO, 'qtdOriginal')

/** Onde o investimento cai dentro da banda de OTB (piso · alvo · teto). */
export type PosicaoBanda = {
  investimento: number
  piso: number
  alvo: number
  teto: number
  /** diferença contra o ALVO (o OTB do recorte) */
  desvio: number
  desvioPct: number
  estourou: boolean
  /** posição 0–100 na régua, para desenhar o marcador */
  posicaoPct: number
}

export function posicaoNaBanda(investimento: number): PosicaoBanda {
  const { piso, teto, otbRecorte } = PLANO
  // a régua tem 8% de folga visual de cada lado da banda
  const folga = (teto - piso) * 0.35
  const min = piso - folga
  const max = teto + folga
  return {
    investimento,
    piso,
    alvo: otbRecorte,
    teto,
    desvio: investimento - otbRecorte,
    desvioPct: (investimento / otbRecorte - 1) * 100,
    estourou: investimento > teto,
    posicaoPct: Math.max(0, Math.min(100, ((investimento - min) / (max - min)) * 100)),
  }
}

/** Recortes do /versoes: por qual dimensão agrupar a aprovação. */
export const RECORTES_VERSAO = ['Categoria', 'Sessão', 'Cluster', 'Faixa'] as const

export function chaveDoRecorte(l: LinhaPlano, recorte: (typeof RECORTES_VERSAO)[number]): string {
  if (recorte === 'Categoria') return l.categoria
  if (recorte === 'Sessão') return l.sessao
  if (recorte === 'Cluster') return `Cluster ${l.clusterFoco}`
  return `${l.faixa} · ${PIRAMIDE_PRECO.find((f) => f.id === l.faixa)?.rotulo ?? ''}`
}

/* ================================ 26. MAPA DA COLEÇÃO (Fase 6) ============ */

export type Zona = 'Vitrine' | 'Dorsal' | 'Need'

export const ZONAS: Zona[] = ['Vitrine', 'Dorsal', 'Need']

export type BadgeMapa = 'destaque' | 'novo' | 'repeat' | 'evento'

export type SkuMapa = {
  id: string
  /** código real quando o produto do snapshot tem um */
  cod?: string
  produto: string
  capsula: string
  zona: Zona
  cor: string
  fornecedor: string
  badges: BadgeMapa[]
  /** preço de venda planejado */
  pv: number
  unidades: number
  /** unidades × pv — a parede é avaliada a preço de VENDA, não a custo */
  valorVenda: number
  aprovado: boolean
}

/** As 3 cápsulas da parede e quantos SKUs cada uma tem (âncora 18/21/19 = 58). */
export const CAPSULAS_MAPA = [
  { nome: 'Tropicália', skus: 18 },
  { nome: 'Essenciais', skus: 21 },
  { nome: 'Denim', skus: 19 },
] as const

export const MAPA = {
  estilista: estilistas[0].nome, // Helena Prado
  parede: 'Setembro',
  skus: 58,
  unidades: 1_421_600,
  valorVenda: 186_400_000,
  fornecedores: 8,
  aprovadosPct: 66,
} as const

/**
 * Os 8 fornecedores da parede: os 7 fictícios do snapshot + a Sawary, que é
 * parceira REAL de jeans (marcas.parceiras). Fecha o âncora de 8.
 */
export const FORNECEDORES_MAPA = [
  ...fornecedores,
  cea.marcas.parceiras[0].split(' (')[0], // "Sawary"
]

/** Produtos do snapshot que servem de base para cada cápsula. */
function produtosDaCapsula(nome: string): Produto[] {
  if (nome === 'Tropicália') {
    return cea.produtos.filter((p) => p.cat === 'Vestidos' || p.marca === 'Mindse7')
  }
  if (nome === 'Denim') {
    return cea.produtos.filter((p) => p.dept === 'Jeans')
  }
  // Essenciais: básicos, íntimo, infantil e esportivo
  return cea.produtos.filter(
    (p) =>
      p.dept === 'Masculino' ||
      p.dept === 'Infantil' ||
      p.cat?.startsWith('Moda Íntima') ||
      p.dept === 'Esportivo',
  )
}

/** Preço do produto: real quando existe no snapshot, senão a faixa da pirâmide. */
function pvDoProduto(p: Produto): number {
  if (p.precoPor) return p.precoPor
  if (p.dept === 'Jeans') return precoDaFaixa('P2')
  if (p.cat === 'Vestidos') return precoDaFaixa('P3')
  if (p.cat?.startsWith('Moda Íntima')) return 69.99
  if (p.dept === 'Infantil') return 49.99
  if (p.dept === 'Esportivo') return (precoDaFaixa('P1') + precoDaFaixa('P2')) / 2
  return 55.99
}

/**
 * Zona do SKU pelo papel que ele cumpre — não é sorteio:
 * vitrine = peça de vitrine/festa/novo premium · dorsal = NOS e básico de
 * reposição · need = evento, cápsula licenciada e ciclo de tendência.
 */
function zonaDoProduto(p: Produto, indice: number): Zona {
  const papel = (p.papelNoApp ?? '').toLowerCase()
  if (papel.includes('vitrine') || papel.includes('festa') || papel.includes('premium')) {
    return 'Vitrine'
  }
  if (papel.includes('evento') || papel.includes('cápsula') || papel.includes('ciclo')) {
    return 'Need'
  }
  if (papel.includes('dorsal') || papel.includes('nos') || papel.includes('core')) {
    return 'Dorsal'
  }
  if (p.desc || p.status === 'esgotado') return 'Need' // remarcado entra como need
  // sem papel declarado: preço alto vai para vitrine, o resto alterna dorsal/need
  if (pvDoProduto(p) >= precoDaFaixa('P4')) return 'Vitrine'
  return indice % 3 === 0 ? 'Need' : 'Dorsal'
}

function badgesDoProduto(p: Produto, zona: Zona): BadgeMapa[] {
  const badges: BadgeMapa[] = []
  const papel = (p.papelNoApp ?? '').toLowerCase()
  if (zona === 'Vitrine' || papel.includes('hero')) badges.push('destaque')
  if (papel.includes('novo') || papel.includes('nova')) badges.push('novo')
  if (papel.includes('repeat') || papel.includes('programa') || papel.includes('dorsal')) {
    badges.push('repeat')
  }
  if (papel.includes('evento') || papel.includes('namorados')) badges.push('evento')
  return badges.length ? badges : ['repeat']
}

/**
 * Gera os 58 SKUs da parede.
 * SKU = produto × variante de cor: quando a cápsula tem menos produtos que a
 * meta, expande pelas cores do próprio produto ou pela cartela real (lavagens
 * de jeans, cores da cartela). Todos os nomes vêm do catálogo.
 * As unidades são alocadas para fechar 1.421.600 un E o PV médio da parede
 * (R$ 186,4 mi ÷ 1.421.600 = R$ 131,12), então o valor de venda cai no âncora.
 */
function gerarMapa(): SkuMapa[] {
  const rand = mulberry32(SEED + 606)
  const base: (Omit<SkuMapa, 'unidades' | 'valorVenda' | 'aprovado'> & { peso: number })[] = []

  for (const capsula of CAPSULAS_MAPA) {
    const produtos = produtosDaCapsula(capsula.nome)
    for (let i = 0; i < capsula.skus; i++) {
      const p = produtos[i % produtos.length]
      const voltas = Math.floor(i / produtos.length)
      const variantes =
        p.cores ??
        (p.dept === 'Jeans' ? cea.atributosReais.lavagensJeans : cea.atributosReais.coresCartela)
      const cor = voltas === 0 ? (p.cor ?? variantes[0]) : variantes[voltas % variantes.length]
      const zona = zonaDoProduto(p, i)
      const pv = pvDoProduto(p)
      base.push({
        id: `M${String(base.length + 1).padStart(2, '0')}`,
        cod: p.cod,
        produto: p.nome,
        capsula: capsula.nome,
        zona,
        cor: String(cor),
        fornecedor: FORNECEDORES_MAPA[base.length % FORNECEDORES_MAPA.length],
        badges: badgesDoProduto(p, zona),
        pv,
        // vitrine é rasa, dorsal é profunda — é o que dá o PV médio da parede
        peso: (zona === 'Dorsal' ? 3 : zona === 'Need' ? 1.6 : 1) * jitter(rand, 0.2),
      })
    }
  }

  /* A vitrine é a fatia curada de cima: além das peças cujo papel já é de
     vitrine, promove as de maior preço até a vitrine ocupar ~20% da parede.
     A promoção é feita DENTRO DE CADA CÁPSULA — promovendo globalmente, os
     vestidos (mais caros) levavam toda a vitrine e a cápsula Tropicália
     ficava com 1 card no dorsal. Cada cápsula tem sua própria vitrine. */
  for (const capsula of CAPSULAS_MAPA) {
    const daCapsula = base
      .map((b, i) => ({ i, ...b }))
      .filter((b) => b.capsula === capsula.nome)
    const alvo = Math.round(capsula.skus * 0.2)
    let promovidas = daCapsula.filter((b) => b.zona === 'Vitrine').length
    const candidatas = daCapsula
      .filter((b) => b.zona === 'Dorsal')
      .sort((a, b) => b.pv - a.pv || a.i - b.i)
    for (const c of candidatas) {
      if (promovidas >= alvo) break
      base[c.i].zona = 'Vitrine'
      if (!base[c.i].badges.includes('destaque')) base[c.i].badges.push('destaque')
      promovidas++
    }
  }

  const pvMedioAlvo = MAPA.valorVenda / MAPA.unidades
  const unidades = alocarComMedia(
    base.map((b) => ({ peso: b.peso, valor: b.pv })),
    MAPA.unidades,
    pvMedioAlvo,
  )

  // 66% de 58 = 38 aprovados; escolhe deterministicamente pelos mais avançados
  const aprovadosAlvo = Math.round((MAPA.skus * MAPA.aprovadosPct) / 100)
  const ordemAprovacao = base
    .map((b, i) => ({ i, chave: (b.zona === 'Dorsal' ? 0 : b.zona === 'Vitrine' ? 1 : 2) + rand() }))
    .sort((a, b) => a.chave - b.chave)
    .slice(0, aprovadosAlvo)
    .map((x) => x.i)
  const aprovados = new Set(ordemAprovacao)

  return base.map((b, i) => {
    const { peso: _p, ...resto } = b
    void _p
    return {
      ...resto,
      unidades: unidades[i],
      valorVenda: Math.round(unidades[i] * b.pv),
      aprovado: aprovados.has(i),
    }
  })
}

export const SKUS_MAPA: SkuMapa[] = gerarMapa()

export type TotaisMapa = {
  skus: number
  unidades: number
  valorVenda: number
  fornecedores: number
  aprovados: number
  aprovadosPct: number
  pvMedio: number
}

export function totaisMapa(skus: SkuMapa[]): TotaisMapa {
  const unidades = soma(skus.map((s) => s.unidades))
  const valorVenda = soma(skus.map((s) => s.valorVenda))
  const aprovados = skus.filter((s) => s.aprovado).length
  return {
    skus: skus.length,
    unidades,
    valorVenda,
    fornecedores: new Set(skus.map((s) => s.fornecedor)).size,
    aprovados,
    aprovadosPct: skus.length ? (aprovados / skus.length) * 100 : 0,
    pvMedio: unidades ? valorVenda / unidades : 0,
  }
}

export const TOTAIS_MAPA = totaisMapa(SKUS_MAPA)

/**
 * Pirâmide da parede: participação de SKUs por faixa, contra o alvo.
 * Usa faixaDoPreco (com clamp nas pontas) e NÃO o intervalo estrito: as faixas
 * foram observadas em vestidos (R$ 69–440), então uma camiseta de R$ 29,99
 * ficaria fora de todas e a soma não fecharia 100%.
 */
export function piramideDaParede(skus: SkuMapa[]) {
  return PIRAMIDE_PRECO.map((f) => {
    const naFaixa = skus.filter((s) => faixaDoPreco(s.pv) === f.id)
    return {
      faixa: f.id,
      rotulo: f.rotulo,
      alvo: f.participacao,
      skus: naFaixa.length,
      pct: skus.length ? (naFaixa.length / skus.length) * 100 : 0,
    }
  })
}

/** Cartela Pantone da parede — cores reais do snapshot com o hex do placeholder. */
export const CARTELA_PAREDE = cea.atributosReais.coresCartela.map((cor) => ({
  cor,
  hex: placeholderFor({ nome: cor, cor }).bg,
}))

/* ============================= 27. EVENTOS & CICLOS (Fase 6) ============== */

export type TipoEvento = 'EVENTO' | 'COMERCIAL' | 'CÁPSULA' | 'CICLO' | 'VITRINE'

export type EventoCiclo = {
  id: string
  nome: string
  tipo: TipoEvento
  ativo: boolean
  /** verba estratégica alocada, em R$ */
  verba: number
  janela: string
  /** true = a peça do evento vai para a vitrine */
  emVitrine: boolean
  nota: string
  /** referência real ligada ao evento, quando houver */
  ref?: string
}

/**
 * Os 7 eventos do âncora (6 ativos, 2 em vitrine). Copa do Mundo e Dia dos Pais
 * são REAIS (citados no release 2T26 e na campanha do site); Stitch é licença
 * real do snapshot; os demais são ciclos de sortimento.
 */
export const EVENTOS_CICLOS: EventoCiclo[] = [
  {
    id: 'EV1',
    nome: 'Copa do Mundo',
    tipo: 'EVENTO',
    ativo: true,
    verba: 460_000,
    janela: 'Jun–Jul/2026',
    emVitrine: true,
    nota: 'Citada no release do 2T26 pelo fluxo menor em loja. A camiseta de torcida é a inclusão do Mapa.',
  },
  {
    id: 'EV2',
    nome: 'Dia dos Pais',
    tipo: 'COMERCIAL',
    ativo: true,
    verba: 0,
    janela: 'Ago/2026',
    emVitrine: true,
    nota: 'Campanha ativa no site na data da coleta — sem verba estratégica extra, roda no dorsal.',
  },
  {
    id: 'EV3',
    nome: 'Cápsula Stitch',
    tipo: 'CÁPSULA',
    ativo: true,
    verba: 0,
    janela: 'Set–Out/2026',
    emVitrine: false,
    nota: 'Licença Disney do snapshot, aplicada no infantil de 4 a 12 anos.',
  },
  {
    id: 'EV4',
    nome: 'Ciclo Animal Print',
    tipo: 'CICLO',
    ativo: true,
    verba: 0,
    janela: 'Out–Dez/2026',
    emVitrine: false,
    nota: 'Padronagem em alta na leitura de atributos; entra por vestido acetinado e tule.',
  },
  {
    id: 'EV5',
    nome: 'Virada Alto Verão',
    tipo: 'VITRINE',
    ativo: true,
    verba: 0,
    janela: 'Dez/2026',
    emVitrine: false,
    nota: 'Troca de parede: linho e laise assumem a vitrine na virada de dezembro.',
  },
  {
    id: 'EV6',
    nome: 'Dia dos Namorados',
    tipo: 'COMERCIAL',
    ativo: true,
    verba: 0,
    janela: '12/06/2026',
    emVitrine: false,
    nota: 'O vestido peplum de laise vermelho é a peça-conceito da data.',
    ref: '1096942',
  },
  {
    id: 'EV7',
    nome: 'Cápsula Resort',
    tipo: 'CÁPSULA',
    ativo: false,
    verba: 0,
    janela: 'A definir',
    emVitrine: false,
    nota: 'Fora da temporada: reavaliada na próxima parede.',
  },
]

export const RESUMO_EVENTOS = {
  verbaEstrategica: soma(EVENTOS_CICLOS.map((e) => e.verba)),
  ativos: EVENTOS_CICLOS.filter((e) => e.ativo).length,
  total: EVENTOS_CICLOS.length,
  emVitrine: EVENTOS_CICLOS.filter((e) => e.emVitrine).length,
  /** % do mix que migrou de Need para Dorsal na temporada (âncora) */
  mixNeedParaDorsal: 2,
}

/** Itens Need/NID candidatos a virar Dorsal, com o evento que os originou. */
export type ItemNeed = {
  id: string
  ref?: string
  produto: string
  eventoId: string
  pecas: number
  motivoNeed: string
}

export const ITENS_NEED: ItemNeed[] = [
  {
    id: 'ND1',
    ref: '1096942',
    produto: 'Vestido midi peplum de laise com recorte',
    eventoId: 'EV6',
    pecas: 30_750,
    motivoNeed: 'Entrou para o Dia dos Namorados, mas girou acima da meta fora da data.',
  },
  {
    id: 'ND2',
    ref: '1086292',
    produto: 'Vestido midi halterneck linho bordado floral',
    eventoId: 'EV5',
    pecas: 30_750,
    motivoNeed: 'Peça de vitrine da virada; pedido de recompra pelas lojas do cluster A.',
  },
  {
    id: 'ND3',
    produto: 'Vestido midi gola alta animal print acetinado',
    eventoId: 'EV4',
    pecas: 18_400,
    motivoNeed: 'Ciclo de tendência com leitura positiva na terceira semana.',
  },
  {
    id: 'ND4',
    produto: 'Camiseta infantil algodão Athos Minecraft',
    eventoId: 'EV3',
    pecas: 22_100,
    motivoNeed: 'Licença com sell-through alto no infantil 4–12.',
  },
]

/* ========================== 28. RETROALIMENTAÇÃO (Fase 6) ================= */

/**
 * A inclusão que o Mapa trouxe para o plano: a camiseta de torcida da Copa.
 * 24.000 peças × R$ 19,17 de custo = R$ 0,46 mi — exatamente a verba
 * estratégica reservada para eventos.
 */
export const INCLUSAO_MAPA = {
  produto: 'Camiseta Torcida Brasil',
  eventoId: 'EV1',
  pecas: 24_000,
  pv: 49.99,
  get pc() {
    return Number((this.valor / this.pecas).toFixed(2))
  },
  valor: 460_000,
  nota: 'Incluída pela parede de setembro para a janela da Copa do Mundo.',
}

/** Itens do plano que entraram vinculados a evento, cápsula, ciclo ou vitrine. */
export type VinculoEvento = {
  id: string
  ref?: string
  produto: string
  tag: TipoEvento
  eventoId: string
  /** valor a custo que este vínculo adiciona ao plano */
  valor: number
}

/**
 * Os 4 vínculos somam R$ 0,31 mi ALÉM da verba estratégica de R$ 0,46 mi —
 * é exatamente o que falta compensar no plano (âncora da spec).
 */
export const VINCULOS_EVENTO: VinculoEvento[] = [
  {
    id: 'VE1',
    ref: '1096942',
    produto: 'Vestido midi peplum de laise com recorte',
    tag: 'EVENTO',
    eventoId: 'EV6',
    valor: 96_000,
  },
  {
    id: 'VE2',
    ref: '1099133',
    produto: 'Calça super wide leg patchwork bicolor',
    tag: 'CÁPSULA',
    eventoId: 'EV3',
    valor: 84_000,
  },
  {
    id: 'VE3',
    produto: 'Vestido midi gola alta animal print acetinado',
    tag: 'CICLO',
    eventoId: 'EV4',
    valor: 72_000,
  },
  {
    id: 'VE4',
    ref: '1086292',
    produto: 'Vestido midi halterneck linho bordado floral',
    tag: 'VITRINE',
    eventoId: 'EV5',
    valor: 58_000,
  },
]

/** Falta compensar = vínculos de evento além da verba estratégica reservada. */
export const COMPENSACAO_NECESSARIA = soma(VINCULOS_EVENTO.map((v) => v.valor))

/**
 * Candidatos a compensação: reduções de quantidade em linhas do plano.
 * Compensar chama alterarQtd no context, então a régua do /plano e os KPIs
 * reagem de verdade — não é um contador isolado.
 */
export type CandidatoCompensacao = {
  id: string
  linhaId: string
  ref: string
  produto: string
  pecas: number
  motivo: string
}

export const CANDIDATOS_COMPENSACAO: CandidatoCompensacao[] = [
  {
    id: 'CP1',
    linhaId: 'L09',
    ref: 'CAT-01',
    produto: 'Vestido midi algodão decote quadrado básico',
    pecas: 3_000,
    motivo: 'Entrada P1 com cobertura folgada nos clusters C e D.',
  },
  {
    id: 'CP2',
    linhaId: 'L02',
    ref: '1046556',
    produto: 'Camiseta algodão peruano bold manga curta',
    pecas: 4_000,
    motivo: 'Premium básico com giro abaixo do dorsal principal.',
  },
  {
    id: 'CP3',
    linhaId: 'L10',
    ref: 'CAT-02',
    produto: 'Sutiã renda sem bojo',
    pecas: 4_500,
    motivo: 'Programa de 6 cores pode abrir com 5 e reavaliar a sexta.',
  },
  {
    id: 'CP4',
    linhaId: 'L13',
    ref: 'CAT-05',
    produto: 'Legging ACE poliamida cintura alta',
    pecas: 2_000,
    motivo: 'Marca nova sem histórico: começar mais raso reduz risco.',
  },
  {
    id: 'CP5',
    linhaId: 'L14',
    ref: '1114492',
    produto: 'Calça wide leg jeans com brilhos cintura alta',
    pecas: 1_500,
    motivo: 'Ciclo de brilho concentrado no cluster A.',
  },
]

/** Valor que cada candidato libera = peças × PC da linha no plano. */
export function valorDoCandidato(c: CandidatoCompensacao): number {
  const linha = LINHAS_PLANO.find((l) => l.id === c.linhaId)
  return linha ? Math.round(c.pecas * linha.pc) : 0
}

/* ===================== 29. LINE · GRADE · EMISSÃO (Fase 7) ================ */

export type DecisaoLine = 'Aceitar' | 'Renegociar'

export type LinhaLine = {
  id: string
  ref: string
  produto: string
  fornecedor: string
  qtdPedida: number
  qtdRetornada: number
  pcPedido: number
  pcNegociado: number
  /** variação do preço negociado sobre o pedido, em % */
  deltaPct: number
  /** variação da quantidade retornada sobre a pedida, em % */
  deltaQtdPct: number
  decisao: DecisaoLine
}

/** Acima deste desvio de preço a linha entra como Renegociar por padrão. */
export const LIMITE_ACEITE_LINE = 2

/**
 * O line devolvido pelos fornecedores: cada linha do plano volta com preço
 * negociado e quantidade confirmada. As variações são seedadas, e a decisão
 * padrão é REGRA — desvio de preço até 2% entra como Aceitar.
 */
function gerarLine(): LinhaLine[] {
  const rand = mulberry32(SEED + 707)
  return LINHAS_PLANO.map((l, i) => {
    // fornecedor determinístico por linha, dos fictícios do snapshot
    const fornecedor = fornecedores[i % fornecedores.length]
    const fatorPreco = jitter(rand, 0.04)
    const fatorQtd = i % 4 === 0 ? jitter(rand, 0.03) : 1
    const pcNegociado = Number((l.pc * fatorPreco).toFixed(2))
    const qtdRetornada = Math.round(l.qtd * fatorQtd)
    const deltaPct = Number(((pcNegociado / l.pc - 1) * 100).toFixed(1))
    return {
      id: `LN${String(i + 1).padStart(2, '0')}`,
      ref: l.ref,
      produto: l.produto,
      fornecedor,
      qtdPedida: l.qtd,
      qtdRetornada,
      pcPedido: l.pc,
      pcNegociado,
      deltaPct,
      deltaQtdPct: Number(((qtdRetornada / l.qtd - 1) * 100).toFixed(1)),
      decisao: Math.abs(deltaPct) <= LIMITE_ACEITE_LINE ? 'Aceitar' : 'Renegociar',
    }
  })
}

export const LINHAS_LINE: LinhaLine[] = gerarLine()

/* ------------------------------------------------- grade de tamanhos ----- */

export type TemplateGrade = {
  id: string
  nome: string
  sessao: string
  tamanhos: string[]
  /** curva de distribuição por tamanho, em % (soma 100) */
  curva: number[]
  /** peças por pack — é o múltiplo que a distribuição respeita */
  pecasPorPack: number
}

/** Os 4 templates de grade padrão, um por sessão. */
export const TEMPLATES_GRADE: TemplateGrade[] = [
  {
    id: 'G1',
    nome: 'Malha 6 tamanhos',
    sessao: 'Camisetas e infantil',
    tamanhos: ['PP', 'P', 'M', 'G', 'GG', 'EG'],
    curva: [10, 20, 28, 22, 13, 7],
    pecasPorPack: 6,
  },
  {
    id: 'G2',
    nome: 'Vestido 4 tamanhos',
    sessao: 'Vestidos',
    tamanhos: ['P', 'M', 'G', 'GG'],
    curva: [22, 30, 28, 20],
    pecasPorPack: 4,
  },
  {
    id: 'G3',
    nome: 'Jeans 6 tamanhos',
    sessao: 'Jeans',
    tamanhos: ['36', '38', '40', '42', '44', '46'],
    curva: [12, 22, 26, 20, 13, 7],
    pecasPorPack: 6,
  },
  {
    id: 'G4',
    nome: 'Íntimo 4 tamanhos',
    sessao: 'Moda Íntima',
    tamanhos: ['P', 'M', 'G', 'GG'],
    curva: [24, 32, 26, 18],
    pecasPorPack: 4,
  },
]

/** Template de cada categoria do plano. */
export const TEMPLATE_POR_CATEGORIA: Record<string, string> = {
  Camisetas: 'G1',
  Vestidos: 'G2',
  Jeans: 'G3',
  'Moda Íntima': 'G4',
  'Infantil & Esportivo': 'G1',
}

export function templateDaLinha(categoria: string): TemplateGrade {
  const id = TEMPLATE_POR_CATEGORIA[categoria] ?? 'G1'
  return TEMPLATES_GRADE.find((t) => t.id === id) ?? TEMPLATES_GRADE[0]
}

/** Distribui uma quantidade pela curva do template, fechando o total exato. */
export function distribuirPelaCurva(qtd: number, t: TemplateGrade): number[] {
  const bruto = t.curva.map((c) => Math.round((qtd * c) / 100))
  const diferenca = qtd - soma(bruto)
  if (diferenca !== 0) {
    // sobra vai para o tamanho de maior curva (o miolo da grade)
    const miolo = t.curva.indexOf(Math.max(...t.curva))
    bruto[miolo] += diferenca
  }
  return bruto
}

/** Quantidade é múltipla do pack? A distribuição exige que seja. */
export function multiploDoPack(qtd: number, t: TemplateGrade): boolean {
  return qtd % t.pecasPorPack === 0
}

/** Arredonda para o múltiplo de pack mais próximo (para cima). */
export function ajustarAoPack(qtd: number, t: TemplateGrade): number {
  return Math.ceil(qtd / t.pecasPorPack) * t.pecasPorPack
}

/* ----------------------------------------------- emissão de pedidos ----- */

export type OrdemCompra = {
  numero: string
  fornecedor: string
  refs: string[]
  pecas: number
  valor: number
  /** dias entre a emissão e a entrega no CD */
  prazoDias: number
  cd: string
}

export const PRAZO_NACIONAL_DIAS = 45
export const PRAZO_IMPORTADO_DIAS = 90

/**
 * As ordens de compra saem do line agrupadas por fornecedor.
 * O prazo é o lead time da premissa do calendário: 90 dias no importado
 * (Global Sourcing Ásia) e 45 dias no nacional.
 */
export function gerarOCs(line: LinhaLine[]): OrdemCompra[] {
  const porFornecedor = new Map<string, LinhaLine[]>()
  for (const l of line) {
    porFornecedor.set(l.fornecedor, [...(porFornecedor.get(l.fornecedor) ?? []), l])
  }
  return [...porFornecedor.entries()]
    .map(([fornecedor, linhas], i) => ({
      numero: `OC-2026-${String(4180 + i * 7).padStart(4, '0')}`,
      fornecedor,
      refs: linhas.map((l) => l.ref),
      pecas: soma(linhas.map((l) => l.qtdRetornada)),
      valor: Math.round(soma(linhas.map((l) => l.qtdRetornada * l.pcNegociado))),
      prazoDias: fornecedor.includes('Ásia') ? PRAZO_IMPORTADO_DIAS : PRAZO_NACIONAL_DIAS,
      cd: i % 3 === 2 ? REDE.cds[1] : REDE.cds[0],
    }))
    .sort((a, b) => b.valor - a.valor)
}

export const OCS_DO_LINE = gerarOCs(LINHAS_LINE)

/* ========================== 30. DISTRIBUIÇÃO (Fase 7) ==================== */

export const DISTRIBUICAO = {
  lojas: 16,
  skus: 14,
  pecas: 38_640,
  packs: 7_912,
  aderenciaIA: 100,
  lacunas: 10,
} as const

/** Clima que um SKU exige. 'Quente' não vai para loja de clima frio. */
export type ClimaSku = 'Quente' | 'Fria' | 'Indiferente'

/**
 * Sensibilidade de clima por linha do plano.
 *
 * REGRA: SKU de clima "Quente" não é distribuído em loja de clima "Fria" nem
 * "Híbrida Fria" — a célula fica como lacuna com ⚠ BLOQUEIO CLIMA.
 *
 * Só o vestido peplum de laise (1096942) é marcado como Quente no recorte, e
 * isso é o que produz exatamente as 10 lacunas do âncora: são as 10 lojas de
 * clima frio entre as 16 do recorte. Os outros dois SKUs sensíveis citados na
 * spec — o vestido de tule floral e a camiseta UV infantil — aparecem na aba
 * COERÊNCIA como casos conhecidos da regra que estão fora deste recorte.
 */
export const CLIMA_POR_LINHA: Record<string, ClimaSku> = {
  L07: 'Quente', // 1096942 · vestido peplum de laise sem manga
}

export function climaDaLinha(id: string): ClimaSku {
  return CLIMA_POR_LINHA[id] ?? 'Indiferente'
}

const CLIMAS_FRIOS: Clima[] = ['Fria', 'Híbrida Fria']

export function bloqueadoPorClima(idLinha: string, loja: Loja): boolean {
  return climaDaLinha(idLinha) === 'Quente' && CLIMAS_FRIOS.includes(loja.clima)
}

/** As 16 lojas do recorte de distribuição (as maiores da rede). */
export const LOJAS_DISTRIBUICAO: Loja[] = LOJAS.slice(0, DISTRIBUICAO.lojas)

export type CelulaDistribuicao = {
  lojaId: string
  linhaId: string
  ref: string
  produto: string
  categoria: string
  cor: string
  climaSku: ClimaSku
  templateId: string
  packs: number
  pecas: number
  bloqueado: boolean
}

/**
 * Snapshot da alocação: 16 lojas × 14 SKUs.
 * Os packs são alocados para fechar 7.912 packs E 38.640 peças ao mesmo tempo
 * (a média de 4,88 peças por pack sai da mistura de packs de 4 e de 6), e as
 * células bloqueadas por clima ficam com zero — são as 10 lacunas.
 */
function gerarDistribuicao(): CelulaDistribuicao[] {
  const rand = mulberry32(SEED + 808)
  const celulas: (Omit<CelulaDistribuicao, 'packs' | 'pecas'> & { peso: number; pack: number })[] =
    []

  for (const loja of LOJAS_DISTRIBUICAO) {
    for (const linha of LINHAS_PLANO) {
      const template = templateDaLinha(linha.categoria)
      const bloqueado = bloqueadoPorClima(linha.id, loja)
      celulas.push({
        lojaId: loja.id,
        linhaId: linha.id,
        ref: linha.ref,
        produto: linha.produto,
        categoria: linha.categoria,
        cor: linha.cor,
        climaSku: climaDaLinha(linha.id),
        templateId: template.id,
        bloqueado,
        pack: template.pecasPorPack,
        // porte da loja e profundidade da linha mandam no peso
        peso: bloqueado
          ? 0
          : (loja.porte === 'GG' ? 1.5 : loja.porte === 'G' ? 1.25 : loja.porte === 'M' ? 1 : 0.8) *
            (linha.qtd / PLANO.pecas) *
            100 *
            jitter(rand, 0.15),
      })
    }
  }

  const ativas = celulas.filter((c) => !c.bloqueado)
  const packs = alocarComMedia(
    ativas.map((c) => ({ peso: c.peso, valor: c.pack })),
    DISTRIBUICAO.packs,
    DISTRIBUICAO.pecas / DISTRIBUICAO.packs,
  )

  /* A alocação fecha os packs exatos, mas as peças caem alguns múltiplos de 2
     fora do âncora — é a mistura de packs de 4 e de 6 arredondando. Mover um
     pack de uma célula de 6 para uma de 4 mantém o total de packs e muda as
     peças em 2, então a diferença é zerada sem mexer no outro âncora. */
  const indicesPorPack = (tamanho: number) =>
    ativas.map((c, idx) => ({ c, idx })).filter((x) => x.c.pack === tamanho)
  const seis = indicesPorPack(6)
  const quatro = indicesPorPack(4)
  let diferenca = soma(ativas.map((c, idx) => packs[idx] * c.pack)) - DISTRIBUICAO.pecas
  let cursor = 0
  while (diferenca !== 0 && seis.length && quatro.length && cursor < 500) {
    const de = diferenca > 0 ? seis[cursor % seis.length] : quatro[cursor % quatro.length]
    const para = diferenca > 0 ? quatro[cursor % quatro.length] : seis[cursor % seis.length]
    if (packs[de.idx] > 1) {
      packs[de.idx] -= 1
      packs[para.idx] += 1
      diferenca += diferenca > 0 ? -2 : 2
    }
    cursor++
  }

  let i = 0
  return celulas.map((c) => {
    const { peso: _peso, pack, ...resto } = c
    void _peso
    if (c.bloqueado) return { ...resto, packs: 0, pecas: 0 }
    const p = packs[i++]
    return { ...resto, packs: p, pecas: p * pack }
  })
}

export const DISTRIBUICAO_CELULAS: CelulaDistribuicao[] = gerarDistribuicao()

export type TotaisDistribuicao = {
  lojas: number
  skus: number
  packs: number
  pecas: number
  lacunas: number
  aderenciaIA: number
}

export function totaisDistribuicao(celulas: CelulaDistribuicao[]): TotaisDistribuicao {
  return {
    lojas: new Set(celulas.map((c) => c.lojaId)).size,
    skus: new Set(celulas.map((c) => c.linhaId)).size,
    packs: soma(celulas.map((c) => c.packs)),
    pecas: soma(celulas.map((c) => c.pecas)),
    lacunas: celulas.filter((c) => c.packs === 0).length,
    aderenciaIA: DISTRIBUICAO.aderenciaIA,
  }
}

export const TOTAIS_DISTRIBUICAO = totaisDistribuicao(DISTRIBUICAO_CELULAS)

/** Casos conhecidos da regra de clima que estão fora do recorte de 14 SKUs. */
export const CASOS_CLIMA_FORA_DO_RECORTE = [
  {
    produto: 'Vestido midi sem alça tule franzido poá — Mindse7',
    clima: 'Quente' as ClimaSku,
    nota: 'Tule sem alça: fora de clima frio na virada de estação.',
  },
  {
    produto: 'Camiseta infantil ML proteção UV coqueiro',
    clima: 'Quente' as ClimaSku,
    nota: 'Moda praia infantil: só nas lojas de clima quente e litoral.',
  },
]

/** Resumo das abas que a tela mostra sem tabela própria. */
export const RESUMO_ABAS_DISTRIBUICAO = [
  {
    aba: 'Coerência',
    texto:
      'Cruza o clima exigido pelo SKU com o clima da loja. Hoje a única regra ativa bloqueia peça de verão em loja de clima frio.',
  },
  {
    aba: 'Quentes × Frias',
    texto:
      'Compara profundidade média entre lojas de clima quente e frio na mesma categoria, para achar excesso sazonal.',
  },
  {
    aba: 'Lacunas',
    texto:
      'Lista as células sem alocação. Toda lacuna precisa de justificativa antes do envio para as lojas.',
  },
]

/* ============================ 31. BENCHMARK (Fase 8) ===================== */

/**
 * Os 5 movimentos que o painel de IA recomenda.
 *
 * O blueprint §5.1 citado na spec não veio com o material, então cada movimento
 * é derivado de um fato do snapshot — nenhum texto é opinião solta. A fonte de
 * cada um está no campo `base`, e o número que ele carrega vem sempre de um
 * âncora já usado em outra tela.
 */
export type MovimentoIA = {
  id: string
  titulo: string
  texto: string
  /** de onde veio o número — aparece no rodapé do card */
  base: string
  impacto: string
  tom: 'oportunidade' | 'defesa' | 'atencao'
}

/** Preço médio de uma marca monitorada — usado nos textos dos movimentos. */
function precoDaMarca(marca: string): number {
  return concorrentes.find((c) => c.marca === marca)?.precoMedio ?? 0
}

/** Preço real do hero NOS 1049412, o piso que os movimentos citam. */
export const PRECO_BASICO_NOS = produtoPorCod('1049412')?.precoPor ?? 29.99

/** Termo usado na coleta ao vivo do /benchmark (spec da Fase 8). */
export const TERMO_COLETA = 'vestido midi'

/** Participação somada das faixas médias/premium na pirâmide real de vestidos. */
export const PARTICIPACAO_P3_P4 = soma(
  PIRAMIDE_PRECO.filter((f) => f.id === 'P3' || f.id === 'P4').map((f) => f.participacao),
)

export const MOVIMENTOS_IA: MovimentoIA[] = [
  {
    id: 'M1',
    titulo: 'Fechar o gap de ticket sem perder o piso de preço',
    texto: `Nosso ticket de ${formatBRL(BENCHMARK.ticketCA, 0)} está ${formatPct(Math.abs(BENCHMARK.gapVsRenner))} abaixo do líder aspiracional. O caminho não é subir etiqueta: é migrar mix para as faixas P3 e P4 de vestidos, que já respondem por ${formatPct(PARTICIPACAO_P3_P4, 0)} da oferta e sustentam preço médio de ${formatBRL(PRECO_MEDIO_PIRAMIDE, 0)}.`,
    base: `ticket C&A ${formatBRL(BENCHMARK.ticketCA, 0)} vs Renner ${formatBRL(precoDaMarca('Renner'), 0)} · pirâmide de vestidos observada`,
    impacto: 'Ticket +R$ 6 a R$ 9 sem markdown adicional',
    tom: 'oportunidade',
  },
  {
    id: 'M2',
    titulo: `Ampliar o programa de ${BENCHMARK.categoriaEmAlta.toLowerCase()}`,
    texto: `${BENCHMARK.categoriaEmAlta} é a categoria em alta na coleta e onde temos mais profundidade de oferta pronta — o dorsal de linho em 6 cores e o programa chemise em 3 cores já cobrem P2 e P3. Puxar duas cores extras no dorsal custa menos que abrir referência nova.`,
    base: `coleta de "${TERMO_COLETA}" · ${BENCHMARK.coletaSnapshot.skus} SKUs na faixa R$ ${BENCHMARK.coletaSnapshot.min}–${BENCHMARK.coletaSnapshot.max}`,
    impacto: 'Profundidade +2 cores no dorsal, sem novo desenvolvimento',
    tom: 'oportunidade',
  },
  {
    id: 'M3',
    titulo: `${BENCHMARK.corDoAno} como cor de assinatura da cápsula`,
    texto: `${BENCHMARK.corDoAno} é a cor do ano e já está na nossa cartela real. Usar como cor de entrada dos lançamentos de ${COLECAO.capsula} alinha a vitrine ao discurso de tendência sem reabrir desenvolvimento de cor.`,
    base: `cartela real do snapshot (${cartelaCores.length} cores) · ${BENCHMARK.corDoAno} presente`,
    impacto: 'Assinatura de tendência com custo zero de desenvolvimento',
    tom: 'oportunidade',
  },
  {
    id: 'M4',
    titulo: 'Defender o básico contra as marcas de valor',
    texto: `Marisa (${formatBRL(precoDaMarca('Marisa'), 0)}) e Torra (${formatBRL(precoDaMarca('Torra'), 0)}) pressionam por baixo. Nossa resposta é a camiseta básica a ${formatBRL(PRECO_BASICO_NOS)} em 22 cores: manter o piso, garantir grade e não deixar ruptura no NOS — perder o básico é perder tráfego, não só a venda da peça.`,
    base: `concorrentes de valor no snapshot · hero NOS 1049412 a ${formatBRL(PRECO_BASICO_NOS)}`,
    impacto: 'Tráfego defendido no piso de preço',
    tom: 'defesa',
  },
  {
    id: 'M5',
    titulo: 'Blindar moda jovem da pressão digital',
    texto: `Shein pressiona moda jovem online e nosso digital cresce ${formatPct(DASHBOARD.digitalVar)} (${formatPct(DASHBOARD.digitalShare)} da receita). Competir por preço unitário nesse recorte não fecha margem: o movimento é velocidade — janelas curtas, reposição por tamanho e cápsula com estilista, onde a marca ganha e o marketplace não copia.`,
    base: `digital ${formatPct(DASHBOARD.digitalShare)} (${formatDelta(DASHBOARD.digitalVar)}) · Shein monitorada como pressão digital`,
    impacto: 'Margem preservada trocando preço por velocidade',
    tom: 'atencao',
  },
]

/** Os 7 concorrentes do JSON com o gap de preço médio contra o ticket C&A. */
export const CONCORRENTES_MONITORADOS = concorrentes.map((c) => ({
  marca: c.marca,
  tipo: c.tipo,
  precoMedio: c.precoMedio ?? null,
  obs: c.obs,
  /** gap do preço médio da marca contra o nosso ticket (null = sem preço no snapshot) */
  gapPct:
    c.precoMedio === undefined
      ? null
      : arredondar(((BENCHMARK.ticketCA - c.precoMedio) / c.precoMedio) * 100, 1),
}))

/** Marcas com preço médio no snapshot — as que entram na tabela comparável. */
export const MARCAS_COM_PRECO = CONCORRENTES_MONITORADOS.filter(
  (c): c is typeof c & { precoMedio: number } => c.precoMedio !== null,
)

/**
 * O mercado monitorado tem dois blocos, e misturá-los numa média só engana:
 * a média das 6 marcas com preço dá R$ 97 (abaixo do nosso ticket de 108),
 * porque metade delas é posicionamento de valor. Então a tabela compara contra
 * os dois — pares aspirativos (onde estamos ABAIXO, o gap de −16% do KPI) e
 * mercado inteiro (onde estamos ACIMA, a pressão das marcas de valor).
 */
export const MARCAS_PARES = MARCAS_COM_PRECO.filter((c) => c.tipo !== 'valor')
export const MARCAS_VALOR = MARCAS_COM_PRECO.filter((c) => c.tipo === 'valor')

/** Arredonda para o padrão de etiqueta da praça (sempre ,99). */
function preco99(v: number): number {
  return Math.max(9.99, Math.round(v - 0.99) + 0.99)
}

export type ItemComparavel = {
  id: string
  peca: string
  /** referência real quando o item comparável é um dos heróis */
  cod?: string
  /** preço REAL praticado pela C&A (do snapshot) */
  precoCA: number
  /** true = preço promocional na coleta (marcado com * na tabela) */
  promocional?: boolean
  nota?: string
  precos: Record<string, number>
  /** média das 3 marcas aspirativas/diretas — a comparação que decide preço */
  mediaPares: number
  deltaParesPct: number
  /** média das 6 marcas com preço no snapshot, os dois blocos juntos */
  mediaMercado: number
  deltaPct: number
}

/**
 * Preço médio por peça comparável.
 *
 * A coluna C&A traz preço REAL do snapshot (os seis da spec: 29,99 · 99,99 ·
 * 159,99 · 189,99 · 159,99* · 59,99). As colunas de concorrente são estimadas —
 * o snapshot só traz o preço médio da marca, não a etiqueta peça a peça — pelo
 * índice de posicionamento (preço médio da marca ÷ ticket C&A), com ruído
 * seedado de 6% e arredondamento para ,99. Mesma seed ⇒ mesma tabela sempre.
 */
function montarComparaveis(): ItemComparavel[] {
  const rand = mulberry32(SEED + 511)
  const base: { id: string; peca: string; cod?: string; precoCA: number; promocional?: boolean; nota?: string }[] = [
    {
      id: 'C1',
      peca: 'Camiseta básica algodão MC',
      cod: '1049412',
      precoCA: 29.99,
      nota: 'Piso de preço do NOS masculino, 22 cores.',
    },
    {
      id: 'C2',
      peca: 'Vestido midi algodão básico',
      precoCA: 99.99,
      nota: 'Entrada da pirâmide de vestidos (P1).',
    },
    {
      id: 'C3',
      peca: 'Vestido midi com linho',
      cod: '1075684',
      precoCA: 159.99,
      nota: 'Dorsal de verão em 6 cores.',
    },
    {
      id: 'C4',
      peca: 'Vestido midi chemise viscose',
      precoCA: 189.99,
      nota: 'Programa repeat em 3 cores (P3).',
    },
    {
      id: 'C5',
      peca: 'Vestido midi de renda floral',
      precoCA: 159.99,
      promocional: true,
      nota: 'Etiqueta de coleta promocional — comparação exige ressalva.',
    },
    {
      id: 'C6',
      peca: 'Sutiã renda sem bojo',
      cod: '7413962',
      precoCA: 59.99,
      nota: 'NOS de moda íntima, programa 6 cores.',
    },
  ]

  return base.map((item) => {
    const precos: Record<string, number> = {}
    for (const m of MARCAS_COM_PRECO) {
      const indice = m.precoMedio / BENCHMARK.ticketCA
      precos[m.marca] = preco99(item.precoCA * indice * jitter(rand, 0.06))
    }
    const mediaMercado = arredondar(soma(Object.values(precos)) / MARCAS_COM_PRECO.length, 2)
    const mediaPares = arredondar(
      soma(MARCAS_PARES.map((m) => precos[m.marca])) / MARCAS_PARES.length,
      2,
    )
    return {
      ...item,
      precos,
      mediaPares,
      deltaParesPct: arredondar((item.precoCA / mediaPares - 1) * 100, 1),
      mediaMercado,
      deltaPct: arredondar((item.precoCA / mediaMercado - 1) * 100, 1),
    }
  })
}

export const ITENS_COMPARAVEIS: ItemComparavel[] = montarComparaveis()

/** Posição média da C&A nas 6 peças comparáveis, contra cada bloco. */
export const GAP_MEDIO_COMPARAVEL = arredondar(
  soma(ITENS_COMPARAVEIS.map((i) => i.deltaPct)) / ITENS_COMPARAVEIS.length,
  1,
)

export const GAP_MEDIO_PARES = arredondar(
  soma(ITENS_COMPARAVEIS.map((i) => i.deltaParesPct)) / ITENS_COMPARAVEIS.length,
  1,
)

/** Texto do banner SERVE PARA / NÃO CONFUNDIR desta tela. */
export const ESCOPO_BENCHMARK = {
  servePara:
    'Ler o mercado antes de decidir preço e mix: onde estamos caros, onde estamos baratos e qual movimento a coleta sustenta.',
  naoConfundir:
    'Não é acompanhamento de venda do dia. Preço realizado, ruptura e markdown ativo ficam no Sortimento Vivo.',
} as const

/* ================================ 32. PLM (Fase 8) ======================= */

/** As 8 fases do ciclo — 1 a 3 acontecem antes da peça chegar à loja. */
export type FasePLM = {
  n: number
  nome: string
  descricao: string
  /** true = a peça já está em loja nesta fase */
  emLoja: boolean
}

export const FASES_PLM: FasePLM[] = [
  { n: 1, nome: 'Briefing', descricao: 'Need, faixa de preço e papel na coleção definidos.', emLoja: false },
  { n: 2, nome: 'Desenvolvimento', descricao: 'Ficha técnica, prova de modelagem e cor aprovada.', emLoja: false },
  { n: 3, nome: 'Aprovação', descricao: 'Preço fechado com o fornecedor e OC emitida.', emLoja: false },
  { n: 4, nome: 'Introdução', descricao: 'Primeiras 4 semanas em loja — leitura de velocidade.', emLoja: true },
  { n: 5, nome: 'Crescimento', descricao: 'Velocidade acelerando; reposição e ampliação de cor.', emLoja: true },
  { n: 6, nome: 'Maturidade', descricao: 'Patamar estável; foco em grade e cobertura.', emLoja: true },
  { n: 7, nome: 'Declínio', descricao: 'Velocidade caindo; decisão de markdown se aproxima.', emLoja: true },
  { n: 8, nome: 'Liquidação', descricao: 'Markdown ativo para zerar pulmão antes da virada.', emLoja: true },
]

/**
 * Os 5 estágios que a tela resume em cards — são as fases 4 a 8, as que
 * acontecem com a peça em loja. As contagens (38/61/84/29/11) vêm da spec e
 * somam 223 SKUs.
 *
 * Reconciliação com o âncora de 262 SKUs ativos: os 39 restantes têm menos de 4
 * semanas em loja e ainda não fecham leitura de velocidade, então ficam fora da
 * classificação — a tela mostra esse resto explicitamente, no rodapé dos cards.
 */
export type EstagioPLM = {
  fase: number
  nome: string
  skus: number
  estrategia: string
  tom: 'info' | 'ok' | 'warn' | 'crit'
}

export const ESTAGIOS_PLM: EstagioPLM[] = [
  {
    fase: 4,
    nome: 'Introdução',
    skus: 38,
    estrategia: 'Não repor antes da 4ª semana. Ler velocidade e conversão por cor.',
    tom: 'info',
  },
  {
    fase: 5,
    nome: 'Crescimento',
    skus: 61,
    estrategia: 'Repor no ritmo da venda e ampliar cor onde a curva de tamanho fecha.',
    tom: 'ok',
  },
  {
    fase: 6,
    nome: 'Maturidade',
    skus: 84,
    estrategia: 'Defender grade e cobertura. Preço firme, sem promoção tática.',
    tom: 'ok',
  },
  {
    fase: 7,
    nome: 'Declínio',
    skus: 29,
    estrategia: 'Preparar markdown escalonado antes que o pulmão vire risco de virada.',
    tom: 'warn',
  },
  {
    fase: 8,
    nome: 'Liquidação',
    skus: 11,
    estrategia: 'Zerar pulmão na janela. Profundidade de desconto conforme cobertura.',
    tom: 'crit',
  },
]

export const TOTAL_CLASSIFICADO_PLM = soma(ESTAGIOS_PLM.map((e) => e.skus))
/** SKUs ativos ainda sem 4 semanas em loja — o resto de 262 − 223. */
export const SKUS_SEM_LEITURA_PLM = COLECAO.skusAtivos - TOTAL_CLASSIFICADO_PLM

export type FichaPLM = {
  cod: string
  nome: string
  categoria: string
  cor: string
  fase: number
  /** semanas desde a entrada em loja */
  idadeSemanas: number
  precoDe?: number
  precoPor: number
  markdownPct?: number
  /** velocidade antes e depois do último movimento, em % vs semana anterior */
  velocidadeAntes: number
  velocidadeDepois: number
  gmroi: number
  /** peças em estoque que ainda precisam sair */
  pulmao: number
  sellOut: number
  aprendizado: string
  /** true = jornada encerrada com sucesso (aparece com selo verde) */
  bemSucedida?: boolean
}

/**
 * Fichas de ciclo de vida dos heróis. Os números de velocidade, GMROI, pulmão e
 * sell-out do 1083993 são os da spec (idade 14 sem · −12% → +64% · GMROI 2,86 ·
 * pulmão 0 · sell-out 100%); os demais heróis seguem a mesma escala, coerentes
 * com a fase em que estão.
 */
export const FICHAS_PLM: FichaPLM[] = [
  {
    cod: '1083993',
    nome: 'Vestido midi de tricot canelado',
    categoria: 'Vestidos',
    cor: 'Grafite',
    fase: 8,
    idadeSemanas: 14,
    precoDe: 199.99,
    precoPor: 89.99,
    markdownPct: -55,
    velocidadeAntes: -12,
    velocidadeDepois: 64,
    gmroi: 2.86,
    pulmao: 0,
    sellOut: 100,
    bemSucedida: true,
    aprendizado:
      'Tricot canelado em cápsula de verão nasce com janela curta: o markdown de −55% na 11ª semana zerou o pulmão sem contaminar o preço do dorsal. Repetir o calendário, não a profundidade — entrar com 30% menos peça na próxima.',
  },
  {
    cod: '1099133',
    nome: 'Calça super wide leg patchwork bicolor',
    categoria: 'Calças Femininas',
    cor: 'Azul bicolor',
    fase: 4,
    idadeSemanas: 2,
    precoPor: 229.99,
    velocidadeAntes: 0,
    velocidadeDepois: 18,
    gmroi: 1.42,
    pulmao: 4_100,
    sellOut: 11,
    aprendizado:
      'Produto novo sem histórico: a leitura só fecha na 4ª semana. Até lá vale conversão por loja de cluster A, não venda absoluta.',
  },
  {
    cod: '1049412',
    nome: 'Camiseta básica de algodão manga curta',
    categoria: 'Camisetas e Regatas',
    cor: 'Preto +22',
    fase: 6,
    idadeSemanas: 52,
    precoDe: 39.99,
    precoPor: 29.99,
    velocidadeAntes: 4,
    velocidadeDepois: 6,
    gmroi: 4.18,
    pulmao: 96_400,
    sellOut: 71,
    aprendizado:
      'NOS não tem declínio: tem ruptura. O ciclo de vida aqui é a grade — reposição tamanho a tamanho, sem promoção tática que derrube o piso de R$ 29,99.',
  },
  {
    cod: '1075684',
    nome: 'Vestido midi com linho decote quadrado',
    categoria: 'Vestidos',
    cor: 'Natural/Bege',
    fase: 5,
    idadeSemanas: 6,
    precoPor: 159.99,
    velocidadeAntes: 21,
    velocidadeDepois: 38,
    gmroi: 3.11,
    pulmao: 18_700,
    sellOut: 43,
    aprendizado:
      'Dorsal de verão em aceleração: as 6 cores vendem em ritmos diferentes, e é a cor — não a referência — que decide reposição.',
  },
  {
    cod: '1033472',
    nome: 'Calça wide leg jeans cintura alta',
    categoria: 'Calças Femininas',
    cor: 'Azul claro',
    fase: 6,
    idadeSemanas: 31,
    precoPor: 199.99,
    velocidadeAntes: 9,
    velocidadeDepois: 3,
    gmroi: 2.94,
    pulmao: 27_300,
    sellOut: 68,
    aprendizado:
      'Core do programa wide leg em patamar: manter cobertura sem ampliar cor. O risco não é venda, é o fit sair de tendência antes do estoque acabar.',
  },
  {
    cod: '1086292',
    nome: 'Vestido midi halterneck linho bordado floral',
    categoria: 'Vestidos',
    cor: 'Bege/Amarelo',
    fase: 7,
    idadeSemanas: 11,
    precoPor: 259.99,
    velocidadeAntes: 14,
    velocidadeDepois: -9,
    gmroi: 1.87,
    pulmao: 6_900,
    sellOut: 54,
    aprendizado:
      'Peça de vitrine desacelera junto com o evento que a sustenta. Markdown escalonado de −28% agora vale mais que −53% em janeiro.',
  },
  {
    cod: '7413962',
    nome: 'Sutiã meia taça canelado com renda',
    categoria: 'Moda Íntima/Sutiãs',
    cor: 'Preto',
    fase: 6,
    idadeSemanas: 44,
    precoPor: 59.99,
    velocidadeAntes: 5,
    velocidadeDepois: 5,
    gmroi: 3.64,
    pulmao: 41_200,
    sellOut: 74,
    aprendizado:
      'Grade crítica: a venda cai por falta de tamanho, não por falta de interesse. Reposição por tamanho é o indicador que manda aqui.',
  },
]

export const FICHA_DESTAQUE_PLM = FICHAS_PLM[0].cod

export function fichaPorCod(cod: string): FichaPLM {
  return FICHAS_PLM.find((f) => f.cod === cod) ?? FICHAS_PLM[0]
}

export type RiscoPLM = 'verde' | 'amarelo' | 'vermelho'

export type ItemPipeline = {
  cod?: string
  produto: string
  fase: number
  semanas: number
  /** cobertura em semanas de venda ao ritmo atual */
  cobertura: number
  sellOut: number
  velocidade: number
  risco: RiscoPLM
  acao: string
}

/**
 * Pipeline de atenção: as peças cuja fase e cobertura pedem decisão nesta semana.
 * O risco é regra, não rótulo solto — `riscoPorCobertura` abaixo é o mesmo
 * critério que os gatilhos automáticos usam.
 */
export function riscoPorCobertura(cobertura: number, velocidade: number): RiscoPLM {
  if (cobertura >= 20 || velocidade <= -15) return 'vermelho'
  if (cobertura >= 12 || velocidade < 0) return 'amarelo'
  return 'verde'
}

const PIPELINE_BASE: Omit<ItemPipeline, 'risco'>[] = [
  {
    produto: 'Vestido midi alça fina — Preto',
    fase: 8,
    semanas: 16,
    cobertura: 24,
    sellOut: 47,
    velocidade: -22,
    acao: 'Markdown de −63% já ativo; acompanhar saída semanal até zerar o pulmão.',
  },
  {
    cod: '1086292',
    produto: 'Vestido midi halterneck linho bordado floral',
    fase: 7,
    semanas: 11,
    cobertura: 14,
    sellOut: 54,
    velocidade: -9,
    acao: 'Abrir markdown escalonado de −28% na próxima semana.',
  },
  {
    produto: 'Vestido midi franzido com fenda — Preto',
    fase: 7,
    semanas: 13,
    cobertura: 18,
    sellOut: 51,
    velocidade: -16,
    acao: 'Segunda dose de markdown (−47%) autorizada pela verba de remarcação.',
  },
  {
    cod: '7413962',
    produto: 'Sutiã meia taça canelado com renda',
    fase: 6,
    semanas: 44,
    cobertura: 9,
    sellOut: 74,
    velocidade: 5,
    acao: 'Repor por tamanho: grade quebrada em 34 lojas do cluster C.',
  },
  {
    cod: '1099133',
    produto: 'Calça super wide leg patchwork bicolor',
    fase: 4,
    semanas: 2,
    cobertura: 13,
    sellOut: 11,
    velocidade: 18,
    acao: 'Aguardar a 4ª semana antes de repor — leitura ainda não fecha.',
  },
  {
    cod: '1033472',
    produto: 'Calça wide leg jeans cintura alta',
    fase: 6,
    semanas: 31,
    cobertura: 11,
    sellOut: 68,
    velocidade: 3,
    acao: 'Manter cobertura, sem ampliar cor. Fit em observação de tendência.',
  },
]

export const PIPELINE_ATENCAO: ItemPipeline[] = PIPELINE_BASE.map((i) => ({
  ...i,
  risco: riscoPorCobertura(i.cobertura, i.velocidade),
}))

export const RESUMO_RISCO_PIPELINE = {
  vermelho: PIPELINE_ATENCAO.filter((i) => i.risco === 'vermelho').length,
  amarelo: PIPELINE_ATENCAO.filter((i) => i.risco === 'amarelo').length,
  verde: PIPELINE_ATENCAO.filter((i) => i.risco === 'verde').length,
}

export type GatilhoPLM = {
  id: string
  nome: string
  se: string
  entao: string
  /** quantos SKUs a regra pegaria no snapshot de hoje */
  alcance: number
  /** estado inicial do toggle */
  monitorando: boolean
  nota: string
}

/** As 3 regras SE/ENTÃO do motor de ciclo de vida. */
export const GATILHOS_PLM: GatilhoPLM[] = [
  {
    id: 'G1',
    nome: 'Declínio com pulmão alto',
    se: 'velocidade < 0 por 2 semanas E cobertura >= 12 semanas',
    entao: 'sugerir markdown escalonado e mover para fase 7 (Declínio)',
    alcance: PIPELINE_ATENCAO.filter((i) => i.velocidade < 0 && i.cobertura >= 12).length,
    monitorando: true,
    nota: 'É a regra que abriu o markdown do tricot canelado na 11ª semana.',
  },
  {
    id: 'G2',
    nome: 'Aceleração sem reposição',
    se: 'velocidade >= +25% E cobertura < 6 semanas',
    entao: 'abrir sugestão de reposição e ampliar cor no dorsal',
    alcance: FICHAS_PLM.filter((f) => f.velocidadeDepois >= 25 && f.sellOut < 60).length,
    monitorando: true,
    nota: 'Pega o dorsal de linho antes de a cor campeã romper.',
  },
  {
    id: 'G3',
    nome: 'Grade quebrada no NOS',
    se: 'ruptura de tamanho > 15% em SKU de fase 6 (Maturidade)',
    entao: 'gerar ordem de reposição tamanho a tamanho, sem aprovação manual',
    alcance: PIPELINE_ATENCAO.filter((i) => i.fase === 6).length,
    monitorando: false,
    nota: 'Pausado desde a virada do ERP — reposição automática exige grade conferida.',
  },
]

/** Texto do banner SERVE PARA / NÃO CONFUNDIR do PLM. */
export const ESCOPO_PLM = {
  servePara:
    'Saber em que fase da vida cada peça está e o que fazer nela: repor, defender preço, remarcar ou liquidar.',
  naoConfundir:
    'Não é a tela de markdown. Aqui sai a sugestão; a remarcação em si é executada no Pricing.',
} as const

/* ============================= 33. HISTÓRICO (Fase 9) ==================== */

/**
 * O que o recorte do Histórico descreve.
 *
 * Os âncoras (R$ 118,4 mi · 1.243.500 pç · ticket R$ 95,22 · margem 59,1%) não
 * são a rede inteira — a rede fatura ~R$ 632 mi/mês. São a coleção equivalente
 * do ano anterior no mesmo recorte que o Plano trabalha, e os números fecham
 * entre si nessa leitura:
 *   118,4 mi ÷ 1.243.500 pç = R$ 95,22 de ticket ✓
 *   118,4 mi × (1 − 59,1%) = R$ 48,4 mi de custo ≈ os R$ 46,4 mi do plano ✓
 *   1.243.500 pç vs 1.208.400 planejadas = o plano entra 2,8% menor ✓
 */
export const COLECOES_HISTORICO = [
  { id: 'V2526', rotulo: 'Verão 25-26', atual: false, fator: 1, nota: 'LY equivalente — base dos âncoras' },
  { id: 'I26', rotulo: 'Inverno 26', atual: false, fator: 0.86, nota: 'estação encerrada, menor volume' },
  { id: 'V2627', rotulo: 'Verão 26-27', atual: true, fator: 0.61, nota: 'coleção ativa, leitura parcial (semana 19)' },
] as const

export type ColecaoHistorico = (typeof COLECOES_HISTORICO)[number]['id']

export const COLECAO_HISTORICO_PADRAO: ColecaoHistorico = 'V2526'

export const CANAIS = ['Físico', 'Digital'] as const
export type Canal = (typeof CANAIS)[number]

/** Todos os produtos reais do snapshot formam o universo de SKUs do recorte. */
export type SkuHistorico = {
  id: string
  cod?: string
  nome: string
  dept: string
  categoria: string
  cor: string
  /** preço de venda praticado (real quando o snapshot traz) */
  pv: number
  /** true = o preço do snapshot já está remarcado */
  remarcado: boolean
  markdownPct: number
  heroi: boolean
  margem: number
  sellThrough: number
}

/**
 * Quantas cores o programa tem, segundo o snapshot. Entradas como
 * "+22 cores" na lista de cores são a contagem do programa inteiro.
 */
function coresDoProduto(p: Produto): number {
  if (!p.cores?.length) return 1
  const extra = p.cores
    .map((c) => /\+\s*(\d+)/.exec(c)?.[1])
    .find((n): n is string => Boolean(n))
  return extra ? Number(extra) : p.cores.length
}

function gerarSkusHistorico(): SkuHistorico[] {
  const rand = mulberry32(SEED + 909)
  const base = produtos.map((p, i) => {
    const remarcado = Boolean(p.desc)
    const markdownPct = remarcado ? Number(p.desc!.replace('%', '')) : 0
    return {
      id: `S${String(i + 1).padStart(2, '0')}`,
      cod: p.cod,
      nome: p.nome,
      dept: p.dept,
      categoria: p.cat,
      cor: p.cor ?? p.cores?.[0] ?? '—',
      pv: pvDoProduto(p),
      remarcado,
      markdownPct,
      heroi: Boolean(p.cod && (HEROIS_CODS as readonly string[]).includes(p.cod)),
      /* Peça remarcada no catálogo é peça que não vendeu no preço cheio: entra
         com sell-through baixo. É sinal do próprio snapshot, não sorteio. */
      sellThrough: remarcado
        ? arredondar(entre(rand, 34, 52) * jitter(rand, 0.05), 1)
        : arredondar(entre(rand, 58, 88) * jitter(rand, 0.05), 1),
      /* Peça remarcada queima margem; peça de preço cheio fica acima da média.
         A escala final (ESCALA_MARGEM) fecha a ponderada nos 59,1% do âncora. */
      margem: arredondar((remarcado ? 44 : 61) * jitter(rand, 0.06), 1),
    }
  })

  return base
}

const SKUS_BASE = gerarSkusHistorico()

/**
 * Peças vendidas por SKU no recorte.
 * Fecha DOIS âncoras ao mesmo tempo — 1.243.500 peças e ticket de R$ 95,22 —
 * pela alocação de dois vínculos: peso comercial define a ordem, o preço de
 * venda define a média.
 */
const PESO_SKU = SKUS_BASE.map((s, i) => {
  const rand = mulberry32(SEED + 910 + Number(s.id.slice(1)))
  const porPapel = s.heroi ? 4.2 : s.remarcado ? 1.4 : 2.1
  const porCategoria = s.categoria === 'Vestidos' ? 1.1 : s.categoria === 'Blusas' ? 1.25 : 1
  /* Programa de muitas cores vende mais unidade que referência de cor única —
     é por isso que a camiseta básica em 22 cores é o maior giro da rede. O
     número de cores vem do próprio snapshot. */
  const porCores = Math.min(2, 1 + 0.05 * (coresDoProduto(produtos[i]) - 1))
  return porPapel * porCategoria * porCores * jitter(rand, 0.22)
})

const QTD_POR_SKU = alocarComMedia(
  SKUS_BASE.map((s, i) => ({ peso: PESO_SKU[i], valor: s.pv })),
  HISTORICO.pecas,
  HISTORICO.ticket,
)

/** Escala das margens para a ponderada por receita cair exatamente em 59,1%. */
const ESCALA_MARGEM = (() => {
  const receita = SKUS_BASE.map((s, i) => QTD_POR_SKU[i] * s.pv)
  const ponderada = soma(SKUS_BASE.map((s, i) => s.margem * receita[i])) / soma(receita)
  return HISTORICO.margem / ponderada
})()

export const SKUS_HISTORICO: SkuHistorico[] = SKUS_BASE.map((s) => ({
  ...s,
  margem: arredondar(s.margem * ESCALA_MARGEM, 1),
}))

export type FatoHistorico = {
  skuId: string
  regiao: Regiao
  canal: Canal
  pecas: number
  receita: number
}

/**
 * Tabela-fato do Histórico: SKU × região × canal (57 × 5 × 2 = 570 linhas).
 * É o que faz os filtros da tela filtrarem de verdade — todo KPI, gráfico e
 * tabela sai de uma soma desta tabela, nunca de número solto.
 * Região segue a distribuição real da rede; canal, a fatia digital de 7,7%.
 */
function gerarFatos(): FatoHistorico[] {
  const rand = mulberry32(SEED + 911)
  const fatos: FatoHistorico[] = []

  SKUS_HISTORICO.forEach((s, i) => {
    const total = QTD_POR_SKU[i]
    const celulas: { regiao: Regiao; canal: Canal; peso: number }[] = []
    for (const r of DISTRIBUICAO_REGIONAL) {
      for (const canal of CANAIS) {
        const fatiaCanal = canal === 'Digital' ? HISTORICO.digitalShare / 100 : 1 - HISTORICO.digitalShare / 100
        celulas.push({
          regiao: r.regiao,
          canal,
          peso: (r.pct / 100) * fatiaCanal * jitter(rand, 0.12),
        })
      }
    }
    const somaPesos = soma(celulas.map((c) => c.peso))
    const qtds = celulas.map((c) => Math.round((total * c.peso) / somaPesos))
    // resíduo do arredondamento vai para a maior célula: o total do SKU fecha exato
    const maior = qtds.indexOf(Math.max(...qtds))
    qtds[maior] += total - soma(qtds)
    celulas.forEach((c, k) => {
      fatos.push({
        skuId: s.id,
        regiao: c.regiao,
        canal: c.canal,
        pecas: qtds[k],
        receita: qtds[k] * s.pv,
      })
    })
  })

  return fatos
}

export const FATOS_HISTORICO: FatoHistorico[] = gerarFatos()

export type FiltroHistorico = {
  colecao: ColecaoHistorico
  /** id do SKU ou 'todos' */
  sku: string
  categoria: string
  regiao: string
  /** id da loja ou 'todas' — rateia pela participação da loja na região */
  loja: string
  canal: string
  /** meses do recorte, 1 a 6 (6 = período inteiro) */
  meses: number
}

export const FILTRO_HISTORICO_PADRAO: FiltroHistorico = {
  colecao: COLECAO_HISTORICO_PADRAO,
  sku: 'todos',
  categoria: 'todas',
  regiao: 'todas',
  loja: 'todas',
  canal: 'todos',
  meses: 6,
}

export const CATEGORIAS_HISTORICO = [...new Set(SKUS_HISTORICO.map((s) => s.categoria))].sort()

export const MESES_HISTORICO = ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'] as const

/**
 * Série mensal do recorte: 6 meses fechando a receita do âncora, com a margem
 * de cada mês ponderando exatamente nos 59,1%. A curva sobe até o pico da
 * estação (jun/jul) — forma sazonal, não ruído puro.
 */
const FORMA_MENSAL = [0.13, 0.15, 0.17, 0.2, 0.19, 0.16]

export const SERIE_MENSAL_HISTORICO = (() => {
  const rand = mulberry32(SEED + 912)
  const receitas = FORMA_MENSAL.map((f) => HISTORICO.receita * f)
  // fecha a receita exata no último mês
  const ajuste = HISTORICO.receita - soma(receitas)
  receitas[receitas.length - 1] += ajuste

  const margensBrutas = MESES_HISTORICO.map(() => HISTORICO.margem * jitter(rand, 0.04))
  const ponderada = soma(margensBrutas.map((m, i) => m * receitas[i])) / HISTORICO.receita
  const escala = HISTORICO.margem / ponderada

  return MESES_HISTORICO.map((mes, i) => ({
    mes,
    receita: Math.round(receitas[i]),
    margem: arredondar(margensBrutas[i] * escala, 1),
    pecas: Math.round((receitas[i] / HISTORICO.receita) * HISTORICO.pecas),
  }))
})()

/** Participação de cada UF no recorte, indexada em SP = 100 (heatmap). */
export const HEATMAP_UF = (() => {
  const porUf = new Map<string, { uf: string; regiao: Regiao; lojas: number; faturamento: number }>()
  for (const l of LOJAS) {
    const atual = porUf.get(l.uf) ?? { uf: l.uf, regiao: l.regiao, lojas: 0, faturamento: 0 }
    atual.lojas += 1
    atual.faturamento += l.faturamentoMes
    porUf.set(l.uf, atual)
  }
  const lista = [...porUf.values()]
  const sp = lista.find((u) => u.uf === 'SP')?.faturamento ?? 1
  return lista
    .map((u) => ({
      ...u,
      indice: arredondar((u.faturamento / sp) * 100, 0),
      /** receita do recorte atribuída à UF, proporcional ao peso da frota */
      receita: (u.faturamento / soma(lista.map((x) => x.faturamento))) * HISTORICO.receita,
    }))
    .sort((a, b) => b.indice - a.indice)
})()

/**
 * Estoque do recorte por região, com status por regra de cobertura.
 *
 * A cobertura da frota inteira quase não varia entre regiões (o gerador jitera
 * por loja e a média regional achata tudo em 45–47 dias). O que varia de
 * verdade numa coleção de VERÃO lida em agosto é o clima: o Sul, com quase toda
 * a frota em clima frio, ainda não entrou na estação e carrega mais estoque;
 * Nordeste e Norte já vendem a coleção há semanas. É a mesma leitura de clima
 * que bloqueia célula na Distribuição.
 *
 * A cobertura de cada região é a da rede (46 dias) corrigida pelo desvio do
 * fator climático, e a média ponderada pela venda volta a fechar nos 46 dias —
 * o âncora do Dashboard continua de pé.
 */
export type EstoqueRegiao = {
  regiao: Regiao
  lojas: number
  /** fração da frota da região em clima quente ou híbrido quente */
  fatorClima: number
  estoque: number
  venda30d: number
  coberturaDias: number
  ev: number
  status: 'Saudável' | 'Atenção' | 'Excesso'
}

/** Amplitude da correção climática sobre a cobertura (±35%). */
const AMPLITUDE_CLIMA_COBERTURA = 0.35

export const ESTOQUE_POR_REGIAO: EstoqueRegiao[] = (() => {
  const base = DISTRIBUICAO_REGIONAL.map((r) => {
    const ls = LOJAS.filter((l) => l.regiao === r.regiao)
    const quentes = ls.filter((l) => l.clima === 'Quente' || l.clima === 'Híbrida Quente').length
    return {
      regiao: r.regiao,
      lojas: ls.length,
      fatorClima: arredondar(quentes / ls.length, 2),
      venda30d: soma(ls.map((l) => l.venda30d)),
    }
  })

  const vendaTotal = soma(base.map((b) => b.venda30d))
  const fatorMedio = soma(base.map((b) => b.fatorClima * b.venda30d)) / vendaTotal

  /* cobertura = 46 dias × (1 − amplitude × desvio do fator climático).
     Região mais quente que a média vende mais rápido ⇒ cobertura menor. */
  const coberturas = base.map(
    (b) =>
      DASHBOARD.coberturaDias * (1 - AMPLITUDE_CLIMA_COBERTURA * (b.fatorClima - fatorMedio)),
  )
  // renormaliza para a média ponderada cair exatamente nos 46 dias do âncora
  const ponderada = soma(coberturas.map((c, i) => c * base[i].venda30d)) / vendaTotal
  const escala = DASHBOARD.coberturaDias / ponderada

  return base.map((b, i) => {
    const coberturaDias = arredondar(coberturas[i] * escala, 1)
    const estoque = Math.round((b.venda30d / 30) * coberturaDias)
    return {
      ...b,
      estoque,
      coberturaDias,
      ev: arredondar(estoque / b.venda30d, 2),
      /* Banda de gestão em torno do âncora de 46 dias: ±15% é saudável, acima
         sobra coleção de verão parada, abaixo falta peça para o pico. */
      status:
        coberturaDias > DASHBOARD.coberturaDias * 1.15
          ? 'Excesso'
          : coberturaDias < DASHBOARD.coberturaDias * 0.85
            ? 'Atenção'
            : 'Saudável',
    }
  })
})()

/** Receita e peças por SKU no recorte inteiro — base de best/slow sellers. */
export function totaisDoSku(skuId: string, fatos = FATOS_HISTORICO) {
  const linhas = fatos.filter((f) => f.skuId === skuId)
  return {
    pecas: soma(linhas.map((f) => f.pecas)),
    receita: soma(linhas.map((f) => f.receita)),
  }
}

export type RankingSku = SkuHistorico & { pecas: number; receita: number }

const RANKING_COMPLETO: RankingSku[] = SKUS_HISTORICO.map((s) => ({
  ...s,
  ...totaisDoSku(s.id),
}))

/**
 * Best sellers por PEÇAS, não por receita: sortimento se planeja em unidade, e
 * ranking por receita esconderia justamente o NOS de preço baixo — a camiseta
 * básica de R$ 29,99 que é o maior giro da rede. A receita aparece na tabela ao
 * lado, para a leitura não ficar cega ao valor.
 */
export const BEST_SELLERS: RankingSku[] = [...RANKING_COMPLETO]
  .sort((a, b) => b.pecas - a.pecas)
  .slice(0, 6)

export const SLOW_SELLERS: RankingSku[] = [...RANKING_COMPLETO]
  .sort((a, b) => a.sellThrough - b.sellThrough)
  .slice(0, 6)

export const RANKING_SKUS: RankingSku[] = [...RANKING_COMPLETO].sort(
  (a, b) => b.receita - a.receita,
)

/* ========================= 34. SORTIMENTO VIVO (Fase 9) ================== */

/** A estação de verão roda 26 semanas; a leitura de hoje é a semana 19. */
export const SEMANAS_ESTACAO = 26

/**
 * Painel Plano × Venda × Estoque × Carteira.
 *
 * Toda a cadeia sai dos âncoras — só a venda semanal é residual, e está
 * marcada como tal:
 *
 *   vendido        = 63,8% (ST) × 1.208.400 pç do plano ............ 770.959 pç
 *   plano de venda = vendido ÷ 74,2% ........................... 1.038.999 pç
 *                    (86% do plano de compra: o resto já nasce previsto para
 *                     liquidação e carry-over — é o que faz o ST de 63,8% e a
 *                     aderência de 74,2% conviverem sem se contradizer)
 *   estação percorrida = 19 ÷ 26 semanas ........................... 73,1%
 *                    ⇒ 74,2% vendido com 73,1% da estação corrida = NO RITMO
 *   necessidade  = plano − vendido ................................ 437.441 pç
 *   disponível   = necessidade + excesso .......................... 533.441 pç
 *   venda semanal = disponível ÷ 12,8 sem de cobertura ............. 41.675 pç
 *                    (2,7% acima da média da estação — semana de pico)
 *   excesso à frente = disponível − necessidade .................... +96.000 pç
 */
export const PECAS_VENDIDAS_VIVO = Math.round(
  (PLANO.pecas * DASHBOARD.sellThroughColecao) / 100,
)

export const ADERENCIA_PLANO_VENDA = 74.2
export const COBERTURA_COLECAO_SEMANAS = 12.8
export const EXCESSO_A_FRENTE_PECAS = 96_000

export const PAINEL_RITMO = (() => {
  const planoVenda = Math.round(PECAS_VENDIDAS_VIVO / (ADERENCIA_PLANO_VENDA / 100))
  const necessidade = PLANO.pecas - PECAS_VENDIDAS_VIVO
  const disponivel = necessidade + EXCESSO_A_FRENTE_PECAS
  const vendaSemanal = Math.round(disponivel / COBERTURA_COLECAO_SEMANAS)
  const estacaoPercorrida = (COLECAO.semana / SEMANAS_ESTACAO) * 100

  return {
    planoVenda,
    /** fatia do plano de compra que o plano prevê vender na estação */
    fatiaVendavel: arredondar((planoVenda / PLANO.pecas) * 100, 1),
    vendido: PECAS_VENDIDAS_VIVO,
    aderencia: ADERENCIA_PLANO_VENDA,
    estacaoPercorrida: arredondar(estacaoPercorrida, 1),
    /** p.p. de vantagem da venda sobre o calendário da estação */
    vantagem: arredondar(ADERENCIA_PLANO_VENDA - estacaoPercorrida, 1),
    necessidade,
    disponivel,
    vendaSemanal,
    vendaMediaEstacao: Math.round(PECAS_VENDIDAS_VIVO / COLECAO.semana),
    cobertura: COBERTURA_COLECAO_SEMANAS,
    semanasRestantes: SEMANAS_ESTACAO - COLECAO.semana,
    excesso: EXCESSO_A_FRENTE_PECAS,
    /** semanas de venda que o excesso representa */
    excessoSemanas: arredondar(EXCESSO_A_FRENTE_PECAS / (disponivel / COBERTURA_COLECAO_SEMANAS), 1),
  }
})()

export type StatusRitmo = { rotulo: string; tom: 'ok' | 'warn' | 'crit' }

/** Bandas de leitura de cada bloco do painel — regra, não rótulo escrito à mão. */
export const STATUS_RITMO = {
  venda: (PAINEL_RITMO.vantagem >= 0
    ? { rotulo: 'NO RITMO', tom: 'ok' }
    : PAINEL_RITMO.vantagem >= -3
      ? { rotulo: 'ATENÇÃO', tom: 'warn' }
      : { rotulo: 'ATRASADO', tom: 'crit' }) as StatusRitmo,
  estoque: (PAINEL_RITMO.cobertura <= 10
    ? { rotulo: 'APERTADO', tom: 'warn' }
    : PAINEL_RITMO.cobertura <= 14
      ? { rotulo: 'EQUILIBRADO', tom: 'ok' }
      : { rotulo: 'PESADO', tom: 'crit' }) as StatusRitmo,
  carteira: (PAINEL_RITMO.excesso <= 0
    ? { rotulo: 'AJUSTADA', tom: 'ok' }
    : PAINEL_RITMO.excesso < 50_000
      ? { rotulo: 'ATENÇÃO', tom: 'warn' }
      : { rotulo: 'EXCESSO À FRENTE', tom: 'crit' }) as StatusRitmo,
} as const

/**
 * Deltas de cada tick de 5s do painel ao vivo.
 * Pré-computados com seed fixa: a demo mostra o mesmo filme em qualquer
 * máquina, e os KPIs só crescem no ritmo do dia (GMV/dia ÷ ticks do dia).
 */
export type TickVivo = {
  gmv: number
  transacoes: number
  pecas: number
}

export const TICKS_VIVO: TickVivo[] = (() => {
  const rand = mulberry32(SEED + 1313)
  const ticksNoDia = (24 * 60 * 60) / 5
  const gmvPorTick = VIVO.gmvDia / ticksNoDia
  const transacoesPorTick = VIVO.transacoes / ticksNoDia
  return Array.from({ length: 120 }, () => {
    const f = jitter(rand, 0.45)
    return {
      gmv: Math.round(gmvPorTick * f),
      transacoes: Math.round(transacoesPorTick * f * jitter(rand, 0.2)),
      pecas: Math.round(transacoesPorTick * f * VIVO.upt),
    }
  })
})()

export type Severidade = 'Crítica' | 'Alta' | 'Média'

export type AlertaSortimento = {
  id: string
  cod?: string
  produto: string
  categoria: string
  cor: string
  /** lojas afetadas (falta) ou lojas com sobra (excesso) */
  lojas: number
  pecas: number
  /** cobertura em dias na situação atual */
  cobertura: number
  severidade: Severidade
  nota: string
}

/**
 * Alertas de falta e de excesso, sempre sobre produto real do snapshot.
 *
 * Contagens vêm dos âncoras do Sortimento Vivo: 38 rupturas viram 7 alertas de
 * FALTA (uma linha por referência; várias lojas na mesma linha) e o excesso
 * lista 24 referências, das quais a tela mostra 5 e abre o resto.
 *
 * A severidade é regra: cobertura abaixo de 7 dias é crítica na falta; acima de
 * 90 dias é crítica no excesso.
 */
export const ALERTAS_FALTA_TOTAL = 7
export const ALERTAS_EXCESSO_TOTAL = 24

function severidadeFalta(cobertura: number): Severidade {
  return cobertura < 7 ? 'Crítica' : cobertura < 14 ? 'Alta' : 'Média'
}

function severidadeExcesso(cobertura: number): Severidade {
  return cobertura > 90 ? 'Crítica' : cobertura > 70 ? 'Alta' : 'Média'
}

export const ALERTAS_FALTA: AlertaSortimento[] = (() => {
  const rand = mulberry32(SEED + 1414)
  /* Falta é problema de quem vende rápido: ordena o recorte pelos maiores
     sell-through e pega as 7 primeiras referências. */
  const candidatos = [...RANKING_SKUS].sort((a, b) => b.sellThrough - a.sellThrough).slice(0, ALERTAS_FALTA_TOTAL)
  /* As 7 linhas repartem exatamente as 38 rupturas do âncora: rateio pelo peso
     e o resto do arredondamento cai na primeira linha. */
  const pesos = candidatos.map(() => 1 + rand())
  const somaPesos = soma(pesos)
  const lojasPorAlerta = pesos.map((w) => Math.max(1, Math.round((VIVO.rupturas * w) / somaPesos)))
  lojasPorAlerta[0] += VIVO.rupturas - soma(lojasPorAlerta)
  return candidatos.map((s, i) => {
    const cobertura = arredondar(entre(rand, 2, 19) * jitter(rand, 0.1), 1)
    return {
      id: `F${i + 1}`,
      cod: s.cod,
      produto: s.nome,
      categoria: s.categoria,
      cor: s.cor,
      lojas: Math.max(1, lojasPorAlerta[i]),
      pecas: Math.round(s.pecas * 0.04 * jitter(rand, 0.3)),
      cobertura,
      severidade: severidadeFalta(cobertura),
      nota:
        cobertura < 7
          ? `Sell-through de ${formatPct(s.sellThrough)} e menos de uma semana de cobertura — repor por tamanho antes do fim de semana.`
          : `Giro alto (${formatPct(s.sellThrough)}) com cobertura curta: entrar na próxima onda de reposição.`,
    }
  })
})()

export const ALERTAS_EXCESSO: AlertaSortimento[] = (() => {
  const rand = mulberry32(SEED + 1515)
  /* Excesso é o inverso: parte dos menores sell-through e completa até 24
     referências percorrendo o recorte em ordem crescente de giro. */
  const candidatos = [...RANKING_SKUS]
    .sort((a, b) => a.sellThrough - b.sellThrough)
    .slice(0, ALERTAS_EXCESSO_TOTAL)
  return candidatos.map((s, i) => {
    const cobertura = arredondar(entre(rand, 48, 120) * jitter(rand, 0.08), 1)
    return {
      id: `E${i + 1}`,
      cod: s.cod,
      produto: s.nome,
      categoria: s.categoria,
      cor: s.cor,
      lojas: entre(rand, 12, 96),
      pecas: Math.round(s.pecas * 0.18 * jitter(rand, 0.35)),
      cobertura,
      severidade: severidadeExcesso(cobertura),
      nota: s.remarcado
        ? `Já remarcado em ${formatDelta(s.markdownPct)} e ainda com ${formatNum(Math.round(cobertura))} dias de cobertura — avaliar segunda dose no Pricing.`
        : `Cobertura de ${formatNum(Math.round(cobertura))} dias sem markdown ativo: candidato à próxima ação de preço.`,
    }
  })
})()

/* ============================== 35. PRICING (Fase 9) ===================== */

/** Os 5 markdowns reais que a tela oferece como candidatos a ação. */
export type CandidatoPreco = {
  id: string
  cod?: string
  produto: string
  categoria: string
  cor: string
  precoDe: number
  precoPor: number
  markdownPct: number
  /** peças em estoque candidatas à ação */
  estoque: number
  cobertura: number
  sellThrough: number
}

export const CANDIDATOS_PRECO: CandidatoPreco[] = (() => {
  const rand = mulberry32(SEED + 1616)
  /* Os candidatos são exatamente as peças cujo snapshot já traz preço de e
     preço por — markdown real de catálogo. A spec pede 5: −63 −47 −53 −32 −55. */
  const alvos = [-63, -47, -53, -32, -55]
  return alvos.map((md, i) => {
    const p = produtos.find((x) => x.desc === `${md}%`)!
    const sku = SKUS_HISTORICO.find((s) => s.nome === p.nome)
    const estoque = Math.round(entre(rand, 4_200, 28_000) * jitter(rand, 0.15))
    return {
      id: `P${i + 1}`,
      cod: p.cod,
      produto: p.nome,
      categoria: p.cat,
      cor: p.cor ?? '—',
      precoDe: p.precoDe!,
      precoPor: p.precoPor!,
      markdownPct: md,
      estoque,
      cobertura: arredondar(entre(rand, 42, 118) * jitter(rand, 0.1), 0),
      sellThrough: sku?.sellThrough ?? 45,
    }
  })
})()

/** Tipos de etiqueta que a ação pode assumir. */
export const TIPOS_ETIQUETA = [
  { id: 'de-por', nome: 'De / Por', nota: 'Etiqueta dupla com preço anterior riscado.' },
  { id: 'unico', nome: 'Preço único', nota: 'Preço fechado, sem referência ao anterior.' },
  { id: 'leve3', nome: 'Leve 3 pague 2', nota: 'Mecânica de volume — puxa UPT, não derruba etiqueta.' },
  { id: 'carrinho', nome: 'Desconto no carrinho', nota: 'Desconto aplicado no caixa, preserva a etiqueta na peça.' },
  { id: 'cea-pay', nome: 'Exclusivo C&A Pay', nota: `Condicionado ao meio de pagamento próprio (${DASHBOARD.ceaPayShare}% das vendas).` },
] as const

export type TipoEtiqueta = (typeof TIPOS_ETIQUETA)[number]['id']

/** Regras de preço por canal — o que pode e o que não pode divergir. */
export const REGRAS_CANAL = [
  {
    canal: 'Físico',
    regra: 'Preço por cluster. Cluster A sustenta etiqueta cheia mais tempo; D absorve a liquidação primeiro.',
    tom: 'info' as const,
  },
  {
    canal: 'Digital',
    regra: `Preço único nacional, sem quebra por cluster. Digital é ${formatPct(DASHBOARD.digitalShare)} da receita e a vitrine é comparável em segundos.`,
    tom: 'info' as const,
  },
  {
    canal: 'Divergência',
    regra: 'Digital nunca acima do físico do cluster A. Abaixo é permitido só em ação de canal, com vigência e verba próprias.',
    tom: 'warn' as const,
  },
]

/** Profundidade recomendada de markdown no cluster A. */
export const PROFUNDIDADE_CLUSTER_A = { min: -10, max: -15 } as const

export type LinhaDrillPreco = {
  id: string
  nivel: 'N1' | 'SKU'
  paiId?: string
  rotulo: string
  cod?: string
  /** preço praticado no físico do cluster A */
  precoFisicoA: number
  precoDigital: number
  /** preço médio do mesmo tipo de peça no mercado digital */
  precoMercadoDigital: number
  recomendacao: 'Manter' | 'Reduzir' | 'Subir'
  profundidade: number
  acao: string
}

/**
 * Drill-down N1 → SKU do preço praticado.
 *
 * Físico A é o preço real do snapshot. Digital nasce do mesmo preço (regra de
 * preço único nacional) com desvio só onde há ação de canal. Mercado digital usa
 * o índice de posicionamento dos pares aspirativos já calculado no Benchmark, de
 * modo que as duas telas contam a mesma história.
 *
 * A recomendação é regra: mais de 6% acima do mercado pede redução; mais de 6%
 * abaixo abre espaço para subir; no meio, manter.
 */
/**
 * A referência de mercado muda com a faixa de preço da peça: uma camiseta de
 * entrada compete com o bloco de valor (e com o marketplace digital), um
 * vestido premium compete com os pares aspirativos. Um índice único achataria
 * tudo numa recomendação só — que é o que acontece se comparamos camiseta
 * básica e vestido de R$ 260 contra a mesma média.
 */
const INDICE_MERCADO_PARES =
  soma(MARCAS_PARES.map((m) => m.precoMedio)) / MARCAS_PARES.length / BENCHMARK.ticketCA
/** Média das 6 marcas com preço — a referência do meio da escada. */
const INDICE_MERCADO_TOTAL =
  soma(MARCAS_COM_PRECO.map((m) => m.precoMedio)) / MARCAS_COM_PRECO.length / BENCHMARK.ticketCA

const PISO_ESCADA = 40
const TETO_ESCADA = 250

function indiceMercadoDigital(pv: number): number {
  const t = Math.min(1, Math.max(0, (pv - PISO_ESCADA) / (TETO_ESCADA - PISO_ESCADA)))
  return INDICE_MERCADO_TOTAL + t * (INDICE_MERCADO_PARES - INDICE_MERCADO_TOTAL)
}

function recomendar(precoA: number, mercado: number): { rec: LinhaDrillPreco['recomendacao']; prof: number } {
  const gap = (precoA / mercado - 1) * 100
  if (gap > 6) {
    /* A profundidade sai do gap, mas presa na banda que a própria tela
       recomenda para o cluster A (−10% a −15%): sugerir −8% contradiria o card
       de profundidade, e abaixo de −10% o cliente do cluster A nem percebe a
       ação. */
    const bruta = -gap
    const prof = Math.min(
      PROFUNDIDADE_CLUSTER_A.min,
      Math.max(PROFUNDIDADE_CLUSTER_A.max, bruta),
    )
    return { rec: 'Reduzir', prof: arredondar(prof, 0) }
  }
  if (gap < -6) return { rec: 'Subir', prof: arredondar(Math.min(8, -gap), 0) }
  return { rec: 'Manter', prof: 0 }
}

export const DRILL_PRECO: LinhaDrillPreco[] = (() => {
  const rand = mulberry32(SEED + 1717)
  const linhas: LinhaDrillPreco[] = []
  const porDept = new Map<string, RankingSku[]>()
  for (const s of RANKING_SKUS) {
    porDept.set(s.dept, [...(porDept.get(s.dept) ?? []), s])
  }

  for (const [dept, skus] of porDept) {
    const filhos = skus.slice(0, 4).map((s, i) => {
      const precoDigital = arredondar(s.pv * (rand() < 0.25 ? 0.95 : 1), 2)
      const precoMercadoDigital = arredondar(s.pv * indiceMercadoDigital(s.pv) * jitter(rand, 0.1), 2)
      const { rec, prof } = recomendar(s.pv, precoMercadoDigital)
      return {
        id: `${dept}-${i}`,
        nivel: 'SKU' as const,
        paiId: dept,
        rotulo: s.nome,
        cod: s.cod,
        precoFisicoA: s.pv,
        precoDigital,
        precoMercadoDigital,
        recomendacao: rec,
        profundidade: prof,
        acao:
          rec === 'Reduzir'
            ? `Markdown de ${formatPct(prof)} no cluster A, alinhando ao mercado digital.`
            : rec === 'Subir'
              ? `Espaço de ${formatPct(prof)} de trade-up sem sair do mercado.`
              : 'Preço alinhado — manter etiqueta e observar giro.',
      }
    })

    const media = (f: (l: LinhaDrillPreco) => number) => arredondar(soma(filhos.map(f)) / filhos.length, 2)
    const precoA = media((l) => l.precoFisicoA)
    const mercado = media((l) => l.precoMercadoDigital)
    const { rec, prof } = recomendar(precoA, mercado)
    linhas.push({
      id: dept,
      nivel: 'N1',
      rotulo: dept,
      precoFisicoA: precoA,
      precoDigital: media((l) => l.precoDigital),
      precoMercadoDigital: mercado,
      recomendacao: rec,
      profundidade: prof,
      acao:
        rec === 'Reduzir'
          ? 'Departamento acima do mercado digital — revisar preço das entradas.'
          : rec === 'Subir'
            ? 'Departamento abaixo do mercado — avaliar trade-up nas linhas premium.'
            : 'Departamento alinhado ao mercado digital.',
    })
    linhas.push(...filhos)
  }

  return linhas
})()

/**
 * Calendário de preço: o que está ativo agora e o que vem.
 * Datas reais do calendário comercial do snapshot; a contagem de dias sai da
 * data de coleta (17/08/2026) — os 102 dias até a Black Friday da spec.
 */
export type JanelaPreco = {
  nome: string
  quando: string
  dias: number | null
  status: 'ATIVO' | 'PROGRAMADO'
  nota: string
}

export const CALENDARIO_PRECO: JanelaPreco[] = (() => {
  /* meta.dataColeta vem em ISO (2026-08-17); os eventos, em dd/mm/aaaa. */
  const [ano, mes, dia] = cea.meta.dataColeta.split('-').map(Number)
  const hoje = new Date(ano, mes - 1, dia)
  const diasAte = (br: string) => {
    const [d, m, a] = br.split('/').map(Number)
    return Math.round((new Date(a, m - 1, d).getTime() - hoje.getTime()) / 86_400_000)
  }
  const eventos = calendario.filter((e): e is typeof e & { evento: string } => Boolean(e.evento))
  const diaDosPais = eventos.find((e) => e.evento === 'Dia dos Pais')
  const blackFriday = eventos.find((e) => e.evento === 'Black Friday')
  const natal = eventos.find((e) => e.evento === 'Natal')

  return [
    {
      nome: diaDosPais?.evento ?? 'Dia dos Pais',
      quando: 'agosto',
      dias: null,
      status: 'ATIVO',
      nota: diaDosPais?.obs ?? 'campanha ativa no site agora',
    },
    {
      nome: blackFriday?.evento ?? 'Black Friday',
      quando: blackFriday?.data ?? '27/11/2026',
      dias: diasAte(blackFriday?.data ?? '27/11/2026'),
      status: 'PROGRAMADO',
      nota: 'Maior janela de markdown do ano — verba e profundidade travadas com 30 dias de antecedência.',
    },
    {
      nome: natal?.evento ?? 'Natal',
      quando: 'dezembro',
      dias: null,
      status: 'PROGRAMADO',
      nota: 'Preço cheio até 20/12; liquidação de verão abre na semana 1.',
    },
  ]
})()
