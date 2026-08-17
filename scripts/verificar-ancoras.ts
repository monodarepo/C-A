/**
 * Autoteste dos NÚMEROS-ÂNCORA (regra de ouro 3).
 * Rode `npm run verificar` antes de fechar qualquer fase: confere se a frota
 * simulada continua calibrada nos âncoras do CLAUDE.md e se as marginais
 * (clusters, regiões) fecham exatamente.
 */
import { produtoPorCod, produtos } from '../src/lib/cea'
import { formatDelta } from '../src/lib/format'
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
  CANDIDATOS_COMPENSACAO,
  CAPSULAS_MAPA,
  CARTELA_PAREDE,
  COMPENSACAO_NECESSARIA,
  EVENTOS_CICLOS,
  INCLUSAO_MAPA,
  ITENS_NEED,
  MAPA,
  RESUMO_EVENTOS,
  SKUS_MAPA,
  TOTAIS_MAPA,
  VINCULOS_EVENTO,
  ZONAS,
  piramideDaParede,
  valorDoCandidato,
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
  CLIMA_POR_LINHA,
  DISTRIBUICAO,
  DISTRIBUICAO_CELULAS,
  LIMITE_ACEITE_LINE,
  LINHAS_LINE,
  LOJAS_DISTRIBUICAO,
  OCS_DO_LINE,
  PRAZO_IMPORTADO_DIAS,
  PRAZO_NACIONAL_DIAS,
  TEMPLATES_GRADE,
  TOTAIS_DISTRIBUICAO,
  ajustarAoPack,
  bloqueadoPorClima,
  distribuirPelaCurva,
  multiploDoPack,
  templateDaLinha,
  TEMPLATE_POR_CATEGORIA,
  BENCHMARK,
  CONCORRENTES_MONITORADOS,
  ESTAGIOS_PLM,
  FASES_PLM,
  FICHAS_PLM,
  FICHA_DESTAQUE_PLM,
  GAP_MEDIO_COMPARAVEL,
  GAP_MEDIO_PARES,
  GATILHOS_PLM,
  ITENS_COMPARAVEIS,
  MARCAS_COM_PRECO,
  MARCAS_PARES,
  MARCAS_VALOR,
  MOVIMENTOS_IA,
  PIPELINE_ATENCAO,
  PRECO_BASICO_NOS,
  SKUS_SEM_LEITURA_PLM,
  TOTAL_CLASSIFICADO_PLM,
  riscoPorCobertura,
  MARKDOWNS_REAIS,
  ALERTAS_EXCESSO,
  ALERTAS_EXCESSO_TOTAL,
  ALERTAS_FALTA,
  CALENDARIO_PRECO,
  CANDIDATOS_PRECO,
  DRILL_PRECO,
  ESTOQUE_POR_REGIAO,
  FATOS_HISTORICO,
  HEATMAP_UF,
  PAINEL_RITMO,
  PROFUNDIDADE_CLUSTER_A,
  RANKING_SKUS,
  SEMANAS_ESTACAO,
  SERIE_MENSAL_HISTORICO,
  SKUS_HISTORICO,
  STATUS_RITMO,
  TICKS_VIVO,
  TIPOS_ETIQUETA,
  BEST_SELLERS,
  SLOW_SELLERS,
  VIVO as VIVO_ANCORA,
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

console.log('\n— MAPA DA COLEÇÃO (Fase 6) —')
checar('SKUs na parede', TOTAIS_MAPA.skus, MAPA.skus, 0)
checar('unidades da parede', TOTAIS_MAPA.unidades, MAPA.unidades, 0)
checar('valor de venda da parede', TOTAIS_MAPA.valorVenda, MAPA.valorVenda, 0.0005)
checar('fornecedores distintos', TOTAIS_MAPA.fornecedores, MAPA.fornecedores, 0)
checar('% aprovado', TOTAIS_MAPA.aprovadosPct, MAPA.aprovadosPct, 0.01)
for (const c of CAPSULAS_MAPA) {
  checar(`cápsula ${c.nome}`, SKUS_MAPA.filter((s) => s.capsula === c.nome).length, c.skus, 0)
}
const semUnidade = SKUS_MAPA.filter((s) => s.unidades <= 0)
falhas += semUnidade.length
console.log(`${semUnidade.length === 0 ? '✓' : '✗'} nenhum SKU da parede com zero unidades`)
// cada cápsula precisa ter as três zonas povoadas, senão o board fica torto
const capsulaTorta = CAPSULAS_MAPA.filter((c) =>
  ZONAS.some((z) => SKUS_MAPA.filter((s) => s.capsula === c.nome && s.zona === z).length === 0),
)
falhas += capsulaTorta.length
console.log(
  capsulaTorta.length === 0
    ? `✓ as 3 zonas estão povoadas em todas as cápsulas (${ZONAS.map((z) => `${z} ${SKUS_MAPA.filter((s) => s.zona === z).length}`).join(' · ')})`
    : `✗ cápsula com zona vazia: ${capsulaTorta.map((c) => c.nome).join(', ')}`,
)
const piramideParede = piramideDaParede(SKUS_MAPA)
checar(
  'pirâmide da parede soma 100%',
  piramideParede.reduce((a, p) => a + p.pct, 0),
  100,
  0.0001,
)
checar('cores na cartela da parede', CARTELA_PAREDE.length, 15, 0)

