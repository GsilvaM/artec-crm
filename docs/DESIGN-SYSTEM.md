# Artec CRM — Design system e UX

Atualizado em: 2026-07-22 (Fase 6 — adocao explicita da paleta Material 3 da pasta `design-system/`)

> Este documento descreve o sistema **real**, implementado e em uso. A versao anterior descrevia uma stack aspiracional (shadcn/ui, Tailwind, Radix UI, TanStack Table, dnd-kit, Sonner) que nunca foi adotada — mantida aqui como nota historica para nao repetir o erro: **confirme a stack real antes de assumir bibliotecas**.
>
> **Mudanca de regra registrada explicitamente**: ate a Fase 5, este projeto seguia a regra do prompt mestre de refatoracao (`PROMPT-REFATORACAO-FRONTEND-ARTEC-CRM.md`, arquivo que nao existe mais no repositorio) de nao clonar identidade visual de outro produto, e a paleta era uma cor azul/navy derivada sem fonte externa. Na Fase 6, o usuario decidiu explicitamente reverter essa regra e adotar a pasta `design-system/` (kit generico de tokens Material 3 + Apple HIG, sem README proprio — ver `color-schemes-material3/`, `spacing-shape/`, `typography/`) como fonte real da paleta de cor e de valores estruturais (radius, tipografia) do produto — decisao do dono do produto sobre a propria marca, nao um erro a corrigir. A cor de marca agora e o esquema **Material 3 "Blue"** (`design-system/color-schemes-material3/blue-light.tokens.json`/`blue-dark.tokens.json`), com suporte real a modo escuro via `prefers-color-scheme`.

## 1. Stack real (confirmada em codigo, nao assumida)

- **Estilo**: CSS puro com custom properties (`src/styles.css`, arquivo unico e global). Sem Tailwind, sem CSS Modules, sem styled-components, sem vanilla-extract.
- **Componentes**: React 19 com componentes de funcao simples. Sem biblioteca de componentes de terceiros (nao ha shadcn/ui, Radix, Base UI). Onde faz sentido, componentes primitivos proprios vivem em `src/components/ui/` (`EmptyState`, `Skeleton`/`LoadingPanels`) e `src/components/layout/` (`Sidebar`).
- **Icones**: `lucide-react`, unica biblioteca usada em todo o produto (nunca misturar com outra).
- **Roteamento**: `react-router-dom` (adicionado na Fase 1 desta refatoracao). `BrowserRouter` no topo (`src/main.tsx`), rotas declaradas em `src/App.tsx`, todas as paginas carregadas via `React.lazy()` + `<Suspense>` (code-splitting por rota, Fase 4).
- **PWA**: `vite-plugin-pwa` (adicionado na Fase 4 — segunda e ultima dependencia nova desta refatoracao) gera `manifest.webmanifest` e service worker (Workbox) a partir de `vite.config.ts`. Service worker so faz cache do app shell (JS/CSS/HTML/icones); nenhuma chamada `/api/*` e cacheada (decisao deliberada, ver `docs/DEVELOPMENT-STATUS.md`, secao Fase 4). Icone do app: `public/icons/icon-source.svg` (unica fonte vetorial), PNGs gerados por `scripts/generate-icons.mjs`.
- **Estado/dados**: sem Redux/Zustand/React Query/SWR. Estado local via `useState`/`useMemo`/`useEffect`; chamadas de API centralizadas e tipadas em `src/domain/crm.ts`.
- **TypeScript**: modo `strict` (`tsconfig.app.json`).
- **Toasts/dialogs**: nao ha biblioteca de toast (Sonner ou equivalente); feedback hoje e via `<div className="alert">` inline e `window.confirm` para confirmacao destrutiva simples. Nao adicionado nesta refatoracao por falta de necessidade comprovada — `alert`/`confirm` cobriram todos os fluxos reconstruidos sem reclamação de UX registrada.

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

### Cores de marca (Material 3 "Blue", Fase 6)

| Token | Valor (claro) | Valor (escuro) | Uso |
| --- | --- | --- | --- |
| `--color-navy-900` | `#001946` | (igual) | Fundo da sidebar — mesmo tom nos dois modos, já escuro o bastante |
| `--color-primary` (= `--primary`) | `#485e92` | `#b0c6ff` | Ação primária (botões, links, foco de navegação) |
| `--color-primary-hover` | `#324574` | `#92a8e1` | Hover de ação primária |
| `--primary-container` / `--on-primary-container` | `#adc3fe` / `#324574` | `#2e4578` / `#d9e2ff` | Superfícies com leve destaque de marca (M3 "container") |
| `--color-secondary` (`--info`) | `#585f72` | `#c0c6dc` | Informação / tom neutro-azulado |
| `--secondary-container` / `--on-secondary-container` | `#d9dff6` / `#404659` | `#404659` / `#dce2f9` | Superfícies secundárias |
| `--color-tertiary` | `#735573` | `#e0bbdd` | Insight / acento secundário (reservado, uso pontual) |
| `--color-teal` | `#006b60` | (não sobreposto) | Atendimento / relacionamento (reservado, uso pontual) |

