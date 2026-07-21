# Artec CRM — Design system e UX

Atualizado em: 2026-07-21 (reescrito na Fase 1 da refatoracao de frontend, `refactor/frontend-design-system`)

> Este documento descreve o sistema **real**, implementado e em uso. A versao anterior descrevia uma stack aspiracional (shadcn/ui, Tailwind, Radix UI, TanStack Table, dnd-kit, Sonner) que nunca foi adotada — mantida aqui como nota historica para nao repetir o erro: **confirme a stack real antes de assumir bibliotecas**.

## 1. Stack real (confirmada em codigo, nao assumida)

- **Estilo**: CSS puro com custom properties (`src/styles.css`, arquivo unico e global). Sem Tailwind, sem CSS Modules, sem styled-components, sem vanilla-extract.
- **Componentes**: React 19 com componentes de funcao simples. Sem biblioteca de componentes de terceiros (nao ha shadcn/ui, Radix, Base UI). Onde faz sentido, componentes primitivos proprios vivem em `src/components/ui/` (`EmptyState`, `Skeleton`/`LoadingPanels`) e `src/components/layout/` (`Sidebar`).
- **Icones**: `lucide-react`, unica biblioteca usada em todo o produto (nunca misturar com outra).
- **Roteamento**: `react-router-dom` (adicionado na Fase 1 desta refatoracao — unica dependencia nova, decisao registrada e validada com o usuario antes de instalar, por ser mudanca de stack). `BrowserRouter` no topo (`src/main.tsx`), rotas declaradas em `src/App.tsx`.
- **Estado/dados**: sem Redux/Zustand/React Query/SWR. Estado local via `useState`/`useMemo`/`useEffect`; chamadas de API centralizadas e tipadas em `src/domain/crm.ts`.
- **TypeScript**: modo `strict` (`tsconfig.app.json`).
- **Toasts/dialogs**: nao ha biblioteca de toast (Sonner ou equivalente); feedback hoje e via `<div className="alert">` inline e `window.confirm` para confirmacao destrutiva simples. Avaliar se um `Toast`/`ConfirmAction` dedicado se justifica na Fase 2, sem adicionar dependencia nova sem necessidade comprovada.

## 2. Princípios

- Clareza antes de decoração.
- Densidade confortável para operação diária.
- Informação urgente deve se destacar sem deixar a tela alarmista.
- Mesma ação deve parecer e funcionar igual em todas as telas.
- Formulários devem pedir apenas o necessário naquele momento.
- Evitar modais empilhados.
- Evitar tabelas gigantes sem filtros, hierarquia ou ações contextuais.
- Não usar cor como única forma de comunicar estado.

## 3. Tokens (`src/styles.css`, bloco `:root`)

Todo valor de cor, espaçamento, radius, sombra, motion, z-index e dimensão de layout vive em uma variável CSS — nenhum componente deve usar hex ou medida solta.

### Cores de marca

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-navy-900` | `#0b1f3a` | Fundo da sidebar, estrutura |
| `--color-navy-700` | `#16345c` | Variação de estrutura escura |
| `--color-primary` (= `--primary`) | `#2454c7` | Ação primária (botões, links, foco de navegação) |
| `--color-primary-hover` | `#1b3f9e` | Hover de ação primária |
| `--color-cyan` | `#0c6f90` | Informação / climatização |
| `--color-teal` | `#0f7a6b` | Atendimento / relacionamento (reservado, uso pontual) |
| `--color-violet` | `#6a4aa8` | Insight / integração secundária (reservado, uso pontual) |

Paleta derivada dos princípios da Seção 7 do prompt de refatoração (não havia logo/assets de marca no repositório para extrair cor real da Artec — decisão de design registrada aqui, sujeita a revisão se a Artec fornecer identidade visual própria). Todas as cores foram calculadas para contraste WCAG AA (≥4.5:1) contra `--surface`/`--surface-muted` antes de entrar no token (ver `docs/ACCESSIBILITY-AUDIT.md` para o histórico de correções de contraste já aplicadas).

### Cores semânticas