console.log('\n— EVENTOS & CICLOS —')
checar('verba estratégica', RESUMO_EVENTOS.verbaEstrategica, 460_000, 0)
checar('eventos ativos', RESUMO_EVENTOS.ativos, 6, 0)
checar('eventos no total', RESUMO_EVENTOS.total, 7, 0)
checar('eventos em vitrine', RESUMO_EVENTOS.emVitrine, 2, 0)
const needSemEvento = ITENS_NEED.filter((n) => !EVENTOS_CICLOS.some((e) => e.id === n.eventoId))
falhas += needSemEvento.length
console.log(
  `${needSemEvento.length === 0 ? '✓' : '✗'} os ${ITENS_NEED.length} itens Need apontam para eventos existentes`,
)
const refsEventos = [...EVENTOS_CICLOS, ...ITENS_NEED]
  .map((x) => ('ref' in x ? x.ref : undefined))
  .filter((r): r is string => Boolean(r))
const refsEventosInvalidas = refsEventos.filter((r) => !produtoPorCod(r))
falhas += refsEventosInvalidas.length
console.log(
  `${refsEventosInvalidas.length === 0 ? '✓' : '✗'} as ${refsEventos.length} refs citadas em eventos existem no catálogo`,
)

console.log('\n— RETROALIMENTAÇÃO —')
checar('inclusão do Mapa (R$)', INCLUSAO_MAPA.valor, 460_000, 0)
checar(
  'inclusão: peças × PC = valor',
  INCLUSAO_MAPA.pecas * INCLUSAO_MAPA.pc,
  INCLUSAO_MAPA.valor,
  0.001,
)
checar('inclusão cabe na verba estratégica', INCLUSAO_MAPA.valor, RESUMO_EVENTOS.verbaEstrategica, 0)
checar('vínculos de evento', VINCULOS_EVENTO.length, 4, 0)
checar('falta compensar (âncora 0,31 mi)', COMPENSACAO_NECESSARIA, 310_000, 0)
const vinculoSemEvento = VINCULOS_EVENTO.filter(
  (v) => !EVENTOS_CICLOS.some((e) => e.id === v.eventoId),
)
falhas += vinculoSemEvento.length
console.log(`${vinculoSemEvento.length === 0 ? '✓' : '✗'} todo vínculo aponta para um evento real`)
const totalCandidatos = CANDIDATOS_COMPENSACAO.reduce((a, c) => a + valorDoCandidato(c), 0)
const cobre = totalCandidatos >= COMPENSACAO_NECESSARIA
if (!cobre) falhas++
console.log(
  `${cobre ? '✓' : '✗'} os ${CANDIDATOS_COMPENSACAO.length} candidatos liberam R$ ${(totalCandidatos / 1000).toFixed(0)} mil — cobrem os R$ ${(COMPENSACAO_NECESSARIA / 1000).toFixed(0)} mil necessários`,
)
const candidatoSemLinha = CANDIDATOS_COMPENSACAO.filter(
  (c) => !LINHAS_PLANO.some((l) => l.id === c.linhaId),
)
falhas += candidatoSemLinha.length
console.log(
  `${candidatoSemLinha.length === 0 ? '✓' : '✗'} todo candidato aponta para uma linha do plano`,
)

console.log('\n— LINE DEVOLVIDO —')
checar('itens no line', LINHAS_LINE.length, LINHAS_PLANO.length, 0)
const lineSemPlano = LINHAS_LINE.filter((l) => !LINHAS_PLANO.some((p) => p.ref === l.ref))
falhas += lineSemPlano.length
console.log(
  `${lineSemPlano.length === 0 ? '✓' : '✗'} toda linha do line aponta para uma referência do plano`,
)
checar('fornecedores distintos no line', new Set(LINHAS_LINE.map((l) => l.fornecedor)).size, 7, 0)
const decisaoForaDaRegra = LINHAS_LINE.filter(
  (l) =>
    l.decisao !== (Math.abs(l.deltaPct) <= LIMITE_ACEITE_LINE ? 'Aceitar' : 'Renegociar'),
)
falhas += decisaoForaDaRegra.length
console.log(
  `${decisaoForaDaRegra.length === 0 ? '✓' : '✗'} decisão padrão segue a regra dos ${LIMITE_ACEITE_LINE}% de desvio de preço`,
)
const deltaQtdErrado = LINHAS_LINE.filter((l) => {
  const plano = LINHAS_PLANO.find((p) => p.ref === l.ref)!
  return Math.abs((l.qtdRetornada / plano.qtd - 1) * 100 - l.deltaQtdPct) > 0.06
})
falhas += deltaQtdErrado.length
console.log(
  `${deltaQtdErrado.length === 0 ? '✓' : '✗'} Δ de quantidade confere com pedido × retorno`,
)
console.log(
  `  → ${LINHAS_LINE.filter((l) => l.decisao === 'Aceitar').length} aceitar · ${LINHAS_LINE.filter((l) => l.decisao === 'Renegociar').length} renegociar`,
)

