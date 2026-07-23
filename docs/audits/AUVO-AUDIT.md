# Auditoria da Integração Auvo — Artec CRM

**Data da auditoria:** 2026-07-23
**Escopo:** `request → autenticação → persistência → normalização → correlação → projeção → triagem`
**Método:** leitura de código-fonte + queries `SELECT`/`count` somente-leitura contra o Postgres real (Supabase, `CRM_DATABASE_URL`) via script `tsx` temporário, executado e apagado dentro desta sessão. Nenhum `UPDATE`/`INSERT`/`DELETE` foi executado. Nenhum dado pessoal (nome, telefone, e-mail, payload bruto) foi copiado para este relatório — apenas contagens, status, comprimentos de string e flags booleanas.

Cada achado é rotulado:
- **[CÓDIGO]** — comprovado lendo o código-fonte atual.
- **[BANCO]** — comprovado por query real contra o Postgres de produção/homologação.
- **[INFERÊNCIA FORTE]** — dedução com alta confiança a partir de código + dados, sem confirmação direta.
- **[HIPÓTESE]** — plausível, não confirmada.
- **[DESCONHECIDO]** — não há como responder com o acesso disponível.

---

## 0. Estado agregado no momento da auditoria

Saída real de `npm run auvo:homologation:status` (executado nesta sessão):

```json
{
  "webhookSecretConfigured": true,
  "totalEvents": 378,
  "syntheticEvents": 4,
  "likelyRealEvents": 374,
  "pendingEvents": 36,
  "failedEvents": 0,
  "ignoredEvents": 12,
  "processedEvents": 330,
  "nextOfficialStep": "analyze_real_auvo_payloads"
}
```

**[BANCO]** Os "328 pendentes" citados na missão já não refletem o estado atual: o worker de reconciliação (implementado nesta sessão, antes desta auditoria) já rodou uma vez e zerou os 330 pendentes de então. Desde essa execução, **36 novos eventos reais** chegaram via webhook e voltaram a se acumular em `status IN ('received','processing')` — porque, como detalhado na seção 3, **não existe nenhum gatilho automático (cron/scheduler) que rode `reconcileAuvoWebhookEvents`**. Ou seja: o número de pendentes hoje é function do tempo desde a última execução manual do script, não de uma falha do worker.

---

## 1. Por que existiam 328 (agora 36) pendentes

**[CÓDIGO]** Antes desta sessão, `receiveAuvoWebhookEvent` (`server/crm/prisma-repository.ts`) gravava todo evento com `status: "received"` e nada no sistema jamais promovia esse status para `processed`/`failed` — não havia worker, cron, endpoint ou script de reconciliação. Isso está confirmado pela ausência total, no histórico do repositório antes desta sessão, de qualquer chamador de uma função de reconciliação (ela não existia).

**[CÓDIGO]** Isso ainda é parcialmente verdade hoje: `reconcileAuvoWebhookEvents` (linha 1455 de `prisma-repository.ts`) só é executado por `npm run auvo:events:reconcile` (`server/auvo-events-reconcile.ts`). Não há:
- endpoint HTTP equivalente a `/api/notifications/reconcile` (que existe para notificações, `server/crm/routes.ts:108`) — **não existe** `/api/integrations/auvo/reconcile`;
- `vercel.json` sem seção de cron;
- nenhum workflow em `.github/workflows` (a pasta não existe no projeto);
- nenhum outro agendador (`grep -rn "cron"` no projeto não retornou nada relevante).

**Conclusão:** o worker existe e funciona (ver seção 3), mas **é 100% manual**. Pendências vão se acumular indefinidamente entre execuções humanas do comando. Este é o gap operacional mais crítico encontrado.

---

## 2. Por que "tentativas" (attemptCount) está em 0

**[BANCO]** Query real:
```
attempt_count | status    | n
0             | received  | 36
0             | processed | 330
0             | ignored   | 12
```
100% das linhas têm `attempt_count = 0`. Nenhum evento, em nenhum momento capturado no banco, jamais falhou dentro do `try/catch` de `reconcileAuvoWebhookEvents` — nem uma vez.