Fonte: `design-system/color-schemes-material3/blue-{light,dark}.tokens.json` (esquema M3 completo, incluindo secondary/tertiary/container que o M3 gera automaticamente a partir da cor primária). Valores extraídos e verificados por contraste (ver seção 7) antes de entrar no token — não copiados às cegas.

### Cores semânticas

`--success` (`#376a3e` claro / `#9cd49f` escuro, sourced do esquema M3 "Green"), `--warning` (`#795a0c` / `#e9c16c`, esquema M3 "Yellow"), `--danger` (`#b3261e` / `#f2b8b5`, Error do próprio esquema Blue — harmonizado à cor primária, não de um esquema separado), `--info` (= `--color-secondary`). M3 não define success/warning nativamente (são extensão de app); sourced de esquemas do mesmo kit para manter família coerente, nunca inventados. Usadas em badges, alertas e indicadores — nunca como decoração sem significado.

### Superfícies, texto e borda

`--background`, `--surface`, `--surface-muted`, `--surface-sunken`, `--foreground`, `--foreground-muted`, `--foreground-on-dark`, `--foreground-on-dark-muted` (para texto sobre a sidebar navy), `--border`, `--focus-ring`. Todos com override completo em `@media (prefers-color-scheme: dark)` (Fase 6) — mesmo nome de token, valor troca sozinho; nenhum componente precisou de CSS extra para suportar modo escuro.

### Tipografia

`--font-sans` (Inter com fallback de sistema), escala `--text-2xs` (11px) a `--text-3xl` (40px, títulos/métricas de destaque), `--leading-tight`/`--leading-normal`, pesos `--weight-normal` (400) a `--weight-black` (800). Os extremos (`2xs`/`3xl`) foram adicionados na Fase 5 com base nos valores reais de `design-system/typography/` (kit de referência de terceiros — ver seção 1); todos os 42 valores de `font-size` que antes eram números soltos em `src/styles.css` agora referenciam esta escala (duas exceções aceitas: `14px` nos headers de coluna do Pipeline, sem par exato na escala e usadas em só 2 lugares).

### Espaçamento — escala 4/8

`--space-1` (4px) a `--space-12` (48px).

### Radius

`--radius-sm` (6px), `--radius-md` (8px, o mais usado), `--radius-lg` (12px), `--radius-xl` (16px), `--radius-2xl` (28px, sheets/modais mobile), `--radius-full` (999px, badges/avatares). `xl`/`2xl` adicionados na Fase 5 com base em `design-system/spacing-shape/corner-radius-scale.tokens.json` (Corner/Large=16, Corner/Extra-large=28).

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

Roteamento real desde a Fase 1, com code-splitting por rota (`React.lazy` + `Suspense`) desde a Fase 4. Rotas atuais, cada uma montando só o componente da sua superfície (não mais um monólito único — ver histórico em `docs/DEVELOPMENT-STATUS.md`, Fases 0/2.1–2.8):

- `/central-comercial` (padrão/`/`)
- `/pipeline`
- `/clientes`, `/clientes/:id`
- `/oportunidades`, `/oportunidades/:id`
- `/proximas-acoes`
- `/notificacoes`
- `/relatorios` (`reports:read`)
- `/caixa-auvo` (`auvo_inbox:read`)
- `/configuracoes/administracao` (`users:manage`)
- `/configuracoes/integracoes/auvo` (`integrations:read`)

`vercel.json` tem rewrite catch-all (`/(.*) -> /index.html`, exceto `/api/*`) para reload direto em produção.

Itens de navegação: busca global central, badge de notificação, avatar/e-mail do usuário, hamburger de menu mobile (Sidebar vira drawer real abaixo de 767px, Fase 4), itens condicionados a permissão real do usuário.

## 5. Padrões de tela

### Central Comercial

Resumo acionável, sem mural de gráficos. Blocos de ação (vencidas, hoje, visitas), blocos de oportunidade (sem próxima ação, paradas, orçamentos aguardando retorno), notificações relevantes, resumo comercial. Filtros com chips removíveis individualmente (`.active-filter-chips`, Fase 5) além do "Limpar filtros" geral.

### Listas (Clientes, Oportunidades, Próximas Ações)

Tabelas HTML densas com ações por linha e paginação por cursor ("Carregar mais"). Abaixo de 767px, `.table-wrap.mobile-cards` + `data-label` por célula transforma cada linha em um cartão (Fase 4) — aplicado em Clientes, Oportunidades e Próximas Ações; as demais tabelas do produto (motivos de perda, usuários, relatórios) mantêm rolagem horizontal interna segura.