console.log('\n— GRADE DE TAMANHOS —')
checar('templates de grade', TEMPLATES_GRADE.length, 4, 0)
for (const t of TEMPLATES_GRADE) {
  checar(
    `${t.id} · curva soma 100%`,
    t.curva.reduce((a, c) => a + c, 0),
    100,
    0,
  )
  checar(`${t.id} · um % por tamanho`, t.curva.length, t.tamanhos.length, 0)
}
const categoriaSemTemplate = [...new Set(LINHAS_PLANO.map((l) => l.categoria))].filter(
  (c) => !TEMPLATE_POR_CATEGORIA[c],
)
falhas += categoriaSemTemplate.length
console.log(
  `${categoriaSemTemplate.length === 0 ? '✓' : '✗'} toda categoria do plano tem template mapeado${categoriaSemTemplate.length ? ` (${categoriaSemTemplate.join(', ')})` : ''}`,
)
const curvaNaoFecha = LINHAS_LINE.filter((l) => {
  const t = templateDaLinha(LINHAS_PLANO.find((p) => p.ref === l.ref)!.categoria)
  return distribuirPelaCurva(l.qtdRetornada, t).reduce((a, n) => a + n, 0) !== l.qtdRetornada
})
falhas += curvaNaoFecha.length
console.log(
  `${curvaNaoFecha.length === 0 ? '✓' : '✗'} a curva fecha o total exato nos ${LINHAS_LINE.length} itens do line`,
)
const packMalAjustado = LINHAS_LINE.filter((l) => {
  const t = templateDaLinha(LINHAS_PLANO.find((p) => p.ref === l.ref)!.categoria)
  const ajustado = ajustarAoPack(l.qtdRetornada, t)
  return !multiploDoPack(ajustado, t) || ajustado < l.qtdRetornada
})
falhas += packMalAjustado.length
console.log(
  `${packMalAjustado.length === 0 ? '✓' : '✗'} ajustarAoPack sempre devolve múltiplo de pack para cima`,
)

console.log('\n— EMISSÃO DE PEDIDOS —')
checar('ordens de compra', OCS_DO_LINE.length, 7, 0)
checar(
  'uma OC por fornecedor',
  new Set(OCS_DO_LINE.map((o) => o.fornecedor)).size,
  OCS_DO_LINE.length,
  0,
)
checar(
  'peças emitidas = retorno do line',
  OCS_DO_LINE.reduce((a, o) => a + o.pecas, 0),
  LINHAS_LINE.reduce((a, l) => a + l.qtdRetornada, 0),
  0,
)
checar(
  'valor emitido = qtd × PC negociado',
  OCS_DO_LINE.reduce((a, o) => a + o.valor, 0),
  LINHAS_LINE.reduce((a, l) => a + l.qtdRetornada * l.pcNegociado, 0),
  0.0001,
)
checar(
  'referências cobertas pelas OCs',
  new Set(OCS_DO_LINE.flatMap((o) => o.refs)).size,
  LINHAS_LINE.length,
  0,
)
const prazoErrado = OCS_DO_LINE.filter(
  (o) =>
    o.prazoDias !== (o.fornecedor.includes('Ásia') ? PRAZO_IMPORTADO_DIAS : PRAZO_NACIONAL_DIAS),
)
falhas += prazoErrado.length
console.log(
  `${prazoErrado.length === 0 ? '✓' : '✗'} D-${PRAZO_IMPORTADO_DIAS} só no importado, D-${PRAZO_NACIONAL_DIAS} no nacional`,
)
const cdsDaRede: readonly string[] = REDE.cds
const semCD = OCS_DO_LINE.filter((o) => !cdsDaRede.includes(o.cd))
falhas += semCD.length
console.log(`${semCD.length === 0 ? '✓' : '✗'} todo destino é um CD real da rede`)

