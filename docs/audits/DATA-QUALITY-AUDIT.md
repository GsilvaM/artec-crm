# Auditoria de Qualidade de Dados — Contaminação E2E/Homologação

**Data:** 2026-07-23
**Escopo:** Postgres real (Supabase), schemas `crm` e `crm_internal`, código em `server/crm/`, `e2e/**`, `database/migrations/`.
**Método:** leitura de código + queries `SELECT`/`count` read-only via script `tsx` temporário (criado e apagado nesta sessão, nunca fez `UPDATE`/`DELETE`/`INSERT`). Nenhum dado foi alterado ou apagado.

Classificação de cada achado:
- **[CÓDIGO]** — comprovado lendo o código-fonte.
- **[BANCO]** — comprovado por número real de uma query nesta sessão (2026-07-23).
- **[INFERÊNCIA]** — dedução razoável a partir de código+dados, não 100% certa.
- **[HIPÓTESE]** — hipótese não verificada, precisa de mais investigação.

---

## 1. Confirmação do isolamento (item 1 da missão)

Números de hoje (2026-07-23), via `prisma.customer.count()` / `prisma.opportunity.count()` com e sem `isTestFixture: true`:

| Tabela | Total | Fixture | Real |
|---|---|---|---|
| `crm.clientes` | 51 | 51 | **0** |
| `crm.oportunidades` | 41 | 41 | **0** |

**[BANCO]** O isolamento por `is_test_fixture` está funcionando tecnicamente (a coluna existe, o backfill rodou, os filtros operacionais aplicam `isTestFixture: false`), mas a foto de hoje é **pior** que a da migration 0017: na migration, 47 clientes / 37 oportunidades eram 100% fixture; hoje são **51 / 41, ainda 100% fixture**. Isso bate exatamente com **4 clientes e 4 oportunidades novos**, coerente com 4 execuções da suíte E2E desde a última auditoria — ou seja, **o problema continua crescendo, não estável**: `e2e/customer-and-opportunity.spec.ts` segue rodando sem teardown e a cada execução acumula mais 1 cliente + 1 oportunidade + 1 next_action reais no banco de produção. **Zero cliente comercial real jamais existiu neste banco.**

## 2. Risco do opt-in por header `x-crm-include-test-fixtures` (item 2)

**[CÓDIGO]** Conferido em `server/crm/routes.ts:410-411`:
```ts
function wantsTestFixtures(request: FastifyRequest): boolean {
  return request.headers["x-crm-include-test-fixtures"] === "true";
}
```
Único requisito para ver fixtures é enviar esse header — **não há verificação de ambiente, IP, feature flag, role ou segredo compartilhado**. Qualquer chamador autenticado (qualquer vendedor ou gestor com sessão válida) que descubra o nome do header em qualquer response de rede, no bundle do `playwright.config.ts` (se o repo vazar) ou por tentativa e erro, passa a ver os 51 clientes e 41 oportunidades fixture nas mesmas telas operacionais.

**[CÓDIGO]** O header só é lido em **3 pontos**, não em todos os endpoints (`grep` em `routes.ts:410-411` cruzado com todas as chamadas a `wantsTestFixtures`):
- `GET /api/search` (busca global)
- `GET /api/customers`
- `GET /api/opportunities`

Ele **não** afeta `/api/commercial-center`, `/api/reports/commercial`, `/api/next-actions` nem os endpoints Auvo — nesses o filtro de fixture é feito de outra forma ou nem existe (ver seção 4).

**Avaliação de risco:** é um mecanismo aceitável para o curto prazo (não expõe nada a usuário não-autenticado, é opt-in e não é usado em produção real hoje porque não há dados reais para "esconder"), mas é **frágil como controle de segurança**:
- Não expira, não é auditado (nenhum log de quem usou o header), não diferencia ambiente (mesmo header funcionaria em produção real se um dia houver dados reais).
- **Nenhum teste** garante hoje que o header é ignorado fora do contexto de teste — ou seja, não há uma trava que impeça alguém de reativar acidentalmente esse comportamento em produção.
- É "security by obscurity": qualquer um com acesso ao repositório (que já está sob controle de versão) vê o nome exato do header em `playwright.config.ts`.