**[CÓDIGO]** `attemptCount` só é incrementado dentro do bloco `catch` de `reconcileAuvoWebhookEvents` (quando `upsertInboxItemFromSessionEvent` ou `upsertContactSnapshotFromContactEvent` lança exceção) ou manualmente via o botão "Reprocessar" do painel (que faz `attemptCount: { increment: 1 } }`). Como nenhum evento real jamais gerou exceção nesse caminho, e ninguém clicou em "Reprocessar" em produção, o contador nunca saiu de 0.

**Interpretação correta:** `attemptCount = 0` **não significa que o worker não roda** — significa que, até agora, todo evento que o worker pegou foi processado com sucesso na primeira tentativa. É evidência de que o parser (`auvo-parser.ts`) está compatível com o formato real dos payloads recebidos até aqui, não evidência de que o worker está inerte.

---

## 3. O worker/reconcile executa de verdade?

**[BANCO] Sim, e há evidência direta:** o estado atual (330 `processed`, 0 `failed`, 36 novos `received` acumulados desde a última corrida) é consistente com uma execução bem-sucedida seguida de um período sem execução — exatamente o que o contexto desta sessão relata (rodou uma vez, processou os 330 pendentes de então, 0 falhas).

**[CÓDIGO] O que o worker faz, linha a linha** (`reconcileAuvoWebhookEvents`, `prisma-repository.ts:1455`):
1. Reclama eventos travados em `processing` há mais de 5 minutos (crash recovery) — devolve para `received`.
2. Busca até `limit` (default 50) eventos `status='received'` com `nextRetryAt` nulo ou vencido, ordenados por `receivedAt asc`.
3. Para cada evento, faz um `updateMany` condicionado a `status='received'` (claim otimista — se outro worker já reclamou, `claim.count === 0` e pula). Isso é seguro para execução concorrente.
4. Despacha por tipo: `SESSION_*` → `upsertInboxItemFromSessionEvent`; `CONTACT_*` → `upsertContactSnapshotFromContactEvent`; **qualquer outro tipo (incluindo `null`) não aciona nenhuma lógica de negócio e é marcado `processed` mesmo assim** (ver seção 5).
5. Em caso de sucesso: `status='processed'`, `lastError=null`.
6. Em caso de exceção: incrementa `attemptCount`; se `>= 5`, `status='failed'` (dead-letter); senão volta para `received` com `nextRetryAt = now + min(2^attemptCount, 60) minutos` (backoff exponencial, teto de 60 min).

**Gap confirmado:** este caminho de falha/retry/dead-letter **nunca foi exercitado com dado real** — não existe nenhuma linha no banco com `attemptCount > 0` ou `status='failed'`, e não há teste automatizado (unitário ou de integração) que cubra `reconcileAuvoWebhookEvents`. Busquei explicitamente: `server/crm/prisma-repository.test.ts` só testa funções puras auxiliares (`isOutOfScopeAuvoEventType`, `isTestFixtureName`, `startOfLocalDay`, `buildCanonicalContactTitle`); `server/app.test.ts` tem um `FakeCrmDataRepository` que **não implementa** `reconcileAuvoWebhookEvents` (a interface do teste nem inclui esse método). **[CÓDIGO]** Portanto:
> O retry com backoff e o dead-letter (`status='failed'`) estão implementados corretamente por leitura de código, mas são **teoricamente corretos e empiricamente não testados** — nem por teste automatizado, nem por incidente real em produção.

---

## 4. Status possíveis

**[CÓDIGO]** `prisma/schema.prisma` (constraint em `database/migrations/0013_harden_auvo_webhook_events.sql:20-22`) define exatamente 5 estados para `auvo_webhook_events.status`:

| status | como se chega lá | reversível? |
|---|---|---|
| `received` | webhook aceito e persistido; ou reclaim de `processing` travado; ou retry após falha (< 5 tentativas); ou clique em "Reprocessar" | sim |
| `processing` | claim otimista do worker durante o processamento | sim (timeout de 5 min devolve para `received`) |
| `processed` | processado com sucesso (inclusive no-op para tipos não tratados, seção 5) | não (bloqueia "Reprocessar"/"Ignorar" na UI e API — `ApiError 409`) |
| `ignored` | tipo fora de escopo do MVP (`isOutOfScopeAuvoEventType`) — payload bruto **não é armazenado**, só `{eventType, outOfScope:true}` | sim, via "Reprocessar" |
| `failed` | `attemptCount >= 5` (dead-letter) | sim, via "Reprocessar" |

