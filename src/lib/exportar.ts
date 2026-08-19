/**
 * Entrega de arquivo ao usuário, funcionando nos três lugares onde a demo roda.
 *
 * 1. Navegador normal (dev, build servido, GitHub Pages): blob + link
 *    temporário, o caminho de sempre.
 * 2. Página publicada com a capability `downloads`: quem entrega é o
 *    visualizador, com confirmação que pode ser recusada.
 * 3. Página publicada SEM capability alguma — que é o que permite compartilhar
 *    o link publicamente: o visualizador bloqueia qualquer download iniciado
 *    pela própria página, então o conteúdo vai para a área de transferência e
 *    o usuário cola no Excel. Nada de botão morto.
 *
 * A função devolve o que de fato aconteceu para o chamador dar o toast certo
 * (regra 8 do CLAUDE.md: nenhum clique morre em silêncio).
 */

export type ResultadoExportacao =
  | { estado: 'salvo' }
  | { estado: 'copiado' }
  | { estado: 'recusado' }
  | { estado: 'erro'; motivo: string }

type Downloads = {
  save: (r: { filename: string; data: string | Blob }) => Promise<{ status: 'saved' }>
}

type ClaudeRuntime = { use?: (nome: string) => Promise<Downloads | null> }

function runtime(): ClaudeRuntime | undefined {
  return (globalThis as { claude?: ClaudeRuntime }).claude
}

/** Extensões que o visualizador aceita sempre; csv depende do conjunto estendido. */
const EXTENSAO_SEGURA = 'txt'

function trocarExtensao(nome: string, extensao: string): string {
  return nome.replace(/\.[^.]+$/, '') + '.' + extensao
}

/**
 * A página publicada roda dentro de um iframe do visualizador, que barra
 * download iniciado pela própria página. Fora dele (dev, build servido, Pages)
 * o link temporário funciona normalmente.
 */
function dentroDoVisualizador(): boolean {
  try {
    return window.self !== window.top
  } catch {
    return true // cross-origin ao ler window.top já significa iframe
  }
}

/** Área de transferência: caminho moderno, com execCommand como reserva. */
async function copiarParaAreaDeTransferencia(conteudo: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(conteudo)
    return true
  } catch {
    /* segue para a reserva */
  }

  try {
    const campo = document.createElement('textarea')
    campo.value = conteudo
    campo.setAttribute('readonly', '')
    campo.style.position = 'fixed'
    campo.style.opacity = '0'
    document.body.appendChild(campo)
    campo.select()
    const copiou = document.execCommand('copy')
    document.body.removeChild(campo)
    return copiou
  } catch {
    return false
  }
}

function baixarPeloNavegador(nome: string, conteudo: string, tipo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportarArquivo(
  nome: string,
  conteudo: string,
  tipo = 'text/csv;charset=utf-8',
): Promise<ResultadoExportacao> {
  const usar = runtime()?.use

  async function semDownload(): Promise<ResultadoExportacao> {
    if (!dentroDoVisualizador()) {
      baixarPeloNavegador(nome, conteudo, tipo)
      return { estado: 'salvo' }
    }
    return (await copiarParaAreaDeTransferencia(conteudo))
      ? { estado: 'copiado' }
      : { estado: 'erro', motivo: 'area_de_transferencia' }
  }

  if (typeof usar !== 'function') return semDownload()

  let downloads: Downloads | null = null
  try {
    downloads = await usar('downloads')
  } catch {
    downloads = null
  }

  if (!downloads) return semDownload()

  try {
    await downloads.save({ filename: nome, data: conteudo })
    return { estado: 'salvo' }
  } catch (e) {
    const codigo = (e as { code?: string })?.code

    /* csv está no conjunto estendido de extensões: quando não está liberado,
       o mesmo conteúdo sai como .txt — o Excel abre igual. */
    if (codigo === 'extension_not_enabled' || codigo === 'rejected_extension') {
      try {
        await downloads.save({
          filename: trocarExtensao(nome, EXTENSAO_SEGURA),
          data: conteudo,
        })
        return { estado: 'salvo' }
      } catch (e2) {
        const codigo2 = (e2 as { code?: string })?.code
        return codigo2 === 'declined'
          ? { estado: 'recusado' }
          : { estado: 'erro', motivo: codigo2 ?? 'desconhecido' }
      }
    }

    if (codigo === 'declined') return { estado: 'recusado' }
    return { estado: 'erro', motivo: codigo ?? 'desconhecido' }
  }
}