console.log('\n— DISTRIBUIÇÃO —')
checar('lojas no recorte', TOTAIS_DISTRIBUICAO.lojas, DISTRIBUICAO.lojas, 0)
checar('SKUs no recorte', TOTAIS_DISTRIBUICAO.skus, DISTRIBUICAO.skus, 0)
checar(
  'células da matriz',
  DISTRIBUICAO_CELULAS.length,
  DISTRIBUICAO.lojas * DISTRIBUICAO.skus,
  0,
)
checar('packs alocados', TOTAIS_DISTRIBUICAO.packs, DISTRIBUICAO.packs, 0)
checar('peças alocadas', TOTAIS_DISTRIBUICAO.pecas, DISTRIBUICAO.pecas, 0)
checar('lacunas', TOTAIS_DISTRIBUICAO.lacunas, DISTRIBUICAO.lacunas, 0)
checar('aderência à sugestão IA (%)', TOTAIS_DISTRIBUICAO.aderenciaIA, DISTRIBUICAO.aderenciaIA, 0)
checar(
  'peças por pack na média',
  DISTRIBUICAO.pecas / DISTRIBUICAO.packs,
  TOTAIS_DISTRIBUICAO.pecas / TOTAIS_DISTRIBUICAO.packs,
  0.0001,
)
checar('SKUs sensíveis a clima no recorte', Object.keys(CLIMA_POR_LINHA).length, 1, 0)
const pecasForaDoPack = DISTRIBUICAO_CELULAS.filter((c) => {
  const t = TEMPLATES_GRADE.find((x) => x.id === c.templateId)!
  return c.pecas !== c.packs * t.pecasPorPack
})
falhas += pecasForaDoPack.length
console.log(
  `${pecasForaDoPack.length === 0 ? '✓' : '✗'} em toda célula peças = packs × peças do pack`,
)
const lacunaSemBloqueio = DISTRIBUICAO_CELULAS.filter((c) => c.packs === 0 && !c.bloqueado)
const bloqueioComPacks = DISTRIBUICAO_CELULAS.filter((c) => c.bloqueado && c.packs > 0)
falhas += lacunaSemBloqueio.length + bloqueioComPacks.length
console.log(
  `${lacunaSemBloqueio.length + bloqueioComPacks.length === 0 ? '✓' : '✗'} toda lacuna é bloqueio de clima e todo bloqueio fica em zero`,
)
const bloqueioForaDaRegra = DISTRIBUICAO_CELULAS.filter(
  (c) => c.bloqueado !== bloqueadoPorClima(c.linhaId, LOJAS_DISTRIBUICAO.find((l) => l.id === c.lojaId)!),
)
falhas += bloqueioForaDaRegra.length
console.log(
  `${bloqueioForaDaRegra.length === 0 ? '✓' : '✗'} o bloqueio de cada célula segue a regra clima SKU × clima loja`,
)
const lojasFrias = LOJAS_DISTRIBUICAO.filter(
  (l) => l.clima === 'Fria' || l.clima === 'Híbrida Fria',
).length
checar('lojas de clima frio no recorte', lojasFrias, DISTRIBUICAO.lacunas, 0)

console.log('\n— BENCHMARK —')
checar('ticket médio C&A', BENCHMARK.ticketCA, 108, 0)
checar('gap vs Renner (%)', BENCHMARK.gapVsRenner, -16, 0)
checar('coleta do snapshot · SKUs', BENCHMARK.coletaSnapshot.skus, 641, 0)
checar('coleta do snapshot · piso', BENCHMARK.coletaSnapshot.min, 39, 0)
checar('coleta do snapshot · teto', BENCHMARK.coletaSnapshot.max, 440, 0)
checar('concorrentes monitorados', CONCORRENTES_MONITORADOS.length, 7, 0)
checar('marcas com preço no snapshot', MARCAS_COM_PRECO.length, 6, 0)
checar('blocos: pares + valor = marcas com preço', MARCAS_PARES.length + MARCAS_VALOR.length, MARCAS_COM_PRECO.length, 0)
const rennerNoSnapshot = MARCAS_COM_PRECO.reduce((a, m) => Math.max(a, m.precoMedio), 0)
checar('preço médio do líder (Renner)', rennerNoSnapshot, 129, 0)
checar(
  'gap vs Renner fecha com o preço do snapshot',
  ((BENCHMARK.ticketCA - rennerNoSnapshot) / rennerNoSnapshot) * 100,
  BENCHMARK.gapVsRenner,
  0.02,
)
checar('movimentos da IA', MOVIMENTOS_IA.length, 5, 0)
const movimentoSemBase = MOVIMENTOS_IA.filter((m) => !m.base || !m.impacto)
falhas += movimentoSemBase.length
console.log(
  `${movimentoSemBase.length === 0 ? '✓' : '✗'} todo movimento declara a base do número e o impacto`,
)
checar('peças comparáveis', ITENS_COMPARAVEIS.length, 6, 0)
const PRECOS_CA_ANCORA = [29.99, 99.99, 159.99, 189.99, 159.99, 59.99]
const precoCAErrado = ITENS_COMPARAVEIS.filter((i, idx) => i.precoCA !== PRECOS_CA_ANCORA[idx])
falhas += precoCAErrado.length
console.log(
  `${precoCAErrado.length === 0 ? '✓' : '✗'} coluna C&A usa os 6 preços reais da spec (${PRECOS_CA_ANCORA.map((p) => p.toFixed(2).replace('.', ',')).join(' · ')})`,
)
checar('preço real do hero NOS 1049412', PRECO_BASICO_NOS, 29.99, 0)
const semTodasAsMarcas = ITENS_COMPARAVEIS.filter(
  (i) => Object.keys(i.precos).length !== MARCAS_COM_PRECO.length,
)
falhas += semTodasAsMarcas.length
console.log(
  `${semTodasAsMarcas.length === 0 ? '✓' : '✗'} toda peça comparável tem preço nas ${MARCAS_COM_PRECO.length} marcas`,
)
const mediaErrada = ITENS_COMPARAVEIS.filter((i) => {
  const mercado = Object.values(i.precos).reduce((a, v) => a + v, 0) / MARCAS_COM_PRECO.length
  const pares = MARCAS_PARES.reduce((a, m) => a + i.precos[m.marca], 0) / MARCAS_PARES.length
  return Math.abs(mercado - i.mediaMercado) > 0.01 || Math.abs(pares - i.mediaPares) > 0.01
})
falhas += mediaErrada.length
console.log(`${mediaErrada.length === 0 ? '✓' : '✗'} as duas médias conferem com as colunas`)
const paresSempreAcima = ITENS_COMPARAVEIS.every((i) => i.deltaParesPct < 0)
const mercadoSempreAbaixo = ITENS_COMPARAVEIS.every((i) => i.deltaPct > 0)
if (!paresSempreAcima || !mercadoSempreAbaixo) falhas++
console.log(
  `${paresSempreAcima && mercadoSempreAbaixo ? '✓' : '✗'} posicionamento entre os dois blocos: ${formatDelta(GAP_MEDIO_PARES)} vs pares · ${formatDelta(GAP_MEDIO_COMPARAVEL)} vs mercado`,
)