Para `auvo_inbox_items.status`, o domínio real (`src/domain/crm.ts` / `AuvoInboxPanel.tsx`) é: `novo`, `em_analise`, `aguardando_dados`, `processado`, `descartado`, `erro_integracao`.

**[BANCO]** No banco real hoje, **todos os 168 itens da Caixa de Entrada estão em `status = 'novo'`** — nenhum foi movido para `em_analise`, `processado`, `descartado` ou `erro_integracao`. Ou seja, a triagem humana real ainda não começou a operar sobre este volume (backlog intocado).

---

## 5. Duplicações

**[BANCO]** Idempotência de entrega no nível do evento:
- `dedupe_key` é `UNIQUE` no schema e a query de detecção de chaves repetidas retornou **0 linhas** — nunca houve duas linhas com o mesmo hash de payload.
- Comparando `external_event_id` (que é sempre `content.id` do payload — **nenhum payload real tem `id`/`eventId` no nível raiz**, confirmado por query estrutural: `has_top_level_id = 0` em 366 eventos não ignorados) agrupado por `(external_event_id, event_type)`: 0 duplicatas.

**[INFERÊNCIA FORTE]** Isso confirma que o mecanismo de idempotência (dedupe por hash SHA-256 do payload, `createWebhookPayloadHash`) está corretamente implementado por construção (constraint `UNIQUE` no banco + checagem `findUnique` antes do insert em `receiveAuvoWebhookEvent`), mas **nenhuma reentrega idêntica byte-a-byte foi observada nos dados reais desta janela** — logo o caminho "retorna `duplicate: true` sem criar linha nova" nunca foi de fato exercitado com tráfego real capturado. É garantidamente correto por construção (unique constraint do Postgres é a última linha de defesa mesmo que a lógica de aplicação falhe), mas não há uma duplicata real observada para confirmar empiricamente o comportamento fim-a-fim.

**[BANCO] Duplicação "de negócio" real e esperada — múltiplos eventos por sessão:** `content.id` (chave de correlação de sessão) se repete: das 144 linhas `SESSION_UPDATE` processadas, só 135 `content.id` distintos (9 sessões receberam mais de um `SESSION_UPDATE` com payload diferente cada vez — não é duplicata de entrega, é progressão real de estado). Entre os três tipos `SESSION_*` juntos, **34 `content.id` aparecem em mais de um evento processado**. Isso é o comportamento correto e esperado: `upsertInboxItemFromSessionEvent` busca por `externalServiceId` (= `content.id`) antes de criar, e se já existir só atualiza `lastEventId` — **não cria um segundo item de Caixa por evento**.

**[BANCO] Confirmação direta da regra "um item por sessão, não por evento":** 211 eventos `SESSION_*` processados (`31 NEW + 144 UPDATE + 36 COMPLETE`) resultaram em apenas **168** linhas em `auvo_inbox_items`, todas com `external_service_id` distinto (`total_rows = distinct_sessions = 168`). A regra está sendo cumprida na prática, não só na intenção.

**[BANCO] Perda de dado histórica (não é duplicação, mas é achado relevante para esta seção):** 12 eventos `SESSION_*` reais + 1 `attendance.created` foram marcados `ignored` entre `2026-07-21T12:54` e `2026-07-21T14:23`, com `raw_payload_json` substituído por `{eventType, outOfScope:true}` (por design — payload fora de escopo não é armazenado). Os primeiros eventos `SESSION_*` processados com sucesso começam às `14:29:24` do mesmo dia. **[INFERÊNCIA FORTE]** Isso indica que a lista de tipos permitidos (`isOutOfScopeAuvoEventType`) foi corrigida no meio da homologação (consistente com o comentário do teste em `auvo-parser.test.ts:16`, que cita literalmente "captura real em 2026-07-21"), e os payloads brutos desses 13 eventos iniciais são **irrecuperáveis** — não por bug atual, mas porque o design intencionalmente não guarda payload de evento fora de escopo, e na hora em que foram recebidos o código de escopo ainda classificava `SESSION_*` como fora de escopo.

