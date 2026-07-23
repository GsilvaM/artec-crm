# Plano de execução — Reconstrução Artec CRM

Plano vivo, atualizado a cada gate. Segue a estrutura de gates do prompt mestre v2 (`docs/PROMPT-MESTRE-REFATORACAO-ARTEC-CRM.md` era a v1; a v2 foi recebida em chat, não está salva como arquivo — recomendação: salvar o texto completo em `docs/PROMPT-MESTRE-REFATORACAO-ARTEC-CRM-V2.md` quando possível).

## Gate 0 — Estado real e preservação
**Status**: concluído (com uma pendência: baseline visual completo não capturado — ferramenta de browser instável neste ambiente).

## Gate 1 — Auditoria paralela e causas raiz
**Status**: em andamento. 5 subagentes reais (`artec-crm-product-architect`, `artec-design-system-engineer`, `artec-auvo-integration-specialist`, `artec-data-quality-e2e`, `artec-qa-release-guardian`) disparados em paralelo, escrevendo em `docs/audits/*.md`. Síntese (`docs/audits/ROOT-CAUSE-SYNTHESIS.md`) pendente até os 5 retornarem.

## Gate 2 — Higiene de dados e isolamento E2E
**Status**: parcialmente concluído em sessão anterior (is_test_fixture, backfill, filtro operacional, header opt-in para E2E). Pendências identificadas a confirmar no Gate 1: teardown ausente em `e2e/customer-and-opportunity.spec.ts`; isolamento de `auvo_inbox_items`/`auvo_webhook_events` ainda não avaliado.

## Gate 3 — Reconstrução da integração Auvo
**Status**: parcialmente concluído em sessão anterior (worker de reconciliação, state machine received→processing→processed/failed com retry+backoff, nome canônico corrigido, CONTACT_*/SESSION_* normalizados a partir de payload real). Pendências a confirmar: observabilidade completa do painel (taxa de sucesso, latência, dead-letter visíveis?), split-view da Caixa Auvo, match confidence exposta na UI.

## Gate 4 — Design system e fundação visual
**Status**: parcialmente concluído (radius de controle 4px, sidebar 248px, decisão de ícones documentada). Pendente: mapeamento formal tokens→componentes (`docs/DESIGN-TOKENS-MAPPING.md`), inventário completo dos 13 JSON novos, catálogo interno de componentes.

## Gate 5 — AppShell
**Status**: não iniciado nesta rodada (Sidebar/Topbar já existem de fases anteriores — reavaliar contra os JSON de navigation/navigation header).

## Gate 6 — Páginas operacionais prioritárias
**Status**: parcial. Central Comercial e Funil tiveram correções reais (stub Auvo corrigido, drag-and-drop). Próximas Ações, Clientes, Caixa Auvo, Oportunidades, fichas — pendentes de revisão profunda.

## Gate 7 — Notificações e relatórios
**Status**: não iniciado nesta rodada.

## Gate 8 — Administração e integração técnica
**Status**: não iniciado nesta rodada.

## Gate 9 — Evidência visual
**Status**: bloqueado parcialmente pela instabilidade da ferramenta de screenshot neste ambiente. Suíte Playwright (36/36, incluindo a11y e responsividade) usada como evidência funcional substituta onde screenshot direto falhar.

## Gate 10 — Validação e release readiness
**Status**: baseline técnico do Gate 0 já verde (typecheck, vitest 85/85, build, playwright 36/36). Repetir ao final de cada gate subsequente.

## Regra de progressão
Não avançar de gate sem os critérios de saída do gate atual atendidos ou explicitamente documentados como pendência aceita em `docs/REFATORACAO-CRM-PROGRESSO.md`.