console.log('\n— PLM —')
checar('fases do ciclo', FASES_PLM.length, 8, 0)
checar('fases em loja', FASES_PLM.filter((f) => f.emLoja).length, ESTAGIOS_PLM.length, 0)
checar('estágios em loja', ESTAGIOS_PLM.length, 5, 0)
const CONTAGENS_ANCORA = [38, 61, 84, 29, 11]
const contagemErrada = ESTAGIOS_PLM.filter((e, i) => e.skus !== CONTAGENS_ANCORA[i])
falhas += contagemErrada.length
console.log(
  `${contagemErrada.length === 0 ? '✓' : '✗'} contagens dos estágios = ${CONTAGENS_ANCORA.join('/')}`,
)
checar('SKUs classificados', TOTAL_CLASSIFICADO_PLM, 223, 0)
checar(
  'classificados + sem leitura = SKUs ativos',
  TOTAL_CLASSIFICADO_PLM + SKUS_SEM_LEITURA_PLM,
  COLECAO.skusAtivos,
  0,
)
const estagioForaDaFase = ESTAGIOS_PLM.filter((e) => FASES_PLM[e.fase - 1]?.nome !== e.nome)
falhas += estagioForaDaFase.length
console.log(
  `${estagioForaDaFase.length === 0 ? '✓' : '✗'} cada estágio corresponde à fase de mesmo número`,
)

const destaque = FICHAS_PLM.find((f) => f.cod === FICHA_DESTAQUE_PLM)!
checar('ficha destaque · fase', destaque.fase, 8, 0)
checar('ficha destaque · idade (semanas)', destaque.idadeSemanas, 14, 0)
checar('ficha destaque · velocidade antes', destaque.velocidadeAntes, -12, 0)
checar('ficha destaque · velocidade depois', destaque.velocidadeDepois, 64, 0)
checar('ficha destaque · GMROI', destaque.gmroi, 2.86, 0)
checar('ficha destaque · pulmão', destaque.pulmao, 0, 0)
checar('ficha destaque · sell-out (%)', destaque.sellOut, 100, 0)
checar('ficha destaque · markdown (%)', destaque.markdownPct ?? 0, -55, 0)
const md1083993 = produtoPorCod('1083993')
const markdownFechaComOCatalogo =
  md1083993?.precoDe === destaque.precoDe && md1083993?.precoPor === destaque.precoPor
if (!markdownFechaComOCatalogo) falhas++
console.log(
  `${markdownFechaComOCatalogo ? '✓' : '✗'} preços do destaque batem com o catálogo real (199,99 → 89,99)`,
)
const markdownNosAncoras = MARKDOWNS_REAIS.includes(
  (destaque.markdownPct ?? 0) as (typeof MARKDOWNS_REAIS)[number],
)
if (!markdownNosAncoras) falhas++
console.log(`${markdownNosAncoras ? '✓' : '✗'} o markdown do destaque é um dos 6 reais do CLAUDE.md`)

const fichaForaDoCatalogo = FICHAS_PLM.filter((f) => !produtoPorCod(f.cod))
falhas += fichaForaDoCatalogo.length
console.log(
  `${fichaForaDoCatalogo.length === 0 ? '✓' : '✗'} toda ficha aponta para uma referência real do catálogo`,
)
const fichaComFaseInvalida = FICHAS_PLM.filter((f) => f.fase < 1 || f.fase > FASES_PLM.length)
falhas += fichaComFaseInvalida.length
console.log(
  `${fichaComFaseInvalida.length === 0 ? '✓' : '✗'} toda ficha está numa fase existente (1 a ${FASES_PLM.length})`,
)
const fichaSemAprendizado = FICHAS_PLM.filter((f) => f.aprendizado.length < 40)
falhas += fichaSemAprendizado.length
console.log(
  `${fichaSemAprendizado.length === 0 ? '✓' : '✗'} toda ficha traz sugestão de aprendizado`,
)
const heroisNasFichas = HEROIS_CODS.filter((c) => FICHAS_PLM.some((f) => f.cod === c)).length
console.log(`  → ${heroisNasFichas} dos ${HEROIS_CODS.length} heróis têm ficha no seletor`)