---

## 6. Relação entre contato, sessão e mensagem

**[CÓDIGO + BANCO]** O modelo de dados real (a partir dos payloads capturados):

```
CONTACT_NEW / CONTACT_UPDATE
  content.id → identidade estável do contato no Auvo (auvoContactId)
  content.name / content.nameWhatsapp → nome
  content.phonenumber / content.phonenumberFormatted → telefone
  content.email

SESSION_NEW / SESSION_UPDATE / SESSION_COMPLETE
  content.id → identidade estável da SESSÃO (não do contato) — vira auvo_inbox_items.external_service_id
  content.contactId → auvoContactId do contato dono da sessão
  content.contactDetails.{name,phonenumber,phonenumberFormatted,email} → snapshot do contato NO MOMENTO da sessão
  content.channelType → ex.: "ZAPI_WHATSAPP" (canal real observado no banco)
```

Não existe, no schema nem nos tipos de evento observados no banco, nenhuma entidade "mensagem" própria — `MESSAGE_*` é explicitamente **fora de escopo** (`isOutOfScopeAuvoEventType`, prefixo bloqueado) e seu payload nunca é armazenado. **[DESCONHECIDO]** Não há como confirmar no banco atual se eventos `MESSAGE_*` já chegaram e foram descartados silenciosamente (a query de tipos ignorados só mostra `SESSION_*`/`attendance.created` no período coberto pelos 378 eventos existentes) — se algum dia chegou um `MESSAGE_*`, ele teria sido registrado como `ignored` com `raw_payload_json` vazio, então tecnicamente seria visível por `event_type`, mas **nenhuma linha com `event_type` iniciando em `MESSAGE_` foi encontrada nas 378 linhas totais** — ou seja, até onde os dados alcançam, o Auvo real desta conta **nunca disparou um evento de mensagem**, apenas contato e sessão.

**Correlação contato↔sessão implementada:** `upsertInboxItemFromSessionEvent` grava `auvoContactId` no item de Caixa a partir de `content.contactId`; depois, `upsertContactSnapshotFromContactEvent` (rodado pelo worker para eventos `CONTACT_*`) faz `findFirst({ where: { auvoContactId } })` e atualiza nome/telefone/e-mail/título do item já existente. **[BANCO]** Confirmado funcionando: 100% dos 168 itens de Caixa têm `auvo_contact_id` preenchido e 100% têm `contact_name` preenchido — mas (ver seção 7) o nome vem principalmente do próprio payload de sessão (`content.contactDetails.name`), não exclusivamente do fluxo `CONTACT_*`.

**Correlação contato↔cliente CRM (customer matching) — achado crítico não citado na missão original:**
**[BANCO]** `suggestCustomerForInboxItem` tenta casar por `auvoContactId` → `telefoneNormalizado` → `email`, nesta ordem. Nos dados reais:
- `0` de `51` clientes no CRM têm `auvo_contact_id` preenchido (o campo existe no schema, `@unique`, mas nunca foi retroalimentado para nenhum cliente existente) — então o primeiro critério de match **nunca pode ter sucesso hoje**.
- `0` dos 168 itens de Caixa têm `suggested_customer_id` preenchido — **taxa de match = 0% no backlog inteiro**.
- Não é um bug de formatação óbvio: os telefones normalizados dos dois lados têm o mesmo formato (13–14 dígitos em ambos, `55` + DDD + número), então **[HIPÓTESE]** a explicação mais provável é que os 168 contatos do Auvo capturados na homologação simplesmente ainda não correspondem a nenhum dos 51 clientes já cadastrados no CRM (fazem sentido como leads novos, que é exatamente o motivo de existir uma Caixa de triagem) — mas não há como descartar com certeza uma divergência sutil de normalização sem inspecionar valores reais, o que este relatório não faz por política de dados pessoais.
- **Consequência prática:** a UI da Caixa de Entrada (`AuvoInboxPanel.tsx:198`) mostra "Cliente sugerido: Nenhum encontrado" em 100% dos 168 itens hoje. O recurso de sugestão de cliente está tecnicamente funcional (código correto), mas **empiricamente inútil no estado atual dos dados** porque a chave de join mais forte (`auvoContactId` nos clientes) nunca foi populada.

