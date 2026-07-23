# Auditoria de QA — sessão de timezone / CHECK constraints / worker Auvo / isolamento E2E

Data: 2026-07-23
Branch: `refactor/frontend-design-system` (git status limpo quanto a arquivos versionados; apenas untracked docs/*.json de design tokens e pastas `docs/audits`, `docs/REFATORACAO-*` não relacionados a esta sessão)
Escopo: mudanças descritas pelo solicitante — timezone (`startOfLocalDay`), migration 0019 (CHECK constraints), worker `reconcileAuvoWebhookEvents`, isolamento E2E via header `x-crm-include-test-fixtures` — mais auditoria das lacunas antigas listadas no charter.

Todas as verificações abaixo foram re-executadas nesta sessão, com números reais coletados agora (não herdados). Constraints de banco foram reconfirmadas de forma independente, com transação real e `ROLLBACK` explícito (nunca `COMMIT`). Nenhum dado foi alterado, nenhuma credencial foi escrita neste documento, nenhum arquivo de produção foi editado, nenhum commit foi feito. Um diretório `.qa-audit-tmp` foi usado temporariamente dentro do projeto (necessário para resolução de `node_modules` pelo `tsx`) e removido ao final — `git status` confirma que não sobrou rastro.

## 1. Resultado da suíte, agora

| Suíte | Resultado | Observação |
|---|---|---|
| `prisma validate` | OK | schema válido |
| `db:migrate:status` | 19/19 aplicadas (0001–0019) | reconfirmado contra o banco real agora |
| `npm run typecheck` | limpo | `prisma generate` + 3 `tsc --noEmit` sem erro |
| `npm run test` (vitest) | **85/85 passando**, 8 arquivos | 5.11s |
| `npx playwright test` | **36/36 passando** | 3.8 min, 1 worker, inclui 12 auditorias axe-core (WCAG 2.1 A/AA) e 7 viewports de responsividade |

Números idênticos aos "já confirmados" informados — reconfirmo, não apenas herdo.

**Achado novo nesta verificação (fora do que foi pedido, mas descoberto ao rodar a suíte):** as 12 auditorias `axe-core` do Playwright, e portanto os "0 violações WCAG", **só cobrem o esquema de cores padrão do Chromium headless** (light — nenhum spec ou `playwright.config.ts` define `colorScheme`). Rodei a mesma auditoria axe-core manualmente com `colorScheme: "dark"` nas mesmas 4 páginas autenticadas (Central Comercial, Funil, Relatórios, Clientes) e obtive:

- Central Comercial: 1 violação `serious` (`color-contrast`, 21 nós)
- Funil: 2 violações `serious` (`color-contrast`, 14 nós; `scrollable-region-focusable`, 1 nó — `.pipeline-board`)
- Relatórios: 1 violação `serious` (`color-contrast`, 14 nós)
- Clientes: 1 violação `serious` (`color-contrast`, 14 nós)

Nós afetados são consistentes entre páginas: o cabeçalho da marca (`.brand-row strong/span`) e os itens de navegação da sidebar (`.nav-section-label`, links `a[href$=...]`) — o axe reporta contraste de 1.28–1.69:1 contra fundo `#ffffff` (esperado 4.5:1), o que é estranho porque a sidebar renderiza visivelmente escura nos screenshots (ver seção 4). Isso sugere que o `background-color` real do container não está sendo herdado corretamente por essa árvore de nós no modo escuro (possível regra CSS que não recebeu tratamento de dark mode, ou um caso onde o axe não consegue resolver o fundo efetivo por causa de posicionamento/stacking) — não determinei a causa raiz porque isso é código de produção e eu não devo alterá-lo nesta auditoria, mas o fato é reproduzível e documentado. Isto é uma lacuna real do gate "light/dark" do charter: a suíte existente não teria pego essa regressão porque nunca testa dark mode.

## 2. Matriz requisito → teste (mudanças desta sessão)

| Requisito | Teste que cobre | Nível | Veredito |
|---|---|---|---|
| `startOfLocalDay` classifica corretamente a fronteira do dia em America/Sao_Paulo (23:30 SP = dia anterior em UTC+1) | `server/crm/prisma-repository.test.ts` › `describe("startOfLocalDay...")`, 3 casos (antes da meia-noite, depois da meia-noite, exatamente na fronteira) | unit | **Suficiente para a função pura** |
| `listNextActions` usa `startOfLocalDay` para `today`/`overdue`/`future` | Nenhum teste de integração direto; só a cobertura indireta de `startOfLocalDay` isolada | unit apenas na função pura | **Parcial** — a integração (query Prisma usando `startOfToday`/`startOfTomorrow`) não é exercida por teste algum, nem fake nem real |
| `getCommercialReport` usa `toDateOnly`/`toEndOfDateOnly` (também dependentes do offset fixo) | Nenhum teste direto para `toDateOnly`/`toEndOfDateOnly` | nenhum | **Lacuna** — funções não testadas isoladamente, só a função irmã `startOfLocalDay` foi testada |
| **(achado novo)** `listNextActions.dateFrom/dateTo` e `getCommercialCenter.from/to` usam `new Date(string)` bruto, **não** passam por `startOfLocalDay`/`toDateOnly` | nenhum | nenhum | **Regressão de escopo — ver seção 3.1** |
| CHECK `oportunidades_tipo_demanda_check` bloqueia valor fora do vocabulário | Nenhum teste automatizado; reconfirmado agora manualmente com transação real + rollback (não commitada) | verificação manual (repetida nesta sessão) | **Real, mas sem teste de regressão automatizado** |
| CHECK `oportunidades_perdida_exige_motivo_check` bloqueia `status='perdida'` sem `motivo_perda_id` | Idem acima — reconfirmado manualmente agora | verificação manual (repetida nesta sessão) | **Real, mas sem teste de regressão automatizado** |
| Vocabulário de `tipoDemanda` na aplicação bate com o CHECK do banco | `server/crm/validation.test.ts` (2 testes, aceita as 6 categorias reais, rejeita fora do vocabulário) | unit | **Suficiente na camada de aplicação** — mas é a única linha de defesa testada; o CHECK é defesa-em-profundidade não testada |
| `loseOpportunity` exige `motivoPerdaId` | `server/crm/validation.test.ts` › `loseOpportunitySchema`; `server/app.test.ts` (rota `/api/opportunities/:id/lose`) | unit + rota (fake repo) | **Suficiente na camada de aplicação** |
| `reconcileAuvoWebhookEvents` (claim, retry com backoff exponencial, dead-letter em `MAX_ATTEMPTS=5`, reclaim de eventos travados em `processing`) | **Nenhum teste, de nenhum nível** | nenhum | **Lacuna real — ver seção 3.3** |
| Isolamento de fixtures E2E via header `x-crm-include-test-fixtures` | **Nenhum teste** verifica que o header é opt-in corretamente, nem que dados são ocultos por padrão, nem o comportamento do header nas 3 rotas que o consomem | nenhum | **Lacuna real — ver seção 3.4** |

## 3. Avaliação dos 4 pontos pedidos

### 3.1 Timezone — correção real, mas **incompleta**

A lógica de `startOfLocalDay` está correta: offset fixo UTC-3 via getters UTC, independente do fuso do processo Node, com comentário explicando a base legal (Brasil não observa horário de verão desde 2019). Os 3 testes novos cobrem exatamente a fronteira que causava o bug original (23:30 SP vs UTC), incluindo o caso de idempotência exata na fronteira. Para a função pura, a cobertura é suficiente.

**Porém, ao ler o restante do arquivo, encontrei que a correção não foi aplicada de forma consistente em todos os pontos de entrada de data que o próprio bug afeta:**

- `listNextActions` (linha ~700-707 de `server/crm/prisma-repository.ts`): os filtros `dateFrom`/`dateTo` (vindos da query string de `/api/next-actions`, sem validação Zod) usam `new Date(filters.dateFrom)` diretamente — não passam por `startOfLocalDay`/`toDateOnly`. Atualmente não há UI que envie esses parâmetros (busquei em `src/` e não encontrei uso), então o risco é hoje apenas de API, não de usuário final.
- `getCommercialCenter` (linha ~719-720): os filtros `from`/`to` também usam `new Date(filters.from)`/`new Date(filters.to)` brutos — **e este caminho É alcançável pela UI**: `src/features/commercial-center/CentralComercialPage.tsx` linhas 117-118 têm `<input type="date">` ligados a `filters.from`/`filters.to`, que vão direto para `/api/commercial-center?from=...&to=...`. Um `<input type="date">` produz uma string `YYYY-MM-DD`; `new Date("2026-07-22")` é interpretado como meia-noite UTC, ou seja, 21:00 do dia 21/07 em horário de São Paulo — exatamente a classe de bug que esta sessão corrigiu em outros três lugares, mas não neste.
- Em contraste, `getCommercialReport` (usado pela página de Relatórios) **foi** corrigido corretamente, usando `toDateOnly`/`toEndOfDateOnly`.

**Veredito: a correção de timezone é real e bem testada onde foi aplicada, mas está incompleta — há uma regressão viva e alcançável por um usuário real (gestor filtrando por data na Central Comercial) da mesma classe de bug que a sessão se propôs a corrigir.** Isso não é uma lacuna de teste, é uma lacuna de escopo da correção.

### 3.2 CHECK constraints (migration 0019) — proteção real, sem teste de regressão automatizado

Reconfirmei agora, de forma independente (não apenas aceitando o relato da sessão), com um script `pg` fora de qualquer teste do projeto, rodando em transações reais com `BEGIN`/`ROLLBACK` (nunca `COMMIT`) contra uma oportunidade real existente:

- `UPDATE ... SET tipo_demanda = 'valor_invalido_teste_qa'` → rejeitado, `code: 23514`, `constraint: oportunidades_tipo_demanda_check`.
- `UPDATE ... SET status = 'perdida', motivo_perda_id = NULL` → rejeitado, `code: 23514`, `constraint: oportunidades_perdida_exige_motivo_check`.
- Controle negativo: `UPDATE ... SET tipo_demanda = 'higienizacao'` (valor válido) → aceito sem erro.
- Leitura pós-rollback confirmou que a linha voltou exatamente ao estado original (`tipo_demanda: 'instalacao', status: 'ativa', motivo_perda_id: null`).

Os dois CHECKs funcionam. A camada de aplicação (Zod + `assertActiveLossReason`) já impede esses estados antes de chegar ao banco, então o CHECK é defesa-em-profundidade, não a única barreira — isso reduz a urgência de testá-lo automatizado.

**Mas "sem teste automatizado" é uma lacuna real, não cosmética**: o projeto não tem infraestrutura de banco de teste (schema efêmero, container, etc.) para nenhuma migration — só o `FakeCrmRepository` em memória para testes de rota. Isso significa que **nenhuma migration futura tem uma rede de segurança automatizada**; um `DROP CONSTRAINT` acidental numa migration futura, ou uma migration que recria a tabela sem essas constraints, só seria pega por verificação manual repetida (como a que fiz agora), que depende de alguém lembrar de fazer isso.

**Veredito: lacuna real, severidade moderada** (mitigada pela defesa em camada de aplicação, mas não eliminada — é exatamente o tipo de coisa que costuma ser descoberta tarde, quando um bypass da aplicação já aconteceu).

### 3.3 Worker `reconcileAuvoWebhookEvents` — lacuna real, severidade **alta**

Esta é a lacuna mais preocupante das quatro. A lógica (linhas 1455-1528 de `server/crm/prisma-repository.ts`) tem:

- Reclaim de eventos travados em `processing` há mais de 5 minutos (worker anterior morto).
- Claim otimista via `updateMany({ where: { id, status: "received" } })` — se `count === 0`, outro worker já pegou o evento primeiro. Isso é seguro contra dois workers concorrentes, mas essa garantia nunca foi exercida em teste algum, nem sequer com dois processos simulados.
- Retry com backoff exponencial (`2^attemptCount` minutos, capado em 60) até `MAX_ATTEMPTS = 5`, depois `status = "failed"` (dead-letter).
- Chamada de `upsertInboxItemFromSessionEvent` / `upsertContactSnapshotFromContactEvent` dentro do `try`, com efeitos colaterais reais no banco.

**Não há teste de nenhum nível**: não está na interface `CrmDataRepository` exposta às rotas (não há rota HTTP para ele, é chamado só pelo script CLI `server/auvo-events-reconcile.ts`, presumivelm, por um cron/scheduled job direto contra produção), então nem o `FakeCrmRepository` o implementa, e `app.test.ts` nunca o menciona. Não há teste de: cálculo de backoff, transição para `failed` no 5º attempt, comportamento do reclaim de eventos travados, nem da lógica de claim concorrente.

Além disso, **encontrei um problema adjacente relacionado a idempotência que não estava na lista de pontos a avaliar, mas é diretamente relevante ao caso obrigatório "webhook duplicado" e ao worker**: `receiveAuvoWebhookEvent` (linha 1154-1189) faz `findUnique({ where: { dedupeKey } })` e, se não encontrar, faz `create(...)` — essas duas operações não são atômicas. Existe uma janela real (TOCTOU) em que duas entregas verdadeiramente concorrentes do mesmo webhook (comum em retries de provedores de webhook) podem ambas passar pelo `findUnique` antes que qualquer uma tenha feito o `create`, resultando em uma delas disparando a constraint `UNIQUE` em `dedupe_key` (confirmada em `database/migrations/0005_create_notifications_and_internal_auvo.sql:24`) **sem tratamento** — não há `catch` para `P2002` nesse método (só existe tratamento de `P2002` em outro lugar do arquivo, para nome de etapa de pipeline duplicado). Isso resultaria num 500 não tratado devolvido ao Auvo em vez do `duplicate: true` esperado.

O teste existente para "webhook duplicado" (`server/app.test.ts:940`) só passa por **duas chamadas sequenciais** contra o `FakeCrmRepository` (um array em memória com `.find()` — nem chega a exercitar Postgres, muito menos concorrência real). Ele prova que o *contrato HTTP* funciona para duplicatas sequenciais, mas não prova nada sobre a race condition real na implementação Prisma.

**Veredito: lacuna real e severidade alta.** É lógica de negócio não-trivial (5+ ramos), roda desacompanhada contra produção real, e tem pelo menos um bug de concorrência latente e não testado adjacente a ela (TOCTOU no dedupe do webhook). Recomendo, no mínimo: (a) extrair o cálculo de backoff/decisão de dead-letter para uma função pura testável isoladamente (nos moldes de `startOfLocalDay`), e (b) envolver `receiveAuvoWebhookEvent` num `catch` para `P2002` que trate como duplicata, com um teste de regressão para isso.

### 3.4 Isolamento E2E via header `x-crm-include-test-fixtures` — risco real, mas **contido**

Confirmei em código (`server/crm/routes.ts:410-412`): `wantsTestFixtures` só checa `request.headers["x-crm-include-test-fixtures"] === "true"` — sem allowlist de origem, sem gate de ambiente (`NODE_ENV`), sem verificação de que a requisição veio do Playwright. **O relato da sessão está correto: qualquer requisição autenticada real pode enviar esse header e ver fixtures.**

Meu próprio script de captura de screenshot (seção 4) confirma isso empiricamente: autenticado como o usuário de homologação e enviando o header, a Central Comercial mostra ações de "Cliente Homologacao Marco 4" misturadas com o que pareceriam ser dados operacionais reais — exatamente o cenário que a migration 0017 foi criada para evitar na visão padrão.

Isso dito, o raio de alcance é menor do que o pior caso, porque **nem todas as rotas usam esse header**:
- `listCustomers`, `listOpportunities` e `globalSearch` (rotas `/api/customers`, `/api/opportunities`, `/api/search`) **respeitam** o header.
- `getCommercialCenter` e `getCommercialReport` (Central Comercial e Relatórios) **ignoram completamente o header** e sempre filtram `isTestFixture: false` de forma hardcoded (linhas 735, 764, 774, 848 de `prisma-repository.ts`) — ou seja, os dois lugares onde números agregados/decisões de negócio são tomados **não podem** ser poluídos por esse header, mesmo que alguém o envie.

Dado que é uma ferramenta interna, não multi-tenant, e todo acesso já exige autenticação válida (`guards.authenticate` roda antes de `wantsTestFixtures`), **não é uma falha de segurança de dados entre organizações** — é, na pior hipótese, um usuário interno autenticado enganando a si mesmo (ou a outro colega, se compartilhar instruções/curl) ao ver clientes e oportunidades de teste nas listas de Clientes/Oportunidades/Busca.

**Cobertura de teste: zero.** Não há teste, em nenhum nível, que confirme (a) que fixtures ficam ocultas por padrão, (b) que o header revela fixtures nas 3 rotas que o suportam, nem (c) que Central Comercial/Relatórios são imunes ao header. Isso é notável porque é precisamente o mecanismo que os próprios specs Playwright dependem para enxergar seus dados — um erro de digitação no nome do header, ou uma rota nova que esqueça de aplicar o filtro, não seria pego por nada.

**Veredito: risco de produto real porém baixo (não é falha de segurança dado o contexto interno/autenticado), risco de regressão de teste alto (mecanismo crítico para a validade de todo o resto da suíte E2E, e zero coberto).**

## 4. Evidência visual (screenshots)

Capturei evidência visual própria nesta sessão (login programático via o mesmo mecanismo de `e2e/support/auth.ts`, usando as credenciais de homologação já configuradas em `.env` do próprio projeto — nenhuma credencial nova foi solicitada, digitada manualmente ou exposta neste documento) em 4 combinações de viewport × esquema de cor (desktop 1440×900 e mobile 390×844, light e dark) × 3 páginas (Central Comercial, Funil, Relatórios) — 12 imagens no total.

As imagens ficaram no diretório de scratchpad da sessão (não foram commitadas nem copiadas para o repositório, porque a tela autenticada expõe o e-mail da conta de homologação, e por padrão screenshots com dado logado não devem ser gravados em um artefato versionável sem decisão explícita de quem revisa):
`C:\Users\ARTECC~1\AppData\Local\Temp\claude\C--Users-Artec-Climatizados-Desktop-artec-crm\d504aba0-9692-4a46-bb6a-b2c1dfad023a\scratchpad\screenshots\`

Observações da inspeção visual:
- **Desktop light/dark, Central Comercial**: renderização correta em ambos os modos, sem quebra de layout visível, contraste aparentemente bom a olho nu (o que reforça a suspeita de que a violação `axe-core` reportada na seção 1 é sobre um valor de fundo computado que diverge do que é visualmente renderizado — merece investigação de causa raiz por quem tem contexto do CSS, não incluída aqui pois seria alteração de código de produção).
- Os cartões de "Ações vencidas"/"Ações de hoje" na Central Comercial, com o header de fixtures ligado, mostram literalmente `Cliente Homologacao Marco 4` e `Cliente Homologacao Marco 3` junto a dados que pareceriam operacionais reais — evidência direta do ponto 3.4.
- Mobile 390×844 (light/dark) e desktop nas 3 páginas: sem overflow horizontal visível, consistente com os 7 viewports que passam no Playwright.

Não gerei screenshot com o header de fixtures desligado para efeito de comparação lado a lado nesta rodada; recomendo isso como parte do teste automatizado a ser escrito para o item 3.4.

## 5. Estado real dos dados no banco (achado não solicitado, mas relevante)

Ao investigar o isolamento de fixtures, contei as linhas marcadas `is_test_fixture` no banco real agora:

- `crm.clientes`: **52 de 52** linhas são fixture (100%).
- `crm.oportunidades`: **42 de 42** linhas são fixture (100%).

Isso é uma escalada em relação ao que a própria migration 0017 registrou como motivação ("36/47 clientes e 33/37 oportunidades... sem teardown"): **hoje não existe nenhum registro real (não-fixture) no banco.** Duas leituras possíveis, que não consigo distinguir com a informação disponível:
(a) este ambiente é, na prática, só um banco de homologação/desenvolvimento compartilhado, sem dados de cliente real ainda — o que tornaria o problema cosmético; ou
(b) dados reais existiram e foram removidos/migrados em algum momento, e a suíte E2E (que roda `e2e/customer-and-opportunity.spec.ts` **sem teardown**, confirmado no comentário da própria migration 0017) continua acrescentando linhas fixture a cada execução — a minha própria rodada de `npx playwright test` nesta sessão também deve ter acrescentado pelo menos 1 cliente + 1 oportunidade fixture, dado que esse spec passou.

De qualquer forma, **o padrão "specs criam dados reais em produção sem teardown, mascarados por uma flag booleana visível apenas mediante header" é uma fonte contínua de crescimento não controlado da base**, e reforça a severidade do item 3.4: se um dia existirem dados reais de novo, a mesma ausência de teardown vai continuar acrescentando fixtures ao lado deles, e o único controle de visibilidade é o header sem allowlist.

## 6. Lacunas antigas ainda não fechadas (auditadas nesta sessão)

| Lacuna | Confirmação | Severidade |
|---|---|---|
| Retry/dead-letter Auvo sem teste | Confirmado — ver 3.3. Zero teste em qualquer nível; método nem está na interface testável por `FakeCrmRepository`. | **Alta** |
| Kanban drag-and-drop sem teste E2E dedicado | Confirmado — `grep` em `e2e/` por "drag" não encontra nada. O único teste que toca a página do Funil é a auditoria WCAG (`accessibility.spec.ts:70`), que não interage com drag nem com o `<select>` de fallback acessível. Pior: o `handleMoveStage` em `src/features/pipeline/PipelinePage.tsx:36-67` implementa corretamente atualização otimista **com rollback em caso de falha** (padrão correto, li o código) — mas nem o caminho feliz nem o caminho de rollback têm qualquer teste automatizado. É lógica correta e não-trivial, roteada, sem rede de segurança. | **Alta** |
| Notificação dedupe sem teste direto | Confirmado — `upsertOpenNotification`/`reconcileNotifications` (linhas 1037-1152) não são chamados por nenhum teste real; a única menção em `app.test.ts` é a implementação do `FakeCrmRepository` para satisfazer a interface, não um teste do comportamento de dedupe (chamar reconcile duas vezes e confirmar que não duplica, ou que uma notificação resolvida some quando a condição não é mais verdadeira). | **Média** |
| Relatórios sem drill-down | Confirmado — não é lacuna de teste, é ausência total da funcionalidade. `src/components/ReportsPanel.tsx` não tem nenhum link/botão que leve das métricas agregadas para a lista de oportunidades/clientes subjacente (busquei por `Link`, `onClick`, `navigate`, `href` — o único `onClick` é o botão "Aplicar filtros"). Isto é lacuna de produto, não de QA. | **Baixa (produto, não QA)** |

## 7. Gates do charter — checklist

| Gate | Status |
|---|---|
| Estado Git conhecido | OK — branch limpa quanto a arquivos versionados; untracked são artefatos de design tokens/docs de outra frente, não desta sessão |
| Migrations aplicadas | OK — 19/19 reconfirmadas agora contra o banco real |
| E2E isolado | **Parcial** — isolamento existe (migration 0017) mas sem teste de regressão, sem teardown, e 100% dos dados atuais são fixture (seção 5) |
| Auvo idempotente | **Parcial** — dedupe por hash funciona no caminho feliz (testado), mas tem TOCTOU não tratado sob concorrência real (não testado, ver 3.3) |
| Dados normalizados | OK — `tipoDemanda`/`motivoPerda` com vocabulário fechado testado em aplicação e banco; telefone normalizado com testes próprios (`validation.test.ts`) |
| Screenshots | OK nesta auditoria — 12 capturadas (desktop/mobile × light/dark × 3 páginas), ver seção 4; **não existiam antes desta sessão de auditoria** (a suíte Playwright só tira screenshot em falha) |
| Visual desktop/mobile | OK — 7 viewports sem overflow (Playwright) + inspeção visual manual em 2 dos 7 |
| Light/dark | **Reprovado** — 4 violações `axe-core serious` de contraste + 1 de foco em teclado encontradas ao testar dark mode manualmente; suíte automatizada nunca testa dark mode |
| Typecheck | OK — limpo |
| Unit/integration/E2E | OK numericamente (85 + 36 = 121/121), mas com lacunas de cobertura de cenário documentadas nas seções 3 e 6 |
| A11y | **Parcial** — 12/12 auditorias passam, mas só em light mode; dark mode reprovado (ver acima) |
| Performance | Não avaliado nesta sessão — fora do escopo do que foi pedido e não há gate de performance automatizado no projeto (sem Lighthouse CI, sem budget de bundle) |
| Nenhuma credencial | OK neste documento — nenhuma senha, chave ou string de conexão foi escrita aqui; usei `.env` do próprio projeto apenas em memória de processo para os scripts temporários, todos removidos |

## 8. Veredito

**BLOQUEADO.**

Não é "reprovado" porque a suíte automatizada existente passa integralmente (121/121) e as duas mudanças centrais desta sessão (offset de timezone e CHECK constraints) estão corretas onde foram aplicadas. Não é "aprovado" porque:

1. **A correção de timezone tem uma regressão viva e alcançável por usuário real** na Central Comercial (`from`/`to` sem `toDateOnly`) — mesma classe de bug que a sessão se propôs a resolver, não resolvida em todos os pontos de entrada.
2. **Dark mode reprova auditoria WCAG automatizada** (4 violações `serious`) assim que testado — gate explícito do charter, nunca verificado pela suíte existente.
3. **O worker Auvo de retry/dead-letter roda sem qualquer teste contra produção real**, com um bug de concorrência (TOCTOU no dedupe de webhook) identificado e não tratado.
4. **Dois casos obrigatórios do charter — kanban move+rollback e notificação dedupe — têm lógica correta e não-trivial já implementada, mas zero cobertura de teste**, tornando qualquer refatoração futura arriscada sem que ninguém perceba até produção.

Nenhum desses quatro pontos é cosmético; todos são alcançáveis por um usuário real ou por uma migration/deploy futuro, e nenhum tem uma rede de segurança automatizada hoje. Recomendo tratá-los antes de promover esta sessão para produção, na ordem: (1) fechar o buraco de timezone em `getCommercialCenter`, (2) decidir e corrigir o contraste em dark mode ou formalmente excluir dark mode do escopo suportado até ser corrigido, (3) adicionar tratamento de `P2002` em `receiveAuvoWebhookEvent` com teste de regressão, (4) escrever ao menos um teste E2E para o caminho de rollback do kanban e um teste (mesmo que via `FakeCrmRepository`, se sua interface for estendida) para dedupe de notificação.

---
*Scripts de verificação temporários (`.qa-audit-tmp/`) foram criados dentro do projeto apenas para resolução de módulos Node, executados, e removidos ao final desta auditoria — confirmado por `git status --short` que nada ficou rastreado além dos arquivos já untracked antes desta sessão.*