**Recomendação concreta:** não é preciso trocar a estratégia agora (não há dado real para vazar), mas antes do primeiro cliente real ser cadastrado, substituir por algo com trava adicional, em ordem de preferência:
1. Restringir o header a ambientes não-produtivos via variável de ambiente do servidor (`if (config.NODE_ENV !== "production" && header === "true")`), assim mesmo que o header vaze, produção o ignora.
2. Exigir também um segredo compartilhado (`CRM_E2E_FIXTURE_TOKEN`) comparado por `timingSafeEqual`, não só o header booleano.
3. Idealmente migrar para a opção preferida da missão: **schema/banco isolado** para os testes E2E (ver seção 5).

## 3. Ausência de teardown em `e2e/customer-and-opportunity.spec.ts` (item 3)

**[CÓDIGO]** Confirmado — o spec (`e2e/customer-and-opportunity.spec.ts:1-37`) faz `POST` de cliente e depois de oportunidade via UI, sem nenhum `afterEach`/`afterAll` que arquive ou apague o que criou. **[CÓDIGO]** Esse é o **único** spec em `e2e/**/*.spec.ts` (auditados todos os 13 arquivos, seção 6) que cria dado persistente — todos os outros são somente leitura/navegação.

**[BANCO]** Cada execução grava permanentemente: 1 `crm.clientes`, 1 `crm.oportunidades` (com `status: "ativa"`, o que **também** cria em cascata 1 `crm.next_actions` pendente, pois `createOpportunity` sempre gera uma next_action quando `status === "ativa"` — `prisma-repository.ts:356-374`). Rodar essa suíte todo dia em CI, sem teardown, acumula ~365 linhas novas/ano em 3 tabelas, indefinidamente, no Supabase real cobrado.

**Solução concreta proposta** (ordem de preferência, pode combinar):

1. **Teardown via API no `test.afterEach`**, usando o próprio `page.request` (já autenticado) para chamar `DELETE`/arquivar o que foi criado:
   ```ts
   test.afterEach(async ({ page }) => {
     if (createdOpportunityId) await page.request.post(`/api/opportunities/${createdOpportunityId}/archive`);
     if (createdCustomerId) await page.request.post(`/api/customers/${createdCustomerId}/archive`);
   });
   ```
   Limitação: hoje não existe endpoint de hard-delete (só archive), então isso reduz poluição visual mas não reduz a linha no banco. Ainda assim resolve boa parte do problema porque `archivedAt` já é filtrado por outras queries.
2. **Preferencial de verdade, alinhado à missão:** um endpoint (ou rota de teste) `DELETE /api/test-fixtures/:runId`, protegido por `NODE_ENV !== "production"`, que apaga em cascata (next_actions → activities → opportunities → customers) tudo criado com um `run_id`/`created_by` de teste em uma execução — chamado no `afterEach`. Isso exige guardar um identificador de execução (ex.: `suffix` já usado no teste, `Date.now().toString(36)`) e propagá-lo, e criar a rota de exclusão real com dry-run first.
3. **Mínimo viável imediato sem mudar infra:** trocar a estratégia de nome fixo (`E2E Cliente ${suffix}`) para reaproveitar sempre os **mesmos 1 cliente + 1 oportunidade "canônicos"** (upsert por nome fixo, sem sufixo de timestamp) em vez de criar um novo registro a cada corrida. Isso não elimina o dado de teste, mas para de crescer sem limite — de "N execuções = N linhas" para "N execuções = 1 linha reaproveitada".

Recomendo **1 imediatamente** (baixo esforço, já reduz visibilidade) **+ 3** (impede crescimento ilimitado) como curto prazo, e **2** como correção definitiva antes de haver dado real na base.

## 4. `auvo_inbox_items` / `auvo_webhook_events` (item 4)

**[CÓDIGO]** Nenhum spec em `e2e/**` cria itens nessas tabelas — `e2e/auvo-inbox.spec.ts` é 100% leitura (só navega e confere que o painel renderiza). Os dados vêm exclusivamente do webhook real do Auvo (`POST` externo processado em `receiveAuvoWebhookEvent`, `prisma-repository.ts:1154-1189`).

**[BANCO]** O próprio código de produção (`server/auvo-homologation-status.ts` e `server/auvo-fixtures-export.ts`) já implementa uma convenção de marcação: eventos sintéticos de homologação levam `raw_payload_json->>'homologation' = 'true'`. Contagem real hoje:

| | `auvo_webhook_events` |
|---|---|
| Total | 378 |
| Marcados `homologation: true` (sintético) | **4** |
| Não marcados (prováveis reais) | **374** |

