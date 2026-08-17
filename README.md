# Plano de Sortimento — C&A (mockup)

Mockup de alta fidelidade de uma plataforma de **planejamento de sortimento para varejo de moda**,
com identidade e dados da **C&A Brasil**. É uma casca navegável para demonstração executiva: sem
backend de negócio, mas com dados reais de catálogo/preços/indicadores públicos e um conector
opcional que hidrata fotos e preços ao vivo do site cea.com.br.

Referência funcional: 22 telas em 5 áreas (Dashboard Executivo · Pré-Season · Follow-up · In-Season
· Transversais). As regras do projeto estão em [`CLAUDE.md`](./CLAUDE.md) e a especificação por tela
em [`docs/PROMPTS_CLAUDE_CODE.md`](./docs/PROMPTS_CLAUDE_CODE.md) (fases 0–10).

## Como rodar

```bash
npm install
npm run dev      # Vite em :5173 + conector Express em :3001 (proxy /api)
```

| Script                | O que faz                                                        |
| --------------------- | ---------------------------------------------------------------- |
| `npm run dev`         | front (5173) + mini-backend (3001) via `concurrently`             |
| `npm run build`       | build de produção do front                                        |
| `npm run typecheck`   | `tsc --noEmit` — obrigatório antes de cada commit                 |
| `npm run lint`        | ESLint — obrigatório antes de cada commit                         |
| `npm run verificar`   | autoteste dos números-âncora — ~293 verificações, sai com erro se algum não fechar |
| `npm run qa`          | varredura do código atrás do que as regras de ouro proíbem        |

## Telas

| Dashboard Executivo | Plano de Sortimento |
| --- | --- |
| ![Dashboard](docs/capturas/dashboard.png) | ![Plano](docs/capturas/plano.png) |

| OTB | Mapa da Coleção |
| --- | --- |
| ![OTB](docs/capturas/otb.png) | ![Mapa](docs/capturas/mapa.png) |

| Distribuição por Loja | Sortimento Vivo |
| --- | --- |
| ![Distribuição](docs/capturas/distribuicao.png) | ![Sortimento Vivo](docs/capturas/vivo.png) |

| Histórico de Vendas | Lojas & Clusters |
| --- | --- |
| ![Histórico](docs/capturas/historico.png) | ![Lojas](docs/capturas/lojas.png) |

As 21 rotas: `/` · `/workflow` · `/otb` · `/habilitadores` · `/atributos` · `/plano` · `/versoes` ·
`/mapa` · `/retroalimentacao` · `/eventos` · `/line` · `/grade` · `/emissao` · `/distribuicao` ·
`/benchmark` · `/plm` · `/historico` · `/vivo` · `/pricing` · `/lojas` · `/cadastro`.

## Stack

React 18 · Vite · TypeScript · Tailwind CSS · React Router · Recharts · Express (conector VTEX).

## Estrutura

```
src/
  app/            # uma pasta por tela (21 rotas) + routes.ts (registro único)
  components/ui/  # KpiCard, StatusChip, Banner, SectionCard, DataTable,
                  # EmptyGate, Sparkline, PageHeader, Tooltip, Button, Toast
  components/layout/  # AppShell, Sidebar, Topbar, LogoCea
  data/cea_data.json  # FONTE ÚNICA de dados reais (não editar valores)
  data/derived.ts     # números-âncora + geradores simulados (seed fixo 2627)
  lib/cea.ts          # loader do snapshot, hydrate(cod), placeholderFor()
  lib/format.ts       # formatBRL, formatPct, formatCompact...
  styles/tokens.css   # design tokens (cores, radius, sombras)
server/index.ts       # conector VTEX (/api/cea/search, /ref/:cod, /logo)
scripts/              # autoteste dos âncoras
docs/                 # blueprint, prompts e capturas de referência
```

## Dados

- **Reais (fonte pública):** catálogo, preços, remarcações, árvore mercadológica, marcas e
  indicadores financeiros da C&A Modas S.A. (release 2T26 e FY25).
- **Simuladas:** métricas por loja/SKU (venda, estoque, sell-through, cobertura), geradas em
  `derived.ts` com seed fixo — idênticas em todo reload e entre telas.
- **Fictícios:** estilistas, fornecedores e a planner Mariana Alves.

## Conector VTEX (opcional)

O mini-backend em `server/index.ts` faz proxy do catálogo público para evitar CORS:

| Rota                          | Upstream                                              |
| ----------------------------- | ----------------------------------------------------- |
| `GET /api/cea/search?term=`   | busca por termo no catálogo                            |
| `GET /api/cea/ref/:cod`       | busca por RefId (código do produto)                    |
| `GET /api/cea/logo`           | extrai o azul e o vermelho oficiais do logo            |

Timeout de 3s, cache em memória de 1h e `{ fallback: true }` em qualquer erro — **a demo funciona
perfeitamente offline do conector**, caindo no snapshot local.

## Como os números se sustentam

Nenhum número aparece escrito dentro de um componente. Tudo sai de `cea_data.json` (real) ou de
`derived.ts` (derivado, com seed fixo 2627), e os dois scripts abaixo são o que impede a demo de
sair do lugar:

- **`npm run verificar`** — confere os números-âncora do `CLAUDE.md` um a um e ainda testa as
  identidades entre eles: a frota de 335 lojas fechando por cluster e por região, o plano de
  R$ 46,4 mi contra o OTB, os 7.912 packs e 38.640 peças da distribuição saindo da mesma alocação,
  a cadeia inteira do painel do Sortimento Vivo, os 102 dias até a Black Friday. Falhou um, o
  script sai com erro.
- **`npm run qa`** — varre o código atrás de lorem ipsum, do rosa da concorrência e de número de
  negócio digitado à mão dentro de tela.

Quando um âncora do `CLAUDE.md` não fechava com outro, a decisão está comentada no ponto exato do
`derived.ts` — procure por "âncora" no arquivo.

## Identidade

Azul institucional `#00287A` com o **&** em vermelho `#E30613` (a C&A Brasil manteve o wordmark
azul-marinho). Tipografia Poppins (títulos) + Inter (dados). Tokens em `src/styles/tokens.css`.