const riscoForaDaRegra = PIPELINE_ATENCAO.filter(
  (i) => i.risco !== riscoPorCobertura(i.cobertura, i.velocidade),
)
falhas += riscoForaDaRegra.length
console.log(
  `${riscoForaDaRegra.length === 0 ? '✓' : '✗'} o risco de cada item do pipeline vem da regra, não de rótulo solto`,
)
const pipelineSemAcao = PIPELINE_ATENCAO.filter((i) => !i.acao)
falhas += pipelineSemAcao.length
console.log(`${pipelineSemAcao.length === 0 ? '✓' : '✗'} todo item do pipeline traz ação sugerida`)
checar('gatilhos automáticos', GATILHOS_PLM.length, 3, 0)
const gatilhoIncompleto = GATILHOS_PLM.filter((g) => !g.se || !g.entao || !g.nota)
falhas += gatilhoIncompleto.length
console.log(
  `${gatilhoIncompleto.length === 0 ? '✓' : '✗'} todo gatilho tem SE, ENTÃO e nota de contexto`,
)
const pausados = GATILHOS_PLM.filter((g) => !g.monitorando).length
checar('gatilhos pausados no estado inicial', pausados, 1, 0)

console.log('\n— HISTÓRICO —')
const somaFatos = (f: (x: (typeof FATOS_HISTORICO)[number]) => number) =>
  FATOS_HISTORICO.reduce((a, x) => a + f(x), 0)
checar('SKUs do recorte', SKUS_HISTORICO.length, 57, 0)
checar('linhas da tabela-fato (SKU × região × canal)', FATOS_HISTORICO.length, 57 * 5 * 2, 0)
checar('peças do recorte', somaFatos((f) => f.pecas), HISTORICO.pecas, 0)
checar('receita do recorte', somaFatos((f) => f.receita), HISTORICO.receita, 0.0005)
checar(
  'ticket = receita ÷ peças',
  somaFatos((f) => f.receita) / somaFatos((f) => f.pecas),
  HISTORICO.ticket,
  0.001,
)
const receitaSku = RANKING_SKUS.reduce((a, s) => a + s.receita, 0)
checar(
  'margem ponderada pela receita',
  RANKING_SKUS.reduce((a, s) => a + s.margem * s.receita, 0) / receitaSku,
  HISTORICO.margem,
  0.001,
)
checar(
  'participação do canal digital (%)',
  (somaFatos((f) => (f.canal === 'Digital' ? f.receita : 0)) / somaFatos((f) => f.receita)) * 100,
  HISTORICO.digitalShare,
  0.01,
)
for (const r of DISTRIBUICAO_REGIONAL) {
  checar(
    `região ${r.regiao} · % da receita`,
    (somaFatos((f) => (f.regiao === r.regiao ? f.receita : 0)) / somaFatos((f) => f.receita)) * 100,
    r.pct,
    0.02,
  )
}
checar('meses da série', SERIE_MENSAL_HISTORICO.length, 6, 0)
checar(
  'série mensal fecha a receita',
  SERIE_MENSAL_HISTORICO.reduce((a, m) => a + m.receita, 0),
  HISTORICO.receita,
  0.0001,
)
checar(
  'margem mensal ponderada',
  SERIE_MENSAL_HISTORICO.reduce((a, m) => a + m.margem * m.receita, 0) /
    SERIE_MENSAL_HISTORICO.reduce((a, m) => a + m.receita, 0),
  HISTORICO.margem,
  0.001,
)
const spNoTopo = HEATMAP_UF[0]?.uf === 'SP' && HEATMAP_UF[0]?.indice === 100
if (!spNoTopo) falhas++
console.log(`${spNoTopo ? '✓' : '✗'} heatmap indexado em SP = 100 (${HEATMAP_UF.length} UFs)`)
const ufForaDaEscala = HEATMAP_UF.filter((u) => u.indice > 100 || u.indice < 0)
falhas += ufForaDaEscala.length
console.log(`${ufForaDaEscala.length === 0 ? '✓' : '✗'} nenhuma UF acima do índice de SP`)
checar(
  'cobertura regional ponderada (dias)',
  ESTOQUE_POR_REGIAO.reduce((a, r) => a + r.coberturaDias * r.venda30d, 0) /
    ESTOQUE_POR_REGIAO.reduce((a, r) => a + r.venda30d, 0),
  DASHBOARD.coberturaDias,
  0.001,
)
const statusDistintos = new Set(ESTOQUE_POR_REGIAO.map((r) => r.status)).size
if (statusDistintos < 2) falhas++
console.log(
  `${statusDistintos >= 2 ? '✓' : '✗'} a tabela de estoque por região tem leitura (${statusDistintos} status distintos: ${ESTOQUE_POR_REGIAO.map((r) => `${r.regiao} ${r.status}`).join(', ')})`,
)
const skuForaDoCatalogo = SKUS_HISTORICO.filter(
  (s) => !produtos.some((p) => p.nome === s.nome),
)
falhas += skuForaDoCatalogo.length
console.log(
  `${skuForaDoCatalogo.length === 0 ? '✓' : '✗'} todo SKU do recorte é um produto real do snapshot`,
)
const bestOrdenado = BEST_SELLERS.every((s, i) => i === 0 || BEST_SELLERS[i - 1].pecas >= s.pecas)
const slowOrdenado = SLOW_SELLERS.every(
  (s, i) => i === 0 || SLOW_SELLERS[i - 1].sellThrough <= s.sellThrough,
)
if (!bestOrdenado || !slowOrdenado) falhas++
console.log(
  `${bestOrdenado && slowOrdenado ? '✓' : '✗'} best sellers por peças e slow sellers por sell-through, em ordem`,
)
const nosNoTopo = BEST_SELLERS[0]?.cod === '1049412'
if (!nosNoTopo) falhas++
console.log(
  `${nosNoTopo ? '✓' : '✗'} o NOS de 22 cores (1049412) lidera o giro em unidades`,
)