`auvo_inbox_items` ligados a um evento marcado como homologação (via `last_event_id`): **0 de 168**.

Amostra de `contactName`/`title` em `auvo_inbox_items` (Jorginho, Catharina Malini, Sergio Aguiar, Ativa Engenharia Eduardo Bissoli Pmoc, ...) tem cara de contato real de WhatsApp/Auvo, reforçando a leitura de que **[INFERÊNCIA]** essas 168 linhas são majoritariamente dados operacionais reais — não fixtures de teste.

**Conclusão:** ao contrário de `clientes`/`oportunidades` (100% fixture), as tabelas Auvo já são, na prática, quase 100% dado real (374/378 ≈ 98,9%). **Não é necessário isolamento equivalente ao de `clientes`/`oportunidades`** — o volume contaminado é pequeno (4 linhas) e não vaza para o funil comercial (0 inbox items derivados).

**Gap residual [CÓDIGO]:** apesar de a marcação `homologation` existir no payload, **nenhuma query de leitura filtra por ela** — `listAuvoWebhookEvents` (`prisma-repository.ts:1389-1415`) e `getAuvoIntegrationStatus` não excluem os 4 eventos sintéticos; eles aparecem normalmente na tela "Integração Auvo". Baixa materialidade (4 linhas), mas por consistência recomendo:
- Adicionar coluna real `is_test_fixture` (ou reaproveitar a convenção existente) em `crm_internal.auvo_webhook_events`, populada a partir de `raw_payload_json->>'homologation'` no `receiveAuvoWebhookEvent`, e filtrar os reads por padrão — mesmo padrão já usado em `clientes`/`oportunidades`, por consistência de arquitetura.

## 5. Vazamento por `activities` e `next_actions` ligados a oportunidades/clientes fixture (item 5) — **achado novo, crítico**

**[CÓDIGO]** As tabelas `crm.atividades` (model `Activity`) e `crm.next_actions` (model `NextAction`) **não têm coluna `is_test_fixture`** (confirmado no `prisma/schema.prisma:148-203` — só `Customer` e `Opportunity` têm o campo). Nenhuma query de leitura dessas tabelas filtra por fixture, nem indiretamente via join no cliente/oportunidade:

- `listActivities` (`prisma-repository.ts:601-619`) — sem filtro de fixture.
- `listNextActions` (`prisma-repository.ts:668-713`), usado por `GET /api/next-actions` ("Próximas ações") — sem filtro de fixture.
- `getCommercialCenter` (`prisma-repository.ts:715-834`) — a query de `pendingActions` (`this.prisma.nextAction.findMany(...)`, linhas 742-754) **não tem nenhum filtro de fixture**, nem hardcoded nem via header. É a fonte de `overdueActions` e `todayActions`, os blocos "Ações vencidas"/"Hoje" da Central Comercial que todo vendedor/gestor vê ao logar.
- Em contraste, na mesma função, as queries de `opportunity.findMany` (`activeOpportunities`, `periodOpportunities`) e `customer.count` **têm** `isTestFixture: false` hardcoded (linhas 735, 764, 774) — ou seja, **o autor cobriu oportunidades e clientes na Central Comercial, mas esqueceu de cobrir next_actions**, que é uma tabela separada sem herdar o filtro do join.

**[BANCO]** Quantificando o vazamento real hoje:

| Métrica | Valor |
|---|---|
| `next_actions` pendentes total | 47 |
| Pendentes ligados a oportunidade fixture | 43 |
| Pendentes ligados a cliente fixture | 45 |
| Pendentes ligados a fixture (opp OU cliente) — o que aparece hoje na Central Comercial sem filtro | **45 de 47 (95,7%)** |
| Desses, quantos aparecem hoje como "vencida" (`overdueActions`, `dueAt < agora`) | **6** |
| `atividades` total | 8 |
| Atividades ligadas a cliente fixture | **8 de 8 (100%)** |
| Atividades ligadas a oportunidade fixture | 3 de 8 |

**Isso significa que, hoje, 45 das 47 "próximas ações" pendentes que aparecem na Central Comercial e na página "Próximas ações" são de fixtures de teste — incluindo 6 marcadas como "vencidas" — e isso não depende do header `x-crm-include-test-fixtures` porque a query nem olha para o campo.** Se amanhã existir 1 vendedor real com 1 next_action real, ela ficará misturada e essencialmente invisível entre 45 fixtures na mesma lista, sem nenhum filtro disponível para separá-las. Este é o achado de maior impacto operacional imediato desta auditoria, pois afeta a tela mais usada do sistema (Central Comercial) mesmo sem qualquer opt-in.

