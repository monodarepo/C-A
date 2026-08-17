/**
 * Entrega de arquivo ao usuário, funcionando nos dois lugares onde a demo roda.
 *
 * No navegador normal (dev ou build servido) o caminho é o de sempre: blob +
 * link temporário. Na página publicada como artifact o visualizador bloqueia
 * download iniciado pela própria página — lá quem entrega é a capability
 * `downloads`, que mostra uma confirmação e pode ser recusada.
 *
 * A função devolve o que de fato aconteceu para o chamador poder dar o toast
 * certo: a regra 8 do CLAUDE.md diz que nenhum clique morre em silêncio, e um
 * botão que não faz nada no artifact seria exatamente isso.
 */

export type ResultadoExportacao =
  | { estado: 'salvo' }
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

  if (typeof usar !== 'function') {
    baixarPeloNavegador(nome, conteudo, tipo)
    return { estado: 'salvo' }
  }

  let downloads: Downloads | null = null
  try {
    downloads = await usar('downloads')
  } catch {
    downloads = null
  }

  if (!downloads) {
    baixarPeloNavegador(nome, conteudo, tipo)
    return { estado: 'salvo' }
  }

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
