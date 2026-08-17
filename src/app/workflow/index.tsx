import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusChip } from '@/components/ui/StatusChip'
import { Tabs } from '@/components/ui/Tabs'
import { AbaWorkflow } from './AbaWorkflow'
import { AbaCalendario } from './AbaCalendario'
import {
  ANO_CALENDARIO,
  ATIVIDADES_CALENDARIO,
  COLECAO,
  ENTREGAS_WORKFLOW,
  ETAPAS_WORKFLOW,
} from '@/data/derived'
import { formatNum } from '@/lib/format'

export default function WorkflowPage() {
  const [aba, setAba] = useState('workflow')
  const etapaAtual = ETAPAS_WORKFLOW.find((e) => e.status === 'atual')!
  const concluidas = ETAPAS_WORKFLOW.filter((e) => e.status === 'concluida').length

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Workflow da Coleção"
        subtitulo={
          aba === 'workflow'
            ? `${COLECAO.nome} · ${formatNum(ENTREGAS_WORKFLOW.length)} entregas · etapa atual ${etapaAtual.nome} · semana ${COLECAO.semanaWorkflow}`
            : `Processos de compras de ${ANO_CALENDARIO} · ${formatNum(ATIVIDADES_CALENDARIO.length)} atividades em 4 coleções`
        }
        meta={
          aba === 'workflow' ? (
            <>
              <StatusChip tom="ok">
                {concluidas} de {ETAPAS_WORKFLOW.length} etapas concluídas
              </StatusChip>
              <StatusChip tom="info" ponto>
                Etapa {etapaAtual.numero} · {etapaAtual.nome}
              </StatusChip>
            </>
          ) : undefined
        }
      />

      <Tabs
        abas={[
          { id: 'workflow', rotulo: 'Workflow', badge: ENTREGAS_WORKFLOW.length },
          { id: 'calendario', rotulo: 'Calendário', badge: ANO_CALENDARIO },
        ]}
        ativa={aba}
        onTrocar={setAba}
      />

      {aba === 'workflow' ? <AbaWorkflow /> : <AbaCalendario />}
    </div>
  )
}
