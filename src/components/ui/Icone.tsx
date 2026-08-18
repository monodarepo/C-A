import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Boxes,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  ClipboardList,
  Download,
  FileText,
  FolderTree,
  GitBranch,
  Grid3x3,
  HelpCircle,
  History,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  LayoutGrid,
  Menu,
  Package,
  Percent,
  Plus,
  Printer,
  RefreshCcw,
  RotateCw,
  Scale,
  Search,
  Settings,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Table2,
  Tags,
  Target,
  TrendingDown,
  TrendingUp,
  Truck,
  Upload,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'

/**
 * Iconografia única do app — traço 1.75, cantos redondos, sempre via este
 * componente. Centralizar o mapa aqui é o que garante que a interface inteira
 * usa a MESMA família de ícones: nenhum glifo unicode solto, nenhum emoji.
 *
 * Os nomes são semânticos (o que o ícone significa no app), não o nome do
 * desenho — trocar o desenho de "emissao" muda um lugar só.
 */
const MAPA = {
  /* rotas (sidebar) */
  dashboard: LayoutDashboard,
  workflow: KanbanSquare,
  otb: Wallet,
  habilitadores: SlidersHorizontal,
  atributos: Tags,
  plano: Table2,
  versoes: GitBranch,
  mapa: LayoutGrid,
  retroalimentacao: RefreshCcw,
  eventos: CalendarDays,
  line: ClipboardList,
  grade: Grid3x3,
  emissao: Printer,
  distribuicao: Truck,
  benchmark: Scale,
  plm: CircleDot,
  historico: History,
  vivo: Activity,
  pricing: Percent,
  lojas: Store,
  cadastro: FolderTree,

  /* interface */
  menu: Menu,
  busca: Search,
  sino: Bell,
  config: Settings,
  ajuda: HelpCircle,
  fechar: X,
  mais: Plus,
  baixar: Download,
  enviar: Upload,
  recalcular: RotateCw,
  ia: Sparkles,
  seta: ArrowRight,
  chevronDir: ChevronRight,
  chevronBaixo: ChevronDown,
  alerta: AlertTriangle,
  subindo: TrendingUp,
  descendo: TrendingDown,
  documento: FileText,
  pacote: Package,
  caixaVazia: Inbox,
  estrela: Star,
  embaralhar: Shuffle,
  caixas: Boxes,
  alvo: Target,
  confirmar: Check,
} as const

export type NomeIcone = keyof typeof MAPA

type Props = {
  nome: NomeIcone
  /** lado em px (padrão 16 — o tamanho de ícone inline do app) */
  tamanho?: number
  className?: string
  /** ícones são decorativos por padrão; o texto ao lado carrega o sentido */
  rotulo?: string
}

export function Icone({ nome, tamanho = 16, className = '', rotulo }: Props) {
  const Desenho: LucideIcon = MAPA[nome]
  return (
    <Desenho
      size={tamanho}
      strokeWidth={1.75}
      aria-hidden={rotulo ? undefined : true}
      aria-label={rotulo}
      className={`shrink-0 ${className}`}
    />
  )
}
