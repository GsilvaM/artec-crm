# Artec CRM — Auditoria de acessibilidade (WCAG)

Atualizado em: 2026-07-21

## 1. Metodologia

Auditoria automatizada com [axe-core](https://github.com/dequelabs/axe-core) (via `@axe-core/playwright`), rodando contra a aplicação real (frontend + backend + Supabase Auth de homologação), não contra mocks. Regras verificadas: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.

Telas cobertas (`e2e/accessibility.spec.ts`):

1. **Tela de login** (não autenticado).
2. **Tela principal autenticada** (papel `gestor`) — como a aplicação hoje não usa rotas separadas por página (é uma SPA de seção única, `src/App.tsx`), essa varredura já cobre simultaneamente: notificações, Central Comercial, Pipeline, Clientes, Oportunidades, Relatórios, Administração (etapas/motivos/usuários) e Caixa de Entrada Auvo, pois todos os painéis visíveis para `gestor` renderizam na mesma página.
3. **Seção de Clientes e oportunidades** especificamente (mesma página, ponto de scroll diferente, para garantir que estados carregados via `useEffect` assíncrono também foram escaneados).

Rodar localmente: `npx playwright test accessibility.spec.ts` (requer `EMAIL_LOGIN`/`SENHA` de homologação, como os demais specs E2E).

## 2. Escopo e limitação conhecida

Ferramentas automatizadas de acessibilidade (axe-core, Lighthouse, etc.) detectam de forma confiável cerca de 30-40% das falhas de WCAG — o restante exige revisão manual porque depende de julgamento humano ou de interação real. **Esta auditoria cobre a parte automatizável; os itens de revisão manual estão listados na seção 4 como pendência documentada, não como "aprovado".**

## 3. Achados e correções aplicadas (2026-07-21)

A primeira execução da suíte encontrou 25 violações automatizadas, agrupadas em 3 causas-raiz reais (não 25 problemas distintos):

| # | Regra axe | Causa raiz | Onde apareceu | Correção |
| --- | --- | --- | --- | --- |
| 1 | `color-contrast` (serious) | `--foreground-muted: #657282` tinha contraste 4.41:1 contra fundos claros da aplicação (mínimo exigido AA: 4.5:1) | Texto de notificações não lidas (`.notification-list li.is-unread`) | `--foreground-muted` escurecido para `#525f70` (contraste ≥ 5.8:1 nos fundos usados) em `src/styles.css` |
| 2 | `color-contrast` (serious) | Seletor CSS `.auvo-inbox-item-header span` era amplo demais e sobrescrevia a cor do badge de status ("Novo") herdando `--foreground-muted` | Badges de status na Caixa de Entrada Auvo | Corrigido como efeito colateral da correção #1 (mesma variável); nenhuma mudança de seletor foi necessária pois o problema real era só o valor da cor, não a especificidade |
| 3 | `color-contrast` (serious) | `--warning: #a86308` tinha contraste 4.22:1 contra `--surface-muted` | Badge "possível duplicidade" na lista de clientes | `--warning` escurecido para `#8a5306` (contraste ≥ 5.6:1) em `src/styles.css` |
| 4 | `select-name` (critical) | `<select>` sem `<label>`, `aria-label` ou `aria-labelledby` — leitor de tela não anuncia a função do campo | Filtro de status de eventos Auvo (`server` → painel de homologação) | `aria-label="Filtrar eventos Auvo por status"` adicionado em `src/App.tsx` |
| 5 | `select-name` (critical) | Mesmo problema | Seletor de papel (Gestor/Vendedor/Atendimento) na tabela de administração de usuários | `aria-label` dinâmico com o e-mail do usuário adicionado em `src/components/AdminPanel.tsx` |

Após as correções, as 3 execuções (login, tela principal, clientes/oportunidades) passam com **zero violações automatizadas** nas categorias WCAG 2.0/2.1 A e AA.

Todos os demais campos `<select>` do produto já estavam corretamente envolvidos por `<label>` (padrão predominante no formulário do CRM) ou usavam `<span class="sr-only">` (ex: seletor de etapa no Pipeline) — confirmado por leitura de código, não apenas pela varredura automática, já que a varredura só cobre o que está visível/montado no momento do teste.

## 4. Pendências de revisão manual (não cobertas por automação)

Estes itens são conhecidos como limitação da abordagem automatizada e ficam registrados como trabalho futuro, não como bloqueio para a auditoria concluída nesta rodada:

- **Leitores de tela reais** (NVDA, VoiceOver): a suíte automatizada verifica *presença* de nomes acessíveis, não a *qualidade* da experiência ao navegar com leitor de tela real (ex: se a ordem de leitura faz sentido, se tabelas grandes de clientes/oportunidades são navegáveis por linha/coluna). Ainda não testado com leitor real.
- **Zoom de página até 200%** sem perda de conteúdo/funcionalidade (WCAG 1.4.4) — não testado nesta rodada.

## 5. Fase 3 da refatoração de frontend — teclado, foco e responsividade (2026-07-22)

Itens fechados nesta fase (`PROMPT-REFATORACAO-FRONTEND-ARTEC-CRM.md`, seção 19, Fase 3):

- **Navegação por teclado**: `e2e/keyboard.spec.ts` (novo) confirma que os links da Sidebar são alcançáveis via `Tab`/`focus()` e ativáveis com `Enter`. Os fluxos de formulário (criar cliente, criar oportunidade, aprovar/perder, resolver item da Caixa de Entrada) já usam `<form>`/`<button type="submit">` nativos, que são operáveis por teclado por padrão — confirmado por leitura de código, sem *keyboard trap* customizado em nenhum deles.
- **Gerenciamento de foco em painel tipo diálogo**: o painel de notificações (`role="dialog"`, `src/components/layout/Topbar.tsx`) não movia foco ao abrir nem fechava com `Escape` — corrigido: foco vai para o primeiro elemento focável do painel ao abrir, `Escape` fecha e devolve o foco ao botão do sino. Coberto pelo segundo teste de `e2e/keyboard.spec.ts`.
- **Foco visível**: a regra global de `:focus-visible` (`--focus-ring`) cobria `button`/`input`/`select` mas não `a`/`textarea` — estendida em `src/styles.css` para cobrir todos os elementos interativos usados no produto (links de navegação e das tabelas incluídos).
- **Movimento e animação**: confirmado por leitura de código que `@media (prefers-reduced-motion: reduce)` em `src/styles.css` já neutraliza globalmente `animation-duration`, `animation-iteration-count`, `transition-duration` e `scroll-behavior` para `*`/`*::before`/`*::after` — cobre todas as animações existentes (spinner de botão, skeleton pulse, abertura de drawer) sem exceção por componente.
- **Responsividade formal nos 7 breakpoints da seção 13**: `e2e/responsive.spec.ts` (novo) navega pelas 5 telas de maior uso (Central Comercial, Funil, Clientes, Oportunidades, Próximas Ações) em `360x800`, `390x844`, `768x1024`, `1024x768`, `1366x768`, `1440x900` e `1920x1080`, e falha se `document.documentElement.scrollWidth` exceder `window.innerWidth` (overflow horizontal acidental). Todas as 35 combinações passaram sem alteração de CSS adicional além da já existente — a base responsiva da Fase 1 já cobria esses casos.
- **Visão mobile do Pipeline**: fechada junto com a Fase 2.7 (abas de etapa em `max-width: 767px`, ver entrada correspondente em `docs/DEVELOPMENT-STATUS.md`), atendendo à seção 10.6 (kanban horizontal não é usável em mobile).

Ainda pendente (não coberto por automação, listado acima na seção 4): leitor de tela real e zoom 200%.

## 5. Cobertura contínua

A suíte `e2e/accessibility.spec.ts` roda junto com o restante da suíte E2E (`npm run e2e`) e deve ser mantida passando (zero violações automatizadas) a cada mudança de UI. Novas telas/painéis adicionados ao produto devem ser incluídos nessa suíte.