---

## 7. Por que a Caixa mostrava nomes genéricos

**[CÓDIGO, já corrigido nesta sessão]** O bug original (relatado no contexto desta sessão) estava em `buildCanonicalContactTitle`, que produzia `"Atendimento - [nome]"` em vez do nome/telefone canônico. Já corrigido.

**[BANCO] Confirmação de que a correção pegou o backlog inteiro:** nos 168 itens de Caixa existentes hoje, `0` têm título `"Contato sem nome"`, `0` têm título "só telefone formatado" (regex de telefone formatado, `(DD) DDDDD-DDDD`), e `168/168` têm título com nome real. **O problema relatado está resolvido nos dados atuais.**

**[CÓDIGO] Onde o nome realmente vem de:** é importante registrar que o nome do título **não depende exclusivamente** do processamento assíncrono de `CONTACT_*` — `upsertInboxItemFromSessionEvent` já extrai `contactDetails.name` diretamente de dentro do próprio payload `SESSION_*` no momento da criação do item (síncrono, dentro do request do webhook). O evento `CONTACT_*` só entra depois, via worker, para **atualizar** o snapshot se o nome mudar. Isso explica por que a cobertura de nome é 100% mesmo com 20 eventos `CONTACT_*` ainda pendentes (`received`) no momento desta auditoria — a maior parte do trabalho de nomeação já acontece no caminho síncrono do webhook, não no reconcile.

**[HIPÓTESE, risco residual]** O fallback `"Contato sem nome"` continua codificado (`buildCanonicalContactTitle`, coberto por teste unitário) e será usado normalmente se um `SESSION_*` real chegar sem `contactDetails.name` nem telefone. Não há dado atual que comprove esse cenário como impossível — é só menos provável dado o padrão observado até agora.

---

## 8. Painel de Integração Auvo (`src/features/integrations/AuvoAdminPage.tsx`) — mostra saúde de verdade?

**[CÓDIGO] Não.** O painel é essencialmente uma lista crua de eventos com 4 métricas agregadas simples:
- `Webhook`: configurado/pendente (booleano).
- `Pendentes`: contagem bruta de `received + processing` (com um limiar arbitrário de alerta visual, `PENDING_COUNT_WARNING_THRESHOLD = 50`, comentado no próprio código como "provisório", "achado real de diagnóstico visual").
- `Falhas`: contagem bruta de `status='failed'`.
- `Último evento`: data do último `receivedAt`.

**O que NÃO existe no painel, apesar de a missão pedir auditoria específica destes pontos:**
- **Taxa de sucesso** (processed / total, ou processed / (processed+failed)) — não é calculada em lugar nenhum, nem no backend (`getAuvoIntegrationStatus`) nem no frontend.
- **Latência** (tempo entre `receivedAt` e `processedAt`, ou tempo médio na fila) — o campo `processedAt` existe no schema e é populado, mas nenhuma métrica de latência é computada ou exibida.
- **Visão dedicada de dead-letter**: dá para filtrar a tabela por `status=failed` no seletor genérico, mas não há uma seção específica de "eventos mortos" com `lastError` agregado, nem contagem de `attemptCount` médio/máximo.
- **`nextRetryAt`**: existe no schema e no backend, mas nunca é exibido na UI — não dá para saber, olhando o painel, quando um evento em retry vai ser tentado de novo.
- **Health check do worker em si** (última execução, se está rodando, se está atrasado) — como o worker não é um processo persistente nem tem heartbeat, isso nem poderia existir sem mudança de arquitetura (ver seção "Implementação" abaixo).

**Achado extra de comportamento (não pedido explicitamente, mas relevante):** o botão **"Reprocessar"** do painel (`handleReprocess` → `reprocessAuvoWebhookEvent`) **não reprocessa nada de fato** — ele só volta o evento para `status='received'` e incrementa `attemptCount`. Como não há cron nem endpoint HTTP de reconciliação, esse evento só será efetivamente reprocessado na próxima vez que alguém rodar `npm run auvo:events:reconcile` manualmente no terminal. Do ponto de vista de um gestor usando só a UI, clicar em "Reprocessar" **parece não fazer nada** até que um humano com acesso ao servidor rode o script.

