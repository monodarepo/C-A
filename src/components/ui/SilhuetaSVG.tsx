import { hexDaCor } from '@/lib/cea'

/**
 * Silhuetas de peça de roupa por categoria, preenchidas com a cor real da
 * variante. É o último nível da cascata do ProductImage — o que aparece quando
 * não há foto local nem hidratação. Como é o que sustenta a demo se algo
 * falhar, é desenho de verdade, não caixa cinza.
 *
 * Cada peça é um caminho fechado num viewBox 100×120 (proporção de vitrine).
 * O contorno é a própria cor escurecida, o que dá definição sem depender de
 * segunda cor e funciona igual em peça clara ou escura.
 */

export type TipoSilhueta =
  | 'vestido'
  | 'camiseta'
  | 'camisa'
  | 'calca'
  | 'bermuda'
  | 'legging'
  | 'sutia'
  | 'top'
  | 'infantil'

/**
 * Caminho principal de cada peça, traços que sugerem a modelagem e pontos
 * (botões). O corpo pode ter mais de um subcaminho — é assim que o colarinho
 * da camisa e as duas taças do sutiã ganham contorno próprio.
 */
const PECAS: Record<
  TipoSilhueta,
  { corpo: string; detalhes?: string[]; pontos?: [number, number][] }
> = {
  /* vestido midi: ombro estreito, cintura marcada, saia evasê */
  vestido: {
    corpo:
      'M36 10 Q43 20 50 20 Q57 20 64 10 Q75 13 78 26 L74 48 Q86 78 89 114 L11 114 Q14 78 26 48 L22 26 Q25 13 36 10 Z',
    detalhes: ['M36 10 Q43 22 50 22 Q57 22 64 10', 'M26 48 Q50 56 74 48'],
  },
  /* camiseta: manga curta, gola careca */
  camiseta: {
    corpo:
      'M35 14 Q42 24 50 24 Q58 24 65 14 L78 20 Q90 30 93 46 L79 54 L75 44 L75 108 L25 108 L25 44 L21 54 L7 46 Q10 30 22 20 Z',
    detalhes: ['M35 14 Q42 26 50 26 Q58 26 65 14'],
  },
  /* camisa: colarinho em bico, carcela central e botões */
  camisa: {
    corpo:
      'M34 12 L44 17 L50 25 L56 17 L66 12 L79 19 Q90 30 93 47 L79 55 L75 45 L75 112 L25 112 L25 45 L21 55 L7 47 Q10 30 21 19 Z' +
      ' M34 12 L49 21 L44 28 L35 22 Z' +
      ' M66 12 L51 21 L56 28 L65 22 Z',
    detalhes: ['M50 26 L50 112'],
    pontos: [
      [50, 40],
      [50, 58],
      [50, 76],
      [50, 94],
    ],
  },
  /* calça wide leg: cós reto e perna ampla */
  calca: {
    corpo: 'M24 10 L76 10 L79 34 L84 114 L57 114 L50 58 L43 114 L16 114 L21 34 Z',
    detalhes: ['M24 20 L76 20', 'M50 24 L50 56'],
  },
  /* bermuda: mesma modelagem, barra na altura do joelho */
  bermuda: {
    corpo: 'M24 22 L76 22 L79 44 L82 92 L56 92 L50 62 L44 92 L18 92 L21 44 Z',
    detalhes: ['M24 32 L76 32', 'M50 36 L50 60'],
  },
  /* legging: cintura alta e perna justa */
  legging: {
    corpo: 'M28 10 L72 10 L74 32 L70 114 L54 114 L50 62 L46 114 L30 114 L26 32 Z',
    detalhes: ['M28 22 L72 22'],
  },
  /* sutiã: duas taças separadas pela ponte central, com alças */
  sutia: {
    corpo:
      'M10 44 Q10 30 24 30 Q40 32 47 48 Q49 54 47 62 Q41 74 27 74 Q11 72 10 54 Z' +
      ' M90 44 Q90 30 76 30 Q60 32 53 48 Q51 54 53 62 Q59 74 73 74 Q89 72 90 54 Z' +
      ' M46 50 L54 50 L54 60 L46 60 Z',
    detalhes: [
      'M24 30 Q30 16 42 18',
      'M76 30 Q70 16 58 18',
      'M12 52 Q26 62 40 58',
      'M88 52 Q74 62 60 58',
    ],
  },
  /* top esportivo: cava recortada (controle para DENTRO do corpo, senão o ombro
     fica convexo e a peça vira tubo), alça larga e barra elástica */
  top: {
    corpo:
      'M24 92 L22 54 Q35 47 39 22 L46 20 Q50 33 54 20 L61 22 Q65 47 78 54 L76 92 Z',
    detalhes: ['M46 20 Q50 33 54 20', 'M23 80 L77 80'],
  },
  /* camiseta infantil: proporção mais curta e gola maior */
  infantil: {
    corpo:
      'M36 20 Q43 30 50 30 Q57 30 64 20 L76 26 Q86 34 89 48 L77 55 L74 46 L74 98 L26 98 L26 46 L23 55 L11 48 Q14 34 24 26 Z',
    detalhes: ['M36 20 Q43 32 50 32 Q57 32 64 20'],
  },
}

