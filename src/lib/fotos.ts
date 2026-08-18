/**
 * Manifesto das fotos reais do catálogo C&A.
 *
 * As imagens vivem em public/produtos/ e o manifesto (src/data/fotos.json) foi
 * gerado pela coleta. Tudo é estático: nenhuma chamada de rede em runtime.
 *
 * Duas coisas do formato pedem cuidado e estão tratadas aqui:
 *
 * 1. CHAVE. Produto com código real é indexado pelo código; produto sem código
 *    usa id sintético "sNNN", onde NNN é a POSIÇÃO no array de produtos do
 *    snapshot (1-based). Como nem toda tela conhece essa posição, o mapa abaixo
 *    resolve também por NOME — que é o mesmo campo que a coleta usou (nomeJson).
 *
 * 2. nomeReal/link/marca PODEM SER ARRAY. Quando a coleta caiu na busca por
 *    termo, o retorno trouxe vários candidatos. Comparando as imagens com as
 *    listas, a foto baixada é sempre a do PRIMEIRO candidato — e nesses casos
 *    ele costuma ser uma variante da mesma família, não o SKU do snapshot
 *    (a camiseta UV "coqueiro", por exemplo, veio com a foto da UV do
 *    Homem-Aranha). Por isso:
 *      · `legendaDaFoto` descreve o que a imagem MOSTRA (primeiro candidato) —
 *        é o que vai para o alt, porque é a verdade da imagem;
 *      · `nomeExibivel` só devolve nome quando a coleta achou UM resultado,
 *        único caso em que dá para afirmar que aquele é o nome real do produto
 *        da linha. Com lista ambígua a tela mantém o nome do snapshot.
 */
import fotos from '@/data/fotos.json'
import { produtos } from './cea'

export type CorFoto = { nome: string; img500: string; img160: string }

export type EntradaFoto = {
  nomeJson?: string
  nomeReal?: string | string[]
  marca?: string | string[]
  link?: string | string[]
  precoPor?: number | null
  precoDe?: number | null
  cores: CorFoto[]
}

const MANIFESTO = fotos as unknown as Record<string, EntradaFoto>

/** Chave do manifesto para cada nome de produto do snapshot. */
const CHAVE_POR_NOME = new Map<string, string>()
produtos.forEach((p, i) => {
  const chave = p.cod ?? `s${String(i + 1).padStart(3, '0')}`
  if (MANIFESTO[chave] && !CHAVE_POR_NOME.has(p.nome)) CHAVE_POR_NOME.set(p.nome, chave)
})

/** Entrada do manifesto por código real ou, na falta dele, pelo nome. */
export function fotoDoProduto(cod?: string, nome?: string): EntradaFoto | undefined {
  if (cod && MANIFESTO[cod]) return MANIFESTO[cod]
  if (nome) {
    const chave = CHAVE_POR_NOME.get(nome)
    if (chave) return MANIFESTO[chave]
  }
  return undefined
}

const primeiro = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v)

/** O que a IMAGEM mostra — sempre o primeiro candidato da coleta. */
export function legendaDaFoto(e?: EntradaFoto): string | undefined {
  return primeiro(e?.nomeReal)?.trim() || undefined
}

/** Nome real do produto, só quando a coleta foi inequívoca (um resultado). */
export function nomeExibivel(e?: EntradaFoto): string | undefined {
  return typeof e?.nomeReal === 'string' ? e.nomeReal.trim() || undefined : undefined
}

/** Marca da coleta: vem em lista, mas com todos os elementos iguais. */
export function marcaDaFoto(e?: EntradaFoto): string | undefined {
  return primeiro(e?.marca)?.trim() || undefined
}

/** true quando a foto é de uma variante da família, não do SKU exato. */
export function fotoAproximada(e?: EntradaFoto): boolean {
  return Array.isArray(e?.nomeReal)
}

/** Quantas entradas o manifesto tem — usado no autoteste. */
export const TOTAL_COM_FOTO = Object.keys(MANIFESTO).length

/** Quantos produtos do snapshot resolvem para alguma foto. */
export const PRODUTOS_COM_FOTO = produtos.filter((p, i) =>
  Boolean(MANIFESTO[p.cod ?? `s${String(i + 1).padStart(3, '0')}`] ?? (CHAVE_POR_NOME.get(p.nome) && true)),
).length
