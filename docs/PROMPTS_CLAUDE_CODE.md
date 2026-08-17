# PROMPTS — Claude Code · Plano de Sortimento C&A

## Como usar
1. Crie o repo no GitHub (ex.: `plano-sortimento-cea`) e clone.
2. Copie para a raiz: `CLAUDE.md` · `docs/PROMPTS_CLAUDE_CODE.md` (este arquivo) · `src/data/cea_data.json` (crie a pasta) · opcional: `docs/Blueprint_v2.docx` e as capturas de referência em `docs/refs/`.
3. Abra o Claude Code na raiz e cole **uma fase por vez**, na ordem. Revise o resultado (`npm run dev`), peça ajustes na mesma sessão se necessário, e só então avance.
4. Se o Claude Code sugerir plano antes de executar, aprove. Ele deve commitar ao final de cada fase.

---

## FASE 0 — Bootstrap: repo, shell, dados e conector
```
Leia o CLAUDE.md inteiro antes de começar. Depois execute:

1) Bootstrap: Vite + React 18 + TypeScript. Instale e configure Tailwind, React Router,
   Recharts, concurrently, express, cors, tsx. Scripts: "dev" (concurrently: vite +
   tsx watch server/index.ts), "build", "typecheck", "lint". Vite com proxy /api -> :3001.
2) Crie a estrutura de pastas do CLAUDE.md. Adicione src/styles/tokens.css com os tokens,
   importe Poppins+Inter no index.html, title "Plano de Sortimento — C&A",
   meta description "dashboard executivo, planejamento de coleção, OTB, plano de sortimento,
   distribuição e sortimento vivo para o varejo de moda da C&A", theme-color #00287A, lang pt-BR.
3) server/index.ts: implemente /api/cea/search, /api/cea/ref/:cod e /api/cea/logo conforme
   o contrato do CLAUDE.md (timeout 3s, cache em memória 1h, {fallback:true} em erro).
4) src/lib/cea.ts: carrega cea_data.json; função hydrate(cod) que tenta /api/cea/ref/:cod
   e mescla {precoPor, precoDe, imageUrl}; util placeholderFor(produto) que devolve um
   bloco de cor determinístico pela cor da variante + iniciais.
5) src/data/derived.ts: exporte os NÚMEROS-ÂNCORA como constantes tipadas; gerador seedado
   (mulberry32, seed 2627) que expande as 24 lojas nomeadas do JSON para 335 lojas
   (nomes "C&A <cidade> <shopping|Centro>", distribuição por cluster/UF do JSON), cada uma
   com faturamentoMes, venda30d, estoque, ev, rupturaPct, ticket, sellThrough — calibrados
   para os âncoras (ex.: soma da venda ≈ GMV; médias de ticket por cluster do JSON).
6) Layout: AppShell com Sidebar (5 grupos e rotas do CLAUDE.md, logo C&A em SVG com
   C/A azuis e & vermelho — tente usar as cores de /api/cea/logo com fallback dos tokens,
   colapsável <1100px) + Topbar (breadcrumb, busca, seletor "Verão 26-27 | Tropicália",
   sino badge 6, engrenagem, ajuda, avatar MA). Todas as 21 rotas com placeholder
   <PageHeader titulo subtitulo/> renderizando.
7) Componentes base em components/ui: KpiCard (label pequeno maiúsculo, valor Poppins
   grande, subtexto colorido com seta), StatusChip, Banner (info azul / warn âmbar /
   crit vermelho), SectionCard, DataTable (denso, zebra, hover, ordenável), EmptyGate
   (ícone+texto+CTA), Sparkline (Recharts), PageHeader.
8) npm run typecheck && npm run lint. README.md curto (o que é, como rodar).
   Commit: "chore: bootstrap do shell, tokens, dados e conector VTEX".
Critérios de aceite: dev sobe sem erros; /api/cea/search?term=vestido responde (ou
fallback:true); sidebar/topbar idênticas à spec; 21 rotas navegáveis.
```