/** Categoria do catálogo → peça desenhada. */
function silhuetaDaCategoria(categoria = '', nome = ''): TipoSilhueta {
  const c = `${categoria} ${nome}`.toLowerCase()
  if (c.includes('vestido')) return 'vestido'
  if (c.includes('sutiã') || c.includes('sutia') || c.includes('íntima')) return 'sutia'
  if (c.includes('legging')) return 'legging'
  if (c.includes('top')) return 'top'
  if (c.includes('bermuda') || c.includes('short')) return 'bermuda'
  if (c.includes('camisa') && !c.includes('camiseta')) return 'camisa'
  if (c.includes('calça') || c.includes('calca') || c.includes('jeans')) return 'calca'
  if (c.includes('infantil') || c.includes('blusa')) return 'infantil'
  return 'camiseta'
}

/** Escurece um hex para virar o contorno da própria peça. */
function escurecer(hex: string, fator = 0.72): string {
  const n = parseInt(hex.slice(1), 16)
  const canais = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.round(v * fator)),
  )
  return `#${canais.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

type Props = {
  categoria?: string
  nome: string
  cor?: string
  /** mostra o nome curto embaixo do desenho */
  rotulo?: boolean
  className?: string
}

export function SilhuetaSVG({ categoria, nome, cor, rotulo = false, className = '' }: Props) {
  const tipo = silhuetaDaCategoria(categoria, nome)
  const peca = PECAS[tipo]
  const fundo = cor ? hexDaCor(cor) : hexDaCor(nome)
  const traco = escurecer(fundo)
  /* peça clara pede contorno mais forte para não desaparecer no fundo neutro */
  const claro = parseInt(fundo.slice(1), 16) > 0xc0c0c0

  return (
    <span
      className={`relative grid h-full w-full place-items-center overflow-hidden bg-slate-100 ${className}`}
    >
      <svg
        viewBox="0 0 100 120"
        role="img"
        aria-label={`${nome}${cor ? ` na cor ${cor}` : ''}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>{`${nome}${cor ? ` · ${cor}` : ''}`}</title>
        <g transform="translate(6 4) scale(0.88)">
          <path
            d={peca.corpo}
            fill={fundo}
            stroke={traco}
            strokeWidth={claro ? 2 : 1.4}
            strokeLinejoin="round"
          />
          {peca.pontos?.map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.8} fill={traco} opacity={0.8} />
          ))}
          {peca.detalhes?.map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke={traco}
              strokeWidth={claro ? 1.4 : 1}
              strokeLinecap="round"
              opacity={0.75}
            />
          ))}
        </g>
      </svg>
      {rotulo && (
        <span className="absolute inset-x-0 bottom-0 truncate bg-white/85 px-1.5 py-0.5 text-center text-[10px] font-medium text-slate-600 backdrop-blur-sm">
          {cor ?? nome}
        </span>
      )}
    </span>
  )
}
