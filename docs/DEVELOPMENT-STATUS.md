# Development Status

Atualizado em: 2026-07-21

## Escopo desta homologacao

- Repositorio: `C:\Users\Artec Climatizados\Desktop\artec-crm`
- Remote esperado: `https://github.com/GsilvaM/artec-crm.git`
- Branch: `main`
- Base local observada: `7e7fffa feat: homologate customers and opportunities`
- Marco trabalhado: Central Comercial com banco real.
- Commit/push: nao executado.

## Estado inicial observado

- Worktree ja estava com alteracoes locais e arquivos novos.
- `CRM_DATABASE_URL` estava presente localmente, parseavel, sem placeholders conhecidos, usando host pooler Supabase, porta `5432` e database `/postgres`.
- Nenhum valor de credencial foi registrado neste documento.
- Migrations `0001` a `0008` estavam pendentes antes da primeira execucao.
- `crm.user_memberships` estava sem memberships apos a aplicacao das migrations; depois foi criada/ativada membership real para o usuario de homologacao.

## Migrations

Auditoria estatica antes da aplicacao:

- Arquivos encontrados: `0001_create_crm_schemas.sql` a `0008_create_activities_and_next_actions.sql`.
- Referencias a `public.`: nenhuma.
- URLs, senhas, service role, tokens ou `DATABASE_URL`: nenhuma.
- Referencias financeiras reais: nenhuma. Os termos encontrados foram `forma_pagamento` em oportunidades de CRM.
- Escopo de schema: `crm`, `crm_internal` e referencias esperadas a `auth.users`/`auth.uid()`.
- `crm_internal` revogado para `anon` e `authenticated` em `0006`.

Status final:

- `0001_create_crm_schemas`: applied
- `0002_create_users_and_roles`: applied
- `0003_create_clients`: applied
- `0004_create_opportunities`: applied
- `0005_create_notifications_and_internal_auvo`: applied
- `0006_harden_schema_access_and_membership_policies`: applied
- `0007_complete_customers_opportunities_flow`: applied
- `0008_create_activities_and_next_actions`: applied
- `0009_fix_opportunity_responsible_trigger`: applied
- `0010_split_responsible_trigger_branch`: applied
- `0011_harden_activities_next_actions`: applied
- `0012_harden_internal_notifications`: applied
- `0013_harden_auvo_webhook_events`: applied

## Prisma, backend e frontend

- `prisma format`: passou.
- `prisma validate`: passou.
- `prisma generate`: passou.
- Backend `dev:server` iniciou em `http://127.0.0.1:4100`.
- Health direto: `GET http://127.0.0.1:4100/api/health` retornou `200` com `database: connected`.
- Health via proxy Vite: `GET http://127.0.0.1:3100/api/health` retornou `200` com `database: connected`.
- Vite serviu a aplicacao em `http://127.0.0.1:3100/` com HTML raiz e modulo frontend.
- O `.env` local foi ajustado para conter os nomes publicos esperados pelo frontend: `VITE_CRM_SUPABASE_URL` e `VITE_CRM_SUPABASE_ANON_KEY`.

## Autenticacao e membership

Foi usado um usuario real do Supabase Auth, configurado localmente, para homologar a primeira membership ativa.

Resultado da homologacao com sessao real:

- Login Supabase por senha: passou.
- Membership real `gestor` ativa: criada/atualizada.
- `GET /api/me` como `gestor`: `200`, membership ativa e permissoes retornadas.
- `GET /api/me` como `vendedor`: `200`, membership ativa e permissoes retornadas.
- `GET /api/me` como `atendimento`: `200`, membership ativa e permissoes retornadas.
- Membership inativa: `403`.
- Sem membership: `403`.
- Token invalido: `401`.
- Token ausente: `401`.
- Estado final restaurado para membership `gestor` ativa.

## Clientes

Homologado com dados reais de teste identificados como homologacao:

- Criar cliente: passou.
- Telefone normalizado no backend: passou.
- Duplicidade por telefone: passou, com alerta por `duplicatePhoneCustomerIds`.
- Buscar/listar por termo: passou.
- Visualizar ficha via `GET /api/customers/:id`: passou.
- Editar cliente: passou.
- Arquivar cliente: passou.
- Cliente arquivado deixa de aparecer na listagem ativa: passou.
- Cliente arquivado bloqueia criacao de oportunidade: passou.
- Restaurar cliente: passou.
- Auditoria em `crm.audit_log`: passou para insert/update.
- RBAC: gestor, vendedor e atendimento validados conforme permissoes atuais.

## Oportunidades

Homologado com dados reais de teste identificados como homologacao:

- Criar oportunidade ativa com responsavel, etapa, situacao, proxima acao e data: passou.
- Bloquear criacao sem responsavel: passou.
- Bloquear criacao sem proxima acao: passou.
- Alterar etapa, situacao e proxima acao: passou.
- Filtrar/listar oportunidades: passou.
- Aprovar exige campos obrigatorios: passou.
- Aprovar com forma de pagamento `a vista` forca 1 parcela: passou.
- Perda exige motivo: passou.
- Marcar como perdida: passou.
- Arquivar e restaurar oportunidade: passou.
- Auditoria em `crm.audit_log`: passou para insert/update.
- Reatribuicao para outro responsavel nao foi homologada no banco real por ausencia de segundo usuario Auth disponivel; regra esta coberta por teste unitario/API e backend.

## Atividades

Homologado com dados reais de teste identificados como homologacao:

- Atividade comercial vinculada a oportunidade: passou.
- Atividade de garantia sem oportunidade: passou.
- Atividade de suporte sem oportunidade: passou.
- Atividade de pos-venda sem oportunidade: passou.
- Linha do tempo por cliente via `GET /api/customers/:id/activities`: passou.
- Linha do tempo por oportunidade via `GET /api/opportunities/:id/activities`: passou.
- Bloqueio de `opportunityId` pertencente a outro cliente: passou em teste automatizado e constraint de banco.
- Auditoria em `crm.audit_log`: passou para atividades.

## Proximas Acoes

Homologado com dados reais de teste identificados como homologacao:

- Criar proxima acao comercial vinculada a oportunidade: passou.
- Criar proxima acao de suporte sem oportunidade: passou.
- Categoria `commercial`, `warranty`, `support` e `after_sales` suportada no contrato.
- Reagendar preservando data anterior em `postponed_from`: passou.
- Cancelar com motivo: passou.
- Concluir acao atual de oportunidade ativa com acao substituta na mesma operacao: passou.
- Bloquear conclusao da unica acao atual sem substituta: coberto por teste automatizado.
- Filtros por categoria, status, vencidas, hoje, futuras, cliente, oportunidade e prioridade: cobertos no backend.
- Auditoria em `crm.audit_log`: passou para proximas acoes.

## Central Comercial

Homologado com dados reais de teste identificados como homologacao:

- Endpoint agregado `GET /api/commercial-center`: passou.
- Acoes vencidas: passou.
- Acoes de hoje: passou.
- Acoes futuras nao aparecem no bloco de hoje: passou.
- Filtro por categoria de proxima acao: passou.
- Filtros globais de periodo, responsavel, etapa, situacao, tipo de demanda, categoria e prioridade: implementados no endpoint e expostos na tela.
- Orcamentos aguardando retorno por etapa comercial: passou.
- Visitas proximas por titulo/situacao de acao: passou.
- Caixa Auvo em estado vazio real de homologacao: passou.
- Resumo comercial com novas oportunidades, valor orcado e valor aprovado: passou.
- Escopo de vendedor no backend: coberto por teste automatizado.
- Gestor visualiza blocos agregados: coberto por teste automatizado.

## Notificacoes internas

Homologado com banco real e dados operacionais existentes:

- Migration `0012_harden_internal_notifications`: aplicada.
- Tabela `crm.notificacoes` preservada e endurecida com `status`, `severity`, `resolved_at`, `metadata` e vinculos opcionais para cliente, oportunidade e proxima acao.
- Dedupe aberto por usuario e chave deterministica: implementado por indice unico parcial.
- Endpoints implementados:
  - `GET /api/notifications`;
  - `GET /api/notifications/unread-count`;
  - `POST /api/notifications/:id/read`;
  - `POST /api/notifications/read-all`;
  - `POST /api/notifications/:id/archive`;
  - `POST /api/notifications/:id/snooze`;
  - `POST /api/notifications/reconcile`, protegido para gestor.
- Comando `npm run notifications:reconcile`: executado duas vezes; primeira execucao gerou notificacoes reais de pendencias existentes, segunda execucao nao duplicou e apenas atualizou notificacoes abertas.
- Eventos implementados nesta rodada:
  - proxima acao vencida;
  - proxima acao chegando ao prazo;
  - oportunidade atribuida a outro usuario;
  - proxima acao atribuida/reatribuida a outro usuario;
  - oportunidade ativa sem proxima acao valida;
  - oportunidade parada.
- Regras antirruido:
  - nao notifica atribuicao feita pelo proprio usuario;
  - dedupe por condicao;
  - reconciliacao idempotente;
  - conclusao, cancelamento, reagendamento e encerramento resolvem notificacoes relacionadas.
- Interface:
  - sino com contador de nao lidas;
  - painel compacto;
  - secao de notificacoes internas com filtros por pendentes, lidas e arquivadas;
  - acoes para marcar como lida, arquivar e adiar.

Limitacoes:

- Pagina dedicada `/notificacoes` ainda nao foi separada em rota propria; a visualizacao completa inicial fica na tela autenticada atual.
- Playwright/E2E visual nao foi executado porque o projeto nao possui infraestrutura configurada.
- Notificacoes de sucesso comum do Auvo, e-mail, WhatsApp e push web nao foram implementadas.
- O Auvo esta limitado ao receptor de homologacao; ainda nao ha Caixa de Entrada definitiva, parsing de eventos reais ou criacao automatica de cliente/oportunidade.

## Auvo - Receptor de homologacao

Implementado no Marco 6:

- Endpoint publico `POST /api/webhooks/auvo/:secret`, protegido por `AUVO_WEBHOOK_SECRET` do backend.
- Validacao de metodo, content-type JSON e limite de payload de 256 KiB.
- Persistencia de evento bruto em `crm_internal.auvo_webhook_events`.
- Hash canonico do payload e deduplicacao por `dedupe_key`.
- Headers persistidos por allowlist, sem `authorization`, `cookie`, `set-cookie`, tokens ou chaves sensiveis.
- APIs administrativas restritas a gestor:
  - `GET /api/integrations/auvo/status`;
  - `GET /api/integrations/auvo/events`;
  - `GET /api/integrations/auvo/events/:id`;
  - `POST /api/integrations/auvo/events/:id/reprocess`;
  - `POST /api/integrations/auvo/events/:id/ignore`.
- Tela administrativa "Homologacao Auvo" com status, eventos recentes, filtro por status, detalhe sanitizado, copiar ID, reprocessar e ignorar.
- Sucesso comum de webhook nao gera notificacao interna.

Fora do Marco 6:

- criacao automatica de clientes;
- criacao automatica de oportunidades;
- sincronizacao ou escrita no Auvo;
- leitura da API Auvo antes da resposta do webhook;
- pagamentos, financeiro, mensagens completas e card moves.

## Auvo - Hardening de seguranca (2026-07-21)

Auditoria realizada sobre o estado herdado do commit `e1f9904`. Confirmado:

- `webhookSecretConfigured: true`, `likelyRealEvents: 0`, `nextOfficialStep: capture_real_auvo_payloads` (via `npm run auvo:homologation:status`).
- Todas as migrations `0001` a `0013` seguem `applied`.
- Rota publica `POST /api/webhooks/auvo/:secret` existe em `server/app.ts` e ja era a unica rota publica de recepcao.

Gaps encontrados contra os requisitos obrigatorios de seguranca do webhook e corrigidos nesta sessao:

- comparacao do segredo era `!==` direto (vazamento de timing por tamanho/prefixo); trocado por `secretsMatch` com `node:crypto.timingSafeEqual`.
- nao havia rate limit na rota publica; adicionado `@fastify/rate-limit` (60 req/min por IP) aplicado somente as rotas do webhook Auvo (`global: false`), com `errorResponseBuilder` retornando `ApiError(429, "rate_limited", ...)` no mesmo formato de erro da API.
- novo `ApiErrorCode` `rate_limited` adicionado em `server/errors.ts`.
- rota do webhook extraida para `registerAuvoWebhookRoutes`, registrada via `app.register()` apos o plugin de rate limit, para garantir que o hook `onRoute` do `@fastify/rate-limit` esteja ativo antes da rota ser definida (bug real encontrado: registrar rota diretamente apos `void app.register(rateLimit, ...)` no mesmo tick nao aplicava o rate limit, pois o plugin so inicializa no boot do avvio).
- testes novos em `server/app.test.ts`: segredo errado do mesmo tamanho (cobre o branch `timingSafeEqual`) e estouro do rate limit (61 requisicoes, espera `429` com `code: rate_limited`).
- `npm run typecheck`, `npm run test` (48 testes) e `npm run build` passaram apos as mudancas.

Resolvido nesta sessao:

- Usuario confirmou que `AUVO_WEBHOOK_SECRET` local reutilizava a chave de autenticacao do Auvo Chat. Segredo rotacionado localmente para um valor novo, aleatorio (32 bytes, `node:crypto.randomBytes`), sem relacao com qualquer credencial do Auvo Chat/API. Valor nao foi impresso em nenhum momento; apenas o comprimento (64 caracteres hex) foi conferido.
- Usuario decidiu hospedar frontend e backend juntos, como projeto unico na Vercel (backend como funcao serverless), em vez de tunel temporario. Codigo preparado (`server/bootstrap.ts`, `api/index.ts`, `vercel.json`, `CRM_DATABASE_POOL_URL`); ver `docs/DEPLOY.md` para os passos completos.

## Bloqueios externos que permanecem

1. Conta/projeto na Vercel ainda nao existem — usuario informou que precisa criar. Passos manuais completos em `docs/DEPLOY.md`, secao 3.
2. `AUVO_WEBHOOK_SECRET` de producao ainda nao existe — deve ser gerado exclusivamente para o ambiente de producao na Vercel (nao reaproveitar o valor local rotacionado nesta sessao).
3. Migrations de producao ainda nao foram aplicadas contra o banco que a Vercel vai usar (mesmo Supabase, mas o passo manual de rodar `npm run db:migrate` contra producao nao foi executado nesta sessao).
4. Dominio proprio (`crm.artecclimatizados.com.br`) nao foi configurado; deploy inicial usara dominio `*.vercel.app` ate decisao em contrario.
5. Sem deploy publicado ainda, a captura de payloads reais do Auvo (Marco 7) continua bloqueada. `likelyRealEvents` permanece `0`.

## Deploy Vercel (2026-07-21)

Deploy publicado pelo usuario em `https://artec-crm.vercel.app/`. Validado nesta sessao:

- `GET /api/health`: `200`, `database: connected`.
- `GET /`: `200` (frontend servido).
- `POST /api/webhooks/auvo/:secret` com segredo incorreto: `403 forbidden`, sem vazar o segredo enviado.
- `GET /api/webhooks/auvo/:secret`: `405`.
- Rota inexistente: `404` no formato JSON padrao da API.
- Headers `X-Ratelimit-*` presentes na resposta do webhook, confirmando rate limit ativo em producao.
- `CRM_DATABASE_URL` de producao aponta para o mesmo projeto Supabase usado localmente (confirmado pelo usuario); migrations `0001`-`0013` ja aplicadas, nenhuma acao adicional de migration necessaria.

Achado de seguranca (nao critico, mas fora do recomendado em `docs/DEPLOY.md`): teste automatizado que envia o `AUVO_WEBHOOK_SECRET` local (sem nunca imprimir o valor) contra a rota publica de producao retornou `202`, ou seja, **o segredo de producao configurado na Vercel e identico ao segredo local atual**. `docs/DEPLOY.md` recomendava um valor exclusivo por ambiente; isso ainda nao foi feito. Evento sintetico de teste (`homologation: true`) foi registrado e nao conta como evento real (`totalEvents` foi de 1 para 2, `likelyRealEvents` continua `0`).

Resolvido em 2026-07-21: novo `AUVO_WEBHOOK_SECRET` gerado (32 bytes aleatorios) exclusivamente para producao, aplicado em Vercel Project Settings > Environment Variables e validado apos redeploy. Confirmado por sondagem automatizada (sem nunca imprimir valores): producao passou a rejeitar (`403`) o segredo local antigo e a aceitar (`202`) apenas o novo valor de producao. Local e producao agora usam segredos distintos. Eventos sinteticos de teste (`homologation: true`) usados nessa validacao nao contam como `likelyRealEvents`.

Proximo passo: configurar a URL `https://artec-crm.vercel.app/api/webhooks/auvo/<segredo-de-producao>` no painel do Auvo (eventos do MVP listados em `docs/AUVO-INTEGRATION.md`) e iniciar a captura real de payloads.

## Funil comercial visual (2026-07-21)

Implementado `src/components/PipelineBoard.tsx`: quadro com uma coluna por etapa (`crm.etapas_funil`, ordenadas por `ordem`), cartao por oportunidade mostrando cliente, titulo, tipo de demanda, origem (quando houver), valor (aprovado ou estimado), situacao, proxima acao com indicador de atraso e status.

Decisoes de escopo:

- Sem drag-and-drop. O `CLAUDE-ARTEC-CRM.md` permite drag-and-drop "apenas se seguro e acessivel"; optou-se por um `<select>` nativo por cartao para mover a oportunidade entre etapas nao terminais, que e acessivel por teclado por padrao.
- Etapas terminais (`Aprovado`, `Perdido`) nao aparecem como destino no seletor de mover; cartoes nessas etapas so tem o botao "Historico" (sem mover/aprovar/perder de novo).
- **Hardening de backend adicionado junto**: `assertStageExists` em `server/crm/prisma-repository.ts` agora rejeita (`409`) mover ou criar uma oportunidade diretamente em etapa terminal fora dos fluxos `/approve` e `/lose`. Esse gap ja existia antes do Funil (a rota `PATCH /api/opportunities/:id` aceitava `etapaId` de etapa terminal sem validar), mas ficou mais facil de acionar por acidente com o quadro visual, entao foi corrigido nesta mesma fatia. Teste novo em `server/app.test.ts` ("rejects moving an opportunity into a terminal stage outside the approve/lose flow").
- "Tempo na etapa" (citado no `CLAUDE-ARTEC-CRM.md` e `docs/PRODUCT-SPEC.md` como campo do cartao) **nao foi implementado nesta fatia**: o schema atual so tem `dataEntrada` (entrada na oportunidade) e `updatedAt` (qualquer alteracao), nenhum dos dois reflete especificamente a data de entrada na etapa atual. Adicionar isso exigiria uma coluna nova e um trigger dedicado; decidiu-se nao inventar um numero impreciso. Fica registrado como pendencia real, nao como "concluido".

Validacao:

- `npm run typecheck`, `npm run test` (53 testes) e `npm run build` passaram.
- Verificado visualmente com Playwright (instalado nesta sessao como dependencia de desenvolvimento, tambem preparando a infraestrutura de E2E do item 14): login real de homologacao, screenshot do quadro renderizado, movimentacao real de uma oportunidade entre etapas confirmada na UI (com refresh assincrono da tela) e devolvida ao estado original ao final do teste. Nenhum erro de console ou de rede durante a verificacao.

## Administracao (2026-07-21)

Implementado `src/components/AdminPanel.tsx` e rotas `/api/admin/*` (todas exigem permissao `settings:read`/`settings:write`/`users:manage`, ja definidas no RBAC desde a fundacao mas sem rota nenhuma ate agora):

- Etapas do funil: criar (`POST /api/admin/pipeline-stages`) e atualizar nome/ordem (`PATCH /api/admin/pipeline-stages/:id`). Novas etapas sempre nascem nao-terminais. Nome/ordem sao unicos no banco; violacao vira `409` tratado (`Prisma.PrismaClientKnownRequestError` codigo `P2002` traduzido para mensagem em portugues, em vez de vazar erro 500 generico).
- Descoberta durante a implementacao: a migration `0007` marca **tres** etapas como terminais (`Aprovado`, `Concluido`, `Perdido`), nao so duas. So `Aprovado` e `Perdido` sao referenciadas por nome no codigo (`getStageIdByName`), mas a protecao contra renomear se aplica as tres por seguranca (renomear qualquer etapa terminal e bloqueado com `409`). `Concluido` nao tem nenhum fluxo que a atinja hoje (nem aprovar, nem perder, nem a nova API de admin, que recusa mover/criar oportunidade diretamente em etapa terminal) — fica registrado como lacuna pre-existente, fora do escopo desta fatia.
- Motivos de perda: listar todos incluindo inativos (`GET /api/admin/loss-reasons`), criar (`POST`) e ativar/desativar (`PATCH`, soft-disable, sem exclusao definitiva).
- Usuarios/memberships: `GET /api/admin/users` faz LEFT JOIN entre `auth.users` e `crm.user_memberships` (via `$queryRaw`, primeira leitura do schema `auth` pelo backend — confirmado que a credencial de `CRM_DATABASE_URL` tem `SELECT` nesse schema antes de construir a feature). `POST /api/admin/users/:userId/membership` cria ou atualiza a membership. Gestor nao pode desativar a propria conta (bloqueio de auto-exclusao testado).
- Decisao de escopo: sem convite/criacao de conta Supabase pela API (exigiria service role, fora do que `CLAUDE.md` autoriza sem necessidade comprovada); sem tornar origem/tipo de demanda campos configuraveis (permanecem texto livre); sem tela de auditoria (`crm.audit_log` ja e populado, so falta o visualizador).

Validacao: `npm run typecheck`, `npm run test` (56 testes, 4 novos cobrindo RBAC e as regras de etapa terminal/duplicidade/auto-exclusao) e `npm run build` passaram. Verificado com Playwright contra o ambiente real de homologacao (mesmo Supabase usado em producao): leitura mostrou os 9 motivos de perda seedados e o unico usuario real (`gestor`, marcado "voce", checkbox de ativo desabilitado); escrita testada ponta a ponta criando e desativando um motivo de perda de teste, e criando uma etapa de teste — ambos limpos do banco ao final da verificacao. Um bug de layout (tabelas cortadas em grid de 2 colunas) foi encontrado e corrigido nessa verificacao antes de finalizar o marco.

## Incidente: eventos fora de escopo capturados na primeira ativacao do webhook (2026-07-21)

O usuario cadastrou o webhook no Auvo com **18 eventos marcados**, incluindo todos os proibidos pelo escopo do MVP (`CLAUDE.md`, secoes 5 e 10.4): pagamento criado/alterado, mensagens (enviada/recebida/atualizada), eventos de painel/card, anotacoes de painel e modelo de mensagem. O webhook ficou `ATIVO` por alguns minutos nessa configuracao.