## FASE 1 — Dashboard Executivo (/)
```
Implemente o Dashboard conforme CLAUDE.md (âncoras) — layout de referência: header
"Verão 26-27 · semana 19 · 335 lojas · 262 SKUs ativos" + botão primário "Pedir Resumo da IA"
(abre modal com resumo textual gerado dos dados: 4 bullets usando os âncoras).
Linha 1 — 6 KpiCards: SELL-THROUGH COLEÇÃO 63,8% (+2,4pp vs LY) · COBERTURA 46 dias
(Meta 60d) · MARGEM REALIZADA 59,1% (badge "20 tris de expansão") · MARKDOWN ACUMULADO
7,6% (Limite 12%) · ADERÊNCIA IA·DISTRIBUIÇÃO 84% (262 SKUs em 335 lojas) · SINCRONIA ERP
OK (Último push 14:32 · 0 erros). Chips à direita: "Digital 7,7% (+33%)" e "C&A Pay 24%".
Bloco Ranking de Estilistas (tabela: estilista+time do JSON ficticios, peças, vendido R$,
barra de sell-through, tendência) e Top Cidades (SP 19, RJ 12, BH 8, Salvador 7, Recife 6
com barras; nota "SP+RJ concentram 31% das vendas. Cluster A pesa 31% do plano.").
Bloco "Atributos de Produto — Leitura da Semana" (5 mini-cards): Cor mais vendida
Marrom/Mocha 18% (+9pp YoY) · Tecido líder Viscose com Linho (+11% ST) · Padronagem
Floral Pequeno (+8pp vs mercado) · Comprimento vestido Midi (51% do mix) · Manga
Curta·Bufante (Longa −5pp). Tag "DIMENSÕES N3–N7".
Bloco Follow-up de Fornecedor (tabela fornecedores fictícios com pedidos, atrasos,
status OK/ATENÇÃO/CRÍTICO e observação citando refs reais 1075684, 1099133, 7413962).
Bloco Alertas Críticos (3 cards com deep-link): ruptura 1049412 → /vivo · markdown
sugerido 1083993 → /pricing · oportunidade recompra 1033472 → /plano.
Tooltips explicando cada KPI. Commit: "feat(dashboard): cockpit executivo completo".
```

## FASE 2 — Workflow da Coleção + Calendário (/workflow)
```
Aba Workflow: header "Verão 26-27 · 21 entregas · etapa atual Lista de Compras · semana 20",
filtro de responsáveis, seletor Semana 20, botão "+ Nova Entrega" (abre modal que adiciona
card em memória). Kanban horizontal com scroll: 16 colunas numeradas (nomes e status da
seção 4.1 do blueprint/na Fase — use exatamente: Workshop Planejamento✓, Atualização do
Plano✓, Workshop Estilo✓, Análise Performance✓, LISTA DE COMPRAS←atual, Mapa da Coleção,
Double Check, Montagem Line, Negociação, Emissão Pedidos, Aprovações, Agendamento,
Entrega CD, Envio Lojas, Acompanhamento, Ajustes do Plano). Cards com avatar-iniciais,
contadores 💬/📎, data, tag de área colorida; cards citam refs reais (OC da Wide Leg
1033472, aprovação de cor 1099133, entrega 1075684 D-15, reposição 1049412+7413962).
Aba Calendário: "Calendário de Processos de Compras · 2026" — Gantt anual custom em
divs/grid (52 colunas-semana), filtros por coleção (Verão 1/2, Inverno 1/2) e área
(Estilo/Planejamento/Compras/Importação), cards de contagem (23/17/26/36) + CONFLITOS
ABERTOS 2. Linha CAMPANHAS: Liquidação·Volta às Aulas, Carnaval, Dia das Mães 10/05,
Namorados 12/06, Copa do Mundo (jun–jul), Dia dos Pais (ago), Black Friday 27/11, Natal.
4 linhas de coleção com trilhas Nacional × Importado e barras de atividades clicáveis.
Painel "Conflitos detectados" (2 cards âmbar com Aplicar sugestão/Ignorar — aplicar
move a barra e some o conflito) + "Premissas do Calendário" (4 cards de texto).
Commit: "feat(workflow): kanban 16 etapas e gantt anual com conflitos".
```

