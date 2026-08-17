/**
 * Autoteste dos NÚMEROS-ÂNCORA (regra de ouro 3).
 * Rode `npm run verificar` antes de fechar qualquer fase: confere se a frota
 * simulada continua calibrada nos âncoras do CLAUDE.md e se as marginais
 * (clusters, regiões) fecham exatamente.
 */
import {
  AGREGADOS_FROTA,
  ALERTAS_CRITICOS,
  DASHBOARD,
  FOLLOWUP_FORNECEDORES,
  PECAS_VENDIDAS_COLECAO,
  RANKING_ESTILISTAS,
  TOTAIS_ESTILISTAS,
  resumoIA,
  validarAtributosSemana,
  DISTRIBUICAO_REGIONAL,
  FATURAMENTO_MES_REDE,
  FINANCEIRO_2T26,
  LOJAS,
  LOJA_PADRAO_DISTRIBUICAO,
  PIRAMIDE_PRECO,
  PLANO,
  PRECO_MEDIO_PIRAMIDE,
  REDE,
  lojaPorNome,
  margemMediaPonderada,
  precoMedioPonderado,
} from '../src/data/derived'
import { VIVO } from '../src/data/derived'

let falhas = 0

function checar(rotulo: string, real: number, esperado: number, tolerancia = 0.005) {
  const desvio = esperado === 0 ? Math.abs(real) : Math.abs(real - esperado) / Math.abs(esperado)
  const ok = desvio <= tolerancia
  if (!ok) falhas++
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2))
  console.log(
    `${ok ? '✓' : '✗'} ${rotulo.padEnd(42)} real ${fmt(real).padStart(14)} · âncora ${fmt(esperado).padStart(14)}`,
  )
}

const f = AGREGADOS_FROTA

console.log('\n— FROTA —')
checar('lojas na rede', f.lojas, REDE.totalLojas, 0)
checar('nomes de loja únicos', new Set(LOJAS.map((l) => l.nome)).size, REDE.totalLojas, 0)
checar('faturamento mês da frota', f.faturamentoMes, FATURAMENTO_MES_REDE, 0.001)
checar('venda/dia física (GMV − digital)', f.vendaDia, (VIVO.gmvDia * (100 - DASHBOARD.digitalShare)) / 100, 0.002)
checar('cobertura de estoque (dias)', f.coberturaDias, DASHBOARD.coberturaDias, 0.01)
checar('ticket médio da rede', f.ticketMedio, 108, 0.02)
checar('sell-through da coleção (%)', f.sellThrough, DASHBOARD.sellThroughColecao, 0.001)
checar(
  'variação vs LY ponderada (SSS %)',
  LOJAS.reduce((a, l) => a + l.vsLY * l.faturamentoMes, 0) / f.faturamentoMes,
  FINANCEIRO_2T26.sssVestuario,
  0.01,
)

console.log('\n— CLUSTERS —')
for (const c of f.porCluster) {
  const ls = LOJAS.filter((l) => l.cluster === c.id)
  const ticket = c.faturamentoMes / ls.reduce((a, l) => a + l.faturamentoMes / l.ticket, 0)
  const ancora = REDE.clusters.find((x) => x.id === c.id)!
  checar(`cluster ${c.id} · nº de lojas`, c.lojas, c.lojasAncora, 0)
  checar(
    `cluster ${c.id} · % do faturamento`,
    (c.faturamentoMes / f.faturamentoMes) * 100,
    ancora.partFatPct,
    0.005,
  )
  checar(`cluster ${c.id} · ticket médio`, ticket, ancora.ticketMedio, 0.01)
}

console.log('\n— REGIÕES —')
for (const r of f.porRegiao) {
  checar(
    `${r.regiao} · % das lojas`,
    (r.lojas / f.lojas) * 100,
    DISTRIBUICAO_REGIONAL.find((d) => d.regiao === r.regiao)!.pct,
    0.02,
  )
}

console.log('\n— PIRÂMIDE DE PREÇO (vestidos) —')
checar(
  'soma das participações (%)',
  PIRAMIDE_PRECO.reduce((a, x) => a + x.participacao, 0),
  100,
  0,
)
checar('preço médio ponderado', precoMedioPonderado(PIRAMIDE_PRECO), PRECO_MEDIO_PIRAMIDE, 0.005)
console.log(`  margem média ponderada: ${margemMediaPonderada(PIRAMIDE_PRECO).toFixed(1)}%`)

console.log('\n— PLANO —')
checar('estouro sobre o OTB do recorte (%)', (PLANO.investimento / PLANO.otbRecorte - 1) * 100, PLANO.estouroPct, 0.01)
checar('teto da banda (alvo +3%)', PLANO.teto, PLANO.otbRecorte * 1.03, 0.01)
checar('piso da banda (alvo −3%)', PLANO.piso, PLANO.otbRecorte * 0.97, 0.01)