Auditoria (apenas contagens e nomes de campo/tipo de evento, nunca conteudo, via `crm_internal.auvo_webhook_events`) encontrou 15 eventos reais recebidos nesse intervalo, sendo:

- Dentro do escopo (mantidos): `CONTACT_NEW` (1), `CONTACT_UPDATE` (3).
- Fora do escopo (removidos): `MESSAGE_SENT` (3), `MESSAGE_UPDATED` (5), `MESSAGE_RECEIVED` (1), `SESSION_NEW` (1), `SESSION_UPDATE` (1), `CONTACT_TAG_UPDATE` (1). Os eventos de mensagem tinham um campo `content` com o que aparentava ser texto real de conversa do cliente.

Acoes tomadas, com autorizacao explicita do usuario para cada exclusao:

1. Usuario corrigiu a configuracao no painel do Auvo, deixando marcados apenas os 5 eventos do MVP (Atendimento criado/alterado/concluido, Contato criado/alterado).
2. As 15 linhas fora de escopo foram apagadas do banco de producao (13 linhas via `id`, mais 2 que chegaram durante a janela de confirmacao, identificadas pelo mesmo criterio: tipo de evento fora da lista aprovada e nao sintetico).
3. Nenhum dado dentro do escopo aprovado foi tocado; os 4 eventos reais de contato permanecem intactos para a proxima etapa (mapeamento de campos).

Hardening adicionado para reduzir recorrencia (`server/crm/prisma-repository.ts`): `isOutOfScopeAuvoEventType` bloqueia por padrao qualquer `eventType` que comece com `MESSAGE_`, `SESSION_`, `PAYMENT_`, `CARD_`, `PANEL_`, `TEMPLATE_`, ou seja exatamente `CONTACT_TAG_UPDATE` — todos confirmados como tipos reais enviados pelo Auvo nesse incidente. Eventos bloqueados continuam gerando uma linha (status `ignored`, visivel na tela administrativa) mas **sem armazenar o payload original** (`rawPayloadJson` vira `{ eventType, outOfScope: true }`), evitando que conteudo fora de escopo chegue a ser persistido mesmo se o painel do Auvo for reconfigurado incorretamente de novo. Tipos de evento desconhecidos (ex: futuros eventos de atendimento, ainda nao observados) continuam passando normalmente — a lista e uma negacao pontual, nao uma lista de permissao, para nao arriscar bloquear eventos legitimos de atendimento por suposicao de nome de campo (proibido pela secao 12 do `CLAUDE.md`). Teste unitario dedicado em `server/crm/prisma-repository.test.ts` (4 casos, sem banco).

## Correcoes do Marco 5

- Backend ganhou endpoints persistentes de notificacoes internas.
- Repository Prisma ganhou reconciliação idempotente e resolucao automatica em operacoes de proxima acao/oportunidade.
- CLI `notifications:reconcile` foi criado para scheduler externo futuro.
- Frontend ganhou sino, contador, painel compacto e lista operacional de notificacoes.
- Testes de API cobrem lista, contador, leitura, snooze, arquivamento, isolamento por usuario e RBAC do reconcile.

## Correcoes do Marco 4

- Backend ganhou endpoint `GET /api/commercial-center`.
- Repository Prisma passou a montar blocos agregados sem sequencia N+1 no frontend.
- Frontend passou a carregar a Central Comercial junto do snapshot autenticado.
- Tela inicial autenticada passou a destacar pendencias operacionais antes dos cadastros.
- Tela inicial passou a ter painel de filtros globais da Central com aplicar e limpar filtros sem recarregamento completo.
- Blocos implementados: acoes vencidas, acoes de hoje, oportunidades sem proxima acao, orcamentos aguardando retorno, visitas proximas, oportunidades paradas, Caixa Auvo vazia e resumo comercial.
- Acoes rapidas reutilizam o fluxo existente de concluir e reagendar proximas acoes.