## FASE 3 — OTB (/otb)
```
Banner azul "somente leitura · última leitura há 18 min" + botões Sincronizar (toast) e
Exportar (baixa CSV do comparativo). Filtro Hierarquia N1–N7 (selects em linha).
6 KpiCards e a tabela comparativa por categoria EXATAMENTE com os valores do CLAUDE.md/
blueprint §4.2 (TOP MALHA 512/486/+5,3%/208/59,8%/10,2s ... TOTAL 2.180/2.030/890/59,4%).
Gráficos Recharts: (a) barras Plano×LY AGO–FEV + linha de crescimento % (tooltip custom
"DEZ · Plano R$ 402 mi · LY R$ 371 mi · +8,4%"); (b) barras empilhadas Comprometido×ATB;
(c) barras Estoque projetado + linha cobertura (sem); (d) barras horizontais margem por
categoria vs linha-meta 59% (verde acima, âmbar abaixo).
Painel "Indicadores para decisão": 2 warnings + 1 sucesso (textos do blueprint).
Rodapé "OTB como insumo": 3 cards com "Abrir módulo →" (deep-links /plano, /distribuicao,
/emissao). Commit: "feat(otb): camada executiva read-only com 4 gráficos".
```

## FASE 4 — Habilitadores (/habilitadores) + Atributos (/atributos)
```
HABILITADORES — recorte "Feminino · Vestidos". Banner Habilitadores≠Atributos com link.
Card Verba: R$ 42.500.000 · custo médio R$ 68,90 · ~616.800 peças · margem 59%.
① Pirâmide de Preço: tabela EDITÁVEL (inputs de participação% e margem%) com as 5 faixas
REAIS (P1 69–119 R$99 28% 54 ... P5 260–440 R$319 5% 66); linha Coleção recalcula preço
médio ponderado (R$ 172) e margem média ao vivo; validação soma=100%.
② Gabarito: tabela packs por porte P/M/G/GG/E-comm por faixa (P1 2·3·4·5·6=132 ...) com
inputs e coluna Peças/SKU recalculada; seletor de sessão.
③ Clusterização de Verba: 9 cards editáveis (P/M/G/GG × quente/fria + E-commerce 18%)
com % e R$ recalculado; total precisa fechar 100% · R$ 42,5 mi (barra de validação);
botão "Sugerir distribuição" restaura os defaults.
④ Dorsal × Need/NID: boxes explicativos (textos do blueprint), tabela Set–Fev com
inputs de Dorsal quente/frio % (92/88 → 55/50) e Need calculado + barra bicolor;
cards-resumo DORSAL R$ 30,2 mi (71%) · NEED R$ 12,3 mi (29%) · FOLGA 6/6.
Botões topo: "Importar em Lote" (toast) e "Gerar Plano de Sortimento →" (/plano).
ATRIBUTOS: dois boxes comparativos com chips; taxonomia em 3 colunas preenchida com a
cartela REAL do JSON (fits, tecidos, padronagens, cores, licenças infantis); bloco
"Janela de otimização" com chips (Coleção ✓ recomendada) e o exemplo PADRONAGEM
(6.200 pç: Liso 46%→2.852 ... Xadrez 7%→434, badge "quantidade coerente").
Commit: "feat(habilitadores+atributos): parâmetros editáveis com validação de verba".
```

