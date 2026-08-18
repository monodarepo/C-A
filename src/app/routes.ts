import type { NomeIcone } from '@/components/ui/Icone'

/**
 * Registro único de rotas — alimenta a Sidebar, o breadcrumb da Topbar e o
 * roteador. Mudou o nome/subtítulo de uma tela? Muda só aqui.
 * Ordem e agrupamento seguem o CLAUDE.md.
 */
export type Grupo = 'Dashboard Executivo' | 'Pré-Season' | 'Follow-up' | 'In-Season' | 'Transversais'

export type Rota = {
  path: string
  /** pasta em src/app */
  slug: string
  /** rótulo curto na sidebar */
  nav: string
  /** título do PageHeader */
  titulo: string
  subtitulo: string
  grupo: Grupo
  icone: NomeIcone
  /** fase do docs/PROMPTS_CLAUDE_CODE.md que implementa a tela */
  fase: number
}

export const ROTAS: Rota[] = [
  {
    path: '/',
    slug: 'dashboard',
    nav: 'Dashboard',
    titulo: 'Dashboard Executivo',
    subtitulo: 'Cockpit da coleção — performance, atributos e alertas da semana',
    grupo: 'Dashboard Executivo',
    icone: 'dashboard',
    fase: 1,
  },
  {
    path: '/workflow',
    slug: 'workflow',
    nav: 'Workflow da Coleção',
    titulo: 'Workflow da Coleção',
    subtitulo: '16 etapas do processo de compra e o calendário anual de coleções',
    grupo: 'Pré-Season',
    icone: 'workflow',
    fase: 2,
  },
  {
    path: '/otb',
    slug: 'otb',
    nav: 'OTB',
    titulo: 'OTB — Open to Buy',
    subtitulo: 'Camada executiva somente leitura: verba, comprometido e margem planejada',
    grupo: 'Pré-Season',
    icone: 'otb',
    fase: 3,
  },
  {
    path: '/habilitadores',
    slug: 'habilitadores',
    nav: 'Habilitadores',
    titulo: 'Habilitadores de Sortimento',
    subtitulo: 'Pirâmide de preço, gabarito de packs, clusterização de verba e Dorsal × Need',
    grupo: 'Pré-Season',
    icone: 'habilitadores',
    fase: 4,
  },
  {
    path: '/atributos',
    slug: 'atributos',
    nav: 'Atributos',
    titulo: 'Atributos de Produto',
    subtitulo: 'Taxonomia N3–N7 e janela de otimização do mix',
    grupo: 'Pré-Season',
    icone: 'atributos',
    fase: 4,
  },
  {
    path: '/plano',
    slug: 'plano',
    nav: 'Plano de Sortimento',
    titulo: 'Plano de Sortimento',
    subtitulo: 'Linhas geradas, banda de OTB e lista de compras da coleção',
    grupo: 'Pré-Season',
    icone: 'plano',
    fase: 5,
  },
  {
    path: '/versoes',
    slug: 'versoes',
    nav: 'Versões & Aprovação',
    titulo: 'Versões & Aprovação',
    subtitulo: 'Plano Original × Qualificado, deltas e aprovação por nível agregado',
    grupo: 'Pré-Season',
    icone: 'versoes',
    fase: 5,
  },
  {
    path: '/mapa',
    slug: 'mapa',
    nav: 'Mapa da Coleção',
    titulo: 'Mapa da Coleção',
    subtitulo: 'Parede visual por cápsula — Vitrine, Dorsal e Need',
    grupo: 'Pré-Season',
    icone: 'mapa',
    fase: 6,
  },
  {
    path: '/retroalimentacao',
    slug: 'retroalimentacao',
    nav: 'Retroalimentação',
    titulo: 'Retroalimentação do Plano',
    subtitulo: 'Impacto do Mapa na verba e compensações necessárias',
    grupo: 'Pré-Season',
    icone: 'retroalimentacao',
    fase: 6,
  },
  {
    path: '/eventos',
    slug: 'eventos',
    nav: 'Eventos & Ciclos',
    titulo: 'Eventos & Ciclos',
    subtitulo: 'Calendário comercial, cápsulas licenciadas e ciclos de tendência',
    grupo: 'Pré-Season',
    icone: 'eventos',
    fase: 6,
  },
  {
    path: '/line',
    slug: 'line',
    nav: 'Line',
    titulo: 'Montagem do Line',
    subtitulo: 'Pedido × retorno do fornecedor e decisão de negociação',
    grupo: 'Pré-Season',
    icone: 'line',
    fase: 7,
  },
  {
    path: '/grade',
    slug: 'grade',
    nav: 'Grade',
    titulo: 'Grade de Tamanhos',
    subtitulo: 'Curvas padrão por sessão e distribuição de peças por tamanho',
    grupo: 'Pré-Season',
    icone: 'grade',
    fase: 7,
  },
  {
    path: '/emissao',
    slug: 'emissao',
    nav: 'Emissão de Pedidos',
    titulo: 'Emissão de Pedidos',
    subtitulo: 'Ordens de compra por fornecedor e integração com o ERP',
    grupo: 'Pré-Season',
    icone: 'emissao',
    fase: 7,
  },
  {
    path: '/distribuicao',
    slug: 'distribuicao',
    nav: 'Distribuição',
    titulo: 'Distribuição por Loja',
    subtitulo: 'Snapshot da alocação: packs, coerência de clima e lacunas',
    grupo: 'Pré-Season',
    icone: 'distribuicao',
    fase: 7,
  },
  {
    path: '/benchmark',
    slug: 'benchmark',
    nav: 'Benchmark',
    titulo: 'Benchmark de Mercado',
    subtitulo: 'Coleta de concorrentes, preço comparável e movimentos recomendados',
    grupo: 'Follow-up',
    icone: 'benchmark',
    fase: 8,
  },
  {
    path: '/plm',
    slug: 'plm',
    nav: 'PLM',
    titulo: 'PLM — Ciclo de Vida',
    subtitulo: '8 fases do produto, pipeline de risco e gatilhos automáticos',
    grupo: 'Follow-up',
    icone: 'plm',
    fase: 8,
  },
  {
    path: '/historico',
    slug: 'historico',
    nav: 'Histórico',
    titulo: 'Histórico de Vendas',
    subtitulo: 'Série por produto, região, canal e período — best e slow sellers',
    grupo: 'In-Season',
    icone: 'historico',
    fase: 9,
  },
  {
    path: '/vivo',
    slug: 'vivo',
    nav: 'Sortimento Vivo',
    titulo: 'Sortimento Vivo',
    subtitulo: 'Leitura em tempo real: GMV do dia, rupturas, excessos e carteira',
    grupo: 'In-Season',
    icone: 'vivo',
    fase: 9,
  },
  {
    path: '/pricing',
    slug: 'pricing',
    nav: 'Pricing & Markdown',
    titulo: 'Pricing & Markdown',
    subtitulo: 'Ações de preço por cluster, profundidade e calendário promocional',
    grupo: 'In-Season',
    icone: 'pricing',
    fase: 9,
  },
  {
    path: '/lojas',
    slug: 'lojas',
    nav: 'Lojas & Clusters',
    titulo: 'Lojas & Clusters',
    subtitulo: '335 lojas físicas, 4 clusters e reagrupamento sugerido',
    grupo: 'Transversais',
    icone: 'lojas',
    fase: 10,
  },
  {
    path: '/cadastro',
    slug: 'cadastro',
    nav: 'Cadastro de Produtos',
    titulo: 'Cadastro de Produtos',
    subtitulo: 'Hierarquia mercadológica, qualidade de cadastro e pirâmide de preço',
    grupo: 'Transversais',
    icone: 'cadastro',
    fase: 10,
  },
]

/** Ordem dos grupos na sidebar (Transversais entram soltos no fim). */
export const GRUPOS: Grupo[] = [
  'Dashboard Executivo',
  'Pré-Season',
  'Follow-up',
  'In-Season',
  'Transversais',
]

export function rotaPorPath(path: string): Rota | undefined {
  return ROTAS.find((r) => r.path === path)
}