O painel, portanto, é fiel para **auditoria manual evento-a-evento com payload sanitizado** (isso funciona bem e é seguro — o payload exibido já passa por `sanitizeWebhookPayload`), mas **não é um dashboard de saúde operacional**.

---

## 9. Caixa Auvo (`CaixaAuvoPage.tsx` / `AuvoInboxPanel.tsx`) — já é split-view com match confidence?

**[CÓDIGO] Não, em nenhum dos dois aspectos.**

- **Layout:** é uma lista vertical única (`<ul className="auvo-inbox-list">`), um `<li>` por item, com o formulário de ação abrindo **inline, expandindo o próprio item** (`isOpen && mode ? <form>...`) — não há painel de detalhe separado, nem duas colunas (lista + detalhe), nem preview lado a lado. `CaixaAuvoPage.tsx` só busca a lista de clientes e delega tudo para `AuvoInboxPanel`, que é 100% lista simples com filtros por status em botões no cabeçalho.
- **Match confidence:** o componente mostra **apenas um booleano binário** — "Cliente sugerido: {nome}" ou "Cliente sugerido: Nenhum encontrado" (`AuvoInboxPanel.tsx:198`). Não existe pontuação de confiança, não existe indicação de qual critério casou (telefone? e-mail? auvoContactId?), e o backend (`suggestCustomerForInboxItem`) também não calcula nem retorna um score — é a primeira correspondência exata que encontrar, sem ranqueamento. E como mostrado na seção 6, essa sugestão está retornando vazio em 100% dos 168 itens reais hoje, então na prática esse trecho da UI está sempre mostrando "Nenhum encontrado".

O painel tem, por outro lado, um cuidado real de UX documentado no próprio código (comentário na linha 47-50) sobre hierarquizar ações primárias vs. secundárias vs. descarte — isso é uma melhoria real já feita, só não é "split-view com match confidence".

---

## 10. Auditoria/log de correlação existe?

**[CÓDIGO] Parcialmente, e de forma implícita, não como uma trilha de auditoria dedicada.**

- Existe `lastEventId` em `auvo_inbox_items`, que aponta para o último `auvo_webhook_events.id` que tocou aquele item — isso dá rastreabilidade de "qual foi o último evento que atualizou este item", mas **não** um histórico de todos os eventos que já contribuíram para aquele item (é sobrescrito a cada novo evento, não um log append-only).
- `auvo_webhook_events` em si é, na prática, o log bruto de tudo que chegou (com `receivedAt`, `processedAt`, `lastError`, `attemptCount`), e cada linha é imutável exceto pelos campos de status/tentativa — isso funciona como log de auditoria do lado da ingestão.
- Não há uma tabela ou visão que junte "este item de Caixa foi formado a partir destes N eventos" de forma explícita e consultável — teria que ser reconstruído fazendo `auvo_webhook_events` filtrado por `content.id = external_service_id`, o que funciona (foi exatamente o que este relatório fez para a seção 5) mas não está exposto como funcionalidade de produto/API.
- Não há log de auditoria (`crm.audit_log`, que existe no schema para outras entidades) integrado com os eventos Auvo — `AuvoWebhookEvent`/`AuvoInboxItem` não aparecem no modelo `AuditLog` do schema.

**Resumo:** dá para reconstruir a correlação evento→item manualmente via query, mas não existe uma feature de auditoria de correlação pronta para uso por um gestor não-técnico.

---

## 11. Como o E2E entra no fluxo

**[CÓDIGO]** Dois mecanismos completamente distintos, e é importante não confundir os dois:

1. **`e2e/auvo-inbox.spec.ts`** — o único teste Playwright que toca a Caixa Auvo. Ele **não envia nenhum webhook real nem cria nenhum `auvo_inbox_item`**: só faz login como gestor de homologação, navega até `/caixa-auvo` e verifica que o painel renderiza com os botões de filtro de status visíveis ("Novo", "Processado", "Descartado"). **Não há cobertura E2E do fluxo de resolução de um item real, nem de recebimento de webhook.**