**Solução proposta (mesmo padrão de 0017), nova migration:**
```sql
ALTER TABLE crm.atividades    ADD COLUMN IF NOT EXISTS is_test_fixture BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE crm.next_actions  ADD COLUMN IF NOT EXISTS is_test_fixture BOOLEAN NOT NULL DEFAULT false;
-- backfill por herança do cliente/oportunidade pai, não por nome (essas tabelas nao tem titulo/nome proprio)
UPDATE crm.atividades a SET is_test_fixture = true
  WHERE EXISTS (SELECT 1 FROM crm.clientes c WHERE c.id = a.cliente_id AND c.is_test_fixture)
     OR EXISTS (SELECT 1 FROM crm.oportunidades o WHERE o.id = a.oportunidade_id AND o.is_test_fixture);
UPDATE crm.next_actions n SET is_test_fixture = true
  WHERE EXISTS (SELECT 1 FROM crm.clientes c WHERE c.id = n.customer_id AND c.is_test_fixture)
     OR EXISTS (SELECT 1 FROM crm.oportunidades o WHERE o.id = n.opportunity_id AND o.is_test_fixture);
```
E no código: `createActivity`/`createNextAction`/a criação em cascata dentro de `createOpportunity` devem herdar `isTestFixture` do cliente/oportunidade pai (não recalcular por nome, já que activity/next_action não têm nome próprio). Depois, aplicar `isTestFixture: false` (respeitando o header, como já é feito em `listCustomers`/`listOpportunities`) em: `listActivities`, `listNextActions`, e principalmente na query de `pendingActions` dentro de `getCommercialCenter` — hoje é a lacuna mais urgente.

**Gap adicional relacionado [CÓDIGO]:** a classificação automática `isTestFixtureName()` (`prisma-repository.ts:2361-2363`) só olha o **nome/título** (`/^e2e\s/i` ou `/homolog/i`), enquanto o backfill original da migration 0017 também considerava `telefone_normalizado = '5511999990000'`. Ou seja, hoje, se alguém cria manualmente um cliente com o telefone de teste `11999990000` mas um nome "normal" (não começando com "E2E " nem contendo "Homolog"), ele **não** é marcado como fixture na criação — só seria pego numa próxima rodada de backfill manual. Recomendo alinhar `isTestFixtureName`/a lógica de criação para também considerar o telefone normalizado, e propagar `isTestFixture` do cliente para a oportunidade no create (hoje `createOpportunity` decide sozinho a partir do título da oportunidade, sem checar se o cliente vinculado já é fixture — `prisma-repository.ts:349`).

## 6. Auditoria de todos os `e2e/**/*.spec.ts` (item 6)

**[CÓDIGO]** Todos os 13 specs foram lidos e o grep por `getByRole("button", …)` com verbos de escrita (`criar|salvar|adicionar|novo|confirmar|aprovar|enviar|registrar|arquivar`) e por `fill(`/`selectOption(`/`click()` foi feito em todos:

| Spec | Cria/muta dado persistente? |
|---|---|
| `customer-and-opportunity.spec.ts` | **Sim** — único criador (seção 3) |
| `keyboard.spec.ts` | Não — abre form "Concluir" e dialog "Arquivar", mas ambos são fechados com `Escape` antes de qualquer submit; nenhuma mutação real ocorre |
| `auth.spec.ts` | Não — só tenta login com senha errada |
| `auvo-inbox.spec.ts` | Não — só navega e confere UI |
| `admin.spec.ts` | Não — só navega entre abas |
| `commercial-center-and-reports.spec.ts` | Não — só leitura |
| `customer-detail.spec.ts` | Não — só navega/lê |
| `opportunity-detail.spec.ts` | Não — só navega/lê |
| `next-actions.spec.ts` | Não — só navega/lê |
| `notifications.spec.ts` | Não — só navega/lê |
| `search.spec.ts` | Não — busca por "Homologacao" (depende dos fixtures existentes via header) |
| `accessibility.spec.ts` | Não — só navega |
| `responsive.spec.ts` | Não — só navega/redimensiona |

