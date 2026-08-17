# CLAUDE.md — Plano de Sortimento C&A (mockup)

## O que é este projeto
Mockup de alta fidelidade de uma plataforma de **planejamento de sortimento para varejo de moda**, 100% com identidade e dados da **C&A Brasil**. É uma "casca" navegável para demonstração executiva: sem backend de negócio, mas com **dados reais** (catálogo, preços, remarcações e indicadores financeiros públicos da C&A) e um **conector opcional** que hidrata fotos/preços ao vivo do site cea.com.br.

Referência funcional: 22 telas em 5 áreas (Dashboard Executivo · Pré-Season · Follow-up · In-Season · Transversais). A especificação completa por tela está em `docs/PROMPTS_CLAUDE_CODE.md` (fases 1–10).

## Stack e comandos
- **React 18 + Vite + TypeScript + Tailwind CSS + React Router + Recharts**
- Mini-backend **Express** em `server/index.ts` (proxy VTEX) rodando junto do Vite
- `npm run dev` → roda Vite (5173) + Express (3001) via `concurrently`; Vite faz proxy de `/api` → 3001
- `npm run build` → build de produção do front
- `npm run lint` / `npm run typecheck` → obrigatórios antes de cada commit

## Estrutura de pastas
```
src/
  app/            # rotas (uma pasta por tela)
  components/ui/  # KpiCard, StatusChip, DataTable, DrillTable, Banner, EmptyGate, PageHeader, SectionCard, Sparkline
  components/layout/  # Sidebar, Topbar, AppShell
  data/cea_data.json  # FONTE ÚNICA de dados (não editar valores reais)
  data/derived.ts     # números-âncora derivados + geradores simulados (seed fixo)
  lib/cea.ts          # loader do snapshot + hidratação via /api/cea + cache
  lib/format.ts       # formatBRL, formatPct, formatCompact
  styles/tokens.css   # design tokens (cores, radius, sombras)
server/index.ts       # proxy VTEX (/api/cea/search, /api/cea/ref/:cod, /api/cea/logo)
docs/                 # blueprint, prompts, capturas
```

