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

- **Navegação por teclado ponta a ponta**: confirmar que todo fluxo crítico (criar cliente, criar oportunidade, aprovar/perder oportunidade, resolver item da Caixa de Entrada) é 100% operável sem mouse, incluindo ordem de tabulação lógica e sem *keyboard traps* em modais/formulários inline.
- **Leitores de tela reais** (NVDA, VoiceOver): a suíte automatizada verifica *presença* de nomes acessíveis, não a *qualidade* da experiência ao navegar com leitor de tela real (ex: se a ordem de leitura faz sentido, se tabelas grandes de clientes/oportunidades são navegáveis por linha/coluna).
- **Foco visível e gerenciamento de foco**: confirmar que o indicador de foco (`--focus-ring`) é suficientemente visível em todos os elementos interativos, e que o foco é movido corretamente ao abrir/fechar painéis (ex: ao abrir o formulário de resolução de um item da Caixa de Entrada).
- **Movimento e animação**: o produto hoje não usa animações não-triviais; se isso mudar (ex: na refatoração de frontend em andamento, que menciona `prefers-reduced-motion`), validar manualmente.
- **Zoom de página até 200%** sem perda de conteúdo/funcionalidade (WCAG 1.4.4) — não testado nesta rodada.

Esses itens fazem parte do escopo de acessibilidade da refatoração de frontend documentada em `PROMPT-REFATORACAO-FRONTEND-ARTEC-CRM.md` (Fase 3), que trata explicitamente de teclado, foco, ARIA e leitor de tela como uma fase dedicada — este documento serve como linha de base antes dessa fase começar.

## 5. Cobertura contínua

A suíte `e2e/accessibility.spec.ts` roda junto com o restante da suíte E2E (`npm run e2e`) e deve ser mantida passando (zero violações automatizadas) a cada mudança de UI. Novas telas/painéis adicionados ao produto devem ser incluídos nessa suíte.