**Conclusão:** confirmado que `customer-and-opportunity.spec.ts` é o único ponto de criação de dado em toda a suíte E2E. Nenhum outro spec precisa de teardown.

## 7. Inventário adicional (achados fora do escopo direto, mas relevantes)

- **[CÓDIGO]** `e2e/support/auth.ts` — os testes E2E logam com um **usuário real de homologação** (`EMAIL_LOGIN`/`SENHA` do `.env`), não um usuário de teste dedicado/sintético. É esse mesmo usuário que humanos usam para testes manuais de homologação — por isso o padrão de nome `"Homolog..."` aparece nos dados (testadores humanos, não só Playwright, criam registros manualmente logados nessa conta).
- **[BANCO/CÓDIGO]** Dois scripts soltos e não rastreados (`git status` mostra como `??`, não fazem parte de nenhum commit) já existiam nesta árvore antes desta sessão: `server/tmp-auvo-audit-readonly.ts` e `server/tmp-auvo-audit-readonly2.ts` — são scripts read-only de auditoria Auvo de uma sessão anterior, esquecidos no `server/` em vez de apagados. Não foram tocados por mim (não fazem parte desta tarefa), mas ficam registrados aqui como débito de limpeza: devem ser apagados ou movidos para fora do diretório versionado.
- **[CÓDIGO]** `getCustomer(id)`/`getOpportunity(id)` (busca por ID direto) **não filtram fixture** — aceitável, pois normalmente só são alcançados a partir de uma lista já filtrada, mas significa que a URL direta `/clientes/:id` ou `/oportunidades/:id` de uma fixture carrega normalmente para qualquer usuário autenticado que tenha (ou adivinhe) o UUID. Risco baixo (UUID não é adivinhável), mas vale citar por completude.
- **[CÓDIGO]** `crm.notificacoes` (model `Notification`) também não tem `is_test_fixture` e pode referenciar `opportunityId`/`customerId` de fixtures (2 notificações hoje ligadas a oportunidade fixture, achado **[BANCO]**). Volume baixo, mas seguiria o mesmo padrão de herança proposto na seção 5 caso a equipe quera fechar 100% dos vazamentos.
- **[CÓDIGO]** Migrations 0018/0019 (`fechar_tipo_demanda_e_exigir_motivo_perda`, `adicionar_constraints_tipo_demanda_e_motivo_perda`) foram aplicadas depois da 0017 e não tocam `is_test_fixture` — não há conflito, apenas registrado para contexto de que a auditoria cobre até a migration 0019 inclusive.

## 8. Causa raiz

A causa raiz, confirmada por código e por banco, é dupla:

1. **Nenhum cliente comercial real jamais foi cadastrado no CRM** — o produto está em uso exclusivamente por testes automatizados (Playwright) e testes manuais de homologação feitos pela própria equipe, logados na única conta disponível (`EMAIL_LOGIN`/`SENHA`). Não é um bug de isolamento; é reflexo do estágio do produto (ainda não foi para produção real com vendedores).
2. **A suíte E2E cria dado real sem teardown e sem limite de crescimento** (`customer-and-opportunity.spec.ts`), e o isolamento implementado na migration 0017 cobriu bem `clientes`/`oportunidades` mas **não se propagou** para as tabelas dependentes `next_actions` e `atividades`, que não têm coluna própria e cujas queries de leitura mais usadas (Central Comercial, Próximas Ações) não filtram por fixture de forma alguma — isso é hoje o vazamento mais visível do sistema.

## 9. Plano de cleanup (dry-run first, sem exclusão)

Nenhuma exclusão foi executada ou é proposta como próximo passo automático. Ordem recomendada:

1. **Curto prazo (não requer migration):**
   - Adicionar `test.afterEach` em `customer-and-opportunity.spec.ts` para arquivar o cliente/oportunidade criados (reduz visibilidade imediatamente, reversível).
   - Trocar o sufixo `Date.now().toString(36)` por um nome fixo reaproveitável, ou fazer o teste checar se o fixture canônico já existe antes de criar outro (para de crescer).
2. **Migration nova (aditiva, sem apagar nada), replicando o padrão da 0017:**
   - `is_test_fixture` em `crm.atividades` e `crm.next_actions`, com backfill por herança do cliente/oportunidade pai (seção 5).
   - Opcional: `is_test_fixture` em `crm.notificacoes` (baixa prioridade, 2 linhas hoje) e em `crm_internal.auvo_webhook_events` a partir de `raw_payload_json->>'homologation'` (baixa prioridade, 4 linhas hoje).