## Correcoes do Marco 3

- Migration `0011` adicionou `category` e `archived_at` a `crm.next_actions`.
- Migration `0011` tornou `crm.atividades.cliente_id` obrigatorio apos backfill seguro a partir da oportunidade.
- Migration `0011` adicionou triggers para impedir atividade ou proxima acao vinculada a oportunidade de outro cliente.
- Backend passou a validar cliente existente antes de gravar atividade ou proxima acao.
- Backend, contratos e UI passaram a trabalhar com categorias de proximas acoes.
- Lista de proximas acoes passou a aceitar filtros por categoria e futuras.

## Correcoes do Marco 2

- Backend passou a validar cliente inexistente/arquivado antes de criar ou mover oportunidade.
- Backend passou a validar etapa inexistente antes de escrever.
- Backend passou a validar motivo de perda ativo antes de marcar perda.
- Backend passou a impedir vendedor de atribuir oportunidade a outro responsavel via chamada direta.
- Rotas passaram a rejeitar ID malformado com `400` antes de chegar ao Prisma.
- Migration `0009` recriou a funcao de validacao de responsavel no banco.
- Migration `0010` separou os ramos da funcao por `IF/ELSE` para evitar referencia a coluna inexistente em trigger de oportunidades.

## Validacoes executadas

- `npm run db:migrate:status`: passou, todas as migrations aplicadas.
- `npm run prisma:format`: passou.
- `npm run prisma:validate`: passou.
- `npm run prisma:generate`: passou.
- `npm run typecheck`: passou.
- `npm run test`: passou, 4 arquivos e 44 testes.
- `npm run build`: passou.
- `npm run notifications:reconcile`: passou e confirmou idempotencia sem duplicar notificacoes abertas.
- Teste local sintetico do webhook Auvo: backend respondeu `200` em health, `202` no recebimento e `202` na duplicidade; evento sintetico marcado como `ignored` em seguida.
- `npm run auvo:homologation:status`: disponivel para auditar a captura sem imprimir segredo, headers ou payloads.
- `npm run auvo:fixtures:export`: disponivel para gerar fixtures locais anonimizadas em `tmp/auvo-fixtures`, diretorio ignorado pelo Git.
- E2E: nao executado porque nao existe script `e2e` ou Playwright no `package.json`.

## Nao alterado

- Nenhuma alteracao de autenticacao fora do uso previsto de Supabase JWT e membership.
- Nenhum commit ou push.
- Nenhum valor sensivel registrado.
- Nenhum objeto financeiro foi alterado.
- Nenhuma integracao Auvo definitiva foi iniciada; existe apenas receptor de homologacao e tela admin de eventos.
- Nenhuma funcionalidade de e-mail, WhatsApp, push web, relatorios avancados, Auvo real ou deploy foi iniciada.

## Marcos

- Marco 1, Homologacao conectada da Fundacao: concluido e homologado.
- Marco 2, Clientes e Oportunidades: concluido e homologado por API/backend/banco; validacao visual automatizada limitada pela ausencia de Playwright/E2E.
- Marco 3, Atividades e Proximas Acoes: concluido e homologado por API/backend/banco; validacao visual automatizada limitada pela ausencia de Playwright/E2E.
- Marco 4, Central Comercial: concluido e homologado por API/backend/banco; validacao visual automatizada limitada pela ausencia de Playwright/E2E.
- Marco 5, Notificacoes internas: concluido e homologado por API/backend/banco; validacao visual automatizada limitada pela ausencia de Playwright/E2E.

## Proximo marco

Implementar o receptor de homologacao do Auvo, ainda sem transformar automaticamente atendimentos em oportunidades e sem iniciar mapeamento definitivo antes de capturar payloads reais.