2. **`isTestFixtureName`** (`prisma-repository.ts:2361`) — mecanismo de isolamento de dados de teste que marca `Customer`/`Opportunity` como `isTestFixture=true` quando o nome bate com `/^e2e\s/i` ou contém `/homolog/i` (usado por `e2e/customer-and-opportunity.spec.ts`). Esse campo `isTestFixture` **existe em `Customer` e `Opportunity`, mas não existe em `AuvoInboxItem`** (confirmado no schema, seção `model AuvoInboxItem` não tem essa coluna). **[BANCO/INFERÊNCIA FORTE]** Isso significa que, se um evento `SESSION_*` chegar durante uma janela de homologação/teste (por exemplo, os `syntheticEvents=4` com `raw_payload_json->>'homologation'='true'` detectados pelo script de status), ele **cria um `auvo_inbox_item` real, indistinguível de um item de produção**, e aparece normalmente na Caixa de Entrada e no contador `auvoInboxPendingCount` da Central Comercial (`getCommercialCenter`, linha 778 de `prisma-repository.ts`) — não há filtro de `isTestFixture` nessa contagem porque a coluna não existe nessa tabela. **Isso é um gap real não citado explicitamente na missão original.**

---

## 12. Zod por tipo/versão — existe?

**[CÓDIGO] Não, e vale registrar mesmo sem ter sido perguntado explicitamente, porque é uma das regras obrigatórias do prompt.**

- `server/crm/validation.ts` usa Zod extensivamente para validar **corpo/query dos endpoints HTTP internos** (`auvoWebhookEventQuerySchema`, `resolveAuvoInboxItemSchema` como `z.discriminatedUnion("action", ...)`) — isso é sólido e bem feito.
- **O payload bruto recebido do Auvo em si nunca passa por um schema Zod.** `auvo-parser.ts` (`parseAuvoContactPayload`, `parseAuvoSessionPayload`) faz narrowing manual com `isRecord`/`typeof` — funcional e testado (`auvo-parser.test.ts`), mas não é um schema versionado por `eventType`. O campo `schemaVersion` existe na tabela `auvo_webhook_events` (sempre gravado como `1`) mas **não há nenhum branch de código que leia esse valor para escolher um parser diferente** — é um campo presente no schema mas não usado ainda como versionamento real.
- **Consequência prática:** se o Auvo mudar o formato de `CONTACT_*`/`SESSION_*` amanhã (renomear `phonenumberFormatted`, por exemplo), o parser vai silenciosamente retornar `null` em vez de falhar de forma auditável e tipada — o item de Caixa correspondente simplesmente não seria criado, sem erro visível no painel (porque `upsertInboxItemFromSessionEvent` retorna cedo se `parseAuvoSessionPayload` for `null`, sem lançar exceção, então o evento vira `processed` normalmente).

---

## Resumo executivo (achados por severidade)