3. **Código:** aplicar `isTestFixture: false` (respeitando `includeTestFixtures`/header, ou lendo de config de ambiente conforme decisão da seção 2) em `listActivities`, `listNextActions`, e na query `pendingActions` de `getCommercialCenter` — esta última é a mais urgente por impacto (45/47 next_actions pendentes hoje).
4. **Antes de qualquer exclusão física de linhas** (fora do escopo desta auditoria): gerar relatório de linhas candidatas (`SELECT id, nome/titulo, created_at, is_test_fixture FROM ... WHERE is_test_fixture ORDER BY created_at`), rodar em modo dry-run, fazer backup/export do Supabase, confirmar ambiente (`CRM_DATABASE_URL` aponta para o projeto certo) e só então decidir se as 51+41+... linhas de fixture antigas devem ser arquivadas ou fisicamente removidas — hoje elas estão apenas **ocultas**, não apagadas, o que é o comportamento seguro esperado.
5. **Testes de isolamento a adicionar** (novos, não existem hoje): um teste de integração/API que verifica, sem o header `x-crm-include-test-fixtures`, que `GET /api/commercial-center`, `GET /api/next-actions` e `GET /api/reports/commercial` **não** retornam nenhum registro com `isTestFixture: true` (direto ou via join) — isso teria pego o gap da seção 5 antes de chegar em produção.

## 10. Métricas antes/depois (antes = migration 0017 original; depois = hoje, 2026-07-23)

| Métrica | Migration 0017 (registro no arquivo) | Hoje (query real) |
|---|---|---|
| `crm.clientes` total | 47 | **51** |
| `crm.clientes` fixture | 47 (100%) | **51 (100%)** |
| `crm.oportunidades` total | 37 | **41** |
| `crm.oportunidades` fixture | 37 (100%) | **41 (100%)** |
| `crm.clientes` real | 0 | **0** |
| `crm.oportunidades` real | 0 | **0** |
| `next_actions` pendentes vazando na Central Comercial (sem filtro) | não medido antes | **45 de 47 (95,7%)** |
| `atividades` ligadas a cliente fixture | não medido antes | **8 de 8 (100%)** |
| `auvo_webhook_events` sintéticos (marcados `homologation:true`) | não medido antes | **4 de 378 (1,1%)** |

O número de fixtures **cresceu** desde a migration 0017 (confirma a seção 3: sem teardown, o problema se agrava a cada execução da suíte), e a auditoria revelou um vazamento novo e maior em `next_actions`/`atividades` que a migration 0017 não cobriu.

---

## Arquivos relevantes (paths absolutos)

- `C:\Users\Artec Climatizados\Desktop\artec-crm\database\migrations\0017_isolar_fixtures_e2e_homologacao.sql`
- `C:\Users\Artec Climatizados\Desktop\artec-crm\server\crm\prisma-repository.ts` (funções `isTestFixtureName`, `listCustomers`, `listOpportunities`, `listActivities`, `listNextActions`, `getCommercialCenter`, `getCommercialReport`, `createCustomer`, `createOpportunity`)
- `C:\Users\Artec Climatizados\Desktop\artec-crm\server\crm\routes.ts` (`wantsTestFixtures`, linhas 131/167/205/410-411)
- `C:\Users\Artec Climatizados\Desktop\artec-crm\prisma\schema.prisma` (models `Customer`, `Opportunity`, `Activity`, `NextAction`, `AuvoWebhookEvent`, `AuvoInboxItem`, `Notification`)
- `C:\Users\Artec Climatizados\Desktop\artec-crm\playwright.config.ts`
- `C:\Users\Artec Climatizados\Desktop\artec-crm\e2e\customer-and-opportunity.spec.ts`
- `C:\Users\Artec Climatizados\Desktop\artec-crm\e2e\support\auth.ts`
- `C:\Users\Artec Climatizados\Desktop\artec-crm\server\auvo-homologation-status.ts`
- `C:\Users\Artec Climatizados\Desktop\artec-crm\server\auvo-fixtures-export.ts`
- `C:\Users\Artec Climatizados\Desktop\artec-crm\server\tmp-auvo-audit-readonly.ts` e `tmp-auvo-audit-readonly2.ts` (débito de limpeza, não tocados)