## REGRAS DE OURO (não negociáveis)
1. **Fonte única de dados.** Todo número exibido vem de `src/data/cea_data.json` ou de `src/data/derived.ts`. **Nunca** hardcode valores dentro de componentes. Se uma tela precisa de um número novo, adicione em `derived.ts` com comentário da derivação.
2. **Dados simulados são determinísticos.** Métricas por loja/SKU (venda, estoque, EV, ST) são geradas em `derived.ts` com **seed fixo** (mulberry32) para que os números sejam idênticos em todo reload e batam entre telas.
3. **Números-âncora** (tabela abaixo) devem ser idênticos em todas as telas em que aparecem.
4. **100% português brasileiro.** Zero lorem ipsum, zero texto em inglês na UI (termos de mercado consagrados como sell-through, markdown, OTB, pack são permitidos).
5. **Identidade C&A:** azul institucional + "&" vermelho. Tokens em `styles/tokens.css`. A Fase 0 tenta extrair o hex do SVG oficial via `/api/cea/logo`; fallback: `--cea-blue:#00287A`, `--cea-red:#E30613`. **Nunca** usar rosa (#EC008C é da referência Marisa, não nosso).
6. **Sem libs novas** além das da stack sem justificar no commit.
7. **Commits pequenos**, um por tela/bloco, mensagem em pt-BR no padrão `feat(tela): descrição` / `fix:` / `chore:`.
8. **Toda ação de botão dá feedback** (navegação, toast, ou mudança visível de estado). Nenhum clique morto.
9. Imagens de produto: tentar `imageUrl` da API; fallback = placeholder com bloco de cor da variante + nome. Nunca quebrar layout por falta de foto.
10. Antes de encerrar qualquer fase: `npm run typecheck && npm run lint`, teste manual da rota, commit.

## Números-âncora (canônicos — copie daqui, não invente)
| Grupo | Valores |
|---|---|
| Rede | **335 lojas** · A:42 Premium Capitais · B:108 Médio Capitais · C:158 Interior · D:27 Outlet & Saldo · CDs: Barueri e RJ |
| Financeiro real 2T26 | Receita R$ 2,082 bi · vestuário R$ 1,895 bi · SSS +4,1% · **margem bruta vestuário 59,1% (20 tris de expansão)** · digital 7,7% (+33%) · EBITDA aj. R$ 435M |
| OTB Verão 26-27 | Venda planejada **R$ 2,18 bi** · OTB R$ 890 mi · ATB R$ 228 mi · margem 59,4% · markdown 11,2% · ST alvo 78% |
| Plano (recorte demo) | 14 linhas · 1.208.400 pç · **R$ 46,4M vs OTB 44,8M** · banda ±3% (43,5–46,1) · estouro **+3,6%** |
| Dashboard | ST coleção 63,8% · cobertura 46d · margem 59,1% · markdown acum. 7,6% · aderência IA 84% · ERP OK · C&A Pay 24% · Digital 7,7% |
| Sortimento Vivo | GMV dia R$ 24,6M · 246,8k transações · ticket R$ 99,70 · conversão 5,9% · ST 4,4%/dia · 38 rupturas · 284 OCs · 6 markdowns ativos |
| Coleção ativa | Seletor topbar: **"Verão 26-27 \| Tropicália"** · semana 19 · 262 SKUs ativos |
| Heróis de produto | 1049412 Camiseta Básica (NOS, 22 cores, 39,99→29,99) · 1033472 Wide Leg 100% alg · 1075684 Vestido Linho 6 cores 159,99 · 1083993 Tricot (199,99→89,99, esgotado) · 7413962 Sutiã Renda (grade) · 1099133 Patchwork (novo) · 1086292 Halterneck (vitrine) · 1096942 Peplum Laise (evento) |
| Markdowns reais | −63% · −55% · −53% · −47% · −32% · −28% |
| Pirâmide vestidos (real) | P1 69–119 (28%) · P2 139–179 (30%) · P3 189–219 (24%) · P4 239–259 (13%) · P5 260–440 (5%) · preço médio R$ 172 |
| Pessoas (fictícias) | Planner: **Mariana Alves — Planejamento** · Estilistas: Helena Prado, Rafael Nunes, Júlia Sales, Théo Lima, Camila Duarte, Bruno Farias, Letícia Ramos |
| Fornecedores (fictícios) | Têxtil Horizonte · Malharia Santa Clara · Denim União · Confecções Aurora · Nordeste Malhas · Renda Fina · Global Sourcing Ásia |

## Rotas (React Router)
`/` Dashboard · `/workflow` (abas Workflow|Calendário) · `/otb` · `/habilitadores` · `/atributos` · `/plano` · `/versoes` · `/mapa` · `/retroalimentacao` · `/eventos` · `/line` · `/grade` · `/emissao` · `/distribuicao` · `/benchmark` · `/plm` · `/historico` · `/vivo` · `/pricing` · `/lojas` · `/cadastro`

Sidebar em 5 grupos: **Dashboard Executivo** | **Pré-Season** (workflow→distribuicao, na ordem acima) | **Follow-up** (benchmark, plm) | **In-Season** (historico, vivo, pricing) | **Lojas & Clusters** e **Cadastro de Produtos** soltos ao final. Rodapé: avatar "MA · Mariana Alves — Planejamento".

## Design tokens
```css
:root{
  --cea-blue:#00287A; --cea-blue-deep:#0B1F5B; --cea-red:#E30613;
  --bg:#F7F8FA; --card:#FFFFFF; --ok:#10B981; --warn:#F59E0B; --crit:#E30613;
  --radius:12px; --shadow:0 1px 3px rgba(16,24,40,.08);
}
```
Fontes: **Poppins** (títulos/números grandes) + **Inter** (dados/corpo) via Google Fonts. Microcopy de empty states usa o tom C&A: "A gente se encontra na C&A ❤".

## Conector VTEX (server/index.ts)
- `GET /api/cea/search?term=...` → proxy p/ `https://www.cea.com.br/api/catalog_system/pub/products/search/{term}?_from=0&_to=19`
- `GET /api/cea/ref/:cod` → `...search/?fq=alternateIds_RefId:{cod}`
- `GET /api/cea/logo` → baixa a home, localiza o SVG do logo e devolve `{blue, red}` extraídos dos fills
- Headers: `User-Agent` de browser; timeout **3s**; em erro/timeout → responder `{fallback:true}` e o front usa o snapshot. Cachear respostas em memória por 1h.
- Campos úteis da VTEX: `productName`, `brand`, `items[].images[].imageUrl`, `items[].sellers[].commertialOffer.{Price,ListPrice}`.
- O app deve funcionar **perfeitamente offline do conector** (demo nunca quebra).

## Definition of Done (por tela)
- [ ] Rota renderiza sem erro de console; typecheck e lint limpos
- [ ] Todos os números vêm de `cea_data.json`/`derived.ts` e batem com os âncoras
- [ ] Header da tela = título + subtítulo + ações, igual à spec da fase
- [ ] Estados: loading (skeleton), vazio (quando aplicável), hover em tabelas, tooltips nos KPIs
- [ ] Responsivo mínimo 1366×768 (sidebar colapsa < 1100px)
- [ ] Deep-links citados na spec funcionam
- [ ] Commit feito com mensagem padrão

## O que NUNCA fazer
- Inventar números fora do JSON/derived · usar rosa Marisa · deixar texto em inglês/lorem · adicionar backend de verdade (auth, banco) · quebrar a build no main.
