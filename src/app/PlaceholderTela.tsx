import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { StatusChip } from '@/components/ui/StatusChip'
import { rotaPorPath } from '@/app/routes'
import { COLECAO } from '@/data/derived'

/**
 * Casca temporária das telas ainda não implementadas.
 * Cada fase do docs/PROMPTS_CLAUDE_CODE.md substitui o conteúdo da sua rota —
 * este componente sai do ar quando a última fase entrar.
 */
export function PlaceholderTela({ path }: { path: string }) {
  const rota = rotaPorPath(path)
  if (!rota) return null

  return (
    <div className="space-y-5">
      <PageHeader
        titulo={rota.titulo}
        subtitulo={rota.subtitulo}
        meta={
          <>
            <StatusChip tom="info">{COLECAO.rotulo}</StatusChip>
            <StatusChip tom="neutro">{rota.grupo}</StatusChip>
          </>
        }
      />
      <SectionCard
        titulo="Tela em construção"
        tag={<StatusChip tom="warn">Fase {rota.fase}</StatusChip>}
      >
        <p className="text-sm leading-relaxed text-muted">
          O shell, os tokens, os dados e o conector já estão no lugar (Fase 0). Esta tela é
          implementada na <strong className="text-ink">Fase {rota.fase}</strong> da sequência de
          prompts — a especificação completa está em{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px]">
            docs/PROMPTS_CLAUDE_CODE.md
          </code>
          .
        </p>
      </SectionCard>
    </div>
  )
}
