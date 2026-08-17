/**
 * Empacota o app inteiro num ÚNICO arquivo HTML, sem nenhuma requisição externa.
 *
 * Serve para publicar a demo onde não há servidor: o arquivo carrega sozinho,
 * com JS e CSS embutidos, HashRouter no lugar do BrowserRouter (não há servidor
 * para reescrever rota) e as fontes do Google fora — a pilha de fallback
 * (system-ui) assume, exatamente como já acontece quando o Google Fonts não
 * responde.
 *
 * O conector VTEX continua degradando para o snapshot local, que é o
 * comportamento que o CLAUDE.md exige: a demo nunca depende da rede.
 *
 * Uso: npm run build:pagina
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const RAIZ = process.cwd()
const SAIDA = join(RAIZ, 'dist-pagina')
const DIST = join(RAIZ, 'dist')

console.log('\n— build de página única —\n')

execFileSync('npx', ['vite', 'build', '--mode', 'pagina'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_ROUTER: 'hash' },
})

const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const assets = readdirSync(join(DIST, 'assets'))
const js = assets.filter((f) => f.endsWith('.js'))
const css = assets.filter((f) => f.endsWith('.css'))

if (js.length !== 1) {
  throw new Error(`esperava 1 bundle de JS, achei ${js.length}: ${js.join(', ')}`)
}

const titulo = /<title>(.*?)<\/title>/.exec(html)?.[1] ?? 'Plano de Sortimento'

/**
 * Poppins e Inter embutidas como data URI.
 *
 * A identidade do CLAUDE.md pede as duas fontes, e num arquivo único o link do
 * Google Fonts não vale: ou está bloqueado, ou é requisição externa — e a
 * degradação silenciosa para system-ui tiraria metade da identidade sem avisar.
 * São 4 pesos de cada, só o subset latino: ~128 kB no total.
 */
const PESOS = [400, 500, 600, 700]

function faceEmbutida(familia: string, peso: number): string {
  const arquivo = join(
    RAIZ,
    'node_modules',
    '@fontsource',
    familia.toLowerCase(),
    'files',
    `${familia.toLowerCase()}-latin-${peso}-normal.woff2`,
  )
  const base64 = readFileSync(arquivo).toString('base64')
  return `@font-face{font-family:'${familia}';font-style:normal;font-weight:${peso};font-display:swap;src:url(data:font/woff2;base64,${base64}) format('woff2')}`
}

const fontes = ['Poppins', 'Inter']
  .flatMap((familia) => PESOS.map((peso) => faceEmbutida(familia, peso)))
  .join('\n')
const estilos = css.map((f) => readFileSync(join(DIST, 'assets', f), 'utf8')).join('\n')
const script = readFileSync(join(DIST, 'assets', js[0]), 'utf8')

/* O arquivo é o CONTEÚDO da página: quem publica embrulha em html/head/body.
   O <meta charset> vai junto mesmo assim: sem ele, um servidor que não declare
   UTF-8 no cabeçalho faz o navegador ler os bytes como latin-1, e o primeiro
   acento dentro do bundle vira "Invalid or unexpected token". */
const pagina = `<meta charset="utf-8" />
<title>${titulo}</title>
<style>
${fontes}
${estilos}
</style>
<div id="root"></div>
<script type="module">
${script}
</script>
`

mkdirSync(SAIDA, { recursive: true })
const destino = join(SAIDA, 'plano-sortimento-cea.html')
writeFileSync(destino, pagina)

const mb = (Buffer.byteLength(pagina) / 1024 / 1024).toFixed(2)
console.log(`\n✓ ${destino}`)
console.log(
  `  ${mb} MB · ${css.length} folha(s) de estilo, ${fontes.split('@font-face').length - 1} fontes e 1 bundle embutidos · zero requisição externa\n`,
)