console.log('\n— SORTIMENTO VIVO —')
checar('vendido = ST × plano', PAINEL_RITMO.vendido, (PLANO.pecas * DASHBOARD.sellThroughColecao) / 100, 0.0001)
checar('aderência plano × venda (%)', PAINEL_RITMO.aderencia, 74.2, 0)
checar('cobertura da coleção (semanas)', PAINEL_RITMO.cobertura, 12.8, 0)
checar('excesso à frente (peças)', PAINEL_RITMO.excesso, 96_000, 0)
checar(
  'vendido ÷ plano de venda = aderência',
  (PAINEL_RITMO.vendido / PAINEL_RITMO.planoVenda) * 100,
  PAINEL_RITMO.aderencia,
  0.001,
)
checar('necessidade = plano − vendido', PAINEL_RITMO.necessidade, PLANO.pecas - PAINEL_RITMO.vendido, 0)
checar('disponível = necessidade + excesso', PAINEL_RITMO.disponivel, PAINEL_RITMO.necessidade + PAINEL_RITMO.excesso, 0)
checar('venda semanal = disponível ÷ cobertura', PAINEL_RITMO.vendaSemanal, PAINEL_RITMO.disponivel / PAINEL_RITMO.cobertura, 0.0001)
checar('estação percorrida (%)', PAINEL_RITMO.estacaoPercorrida, (COLECAO.semana / SEMANAS_ESTACAO) * 100, 0.001)
checar('semanas restantes', PAINEL_RITMO.semanasRestantes, SEMANAS_ESTACAO - COLECAO.semana, 0)
const rotulos = `${STATUS_RITMO.venda.rotulo} · ${STATUS_RITMO.estoque.rotulo} · ${STATUS_RITMO.carteira.rotulo}`
const rotulosOk = rotulos === 'NO RITMO · EQUILIBRADO · EXCESSO À FRENTE'
if (!rotulosOk) falhas++
console.log(`${rotulosOk ? '✓' : '✗'} painel lê "${rotulos}" (spec: NO RITMO · EQUILIBRADO · EXCESSO À FRENTE)`)
checar('alertas de falta', ALERTAS_FALTA.length, 7, 0)
checar(
  'lojas dos alertas de falta = rupturas do dia',
  ALERTAS_FALTA.reduce((a, x) => a + x.lojas, 0),
  VIVO_ANCORA.rupturas,
  0,
)
checar('alertas de excesso', ALERTAS_EXCESSO.length, ALERTAS_EXCESSO_TOTAL, 0)
checar('alertas de excesso (âncora)', ALERTAS_EXCESSO_TOTAL, 24, 0)
const severidadeErrada = [
  ...ALERTAS_FALTA.filter(
    (a) => a.severidade !== (a.cobertura < 7 ? 'Crítica' : a.cobertura < 14 ? 'Alta' : 'Média'),
  ),
  ...ALERTAS_EXCESSO.filter(
    (a) => a.severidade !== (a.cobertura > 90 ? 'Crítica' : a.cobertura > 70 ? 'Alta' : 'Média'),
  ),
]
falhas += severidadeErrada.length
console.log(
  `${severidadeErrada.length === 0 ? '✓' : '✗'} a severidade de todo alerta vem da regra de cobertura`,
)
const alertaForaDoRecorte = [...ALERTAS_FALTA, ...ALERTAS_EXCESSO].filter(
  (a) => !SKUS_HISTORICO.some((s) => s.nome === a.produto),
)
falhas += alertaForaDoRecorte.length
console.log(
  `${alertaForaDoRecorte.length === 0 ? '✓' : '✗'} todo alerta aponta para produto real do snapshot`,
)
const tickNegativo = TICKS_VIVO.filter((t) => t.gmv <= 0 || t.transacoes < 0)
falhas += tickNegativo.length
console.log(
  `${tickNegativo.length === 0 ? '✓' : '✗'} os ${TICKS_VIVO.length} ticks pré-computados só somam (nenhum negativo)`,
)