| # | Achado | Classificação | Severidade |
|---|---|---|---|
| 1 | Worker de reconcile não tem nenhum gatilho automático (sem cron/scheduler/endpoint) — depende 100% de execução manual via terminal | CÓDIGO | **Alta** |
| 2 | Botão "Reprocessar" da UI não reprocessa de fato — só reenfileira; sem o worker manual, parece não fazer nada | CÓDIGO | **Alta** |
| 3 | 0% de match de cliente sugerido no backlog real (168/168) porque nenhum cliente tem `auvo_contact_id` preenchido | BANCO | **Alta** |
| 4 | Retry/backoff/dead-letter nunca foi exercitado com falha real nem coberto por teste automatizado | CÓDIGO + BANCO (ausência) | **Média** |
| 5 | Eventos com `event_type` fora de `CONTACT_*`/`SESSION_*` (ex.: `null`, `attendance.created`) são marcados `processed` sem nenhum processamento real (no-op silencioso) | BANCO | **Média** |
| 6 | Painel Auvo Admin não calcula taxa de sucesso, latência nem visão dedicada de dead-letter | CÓDIGO | **Média** |
| 7 | Caixa Auvo é lista simples, não split-view; "match confidence" é só um booleano sem score | CÓDIGO | **Média** |
| 8 | `AuvoInboxItem` não tem `isTestFixture` — eventos de homologação podem poluir a Caixa/Central real sem filtro | CÓDIGO + BANCO | **Média** |
| 9 | Payload bruto do Auvo nunca passa por schema Zod versionado; `schemaVersion` gravado mas não usado para dispatch | CÓDIGO | **Baixa/Média** |
| 10 | 13 payloads reais de `SESSION_*`/`attendance.created` de 2026-07-21 foram descartados (não armazenados) por classificação de escopo desatualizada na época — irrecuperáveis por design | BANCO | **Baixa** (histórico, não recorrente) |
| 11 | Nomes genéricos na Caixa — **já corrigido**, 168/168 itens atuais têm nome real | BANCO | **Resolvido** |
| 12 | Correlação sessão→item de Caixa (1 item por sessão, não por evento) — **funciona corretamente**, confirmado com 211 eventos → 168 itens | BANCO | **Confirmado OK** |
| 13 | Idempotência por hash de payload — **correta por construção** (unique constraint), sem reentrega real observada para validar empiricamente | CÓDIGO + BANCO (ausência) | **Confirmado por código, não por incidente real** |

---

## Recomendações para a próxima etapa de implementação (sem código ainda — apenas o plano exigido)

Antes de qualquer edição, conforme regra da missão:

1. **Catalogar payloads**: os únicos `eventType` reais observados no banco de produção/homologação até hoje são `CONTACT_NEW`, `CONTACT_UPDATE`, `SESSION_NEW`, `SESSION_UPDATE`, `SESSION_COMPLETE` e o legado `attendance.created` (1 ocorrência, ignorado). Nenhum `MESSAGE_*`/`PAYMENT_*`/`CARD_*`/`PANEL_*`/`TEMPLATE_*` foi observado nas 378 linhas existentes — o bloqueio desses prefixos é preventivo, não reativo a um incidente real.
2. **Fixtures anonimizadas**: `server/crm/auvo-fixtures.ts` + `npm run auvo:fixtures:export` já implementam exatamente isso (redação por padrão de chave: PII, telefone, e-mail, documento, nome, endereço, texto livre) — reaproveitar esse pipeline para gerar fixtures de teste do worker de reconcile, que hoje não tem nenhuma.
3. **Testes de contrato antes de mexer**: prioridade máxima é um teste para `reconcileAuvoWebhookEvents` cobrindo claim otimista, backoff exponencial e transição para `failed` em 5 tentativas — isso não existe hoje e é a maior lacuna de risco técnico.
4. **Migration nova**: não é necessária para os campos já usados (attempt/retry/dead-letter já existem desde a migration 0013). Seria necessária apenas se a correção do achado #8 (adicionar `isTestFixture` a `AuvoInboxItem`) ou de agendamento automático (se exigir alguma tabela de controle de execução do worker) for implementada.
5. **Backfill dry-run**: o backfill mais claramente necessário é popular `Customer.auvoContactId` para os 51 clientes existentes a partir de correspondência de telefone com os 168 itens de Caixa — isso desbloquearia o match automático (achado #3). Um dry-run deveria reportar, sem gravar nada, quantos clientes teriam `auvoContactId` preenchido por correspondência de telefone exata antes de aplicar.

---

## Nota sobre o pedido de auditoria "por que existem 328 pendentes"

Registrado explicitamente porque a missão pediu essa explicação por nome: o número **328** não bate exatamente com o **330** processados relatados no contexto desta sessão nem com os **36** pendentes atuais — é provável que 328 tenha sido o número observado em um instante intermediário entre a implementação do worker e a primeira execução completa, ou um arredondamento/typo da missão original. **[DESCONHECIDO]** Não há como reconstruir retroativamente o valor exato 328 a partir do estado atual do banco (o histórico de contagem não é logado ponto-a-ponto); o que se pode confirmar com certeza é a causa raiz (ausência de worker até esta sessão) e o comportamento atual (acúmulo de 36 desde a última execução manual), o que já responde à pergunta de fundo.