`--success` (`#177245`), `--warning` (`#8a5306`), `--danger` (`#b0303f`), `--info` (= `--color-cyan`). Usadas em badges, alertas e indicadores — nunca como decoração sem significado.

### Superfícies, texto e borda

`--background`, `--surface`, `--surface-muted`, `--surface-sunken`, `--foreground`, `--foreground-muted`, `--foreground-on-dark`, `--foreground-on-dark-muted` (para texto sobre a sidebar navy), `--border`, `--focus-ring`.

### Tipografia

`--font-sans` (Inter com fallback de sistema), escala `--text-xs` (12px) a `--text-2xl` (28px), `--leading-tight`/`--leading-normal`, pesos `--weight-normal` (400) a `--weight-black` (800).

### Espaçamento — escala 4/8

`--space-1` (4px) a `--space-12` (48px).

### Radius

`--radius-sm` (6px), `--radius-md` (8px, o mais usado), `--radius-lg` (12px), `--radius-full` (999px, badges/avatares).

### Sombra

`--shadow-sm` (cards em repouso), `--shadow-md` (dropdowns/popovers), `--shadow-lg` (elementos flutuantes de maior destaque).

### Z-index

`--z-dropdown` (20), `--z-sticky` (30), `--z-overlay` (40), `--z-modal` (50), `--z-toast` (60).

### Motion

`--duration-fast` (140ms, feedback imediato), `--duration-base` (200ms, expansão/painel), `--easing-standard`. Toda animação respeita `prefers-reduced-motion: reduce` via regra global no topo de `src/styles.css` (zera duração de animação/transição para quem pediu menos movimento no sistema operacional).

### Layout

`--sidebar-width` (272px, dentro da faixa 260–280px pedida), `--control-height-sm/md/lg` (32/40/48px).

### Breakpoints (documentados, não como CSS var — media query não aceita `var()` na condição)

- até 767px: celular (referência de validação: 360×800, 390×844)
- 768px–1023px: tablet (referência: 768×1024)
- 1024px em diante: desktop (referência: 1024×768, 1366×768, 1440×900, 1920×1080)

## 4. Navegação

A aplicação passou a ter roteamento real na Fase 1 (antes: SPA de URL única, sidebar com um item decorativo — ver `docs/DEVELOPMENT-STATUS.md`, seção "Fase 0"). Rotas atuais:

- `/central-comercial` (padrão/`/`)
- `/pipeline`
- `/clientes`
- `/oportunidades`
- `/proximas-acoes`
- `/notificacoes`
- `/configuracoes/integracoes/auvo` (somente `gestor`/`integrations:read`)

**Estado transicional, registrado explicitamente**: todas as rotas acima hoje renderizam o mesmo conteúdo (o antigo componente monolítico `AuthenticatedApp`), com a navegação da Sidebar rolando até a seção correspondente (`scrollIntoView`) em vez de montar uma página isolada por rota. Isso dá URLs reais, navegáveis e com estado de "ativo" correto na Sidebar, sem exigir ainda a separação de estado/dados por rota — que é o trabalho da Fase 2 (extrair cada superfície com sua própria carga de dados). Ao final da Fase 2, cada rota deve montar apenas o componente da sua superfície, não a página inteira.

`vercel.json` recebeu um rewrite catch-all (`/(.*) -> /index.html`, exceto `/api/*`) para que essas rotas funcionem em produção com reload direto — sem isso, o roteamento client-side quebra em qualquer acesso direto a uma URL que não seja `/`.

Itens de navegação incluem: busca global central, badge de notificação, avatar/e-mail do usuário, indicador de integração Auvo restrito a gestor.

## 5. Padrões de tela

### Central Comercial

Resumo acionável, sem mural de gráficos. Prioriza listas curtas com botões diretos (ações vencidas, ações de hoje, orçamentos aguardando retorno, oportunidades sem próxima ação, oportunidades paradas, resumo comercial).

### Listas (Clientes, Oportunidades)

Hoje são tabelas HTML densas com ações por linha e paginação por cursor ("Carregar mais"). Ainda sem alternativa em cards para mobile — pendência registrada para a Fase 2/3.

