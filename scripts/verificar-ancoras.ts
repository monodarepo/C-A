/**
 * Autoteste dos NÚMEROS-ÂNCORA (regra de ouro 3).
 * Rode `npm run verificar` antes de fechar qualquer fase: confere se a frota
 * simulada continua calibrada nos âncoras do CLAUDE.md e se as marginais
 * (clusters, regiões) fecham exatamente.
 */
import { produtoPorCod } from '../src/lib/cea'
import {
  AGREGADOS_FROTA,
  ALERTAS_CRITICOS,
  ATIVIDADES_CALENDARIO,
  CAMPANHAS,
  COLECAO,
  CONFLITOS_CALENDARIO,
  CONTAGEM_POR_AREA,
  ENTREGAS_WORKFLOW,
  ETAPAS_WORKFLOW,
  PREMISSAS_CALENDARIO,
  SEMANAS_NO_ANO,
  OTB,
  OTB_CATEGORIAS,
  OTB_MENSAL_CALCULADO,
  TOTAIS_OTB,
  indicadoresOTB,
  recortarPorSegmento,
  totaisOTB,
  validarHierarquiaOTB,
  CLUSTERIZACAO_DEFAULT,
  DORSAL_NEED_DEFAULT,
  EXEMPLO_PADRONAGEM,
  GABARITO_POR_SESSAO,
  JANELAS_OTIMIZACAO,
  PECAS_EXEMPLO_PADRONAGEM,
  RESUMO_DORSAL_DEFAULT,
  TAXONOMIA_ATRIBUTOS,
  VERBA_HABILITADORES,
  distribuirPadronagem,
  pecasPorSku,
  validarExemploPadronagem,
  HEROIS_CODS,
  HISTORICO,
  LINHAS_PLANO,
  MOTIVOS_QUALIFICACAO,
  TOTAIS_PLANO_ORIGINAL,
  TOTAIS_PLANO_QUALIFICADO,
  posicaoNaBanda,
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

console.log('\n— WORKFLOW: 16 ETAPAS E 21 ENTREGAS (Fase 2) —')
checar('etapas do processo', ETAPAS_WORKFLOW.length, 16, 0)
checar('entregas no quadro', ENTREGAS_WORKFLOW.length, COLECAO.entregas, 0)
const atuais = ETAPAS_WORKFLOW.filter((e) => e.status === 'atual')
if (atuais.length !== 1 || atuais[0].nome !== COLECAO.etapaAtual) falhas++
console.log(
  `${atuais.length === 1 && atuais[0].nome === COLECAO.etapaAtual ? '✓' : '✗'} etapa atual única: ${atuais.map((e) => e.nome).join(', ')} (âncora ${COLECAO.etapaAtual})`,
)
const etapasInvalidas = ENTREGAS_WORKFLOW.filter(
  (e) => !ETAPAS_WORKFLOW.some((x) => x.numero === e.etapa),
)
falhas += etapasInvalidas.length
console.log(
  `${etapasInvalidas.length === 0 ? '✓' : '✗'} toda entrega aponta para uma etapa existente`,
)
const refsInvalidas = ENTREGAS_WORKFLOW.flatMap((e) => e.refs).filter((r) => !produtoPorCod(r))
falhas += refsInvalidas.length
console.log(
  refsInvalidas.length === 0
    ? `✓ as ${ENTREGAS_WORKFLOW.flatMap((e) => e.refs).length} refs citadas nos cards existem no catálogo`
    : `✗ refs inexistentes nos cards: ${refsInvalidas.join(', ')}`,
)
for (const ref of ['1033472', '1099133', '1075684', '1049412', '7413962']) {
  const citada = ENTREGAS_WORKFLOW.some((e) => e.refs.includes(ref))
  if (!citada) falhas++
  console.log(`  ${citada ? '✓' : '✗'} card cita a ref ${ref}`)
}

console.log('\n— CALENDÁRIO: GANTT ANUAL —')
checar('atividades no ano', ATIVIDADES_CALENDARIO.length, 102, 0)
const ancoraPorArea: Record<string, number> = {
  Estilo: 23,
  Planejamento: 17,
  Compras: 26,
  'Importação': 36,
}
for (const c of CONTAGEM_POR_AREA) {
  checar(`${c.area} · atividades`, c.total, ancoraPorArea[c.area], 0)
}
checar('conflitos abertos', CONFLITOS_CALENDARIO.length, 2, 0)
for (const c of CONFLITOS_CALENDARIO) {
  const alvo = ATIVIDADES_CALENDARIO.find((a) => a.id === c.atividadeId)
  if (!alvo) falhas++
  console.log(
    `  ${alvo ? '✓' : '✗'} ${c.id} aponta para "${alvo?.nome ?? c.atividadeId}" (deslocamento ${c.deslocamento > 0 ? '+' : ''}${c.deslocamento} semanas)`,
  )
}
const foraDaGrade = ATIVIDADES_CALENDARIO.filter(
  (a) => a.semanaInicio < 1 || a.semanaFim > SEMANAS_NO_ANO || a.semanaFim < a.semanaInicio,
)
falhas += foraDaGrade.length
console.log(`${foraDaGrade.length === 0 ? '✓' : '✗'} todas as barras caem dentro das 52 semanas`)
checar('premissas do calendário', PREMISSAS_CALENDARIO.length, 4, 0)
console.log(`  campanhas na régua: ${CAMPANHAS.length} (${CAMPANHAS.filter((c) => c.real).length} do snapshot real)`)
for (const c of CAMPANHAS.filter((x) => x.real).slice(0, 3)) {
  console.log(`  ✓ ${c.nome}: semanas ${c.semanaInicio}–${c.semanaFim}`)
}

console.log('\n— OTB: COMPARATIVO POR CATEGORIA (Fase 3) —')
checar('plano total (R$ mi)', TOTAIS_OTB.plano, OTB.vendaPlanejada / 1e6, 0)
checar('LY total (R$ mi)', TOTAIS_OTB.ly, 2030, 0)
checar('OTB total (R$ mi)', TOTAIS_OTB.otb, OTB.otb / 1e6, 0)
checar('ATB total (R$ mi)', TOTAIS_OTB.atb, OTB.atb / 1e6, 0)
checar('margem ponderada (%)', TOTAIS_OTB.margem, OTB.margemPlanejada, 0.0002)
const topMalha = OTB_CATEGORIAS[0]
checar('Top Malha · plano', topMalha.plano, 512, 0)
checar('Top Malha · LY', topMalha.ly, 486, 0)
checar('Top Malha · var %', (topMalha.plano / topMalha.ly - 1) * 100, 5.3, 0.01)
checar('Top Malha · OTB', topMalha.otb, 208, 0)
checar('Top Malha · margem', topMalha.margem, 59.8, 0)
checar('Top Malha · cobertura (sem)', topMalha.coberturaSemanas, 10.2, 0)

const errosHierarquia = validarHierarquiaOTB()
falhas += errosHierarquia.length
if (errosHierarquia.length === 0) {
  console.log('✓ N1/N2/N3 de todas as categorias existem na árvore mercadológica real')
} else {
  errosHierarquia.forEach((e) => console.log(`✗ ${e}`))
}

console.log('\n— OTB: CURVA MENSAL AGO–FEV —')
checar(
  'soma do plano mensal',
  OTB_MENSAL_CALCULADO.reduce((a, m) => a + m.plano, 0),
  TOTAIS_OTB.plano,
  0,
)
checar(
  'soma do LY mensal',
  OTB_MENSAL_CALCULADO.reduce((a, m) => a + m.ly, 0),
  TOTAIS_OTB.ly,
  0,
)
const dez = OTB_MENSAL_CALCULADO.find((m) => m.mes === 'DEZ')!
checar('DEZ · plano (tooltip da spec)', dez.plano, 402, 0)
checar('DEZ · LY (tooltip da spec)', dez.ly, 371, 0)
checar('DEZ · crescimento (tooltip da spec)', dez.crescimento, 8.4, 0.01)
checar('meses na curva', OTB_MENSAL_CALCULADO.length, 7, 0)

console.log('\n— OTB: RECORTE POR SEGMENTO N5 —')
const soColecao = totaisOTB(recortarPorSegmento(OTB_CATEGORIAS, 'Coleção 120d'))
const soDorsal = totaisOTB(recortarPorSegmento(OTB_CATEGORIAS, 'Dorsal / NOS'))
checar('Coleção + Dorsal = plano total', soColecao.plano + soDorsal.plano, TOTAIS_OTB.plano, 0.002)
console.log(
  `  Coleção 120d R$ ${soColecao.plano} mi (${((soColecao.plano / TOTAIS_OTB.plano) * 100).toFixed(0)}%) · Dorsal/NOS R$ ${soDorsal.plano} mi`,
)

console.log('\n— OTB: INDICADORES PARA DECISÃO —')
const indicadores = indicadoresOTB()
checar('indicadores gerados', indicadores.length, 3, 0)
checar('alertas (warn)', indicadores.filter((i) => i.tom === 'warn').length, 2, 0)
checar('sucessos (ok)', indicadores.filter((i) => i.tom === 'ok').length, 1, 0)
const semNumeroOTB = indicadores.filter((i) => !/\d/.test(i.texto)).length
if (semNumeroOTB > 0) falhas++
console.log(`  ${semNumeroOTB === 0 ? '✓' : '✗'} todos os indicadores citam números da tabela`)

console.log('\n— HABILITADORES (Fase 4) —')
checar('verba do recorte', VERBA_HABILITADORES.verba, PLANO.verbaHabilitadores, 0)
checar(
  'peças = verba ÷ custo médio',
  VERBA_HABILITADORES.verba / VERBA_HABILITADORES.custoMedio,
  VERBA_HABILITADORES.pecas,
  0.001,
)
const gabaritoVestidos = GABARITO_POR_SESSAO.Vestidos
checar('P1 · peças/SKU (âncora 132)', pecasPorSku(gabaritoVestidos[0].packs), 132, 0)
const pecasDecrescentes = gabaritoVestidos.every(
  (l, i) => i === 0 || pecasPorSku(l.packs) < pecasPorSku(gabaritoVestidos[i - 1].packs),
)
if (!pecasDecrescentes) falhas++
console.log(
  `${pecasDecrescentes ? '✓' : '✗'} profundidade cai da base para o topo da pirâmide: ${gabaritoVestidos.map((l) => pecasPorSku(l.packs)).join(' → ')}`,
)
checar(
  'clusterização soma 100%',
  CLUSTERIZACAO_DEFAULT.reduce((a, c) => a + c.pct, 0),
  100,
  0,
)
checar(
  'e-commerce na clusterização',
  CLUSTERIZACAO_DEFAULT.find((c) => c.id === 'ecommerce')!.pct,
  18,
  0,
)
checar('células de verba', CLUSTERIZACAO_DEFAULT.length, 9, 0)

const rd = RESUMO_DORSAL_DEFAULT
checar('dorsal (R$)', rd.dorsalValor, 30_200_000, 0.005)
checar('dorsal (%)', rd.dorsalPct, 71, 0.005)
checar('need (R$)', rd.needValor, 12_300_000, 0.005)
checar('need (%)', rd.needPct, 29, 0.005)
checar('meses com folga', rd.mesesComFolga, 6, 0)
checar('dorsal + need = verba', rd.dorsalValor + rd.needValor, VERBA_HABILITADORES.verba, 0)
const primeiro = DORSAL_NEED_DEFAULT[0]
const ultimo = DORSAL_NEED_DEFAULT[DORSAL_NEED_DEFAULT.length - 1]
const extremosOk =
  primeiro.dorsalQuente === 92 &&
  primeiro.dorsalFrio === 88 &&
  ultimo.dorsalQuente === 55 &&
  ultimo.dorsalFrio === 50
if (!extremosOk) falhas++
console.log(
  `${extremosOk ? '✓' : '✗'} curva de dorsal vai de ${primeiro.dorsalQuente}/${primeiro.dorsalFrio} (${primeiro.mes}) a ${ultimo.dorsalQuente}/${ultimo.dorsalFrio} (${ultimo.mes})`,
)

console.log('\n— ATRIBUTOS (Fase 4) —')
const padronagens = distribuirPadronagem()
checar('peças do exemplo', PECAS_EXEMPLO_PADRONAGEM, 6200, 0)
checar(
  'soma das participações',
  EXEMPLO_PADRONAGEM.reduce((a, p) => a + p.pct, 0),
  100,
  0,
)
checar('Liso 46% → peças (âncora 2.852)', padronagens[0].pecas, 2852, 0)
checar(
  'Xadrez 7% → peças (âncora 434)',
  padronagens.find((p) => p.padronagem === 'xadrez')!.pecas,
  434,
  0,
)
checar(
  'peças distribuídas = total',
  padronagens.reduce((a, p) => a + p.pecas, 0),
  PECAS_EXEMPLO_PADRONAGEM,
  0,
)
const errosPadronagem = validarExemploPadronagem()
falhas += errosPadronagem.length
console.log(
  errosPadronagem.length === 0
    ? '✓ todas as padronagens do exemplo existem na cartela real'
    : errosPadronagem.map((e) => `✗ ${e}`).join('\n'),
)
const gruposVazios = TAXONOMIA_ATRIBUTOS.filter((g) => g.termos.length === 0)
falhas += gruposVazios.length
console.log(
  `${gruposVazios.length === 0 ? '✓' : '✗'} ${TAXONOMIA_ATRIBUTOS.length} grupos de taxonomia com ${TAXONOMIA_ATRIBUTOS.reduce((a, g) => a + g.termos.length, 0)} termos, todos vindos do snapshot`,
)
const janelasRecomendadas = JANELAS_OTIMIZACAO.filter((j) => j.recomendada).length
checar('janelas recomendadas', janelasRecomendadas, 1, 0)

console.log('\n— PLANO DE SORTIMENTO (Fase 5) —')
const q = TOTAIS_PLANO_QUALIFICADO
const o = TOTAIS_PLANO_ORIGINAL
checar('linhas do plano', q.linhas, PLANO.linhas, 0)
checar('peças (qualificado)', q.pecas, PLANO.pecas, 0)
checar('investimento (qualificado)', q.investimento, PLANO.investimento, 0.0005)
checar('margem do plano (%)', q.margem, PLANO.margem, 0.0002)
checar('peças (original)', o.pecas, PLANO.original.pecas, 0)
checar('investimento (original)', o.investimento, PLANO.original.investimento, 0.0005)

// os três âncoras do estouro só fecham juntos se o investimento for 46,42
const banda = posicaoNaBanda(q.investimento)
checar('estouro em R$ (âncora 1,62 mi)', banda.desvio, PLANO.estouroValor, 0.005)
checar('estouro em % (âncora 3,6)', banda.desvioPct, PLANO.estouroPct, 0.01)
const estourouMesmo = banda.estourou && q.investimento > PLANO.teto
if (!estourouMesmo) falhas++
console.log(
  `${estourouMesmo ? '✓' : '✗'} o plano estoura o teto da banda (${(q.investimento / 1e6).toFixed(2)} > ${(PLANO.teto / 1e6).toFixed(1)})`,
)

// PC precisa ser derivado do PV e da margem em toda linha
const pcErrado = LINHAS_PLANO.filter(
  (l) => Math.abs(l.pc - l.pv * (1 - l.margem / 100)) > 0.011,
)
falhas += pcErrado.length
console.log(
  `${pcErrado.length === 0 ? '✓' : '✗'} PC derivado de PV × (1 − margem) em todas as ${LINHAS_PLANO.length} linhas`,
)

// as 8 referências reais da spec precisam estar no plano
const refsHeroisNoPlano = HEROIS_CODS.filter((c) => LINHAS_PLANO.some((l) => l.ref === c))
checar('heróis reais no plano', refsHeroisNoPlano.length, HEROIS_CODS.length, 0)
checar('linhas marcadas como herói', LINHAS_PLANO.filter((l) => l.heroi).length, 8, 0)
checar('categorias do plano', new Set(LINHAS_PLANO.map((l) => l.categoria)).size, 5, 0)

const comQualificacao = LINHAS_PLANO.filter((l) => l.qtd !== l.qtdOriginal)
checar('qualificações vs Original', comQualificacao.length, 7, 0)
const semMotivo = comQualificacao.filter((l) => !MOTIVOS_QUALIFICACAO[l.id])
falhas += semMotivo.length
console.log(
  `${semMotivo.length === 0 ? '✓' : '✗'} toda qualificação tem motivo declarado`,
)
checar('Δ peças Original → Qualificado', q.pecas - o.pecas, 52_400, 0)
checar(
  'Δ investimento Original → Qualificado',
  q.investimento - o.investimento,
  PLANO.investimento - PLANO.original.investimento,
  0.005,
)
console.log(
  `  PV médio do plano R$ ${q.pvMedio.toFixed(2)} · preço médio por peça do histórico R$ ${HISTORICO.ticket.toFixed(2)} (coerentes)`,
)

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