## FASE 5 — Plano de Sortimento (/plano) + Versões & Aprovação (/versoes)
```
PLANO: header "Verão 26-27 · Tropicália · 14 linhas geradas automaticamente" + botões
+Incluir item / Restaurar / Exportar CSV / Recalcular plano. Chips de origem (OTB,
Habilitadores, Atributos, Histórico, Best/Slow, Estratégia, Benchmark, Eventos/Ciclos).
Warning ESTOURO DE VERBA com régua Piso 43,5 — Alvo 44,8 — Teto 46,1 e "+R$ 1,62 mi
(+3,6%)"; a régua reage ao vivo quando quantidades mudam.
Toggle Plano Original | Plano Qualificado✓ · filtro N1–N7 · KPIs (14 linhas · 1.208.400 pç
· R$ 46,4M · margem 59,2%) · cards Impacto das Alterações e Comparação com o Line.
LISTA DE COMPRAS: tabela com as 8 linhas REAIS (1049412, 1046556, 1033472, 1099133,
1075684, 1086292, 1096942, 7413962) — colunas Status/Foto(hydrate com placeholder)/
Ref/Produto/Categoria/Papel/Cor/PC/PV/M%/Qtd com stepper de quantidade; alterar qtd
recalcula investimento, margem média, régua e o card de impacto. Persistir em memória
(context) para o /versoes ler. + 6 linhas geradas do catálogo p/ fechar 14.
VERSÕES: cards Original (baseline imutável: 1.156.000 · R$ 44,7M) × Qualificado (deltas
ao vivo do context); warning de estouro; banner "aprovação por nível agregado"; toggle
Categoria|Sessão|Cluster|Faixa; tabela por categoria com Δ e botão Aprovar (muda status,
contador "X de 5 aprovados", botão Aprovar todos); tabela "Alterações vs Original"
(7 qualificações listadas) e Histórico (registra cada mudança feita no /plano com
autor "Mariana Alves" + timestamp).
Commit: "feat(plano+versoes): plano vivo com banda de OTB e aprovação por nível".
```

## FASE 6 — Mapa da Coleção (/mapa) + Retroalimentação (/retroalimentacao) + Eventos (/eventos)
```
MAPA: header com estilista Helena Prado · Parede Setembro · stats (58 SKUs · 1.421.600 un
· R$ 186,4 mi · 8 fornecedores · 66% aprovados) · pirâmide-alvo em chips · botões
Exportar PPTX/PDF (toast "export simulado") e Aprovar Pendentes.
Abas de cápsula Tropicália 18 | Essenciais 21 | Denim 19. Board com 3 zonas (VITRINE /
DORSAL / NEED) em colunas pontilhadas; cards de produto com foto (hydrate/placeholder),
badges (⭐ 🔴NOVO 🔁 ❤evento), drag-and-drop entre zonas (HTML5 DnD simples); cartela
Pantone com swatches da cartela real; toolbar flutuante decorativa; zoom CSS (80–120%).
Mover card entre zonas grava evento no histórico compartilhado.
RETROALIMENTAÇÃO: KPIs (OTB alvo 44,8 · Plano com Mapa 46,4 +3,6% · impacto líquido ·
status ESTOURO); banner Copa do Mundo; seção Inclusões (Camiseta Torcida Brasil 24k pç
+R$0,46M), Vinculados a eventos (4 itens com tags EVENTO/CÁPSULA/CICLO/VITRINE), e
"Compensar a verba — falta R$ 0,31M": lista com botão [Compensar] que remove a linha,
libera verba e atualiza régua/KPIs ao vivo; histórico de alterações do Mapa.
EVENTOS: KPIs (verba estratégica R$0,46M · 6/7 ativos · 2 em vitrine · mix Need→Dorsal 2%);
grid de cards de eventos (Copa do Mundo EVENTO, Dia dos Pais COMERCIAL ativo, Stitch
CÁPSULA licenciado, Animal Print CICLO, Virada Alto Verão VITRINE, Namorados COMERCIAL,
Cápsula Resort INATIVO) + botão Novo evento (modal); lista NEED/NID com botão
"Tornar Dorsal" (pede motivo, grava no histórico vinculado ao evento selecionado);
Histórico de decisões (autor/nota/timestamp).
Commit: "feat(mapa+retro+eventos): board visual com retroalimentação de verba".
```