### Pipeline/Funil

Kanban por etapa (`PipelineBoard`), com seletor de etapa acessível (`<select>` com rótulo `sr-only`) como alternativa ao drag-and-drop.

### Formulários rápidos

Campos agrupados por significado, labels sempre visíveis (nunca só placeholder), validação com mensagem específica do domínio (ex.: "Defina a próxima ação e a data antes de manter esta oportunidade ativa.").

## 6. Componentes

### Componentes React reais (`src/components/`)

- `layout/Sidebar.tsx` — navegação principal, itens reais por rota, permissão-consciente (item de Auvo só para quem tem `integrations:read`).
- `ui/EmptyState.tsx`, `ui/Skeleton.tsx` (`LoadingPanels`) — feedback de vazio/carregamento, extraídos e reutilizáveis.
- `PipelineBoard.tsx`, `AdminPanel.tsx`, `QuotesPanel.tsx`, `ReportsPanel.tsx`, `AuvoInboxPanel.tsx` — superfícies já componentizadas antes desta refatoração.

### Padrões CSS reutilizáveis (classe, não componente React ainda)

`.button` (`primary`/`secondary`/`ghost`/`destructive`, com estado `.loading` — spinner via `::after`, sem alterar largura), `.icon-button` (com badge de contagem), `.badge` (+ `.warning`/`.danger-badge`), `.panel`/`.state-panel` (card base, com `--shadow-sm`), `.empty-state`, `.skeleton`/`.skeleton-title`/`.skeleton-line`, `.alert`/`.danger-alert`, campos de formulário (`.compact-form input/select`, `.filter-grid input/select`), `.segmented-control` (filtros tipo abas).

Extrair esses padrões CSS para componentes React com props de variante (`<Button variant="destructive" />` etc.) é trabalho natural da Fase 2, conforme cada superfície for reconstruída — não foi feito em bloco na Fase 1 para não introduzir uma camada de abstração nova sem que as telas que a usariam já tenham sido revisadas.

## 7. Acessibilidade

Auditoria automatizada completa em `docs/ACCESSIBILITY-AUDIT.md` (axe-core, 0 violações WCAG 2.0/2.1 A/AA nas telas cobertas). Resumo do que já está garantido:

- Contraste ≥4.5:1 em todos os tokens de texto sobre as superfícies usadas.
- Todo campo `<select>`/`<input>` tem label associada (visível ou `sr-only`) ou `aria-label`.
- Foco visível global (`:focus-visible` com anel de 3px, cor `--focus-ring`).
- `prefers-reduced-motion: reduce` respeitado globalmente.

Pendente de revisão manual (Fase 3): navegação por teclado ponta a ponta, leitor de tela real, gerenciamento de foco em painéis/drawers, zoom 200%.

## 8. Microinterações

- Botões: transição de cor/fundo em `--duration-fast` (140ms).
- Scroll de navegação (Sidebar → seção): `scrollIntoView({ behavior: "smooth" })`, desativado automaticamente por `prefers-reduced-motion`.
- Skeleton com gradiente animado para carregamento inicial.

Não usar: confete, parallax, pulso contínuo, sino piscando, bounce.

## 9. Linguagem

Português do Brasil, direto e humano. Preferir "Próxima ação", "Nova oportunidade", "Registrar follow-up", "Concluir ação", "Marcar como perdido", "Arquivar". Evitar jargão técnico, "workflow", "ticket", "deal". Nunca chamar valor aprovado de "receita" ou "faturamento".

## 10. Pendências conhecidas ao final da Fase 1

- Rotas ainda renderizam o componente monolítico inteiro (ver seção 4) — separação real por superfície é Fase 2.
- Sem alternativa mobile para tabelas densas (Clientes/Oportunidades) — Fase 2/3.
- Sidebar em mobile empilha no topo (`position: static`), não é um drawer — Fase 3.
- Sem componente `Toast`/`Dialog`/`ConfirmAction` dedicado — feedback ainda via `alert`/`window.confirm`.
- Sem PWA (manifest, service worker, ícones) — Fase 4.
