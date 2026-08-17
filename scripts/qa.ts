/**
 * QA da Fase 10 — varre o código atrás do que o CLAUDE.md proíbe.
 *
 * Complementa o `verificar-ancoras.ts`: aquele confere se os NÚMEROS fecham,
 * este confere se as REGRAS DE OURO foram respeitadas no código-fonte.
 * Rode com `npm run qa`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const RAIZ = process.cwd()
const PASTAS = ['src', 'server', 'scripts']
const EXTENSOES = new Set(['.ts', '.tsx', '.css', '.html'])

type Achado = { arquivo: string; linha: number; trecho: string; regra: string }

const achados: Achado[] = []
let arquivosLidos = 0

function arquivos(dir: string): string[] {
  const saida: string[] = []
  for (const nome of readdirSync(dir)) {
    if (nome === 'node_modules' || nome === 'dist' || nome.startsWith('.')) continue
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) saida.push(...arquivos(caminho))
    else if (EXTENSOES.has(extname(caminho))) saida.push(caminho)
  }
  return saida
}

/* ------------------------------------------------------------- as regras -- */

/** Termos em inglês que denunciam texto de fachada na UI (regra de ouro 4). */
const LOREM = /\b(lorem|ipsum|dolor sit amet|placeholder text|foo bar|tbd|todo:)\b/i

/** Rosa da Marisa e vizinhos — proibidos pela regra de ouro 5. */
const ROSA_PROIBIDO = /#EC008C|#ec008c|#FF69B4|#ff69b4|magenta/

/**
 * Números grandes soltos dentro de componente (regra de ouro 1).
 * Ignora tudo que é claramente medida de layout, opacidade, cor, duração e
 * índice — o alvo é valor de negócio digitado à mão numa tela.
 */
const NUMERO_SUSPEITO = /(?<![\w.#-])(\d{1,3}(?:[.,]\d{3})+|\d{5,})(?![\w%px])/g

/* Limite conhecido: a isenção é por LINHA. Uma linha que já traz um hex de cor
   ou uma medida em px isenta os números vizinhos dela. É heurística de
   varredura, não análise de AST — vale como rede, não como prova. */
const CONTEXTO_INOCENTE =
  /(px|rem|em|%|ms|deg|z-index|width|height|margin|padding|opacity|rgba?|hsla?|#[0-9a-f]{3,8}|translate|scale|viewBox|stroke|radius|seed|SEED|0x[0-9a-f]+|Math\.imul|>>>|86_400_000|1e\d)/i

/** Só telas e componentes: derived.ts e o JSON são a fonte, podem ter números. */
const SO_COMPONENTES = /^src\/(app|components)\//

/* ------------------------------------------------------------------ varre -- */

for (const pasta of PASTAS) {
  for (const caminho of arquivos(join(RAIZ, pasta))) {
    const rel = relative(RAIZ, caminho)
    const linhas = readFileSync(caminho, 'utf8').split('\n')
    arquivosLidos++

    /* Comentário não renderiza: a linha que DOCUMENTA a regra ("nunca usar
       rosa", "nunca lorem ipsum") não é violação dela. Precisa ser um
       rastreador de bloco, não um teste de prefixo — em CSS o /* abre numa
       linha e o texto continua nas seguintes, sem asterisco na margem. */
    let dentroDeBloco = false

    linhas.forEach((linha, i) => {
      const n = i + 1
      const abre = linha.lastIndexOf('/*')
      const fecha = linha.lastIndexOf('*/')
      const comentario =
        dentroDeBloco || /^\s*(\/\/|\*|\/\*)/.test(linha) || (abre > -1 && abre > fecha)
      if (abre > fecha) dentroDeBloco = true
      else if (fecha > abre) dentroDeBloco = false

      if (LOREM.test(linha) && !comentario && !rel.startsWith('scripts/')) {
        achados.push({ arquivo: rel, linha: n, trecho: linha.trim(), regra: 'lorem/inglês' })
      }

      if (ROSA_PROIBIDO.test(linha) && !comentario && !rel.startsWith('scripts/')) {
        achados.push({ arquivo: rel, linha: n, trecho: linha.trim(), regra: 'rosa proibido' })
      }

      if (SO_COMPONENTES.test(rel) && !comentario && !CONTEXTO_INOCENTE.test(linha)) {
        const encontrados = linha.match(NUMERO_SUSPEITO)
        if (encontrados) {
          achados.push({
            arquivo: rel,
            linha: n,
            trecho: linha.trim(),
            regra: `número hardcoded (${encontrados.join(', ')})`,
          })
        }
      }
    })
  }
}

/* ------------------------------------------------------------- relatório -- */

console.log(`\n— QA DE CÓDIGO — ${arquivosLidos} arquivos varridos\n`)

const porRegra = new Map<string, Achado[]>()
for (const a of achados) {
  const chave = a.regra.split(' (')[0]
  porRegra.set(chave, [...(porRegra.get(chave) ?? []), a])
}

for (const regra of ['lorem/inglês', 'rosa proibido', 'número hardcoded']) {
  const lista = porRegra.get(regra) ?? []
  console.log(`${lista.length === 0 ? '✓' : '✗'} ${regra}: ${lista.length} ocorrência(s)`)
  for (const a of lista) {
    console.log(`    ${a.arquivo}:${a.linha}  ${a.trecho.slice(0, 110)}`)
  }
}

console.log(
  achados.length === 0
    ? '\n✓ nenhuma violação das regras de ouro no código\n'
    : `\n✗ ${achados.length} ponto(s) para revisar\n`,
)
process.exit(achados.length === 0 ? 0 : 1)