## FASE 7 — Line (/line) + Grade (/grade) + Emissão (/emissao) + Distribuição (/distribuicao)
```
Cadeia com estado compartilhado lineCarregado:boolean (context).
LINE: EmptyGate "Carregar Line devolvido" (nota 'Demo · devolução simulada de 14 itens');
ao clicar, gera tabela pedido×retorno (ref, produto, qtd pedida/retornada, PC pedido/
negociado, fornecedor, Δ%, decisão Aceitar/Renegociar) usando os 8 heróis + 6 do catálogo,
e seta lineCarregado=true.
GRADE: se !lineCarregado → EmptyGate "Carregue o Line antes de montar as grades →";
senão: card "Cadastro de grade padrão — 4 templates por sessão" (drawer com curvas) e
tabela por item distribuindo qtd por tamanho (curva pack) com validação de múltiplos.
EMISSÃO: mesmo gate; senão lista OC-2026-#### (fornecedor, valor, D-90, status
"Integrado ao ERP ✓" com timestamp) e botão Gerar OCs (anima criação com toasts).
DISTRIBUIÇÃO: banner "alocação executada no sistema corporativo — esta camada é
leitura/snapshot"; KPIs (16 lojas · 14 SKUs · 38.640 pç · 7.912 packs · aderência 100% ·
10 lacunas); abas POR LOJA✓/POR CLUSTER/POR PACK/POR SESSÃO/COERÊNCIA/QUENTES-FRIAS/
LACUNAS (as 4 primeiras funcionais, demais com resumo); seletor de loja (default
"C&A Shopping Eldorado — Cluster A · Clima Híbrida Fria") e tabela REF/Produto/Sessão/
Cor/Clima do SKU/Packs/Peças/Status com ✓DISTRIBUÍDO e ⚠BLOQUEIO CLIMA nos SKUs
"Quente" (1096942, tule floral, camiseta UV infantil).
Commit: "feat(compras+distribuicao): cadeia line→grade→emissão e snapshot de alocação".
```

## FASE 8 — Benchmark (/benchmark) + PLM (/plm)
```
BENCHMARK: banner SERVE PARA / NÃO CONFUNDIR (+link Sortimento Vivo) + Atualizar Coleta
(chama /api/cea/search?term=vestido midi e atualiza card "coleta ao vivo: N SKUs · faixa
R$ X–Y" com fallback do snapshot 641/39–440). Painel "Insights estratégicos da IA —
5 movimentos" (textos do blueprint §5.1). KPIs (Ticket C&A R$108 · Gap vs Renner −16% ·
Cor do ano Mocha · Categoria em alta Vestido Midi). Tabela Concorrentes Monitorados
(7 do JSON). Tabela "Preço médio por peça comparável" com coluna C&A destacada em azul
usando preços REAIS (29,99 / 99,99 / 159,99 / 189,99 / 159,99* / 59,99) vs concorrentes
e Δ vs média.
PLM: ficha destaque 1083993 (fase 8/8, jornada de liquidação bem-sucedida: 199,99→89,99
−55% → sell-out 100%) com stepper de 8 fases e métricas (idade 14 sem · vel −12%→+64% ·
GMROI 2,86 · pulmão 0 · sugestão de aprendizado); seletor para trocar de produto (1099133
em Introdução etc.). Cards dos 5 estágios com contagens (38/61/84/29/11) e estratégia.
Tabela Pipeline (atenção) com risco ●verde/amarelo/vermelho. Painel "Gatilhos
Automáticos" com as 3 regras SE/ENTÃO em blocos monoespaçados e status
Monitorando/Pausado (toggle).
Commit: "feat(benchmark+plm): inteligência externa e ciclo de vida com gatilhos".
```

