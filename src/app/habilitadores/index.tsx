import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Icone } from '@/components/ui/Icone'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/ui/KpiCard'
import { StatusChip } from '@/components/ui/StatusChip'
import { useToast } from '@/components/ui/Toast'
import { BlocoGabarito, BlocoPiramide } from './BlocosParametros'
import { BlocoClusterizacao, BlocoDorsalNeed } from './BlocosVerba'
import { COLECAO, RECORTE_HABILITADORES, VERBA_HABILITADORES } from '@/data/derived'
import { formatBRL, formatBRLCompact, formatNum, formatPct } from '@/lib/format'

export default function HabilitadoresPage() {
  const { push } = useToast()
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Habilitadores de Sortimento"
        subtitulo={`${COLECAO.rotulo} · recorte ${RECORTE_HABILITADORES.n1} · ${RECORTE_HABILITADORES.n3}`}
        meta={
          <>
            <StatusChip tom="info">Parâmetros editáveis</StatusChip>
            <StatusChip tom="neutro">Recalcula ao vivo</StatusChip>
          </>
        }
        acoes={
          <>
            <Button
              icone={<Icone nome="enviar" tamanho={15} />}
              onClick={() =>
                push(
                  'Importação em lote',
                  'info',
                  'Demo: a planilha de parâmetros entraria por aqui, validando soma de 100% por bloco.',
                )
              }
            >
              Importar em Lote
            </Button>
            <Button
              variante="primario"
              onClick={() => {
                push('Parâmetros enviados ao plano', 'ok', 'Abrindo o Plano de Sortimento.')
                navigate('/plano')
              }}
            >
              Gerar Plano de Sortimento →
            </Button>
          </>
        }
      />

      <Banner tom="info" titulo="Habilitadores não são atributos">
        Habilitador é <strong>quanto e como comprar</strong> — verba, profundidade, packs, divisão
        Dorsal × Need. Atributo é <strong>o que o produto é</strong> — fit, tecido, padronagem, cor.
        A taxonomia de atributos fica em{' '}
        <Link to="/atributos" className="font-semibold text-cea-blue hover:underline">
          Atributos de Produto
        </Link>
        .
      </Banner>

      {/* --------------------------------------------------- card de verba --- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Verba do recorte"
          valor={formatBRLCompact(VERBA_HABILITADORES.verba, 1)}
          sub={`${RECORTE_HABILITADORES.n1} · ${RECORTE_HABILITADORES.n3}`}
          tomSub="neutra"
          dica="Parte do OTB destinada a esta sessão. É o teto que os quatro blocos abaixo distribuem."
        />
        <KpiCard
          label="Custo médio"
          valor={formatBRL(VERBA_HABILITADORES.custoMedio)}
          sub="por peça"
          tomSub="neutra"
          dica="Custo médio de aquisição da peça na sessão, negociado com os fornecedores."
        />
        <KpiCard
          label="Peças estimadas"
          valor={formatNum(VERBA_HABILITADORES.pecas)}
          sub="verba ÷ custo médio"
          tomSub="neutra"
          dica="Volume que a verba compra ao custo médio atual. Muda quando o custo negociado muda."
        />
        <KpiCard
          label="Margem alvo"
          valor={formatPct(VERBA_HABILITADORES.margem, 0)}
          sub="da sessão"
          tomSub="neutra"
          dica="Margem bruta que a sessão precisa entregar. A pirâmide de preço é o que a sustenta."
        />
      </div>

      <BlocoPiramide />
      <BlocoGabarito />
      <BlocoClusterizacao />
      <BlocoDorsalNeed />

      <p className="text-[11.5px] text-slate-400">
        Tudo nesta tela é parâmetro de entrada: as edições ficam em memória e alimentam o Plano de
        Sortimento. Nenhum número aqui é gravado em sistema.
      </p>
    </div>
  )
}