### Pipeline/Funil

Kanban por etapa (`PipelineBoard`), com seletor de etapa acessível (`<select>` com rótulo `sr-only`) como alternativa ao drag-and-drop — decisão de escopo mantida na Fase 5 (drag-and-drop com paridade real de teclado/leitor de tela é escopo maior, registrado como próximo passo). Badge de "parada" (deal rotting) e badges de alerta forte (`.badge-alert-danger`) para "sem próxima ação"/"atrasada".

### Formulários rápidos e bottom sheet mobile

Campos agrupados por significado, labels sempre visíveis, validação com mensagem específica do domínio. Placeholders têm contraste explícito mais fraco que valor preenchido (`input::placeholder`); campos com valor padrão pré-preenchido (não placeholder) mostram `.field-hint` explicando isso.

`ActionOperationForm` (concluir/reagendar/cancelar próxima ação — o formulário mais reutilizado do produto) vira uma folha inferior (bottom sheet) abaixo de 767px: canto superior `--radius-2xl`, indicador "grabber", backdrop, foco automático no primeiro campo, fecha com Escape ou clique no backdrop (Fase 5, inspirado nos tokens de forma de dispositivo de `design-system/spacing-shape/`).

## 6. Componentes

### Componentes React reais (`src/components/`)

- `layout/Sidebar.tsx`, `layout/Topbar.tsx`, `layout/AppLayout.tsx` — shell, navegação, drawer mobile.
- `ui/EmptyState.tsx`, `ui/Skeleton.tsx` (`LoadingPanels`), `ui/NotificationList.tsx` — feedback reutilizável.
- `ui/Button.tsx`, `ui/Badge.tsx` (Fase 5) — primeiros componentes-base reais com props de variante (`<Button variant="destructive">`, `<Badge tone="alert-danger">`), mapeando para as mesmas classes CSS já existentes (zero mudança visual). **Não é uma migração completa**: as ~40 ocorrências existentes de `<button className="button ...">`/`<span className="badge ...">` no resto do app ainda não foram convertidas para os novos componentes — trabalho mecânico registrado como próximo passo, de baixo risco por não alterar a saída visual (mesmas classes CSS por trás).
- `feedback/OfflineBanner.tsx`, `feedback/InstallPrompt.tsx` — estado de rede e convite de instalação PWA (Fase 4).
- `ui/ConfirmDialog.tsx` (Fase 7) — modal de confirmação acessível (foco automático no botão de confirmar, `Escape` fecha, `role="alertdialog"`), substitui `window.confirm` nas três ações destrutivas do produto (arquivar cliente, arquivar oportunidade). Renderizado localmente por página (estado de confirmação é local, não global).
- `ui/PromptDialog.tsx` (Fase 7) — modal de entrada de texto (label + input, foco e seleção automáticos no campo, `Escape` fecha), substitui `window.prompt` nas duas ações administrativas do Funil (renomear etapa, reordenar etapa).
- `ui/Toast.tsx` (Fase 7) — `ToastProvider`/`useToast()` global (montado em `main.tsx`, acima de `<App />`), fila de notificações transitórias (4s), variantes `success`/`error`, `role="status"`/`aria-live="polite"`. Usado para confirmar toda ação de escrita relevante (salvar cliente, arquivar, aprovar orçamento, marcar como perdida, registrar atividade, renomear/reordenar etapa).
- `PipelineBoard.tsx`, `AdminPanel.tsx`, `QuotesPanel.tsx`, `ReportsPanel.tsx`, `AuvoInboxPanel.tsx` — superfícies de domínio.

### Padrões CSS reutilizáveis (classe, ainda não 100% convertidos para componente React)

`.button` (`primary`/`secondary`/`ghost`/`destructive`, `.loading`), `.icon-button`, `.badge` (+ `.warning`/`.danger-badge` para contextos de menor urgência, `.badge-alert-danger`/`.badge-alert-warning` para alertas fortes — Fase 5), `.panel`, `.empty-state`, `.skeleton`, `.alert`/`.danger-alert`, `.field-hint` (Fase 5), campos de formulário, `.segmented-control`, `.active-filter-chips` (Fase 5), `.dropdown-menu`/`.dropdown-menu-wrapper` (menu "Mais ações", Fase 5), `.action-operation`/`.action-operation-backdrop` (bottom sheet, Fase 5), `.confirm-dialog`/`.confirm-dialog-backdrop`, `.toast-stack`/`.toast`/`.toast-success`/`.toast-error` (Fase 7).

## 7. Acessibilidade

Auditoria automatizada completa em `docs/ACCESSIBILITY-AUDIT.md` (axe-core, 0 violações WCAG 2.0/2.1 A/AA nas telas cobertas). Resumo do que já está garantido:

- Contraste ≥4.5:1 em todos os tokens de texto sobre as superfícies usadas — recalculado e verificado (fórmula WCAG de luminância relativa) para toda a paleta M3 nova (claro e escuro) antes de entrar em produção na Fase 6; menor contraste medido foi 6.05:1 (claro) e 7.73:1 (escuro), ambos acima do mínimo AA.
- Todo campo `<select>`/`<input>` tem label associada (visível ou `sr-only`) ou `aria-label`.
- Foco visível global (`:focus-visible` com anel de 3px, cor `--focus-ring`).
- `prefers-reduced-motion: reduce` respeitado globalmente.
- `prefers-color-scheme: dark` respeitado globalmente (Fase 6) — sem toggle manual ainda.
- Sem `window.confirm`/`window.prompt` nativos no app (Fase 7) — todos substituídos por `ConfirmDialog`/`PromptDialog`, que herdam foco/`Escape`/contraste do design system em vez do diálogo não estilizável do navegador.

Pendente de revisão manual (Fase 3): navegação por teclado ponta a ponta, leitor de tela real, gerenciamento de foco em painéis/drawers, zoom 200%.

## 8. Microinterações

- Botões: transição de cor/fundo em `--duration-fast` (140ms).
- Scroll de navegação (Sidebar → seção): `scrollIntoView({ behavior: "smooth" })`, desativado automaticamente por `prefers-reduced-motion`.
- Skeleton com gradiente animado para carregamento inicial.

Não usar: confete, parallax, pulso contínuo, sino piscando, bounce.

## 9. Linguagem

Português do Brasil, direto e humano. Preferir "Próxima ação", "Nova oportunidade", "Registrar follow-up", "Concluir ação", "Marcar como perdido", "Arquivar". Evitar jargão técnico, "workflow", "ticket", "deal". Nunca chamar valor aprovado de "receita" ou "faturamento".

## 10. Pendências reais após a Fase 7

Resolvidas ao longo das Fases 2–5 (não repetir aqui como pendência): componente monolítico extraído por rota; Clientes/Oportunidades/Próximas Ações com cards no mobile; Sidebar em drawer real no mobile; PWA completo; code-splitting por rota; acentuação em praticamente 100% das strings de UI; vazamento de enum bruto (status/papel) traduzido; cor semântica forte em urgência/atraso/prioridade; hierarquia de botões da Caixa Auvo; ambiguidade de "sem dados" vs 0; contraste de placeholder; severidade no contador de pendentes do Auvo; filtros com chips removíveis; escala de radius/tipografia estendida e 42 valores de `font-size` soltos tokenizados; bottom sheet mobile no formulário mais reutilizado do produto.

Resolvidas na Fase 7 (feedback e diálogos nativos do navegador): `ConfirmDialog`/`PromptDialog`/`Toast` criados e adotados nos 5 pontos de escrita destrutiva/relevante do app (arquivar cliente, arquivar oportunidade, aprovar orçamento, marcar como perdida, renomear/reordenar etapa do Funil) — zero `window.confirm`/`window.prompt` restante no código-fonte.

Pendências reais que continuam em aberto, por escopo ou por exigirem decisão/ação externa:

- Migração completa de `<button className="button ...">`/`<span className="badge ...">` para os componentes `Button`/`Badge` reais (Fase 5 criou os componentes mas não migrou todas as ~40 ocorrências existentes — mudança mecânica, sem risco visual, registrada como próximo passo).
- Drag-and-drop no kanban do Funil — mantido o `<select>` acessível como decisão de escopo; implementar arrastar-e-soltar com paridade real de teclado/leitor de tela (padrão WAI-ARIA APG) é trabalho maior que o resto desta fase.
- Biblioteca de componentes de dados mais ampla (`DataTable` com ordenação/paginação numerada, `Combobox`, `DatePicker`, `MultiSelect`, `CurrencyInput`, `PhoneInput`) ainda não existe como componente reutilizável — cada tela resolve isso com HTML nativo (`<table>`, `<input type="date">` etc.), funcional e acessível, mas não abstraído.
- `Tabs` para reduzir a rolagem da Ficha de Cliente (5 seções empilhadas: Identificação, Oportunidades, Próximas ações, Garantia/Suporte/Pós-venda, Linha do tempo) — identificado, não implementado.
- Tabelas fora de Clientes/Oportunidades/Próximas Ações (motivos de perda, usuários, relatórios) ainda usam rolagem horizontal interna no mobile em vez de cards — seguro, mas não é o padrão ideal da seção 10.5.
- Bloqueio proativo de ação de escrita quando offline (hoje reativo).
- Revisão manual com leitor de tela real e zoom 200% (`docs/ACCESSIBILITY-AUDIT.md`, seção 4).
- Limite de severidade do contador "Pendentes" do Auvo (50) é provisório, a confirmar com a Artec.
