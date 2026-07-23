# Progresso — Reconstrução Artec CRM

Atualizado a cada gate. Última atualização: Gate 1 concluído, primeiro lote de correções P0-P4 do Gate 2/3/4 aplicado e validado.

## Gate atual
Transição Gate 1 → Gate 2/3/4 (correções priorizadas por severidade, não estritamente sequenciais por número de gate — ver justificativa em `docs/audits/ROOT-CAUSE-SYNTHESIS.md`).

## Concluído
- **Gate 0**: estado Git levantado, hierarquia de fontes verificada, tokens JSON de `docs/` inventariados (achado crítico D001 em `REFATORACAO-CRM-DECISOES.md`), baseline técnico verde.
- **Gate 1**: 5 auditorias formais escritas em `docs/audits/*.md` pelos subagentes reais do projeto, síntese em `docs/audits/ROOT-CAUSE-SYNTHESIS.md`.
- **Lote P0** (integridade de dados): `next_actions`/Central Comercial agora excluem fixtures via join a `customer.isTestFixture` (achado: 95,7% das ações pendentes exibidas eram fixture); timezone de `getCommercialCenter` from/to corrigido (mesma classe de bug já corrigida em outros pontos); corrida em `receiveAuvoWebhookEvent` corrigida (P2002 tratado como duplicata legítima, não erro); teardown adicionado a `e2e/customer-and-opportunity.spec.ts` (bug descoberto e corrigido no processo: `page.request` não herda o Bearer token que a app injeta via JS — token agora lido do localStorage); 43 clientes e 40 oportunidades fixture órfãos (de execuções antes do teardown existir) arquivados.
- **Lote P1** (confiabilidade operacional): novo endpoint `/api/internal/reconcile` protegido por `CRON_SECRET`, chamado por `vercel.json` `crons` a cada 5 min, resolvendo o padrão sistêmico "nenhum scheduler" que afetava tanto o worker Auvo quanto as notificações; botão "Reprocessar" agora reprocessa de fato (antes só resetava status); `AuvoInboxItem` ganhou `is_test_fixture`; corpo de notificação de ação vencida não expõe mais ISO cru (formatado em pt-BR, fuso América/São Paulo).
- **Lote P4** (fidelidade de design, com evidência real): radius de card/painel e badge corrigido de 8px/pill para 4px (`docs/cards.json` comprovou o valor, corrigindo suposição anterior); classe `.cell-primary-text` (usada em Clientes/Oportunidades, inexistente) criada; badges de status inconsistentes em `AuvoInboxPanel.tsx` corrigidos (nova classe `.badge-warning-soft`).
- Regressão própria descoberta e corrigida no processo: o filtro de fixtures em `getCommercialCenter`/`listNextActions` quebrou um teste E2E de teclado que dependia de ver uma ação pendente para clicar "Concluir" — resolvido estendendo o mesmo opt-in por header já usado em Clientes/Oportunidades/Busca.

## Validado (não herdado — reexecutado após cada lote)
`prisma validate` ok · 20 migrations aplicadas (0001-0020) · `typecheck` limpo · `vitest` 90/90 · `build` (frontend+server) ok · `playwright` 36/36 (a11y + responsividade inclusos).

## Pendências honestas (não resolvidas nesta rodada, documentadas para não fingir conclusão)
- **Dark mode reprova WCAG de verdade** (achado QA): os audits axe-core nunca testaram `colorScheme: dark` — rodado manualmente, houve violações `serious` de contraste em 4 páginas. Não corrigido ainda.
- Sem entidade Visita/Equipamento/Endereço no schema (achado Product) — mudança estrutural grande, não decidida unilateralmente nesta rodada.
- Cliente/Oportunidade não editáveis após criação; `origem` nunca coletado por formulário.
- 0% de match cliente↔contato Auvo (achado Auvo) — `auvoContactId` nunca foi backfilled nos clientes existentes.
- Cobertura de teste zero para: worker Auvo real (só a lógica pura é testada), corrida corrigida em `receiveAuvoWebhookEvent` (fix aplicado, sem teste automatizado dedicado), kanban rollback, notification dedupe.
- Degrau de altura de controle 37px do kit ainda ausente da escala; demais páginas (Próximas Ações como "Task List", Caixa Auvo split-view) não redesenhadas nesta rodada.
- Baseline visual completo (8 viewports × 13 páginas) não capturado — ferramenta de screenshot deste ambiente intermitente.

## Riscos
- Commit local (`43f412d`, sessão anterior) segue 1 à frente do origin, não pushado — nenhuma ação de commit/push tomada nesta rodada.
- `CRON_SECRET` precisa ser configurado no painel do Vercel para o scheduler funcionar em produção — não é algo que este agente possa configurar (segredo de ambiente).

## Próximo passo
Seguir para os itens P2 (dark mode) e P3 (modelo de produto — decisão de escopo, não implementação unilateral) do `ROOT-CAUSE-SYNTHESIS.md`, e as páginas ainda não redesenhadas (Próximas Ações, Caixa Auvo, Clientes, Relatórios), sem pausar para confirmação salvo exclusão de dados, mudança irreversível ou ambiguidade de regra de negócio.