console.log('\n— PRICING —')
checar('candidatos a ação de preço', CANDIDATOS_PRECO.length, 5, 0)
const MD_SPEC = [-63, -47, -53, -32, -55]
const mdErrado = CANDIDATOS_PRECO.filter((c, i) => c.markdownPct !== MD_SPEC[i])
falhas += mdErrado.length
console.log(
  `${mdErrado.length === 0 ? '✓' : '✗'} os 5 markdowns da spec, na ordem (${MD_SPEC.join(' · ')})`,
)
const mdForaDosAncoras = CANDIDATOS_PRECO.filter(
  (c) => !(MARKDOWNS_REAIS as readonly number[]).includes(c.markdownPct),
)
falhas += mdForaDosAncoras.length
console.log(
  `${mdForaDosAncoras.length === 0 ? '✓' : '✗'} todo candidato é um dos 6 markdowns reais do CLAUDE.md`,
)
const precoErrado = CANDIDATOS_PRECO.filter((c) => {
  const p = produtos.find((x) => x.nome === c.produto)
  return p?.precoDe !== c.precoDe || p?.precoPor !== c.precoPor
})
falhas += precoErrado.length
console.log(
  `${precoErrado.length === 0 ? '✓' : '✗'} de/por de cada candidato vem do catálogo, não da tela`,
)
const mdCalculadoErrado = CANDIDATOS_PRECO.filter(
  (c) => Math.abs((c.precoPor / c.precoDe - 1) * 100 - c.markdownPct) > 1,
)
falhas += mdCalculadoErrado.length
console.log(
  `${mdCalculadoErrado.length === 0 ? '✓' : '✗'} o % de markdown confere com de/por em todos`,
)
checar('tipos de etiqueta', TIPOS_ETIQUETA.length, 5, 0)
checar(
  'lojas somadas dos 4 clusters',
  REDE.clusters.reduce((a, c) => a + c.lojas, 0),
  REDE.totalLojas,
  0,
)
checar('profundidade cluster A · piso', PROFUNDIDADE_CLUSTER_A.min, -10, 0)
checar('profundidade cluster A · teto', PROFUNDIDADE_CLUSTER_A.max, -15, 0)
const bf = CALENDARIO_PRECO.find((j) => j.nome === 'Black Friday')
checar('dias até a Black Friday', bf?.dias ?? 0, 102, 0)
const paisAtivo = CALENDARIO_PRECO.find((j) => j.nome === 'Dia dos Pais')?.status === 'ATIVO'
if (!paisAtivo) falhas++
console.log(`${paisAtivo ? '✓' : '✗'} Dia dos Pais entra como janela ATIVA (obs do snapshot)`)
const n1SemFilho = DRILL_PRECO.filter(
  (l) => l.nivel === 'N1' && !DRILL_PRECO.some((f) => f.paiId === l.id),
)
falhas += n1SemFilho.length
console.log(`${n1SemFilho.length === 0 ? '✓' : '✗'} todo N1 do drill-down abre em SKUs`)
const recomendacaoErrada = DRILL_PRECO.filter((l) => {
  const gap = (l.precoFisicoA / l.precoMercadoDigital - 1) * 100
  const esperado = gap > 6 ? 'Reduzir' : gap < -6 ? 'Subir' : 'Manter'
  return l.recomendacao !== esperado
})
falhas += recomendacaoErrada.length
console.log(
  `${recomendacaoErrada.length === 0 ? '✓' : '✗'} a recomendação de preço vem da regra de gap contra o mercado`,
)
const profundidadeForaDaBanda = DRILL_PRECO.filter(
  (l) =>
    l.recomendacao === 'Reduzir' &&
    (l.profundidade > PROFUNDIDADE_CLUSTER_A.min || l.profundidade < PROFUNDIDADE_CLUSTER_A.max),
)
falhas += profundidadeForaDaBanda.length
console.log(
  `${profundidadeForaDaBanda.length === 0 ? '✓' : '✗'} nenhuma redução sugerida fora da banda de ${PROFUNDIDADE_CLUSTER_A.min}% a ${PROFUNDIDADE_CLUSTER_A.max}% do cluster A`,
)
const variedade = new Set(DRILL_PRECO.filter((l) => l.nivel === 'SKU').map((l) => l.recomendacao))
if (variedade.size < 2) falhas++
console.log(
  `${variedade.size >= 2 ? '✓' : '✗'} o drill-down tem leitura (${variedade.size} recomendações distintas: ${[...variedade].join(', ')})`,
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