## FASE 9 — In-Season: Histórico (/historico) + Sortimento Vivo (/vivo) + Pricing (/pricing)
```
HISTÓRICO: filtros (produto/categoria/coleção/região/loja/canal/período) que filtram de
verdade os dados derivados; KPIs (R$ 118,4M · 1.243.500 pç · R$ 95,22 · 59,1% · 7,7% ·
+5%); abas Visão Agregada | Lista por SKU. Agregada: área receita+linha margem 6 meses;
heatmap por UF (grid de quadrados, SP=100); Vendas por Região; Canal; Best sellers e
Slow sellers REAIS com botões de ação (deep-link /pricing e /vivo); Top 10 lojas;
tabela região×estoque com status. Lista por SKU: tabela completa + Exportar CSV.
VIVO: badge ●LIVE "atualizado há Xs" com contador; um tick a cada 5s soma deltas seedados
aos KPIs (GMV 24,6M +9,8% · 246,8k · 99,70 · 1,52 · 5,9% · 4,4%/dia) com sparklines;
4 cards de ação (38 rupturas · 16 best movers · 284 OCs R$ 8,2M · 6 markdowns −38% médio);
painel Plano×Venda×Estoque×Carteira (74,2% NO RITMO · 12,8 sem EQUILIBRADO · +96k pç
EXCESSO À FRENTE com os subvalores do blueprint); listas Alertas de Falta (7) e de
Excesso (24, mostrar 5+) com severidade e nota, usando os produtos reais.
PRICING: header + "Aplicar no Cluster A (3)". Bloco Criar Ação: lista de produtos com
checkbox (os markdowns REAIS: −63/−47/−53/−32/−55) + configuração (nome, tipo de
etiqueta com 5 opções, vigência, clusters-alvo A–D) + preview do impacto e botão Criar
(toast + adiciona em "ações ativas"). Bloco Base Analítica: 4 cards de cluster
(A 42✓ · B 108 · C 158 · D 27), regras de canal (texto do blueprint), KPIs, tabela
drill-down N1→SKU expansível (Físico Cluster A · Digital · Mercado digital ·
Recomendação · Profundidade · Ação), calendário fixo (Dia dos Pais ATIVO · Black Friday
27/11 · 102d) e card Profundidade do Markdown Cluster A (−10 a −15%).
Commit: "feat(in-season): histórico filtrável, tempo real e pricing por cluster".
```

## FASE 10 — Lojas & Clusters (/lojas) + Cadastro (/cadastro) + Polimento & QA
```
LOJAS: 4 cards de cluster (dados do CLAUDE.md) + "335 lojas físicas" + Cadastrar loja
(modal em memória); Top 10 (reais, com VS LY e barra ST; 1 negativa em vermelho; clique
abre drawer-dashboard da loja com KPIs derivados); Distribuição Regional (barras
Sudeste 50% · NE 25% · Sul 13% · CO 7% · Norte 5%); card "Reagrupamento sugerido —
3 lojas fora do cluster" com Aceitar (move e toast).
CADASTRO: abas Cadastro de Setor✓ | Qualidade de Cadastro | Cadastro de Lojas |
Pirâmide (P1–P5). Setor: acordeão da hierarquia REAL (Feminino expandido com Calça/
Blusa/Vestido e atributos; Masculino; Infantil com faixas e marcas; Íntimo; Esportivo
ACE; Mindse7) + coluna Hierarquia de Cores com swatches reais. Qualidade: score 94%,
3 pendências (ex.: "1099133 sem lavagem cadastrada"). Pirâmide: tabela P1–P5 read-only
espelhando Habilitadores. Botão + Novo Cadastro → wizard de 3 passos (identificação/
grade/estratégia) que adiciona ao acordeão.
POLIMENTO GLOBAL: skeletons em todas as telas; tooltips de KPI completos; favicon SVG
oval C&A; 404 amigável; verificação final — rode um script rápido que greppe por
"lorem", cores #EC008C e números hardcoded suspeitos; confira âncoras nas telas;
npm run build limpo. Atualize README (gif/screenshots em docs/). 
Commit: "feat(transversais)+chore(qa): lojas, cadastro e polimento final".
Depois: crie tag v1.0.0 e, se eu pedir, configure deploy (Vercel: vite build + rota
/api como serverless function espelhando server/index.ts).
```

---

## Dicas de condução no Claude Code
- Se uma fase ficar grande demais numa sessão, peça: "continue a Fase N do ponto em que parou, releia o CLAUDE.md".
- Divergência visual? Cole a captura de referência correspondente (docs/refs/) e peça ajuste fino.
- Nunca aceite número que não esteja no JSON/derived — peça correção citando a regra 1 do CLAUDE.md.
- Ao final de tudo, o teste de ouro: abrir as 21 rotas seguidas e conferir os âncoras (46,4M · +3,6% · 59,1% · 335 · 24,6M · 7,7%).