console.log('\n— DASHBOARD: RANKING DE ESTILISTAS (Fase 1) —')
checar('peças = plano × sell-through', TOTAIS_ESTILISTAS.pecas, PECAS_VENDIDAS_COLECAO, 0.0001)
checar('sell-through ponderado (%)', TOTAIS_ESTILISTAS.sellThrough, DASHBOARD.sellThroughColecao, 0.001)
console.log(
  `  vendido total ${(TOTAIS_ESTILISTAS.vendido / 1e6).toFixed(1)} mi · preço médio R$ ${TOTAIS_ESTILISTAS.precoMedio.toFixed(2)}`,
)
for (const e of RANKING_ESTILISTAS) {
  console.log(
    `  ${e.nome.padEnd(16)} ${e.time.padEnd(21)} ${String(e.pecas).padStart(7)} pç · R$ ${(e.vendido / 1e6).toFixed(1)} mi · ST ${e.sellThrough}% · ${e.tendencia > 0 ? '+' : ''}${e.tendencia}%`,
  )
}

console.log('\n— DASHBOARD: FOLLOW-UP DE FORNECEDOR —')
checar(
  'pedidos na carteira = OCs do Vivo',
  FOLLOWUP_FORNECEDORES.reduce((a, f) => a + f.pedidos, 0),
  VIVO.ordensCompra,
  0,
)
for (const f of FOLLOWUP_FORNECEDORES) {
  const esperado = f.atrasos === 0 ? 'OK' : f.atrasos <= 2 ? 'ATENÇÃO' : 'CRÍTICO'
  if (f.status !== esperado) falhas++
  console.log(
    `  ${f.status === esperado ? '✓' : '✗'} ${f.fornecedor.padEnd(22)} ${String(f.pedidos).padStart(3)} pedidos · ${f.atrasos} atraso(s) · ${f.status}`,
  )
}
const semObs = FOLLOWUP_FORNECEDORES.filter((f) => !f.observacao)
falhas += semObs.length
console.log(
  semObs.length === 0
    ? '  ✓ todos os fornecedores têm observação preenchida'
    : `  ✗ sem observação: ${semObs.map((f) => f.fornecedor).join(', ')}`,
)
const refsCitadas = ['1075684', '1099133', '7413962']
for (const ref of refsCitadas) {
  const citada = FOLLOWUP_FORNECEDORES.some((f) => f.observacao.includes(ref))
  if (!citada) falhas++
  console.log(`  ${citada ? '✓' : '✗'} observação cita a ref real ${ref}`)
}

console.log('\n— DASHBOARD: ATRIBUTOS DA SEMANA —')
const errosAtributos = validarAtributosSemana()
falhas += errosAtributos.length
if (errosAtributos.length === 0) {
  console.log('✓ todos os termos citados existem na cartela real do JSON')
} else {
  errosAtributos.forEach((e) => console.log(`✗ ${e}`))
}

console.log('\n— DASHBOARD: ALERTAS CRÍTICOS —')
for (const a of ALERTAS_CRITICOS) {
  const temProduto = a.produto.length > 0
  if (!temProduto) falhas++
  console.log(`  ${temProduto ? '✓' : '✗'} ${a.cod} → ${a.rota} · ${a.produto || 'PRODUTO NÃO ENCONTRADO'}`)
}

console.log('\n— DASHBOARD: RESUMO DA IA —')
const bullets = resumoIA()
checar('bullets gerados', bullets.length, 4, 0)
const semNumero = bullets.filter((b) => !/\d/.test(b.texto)).length
if (semNumero > 0) falhas++
console.log(`  ${semNumero === 0 ? '✓' : '✗'} todos os bullets citam indicadores`)

console.log('\n— LOJA PADRÃO DA DISTRIBUIÇÃO —')
const eldorado = lojaPorNome(LOJA_PADRAO_DISTRIBUICAO)
if (!eldorado) {
  falhas++
  console.log(`✗ loja "${LOJA_PADRAO_DISTRIBUICAO}" não encontrada na frota`)
} else {
  const ok = eldorado.cluster === 'A' && eldorado.clima === 'Híbrida Fria'
  if (!ok) falhas++
  console.log(
    `${ok ? '✓' : '✗'} ${eldorado.nome} · Cluster ${eldorado.cluster} · Clima ${eldorado.clima} (spec: Cluster A · Híbrida Fria)`,
  )
}

console.log('\n— TOP 10 LOJAS (Fase 10 pede 1 negativa) —')
const top10 = LOJAS.slice(0, 10)
for (const l of top10) {
  console.log(
    `  ${l.id} ${l.nome.padEnd(34)} ${l.cluster} · R$ ${(l.faturamentoMes / 1e6).toFixed(2)} mi · ST ${l.sellThrough}% · vs LY ${l.vsLY}%`,
  )
}
const negativas = top10.filter((l) => l.vsLY < 0).length
console.log(`  → ${negativas} loja(s) com vs LY negativo no top 10`)

console.log(
  falhas === 0
    ? '\n✓ todos os âncoras conferem\n'
    : `\n✗ ${falhas} verificação(ões) fora do âncora\n`,
)
process.exit(falhas === 0 ? 0 : 1)
