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

## Orcamentos versionados (2026-07-21)

Nova tabela `crm.orcamentos` (migration `0014_criar_orcamentos`), com RLS/grants no mesmo padrao de `crm.atividades` (gestor/atendimento veem tudo; vendedor ve o que criou ou o que pertence a oportunidade sob sua responsabilidade). Uma oportunidade pode ter varias versoes de orcamento; a versao e calculada automaticamente (`max(versao) + 1` por oportunidade, dentro de uma transacao).

Maquina de estados no backend (`server/crm/prisma-repository.ts`, tabela `QUOTE_STATUS_TRANSITIONS`): `rascunho -> enviado -> {revisado, aprovado, recusado, expirado}`, com `revisado` tambem podendo seguir para `aprovado/recusado/expirado`. Estados finais (`aprovado`, `recusado`, `expirado`) nao tem saida. `valor`/`resumo` so podem ser alterados enquanto o orcamento esta em `rascunho` — depois de enviado, e um registro historico; nova negociacao = nova versao, nao edicao da mesma linha.

Efeito colateral corrigido: `crm.oportunidades.valor_orcamento` e `data_orcamento` existiam desde o Marco 2 (schema e leitura ja prontos, inclusive usados pelos blocos "Orçamentos aguardando envio/retorno" da Central Comercial), mas **nenhum fluxo os preenchia** — `data_orcamento` nunca tinha sido escrito por nenhum caminho de codigo, entao esses blocos da Central Comercial estavam silenciosamente sempre vazios. Agora, marcar um orcamento como `enviado` atualiza os dois campos na oportunidade automaticamente.

API: `GET /api/opportunities/:id/quotes`, `POST /api/opportunities/:id/quotes` (cria rascunho), `PATCH /api/quotes/:id` (edita rascunho ou transiciona status). Frontend: `src/components/QuotesPanel.tsx`, aberto junto com a linha do tempo ao clicar "Historico" numa oportunidade.

Bug de ferramenta encontrado e corrigido no caminho: `database/create-migration.ts` gerava nomes de arquivo com timestamp de 14 digitos, mas `database/migration-utils.ts` so reconhece o padrao `NNNN_nome.sql` (4 digitos) — usado em todas as 13 migrations anteriores. O script `db:migrate:create` estava, portanto, gerando migrations que o runner nunca enxergaria (silenciosamente ignoradas, sem erro). Corrigido para calcular o proximo numero sequencial de 4 digitos a partir dos arquivos existentes.

Validacao: `npm run typecheck`, `npm run test` (57 testes, 1 novo cobrindo criacao/versionamento/transicoes invalidas/trava de edicao apos envio) e `npm run build` passaram. Migration aplicada com `npm run db:migrate` contra o banco real de homologacao (mesmo usado pela producao). Verificado com Playwright ponta a ponta: criar orcamento, enviar, aprovar — sem erros de console, valores e datas corretos na UI. Dados de teste (1 orcamento e os campos denormalizados da oportunidade) limpos do banco ao final.

## Relatorios comerciais (2026-07-21)

Novo endpoint `GET /api/reports/commercial` (permissao `reports:read`, ja existia no RBAC desde a fundacao mas sem rota nenhuma) e painel `src/components/ReportsPanel.tsx`. Filtros: periodo (`from`/`to`, padrao ultimos 30 dias), responsavel, origem, tipo de demanda, etapa.

Metricas: novos leads, oportunidades criadas, oportunidades por etapa, valor orcado, valor aprovado, numero de aprovacoes, ticket medio aprovado, taxa de conversao simples (aprovadas / (aprovadas + perdidas) no periodo), conversao por origem, distribuicao de motivos de perda, tempo medio (dias) ate orcamento/aprovacao/perda, follow-ups vencidos (situacao atual) e concluidos no periodo.

Fora do escopo desta fatia, por decisao e nao por esquecimento: tempo medio de triagem da Caixa Auvo (a Caixa ainda nao existe), recuperacao apos follow-up, exportacao/graficos (a tela usa tabelas e cartoes de metrica, reaproveitando os componentes visuais ja existentes).

Validacao: `npm run typecheck`, `npm run test` (58 testes, 1 novo cobrindo RBAC e presenca das metricas agregadas) e `npm run build` passaram. Verificado com Playwright contra o ambiente real de homologacao: metricas renderizadas batem entre si (ex.: soma de "oportunidades por etapa" bate com "oportunidades criadas"; "dias ate orcamento" retornou corretamente "Sem dados" apos a limpeza do orcamento de teste do marco anterior, em vez de um numero fabricado).

## Busca global (2026-07-21)

`GET /api/search?q=` (permissao `customers:read`, disponivel para os tres papeis) combina `listCustomers`/`listOpportunities` reaproveitando os mesmos filtros de busca ja existentes (nao duplica logica de query). Adicionado `auvo_contact_id` como criterio exato de busca de cliente, que faltava apesar de citado no `docs/PRODUCT-SPEC.md`. Resultado limitado a 8 clientes + 8 oportunidades para uso como "ir para" rapido, nao como listagem completa (a tabela principal continua sendo a busca detalhada).

Frontend: a caixa de busca da topbar (ja existente) ganhou um dropdown com debounce de 300ms, agrupado por tipo, navegando direto para a linha do tempo do cliente/oportunidade ao clicar. `Enter` continua disparando a busca completa nas tabelas, como antes — o dropdown e um atalho adicional, nao uma substituicao.

Validacao: `npm run typecheck`, `npm run test` (59 testes, 1 novo cobrindo busca combinada e query vazia) e `npm run build` passaram. Verificado com Playwright: digitar "Homologacao" retornou clientes reais agrupados, clicar no primeiro resultado abriu a linha do tempo correta e fechou o dropdown, sem erros de console.

## Hardening final e E2E minimo (2026-07-21)

### Playwright E2E

Infraestrutura adicionada do zero: `playwright.config.ts` (chromium, `webServer` sobe `dev:server`+`dev:frontend` automaticamente se nao estiverem no ar, `baseURL` configuravel via `CRM_E2E_BASE_URL` para apontar a outro ambiente), `e2e/support/auth.ts` (login real via UI, credenciais lidas de `EMAIL_LOGIN`/`SENHA`, nunca hardcoded — falha com mensagem clara se as env vars nao existirem), e 7 specs cobrindo os fluxos criticos que o unico usuario real de homologacao disponivel permite exercitar: login (sucesso e falha), criar cliente, criar oportunidade e ve-la no funil, Central Comercial, Relatorios, Administracao, Busca global.

Todos os 7 testes passaram contra o ambiente real (`https://artec-crm.vercel.app` ou local, mesmo banco Supabase). Limitacao honesta: **nao ha banco de teste isolado** — os testes rodam contra o mesmo Supabase de producao (decisao ja tomada e documentada no Marco Deploy), e o teste de criacao de cliente/oportunidade grava dados reais prefixados com `E2E <timestamp>` a cada execucao, sem limpeza automatica. Isso segue o mesmo padrao ja presente no ambiente (dezenas de registros `Cliente Homologacao...` de sessoes anteriores), mas fica registrado como divida tecnica: rodar a suite repetidamente (ex: em CI) acumula dados indefinidamente.

Fluxos do `CLAUDE-ARTEC-CRM.md` secao 14 que **nao** foram cobertos por E2E real, por exigirem um segundo usuario com papel diferente (`vendedor`/`atendimento`) que nao existe neste ambiente: aprovacao, perda, garantia, suporte, RBAC entre papeis. RBAC entre papeis ja esta coberto exaustivamente nos 60 testes de API/unitarios (Vitest), que simulam os tres papeis livremente sem depender de contas reais.

### Seguranca

- Headers de seguranca adicionados via hook `onSend` global em `server/app.ts`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store`. `Strict-Transport-Security` ja e adicionado automaticamente pela Vercel em producao (confirmado por curl direto na sessao do Marco Deploy).
- `npm audit`: 3 vulnerabilidades moderadas, todas em `@hono/node-server`, dependencia transitiva de `@prisma/dev` (ferramental de desenvolvimento do Prisma — Prisma Studio/dev server), nao usada em runtime de producao. `npm audit fix --dry-run` nao resolve (upstream ainda nao publicou a correcao na faixa de versao usada pelo Prisma 7.8.0 fixado no projeto). Risco baixo, registrado, nao corrigido nesta sessao para nao arriscar quebrar a versao do Prisma fixada.
- Confirmado: nenhum `.env`/`.env.local` versionado (`git ls-files` so retorna `.env.example`); nenhum segredo hardcoded encontrado em busca por padroes (`sk_live`, chaves AWS, JWT, connection strings com credenciais) em codigo e documentacao rastreados.
- `bodyLimit` global do Fastify (256 KiB) ja cobre todas as rotas, nao so o webhook Auvo.

### Nao feito nesta sessao (registrado, nao esquecido)

- Paginacao por cursor em `GET /api/customers` e `GET /api/opportunities` (hoje limitam a 100 registros via `take`, sem cursor); `GET /api/integrations/auvo/events` ja tem cursor.
- Rate limit global em rotas autenticadas (hoje so a rota publica do webhook Auvo tem rate limit; rotas autenticadas dependem so do Bearer token do Supabase como barreira).
- Auditoria formal de acessibilidade (WCAG).
- Runbook de incidentes e politica de backup documentados.
- Analise de planos de consulta (`EXPLAIN`) nas queries mais pesadas dos relatorios.

## Payloads reais do Auvo capturados e mapeados (2026-07-21)

`likelyRealEvents` passou de `0` para eventos reais de `CONTACT_NEW`, `CONTACT_UPDATE`, `SESSION_NEW`, `SESSION_UPDATE` e `SESSION_COMPLETE` (contato e atendimento reais criados pelo usuario, com apenas os 5 eventos do MVP habilitados no Auvo). Schema completo documentado em `docs/AUVO-INTEGRATION.md`, secao 12, por estrutura (nomes/tipos de campo), nunca por valor real.

Achado central, so possivel apos a captura real (confirma a decisao de nao presumir payload antes disso): **"Atendimento" nesta conta Auvo e uma sessao de conversa/chat** (WhatsApp/Instagram, com bot e/ou agente humano), identificada pelo `eventType` literal `SESSION_*`, nao uma ordem de servico tecnica com tecnico/equipamento/data de visita. Isso muda o desenho esperado da Caixa de Entrada: cada `SESSION_NEW` e uma nova conversa comercial aguardando triagem, nao uma visita agendada.

`nextOfficialStep` (via `npm run auvo:homologation:status`) permanece `capture_real_auvo_payloads` porque o script ainda usa o mesmo texto fixo de antes da captura — isso e apenas a mensagem do comando, nao reflete mais o estado real; o proximo passo genuino agora e gerar fixtures anonimizadas e iniciar o parser/Caixa de Entrada (Marco 7).

## Marco 7: Caixa de Entrada do Auvo (2026-07-21)

Implementado com dados reais, nao sinteticos. Migration `0015_criar_caixa_entrada_auvo` estende `crm_internal.auvo_inbox_items` (tabela ja existia desde o Marco 1, nunca usada) com campos de resolucao (`resolution`, `resolved_opportunity_id`, `resolved_customer_id`, `resolved_by`, `resolved_at`, `discard_reason`) e indices. Sem RLS/grants para `authenticated` — mesmo padrao de `auvo_webhook_events`, ja que `crm_internal` inteiro e revogado de `anon`/`authenticated` desde a migration `0006`; acesso exclusivamente pelo backend com RBAC proprio (`auvo_inbox:read`/`auvo_inbox:write`, novo, concedido a gestor e atendimento, nao a vendedor).

Parser (`server/crm/auvo-parser.ts`) + ingestao automatica no recebimento do webhook + 8 acoes de triagem via `POST /api/auvo-inbox/:id/resolve`. Detalhes completos do fluxo em `docs/AUVO-INTEGRATION.md`, secao 13.

Backfill unico rodado contra o banco real para reprocessar os eventos `SESSION_*` capturados antes deste codigo existir: 4 itens de triagem reais criados a partir de eventos ja armazenados, nenhum com cliente sugerido (nenhum dos contatos reais capturados ja existia como cliente no CRM, comportamento correto — sem falso positivo de mesclagem).

Validacao: `npm run typecheck`, `npm run test` (67 testes; novos: 4 do parser puro, 1 de listagem/RBAC/acoes de resolucao via fake repository, 1 de ingestao automatica ponta a ponta via webhook simulado com sugestao de cliente por telefone) e `npm run build` passaram. Verificado com Playwright contra o banco real: os 4 itens reais renderizaram corretamente (nome do contato, telefone, canal, sem sugestao falsa); fluxo de resolucao testado ponta a ponta com um item sintetico dedicado (criado e apagado so para o teste, para nao alterar a triagem real de clientes de verdade) — marcado como duplicado com motivo, confirmado na UI sem erros de console.

Decisoes de escopo registradas, nao esquecimentos: sem leitura da API Auvo (os campos do proprio webhook ja bastam); sem criacao de cliente novo embutida na tela de resolucao (reusa o formulario "Novo cliente" ja existente, evitando duplicar validacao de telefone/duplicidade em dois lugares); sem seletor de oportunidade existente na acao "vincular" (campo de texto livre para o ID por enquanto).

## Correcao: SESSION_* nao e fora de escopo (2026-07-21)

Durante o incidente do primeiro registro (18 eventos habilitados por engano), `SESSION_NEW`/`SESSION_UPDATE` apareceram misturados com eventos de mensagem, e foram classificados como fora de escopo por associacao (nao havia evidencia isolada do que representavam). Apagados junto com o resto do lote na limpeza daquele incidente.

Com apenas os 5 eventos do MVP habilitados, o usuario criou um contato de teste e um atendimento (criar/alterar/concluir). Os unicos eventos reais recebidos foram `CONTACT_NEW`, `CONTACT_UPDATE`, `SESSION_NEW`, `SESSION_UPDATE` e `SESSION_COMPLETE` — nenhum evento de mensagem, pagamento ou painel. Isso e evidencia forte de que `SESSION_*` e o nome real que o Auvo usa internamente para o conceito de "Atendimento" exibido na UI (`SESSION_NEW` = Atendimento criado, `SESSION_UPDATE` = Atendimento alterado, `SESSION_COMPLETE` = Atendimento concluido).

`SESSION_` removido de `OUT_OF_SCOPE_AUVO_EVENT_TYPE_PREFIXES` em `server/crm/prisma-repository.ts`. Os eventos `SESSION_*` desta captura ja tinham sido ignorados com payload descartado antes dessa correcao (por design: eventos fora de escopo nao tem o payload persistido) — pedido ao usuario para gerar mais uma acao de atendimento apos o deploy da correcao, para capturar o payload completo e documentar o schema real, em vez de presumir a estrutura.

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

## Hardening final: os 5 itens pendentes da secao "Nao feito nesta sessao" (2026-07-21)

Fecha os 5 itens registrados como pendentes no "Hardening final e E2E minimo" acima.

### Paginacao por cursor em clientes/oportunidades

`GET /api/customers` e `GET /api/opportunities` passaram a aceitar `?cursor=<id>&limit=<n>` (mesmo padrao ja usado por `/api/integrations/auvo/events` e `/api/notifications`: `id: {lt: cursor}` com `orderBy [chave, id desc]`, `take: limit + 1` para detectar `nextCursor`). Limite default 100 (igual ao comportamento anterior, sem regressao), maximo 200 por pagina. Resposta agora e `{ customers, nextCursor }` / `{ opportunities, nextCursor }` em vez de array cru — mudanca de contrato compativel, pois o frontend so lia `.customers`/`.opportunities`. UI recebeu botao "Carregar mais" nas duas listas (`src/App.tsx`) que acumula paginas no estado local. Teste novo: `paginates customers by cursor without repeating or skipping records` em `server/app.test.ts`.

### Rate limit em rotas autenticadas

`server/app.ts`: as rotas de `/api/me` e todas as de `registerCrmRoutes` passaram a rodar dentro de um contexto Fastify encapsulado com `@fastify/rate-limit` (`global: true`, 600 req/min por IP), isolado do rate limit especifico do webhook Auvo (60 req/min, ja existente). Mesma tecnica de encapsulamento ja usada para o webhook (registrar o plugin e as rotas no mesmo `app.register(async (instance) => {...})` para evitar o problema de ordenacao do avvio ja documentado nesta sessao).

### Auditoria formal de acessibilidade (WCAG)

`@axe-core/playwright` adicionado; `e2e/accessibility.spec.ts` varre login, tela principal autenticada e a secao de clientes/oportunidades contra as regras `wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`. Primeira execucao encontrou 25 violacoes automatizadas reduzveis a 3 causas-raiz reais: contraste insuficiente de `--foreground-muted` (4.41:1, corrigido para `#525f70`) e de `--warning` (4.22:1, corrigido para `#8a5306`) em `src/styles.css`, e dois `<select>` sem nome acessivel (filtro de eventos Auvo e seletor de papel na administracao de usuarios), corrigidos com `aria-label`. Apos as correcoes, as 3 execucoes passam com zero violacoes automatizadas. Detalhe completo, metodologia e pendencias de revisao manual (teclado, leitor de tela real, zoom 200%) em `docs/ACCESSIBILITY-AUDIT.md`.

### Runbook de incidentes e politica de backup

`docs/INCIDENT-RUNBOOK.md` (novo): politica de backup do Supabase (o que verificar no painel, pois este repositorio nao tem acesso a ele), e runbook para 6 tipos de incidente (banco fora do ar, migration travada, rotacao do segredo do webhook Auvo, deploy quebrado na Vercel, rate limit bloqueando usuario legitimo, exclusao indevida de dados). Distinto do `docs/HOMOLOGATION-RUNBOOK.md` existente, que cobre apenas setup inicial de homologacao, nao operacao de incidentes.

### Analise de plano de consulta nas queries de relatorios

`EXPLAIN (ANALYZE, BUFFERS)` real contra o Supabase de homologacao nas queries de `getCommercialReport`/`getCommercialCenter`. Com o volume atual (dezenas de linhas), tudo ja roda em <0.3ms com `Seq Scan` — comportamento correto do planejador, nao um problema. Foram encontrados 4 predicados sem indice dedicado (filtro de periodo em `oportunidades.created_at`, `oportunidades.archived_at+status+updated_at` do centro comercial, `clientes.archived_at+created_at`, `next_actions.category+status+completed_at`); indices criados em `database/migrations/0016_criar_indices_relatorios.sql` e aplicados contra o banco real, confirmados usaveis via `EXPLAIN` com `enable_seqscan = off`. Detalhe completo em `docs/QUERY-PERFORMANCE.md`.

### Validacoes

`npm run typecheck`, `npm test` (68 testes), `npm run build` e `npx playwright test` (11 specs, incluindo os 3 novos de acessibilidade) passaram apos todas as mudancas acima.

## Refatoracao de frontend — Fase 0: Auditoria (2026-07-21)

Executada em branch dedicada `refactor/frontend-design-system` (local, sem push), conforme `PROMPT-REFATORACAO-FRONTEND-ARTEC-CRM.md` secao 2 e 19. Nenhum codigo foi alterado nesta fase — apenas leitura e diagnostico.

Confirmado antes de assumir qualquer coisa (secao 2 do prompt): repositorio, remote (`github.com/GsilvaM/artec-crm.git`) e branch base (`main`) batem com o esperado; `git status` na base estava limpo (apenas os 3 `.md` de instrucao do usuario, nunca versionados por convencao desta sessao).

### Implementado e reutilizavel

- **Tokens ja centralizados em CSS custom properties** (`src/styles.css:1-18`): `--background`, `--surface`, `--surface-muted`, `--foreground`, `--foreground-muted`, `--border`, `--primary`, `--success`, `--warning`, `--danger`, `--info`, `--focus-ring`. Zero hex hardcoded ou `style={{}}` inline em `.tsx` (confirmado por busca no codigo) — a disciplina de "nao espalhar hex/medidas soltas" que o prompt pede na secao 7 ja existe na pratica, so falta formalizar espacamento/radius/sombra/motion/breakpoints como tokens tambem (hoje sao valores soltos repetidos).
- **RBAC e regras de negocio no frontend refletem o backend**: `src/domain/auth.ts` espelha o `Permission` do backend; nenhuma tela esconde acao sem o backend tambem bloquear (confirmado nos testes de API RBAC).
- **8 componentes ja extraidos de `App.tsx`**: `PipelineBoard`, `AdminPanel`, `QuotesPanel`, `ReportsPanel`, `AuvoInboxPanel` em `src/components/`, mais `format.ts` em `src/domain/` para evitar import circular. Sao um ponto de partida real para a extracao continuar.
- **Camada de API ja separada de UI**: `src/domain/crm.ts` concentra todas as chamadas HTTP tipadas; nenhum componente faz `fetch` direto.
- **Unica biblioteca de icones** (`lucide-react`), usada de forma consistente (`aria-hidden` nos icones decorativos, `aria-label` nos botoes so-com-icone) — ja em conformidade com a secao 12/25.5 do prompt.
- **2 breakpoints responsivos ja existem** (`max-width: 900px` e `max-width: 560px`, `src/styles.css:1391-1477`) cobrindo grid, sidebar, formularios e popover de notificacao — nao e responsividade zero, e uma base parcial.
- **Suite de testes real**: 68 testes Vitest (unit/integration) + 11 specs Playwright E2E contra ambiente real de homologacao, incluindo a auditoria de acessibilidade automatizada recem-adicionada (`e2e/accessibility.spec.ts`). Isso da uma rede de seguranca de regressao para a refatoracao.

### Problemas de arquitetura

- **`src/App.tsx` tem 1410 linhas** e concentra: todo o estado da aplicacao (~20 `useState`), toda a logica de fetch/refresh, todos os handlers de formulario (cliente, oportunidade, atividade, proxima acao, aprovacao, perda), e a renderizacao de praticamente todas as secoes (Central Comercial, Clientes, Oportunidades, Pipeline, Auvo admin, notificacoes, busca). E exatamente o monolito que a secao 3 e 11 do prompt preveem auditar.
- **Nao ha roteamento** (`react-router` nao esta instalado; `src/main.tsx` so renderiza `<App />` sem `BrowserRouter`). Toda a aplicacao vive em uma unica URL (`/`), com secoes empilhadas verticalmente e reveladas por scroll/permissao, nao por navegacao. A sidebar (`src/App.tsx:596`) tem um unico item de menu ("Clientes e oportunidades"), sempre marcado como `active`, sem funcao de navegacao real — e decorativa, nao um `Sidebar` funcional. Isso contradiz diretamente a secao 11 (rotas esperadas: `/inicio`, `/clientes`, `/oportunidades`, `/funil`, `/proximas-acoes`, `/notificacoes`, `/configuracoes/integracoes/auvo`) e o padrao de navegacao da secao 12.
- **`docs/DESIGN-SYSTEM.md` atual e aspiracional, nao real**: propoe shadcn/ui, Tailwind, Radix UI, TanStack Table, dnd-kit e Sonner — nenhuma dessas bibliotecas esta instalada (`package.json` confirmado: so `react`, `react-dom`, `lucide-react`, `zod`, `vite`, `vitest`). A stack real e CSS puro com custom properties, sem router, sem state manager, sem biblioteca de componentes. A secao 2 do prompt e explicita sobre isso: "confirme... nao assuma". `docs/DESIGN-SYSTEM.md` precisa ser reescrito para descrever o que existe de fato, nao o que foi planejado antes da implementacao real.
- **Sem gerenciador de estado nem cliente de dados** (sem Context global, sem React Query/SWR): cada refresh e um `Promise.all` manual disparado por handlers espalhados por `App.tsx`. Funciona hoje pelo volume de dados baixo, mas gera bastante codigo repetido de loading/erro.
- **Nenhuma estrutura de pastas por feature**: tudo em `src/App.tsx` + `src/components/` plano + `src/domain/` plano. Nao ha `src/features/*`, `src/hooks/`, `src/lib/` como a secao 11 sugere (adaptavel, nao obrigatorio ao pe da letra, mas a ausencia total de subdivisao e o problema real).

### Problemas visuais

- **Paleta funcional mas nao "colorida" no sentido da secao 7**: hoje e majoritariamente neutra (`--background: #f5f7fa`, `--surface: #ffffff`) com cor semantica so em badges/alertas. Nao ha cor de marca proprio-Artec definida (navy premium de sidebar, azul royal de acao primaria etc. da secao 7) alem do `--primary: #0f5f75` atual (um azul petroleo neutro). Nenhum logo/asset de marca real foi encontrado no repositorio para derivar paleta — vai precisar ser definida do zero, documentada como decisao de design (a propria secao 7 preve esse caminho quando nao ha marca disponivel).
- **Sidebar sem a largura/tratamento premium pedido na secao 7** (260-280px, item ativo com fundo solido arredondado): a sidebar atual e simples, sem essa identidade visual, e como notado acima, tem apenas 1 item.
- **Tabelas cruas (`<table>`) sem tratamento de `DataTable`**: listas de clientes e oportunidades (`src/App.tsx:982-1039`) sao tabelas HTML simples sem header sticky, sem estado de ordenacao visual, sem densidade configurada — funcionais, mas exatamente o "planilha disfarcada" que `AGENTS.md` pede para evitar.
- **Sem tokens de espacamento/radius/sombra/motion/z-index/breakpoint** — cada componente define seus proprios valores de `padding`/`gap`/`border-radius` diretamente (nao violam a regra de "nao usar hex solto", mas violam a de tokens de espacamento consistentes da secao 7).

### Problemas de UX

- **Sem pagina/URL propria por contexto**: como nao ha roteamento, nao e possivel copiar/compartilhar um link direto para um cliente, oportunidade ou filtro especifico — todo estado de navegacao se perde ao recarregar a pagina. Isso contradiz a secao 11 ("nao quebrar deep links") pela ausencia total deles hoje.
- **Central Comercial nao e a tela inicial isolada**: hoje ela e uma secao entre outras na mesma pagina longa, nao a primeira coisa que o usuario ve isolada ao entrar, como a secao 10.1 exige ("deve ser a tela inicial de operacao").
- **Fluxo de follow-up funcional mas dependente de scroll manual** ate a secao de proximas acoes dentro da pagina unica, sem atalho direto por notificacao/link.
- **Nao ha indicador de "oportunidade parada" (deal rotting)** mencionado na secao 6 (Close/Attio) — o backend ja calcula `stalledOpportunities` no centro comercial, mas o cartao do Pipeline (`PipelineBoard.tsx`) nao exibe esse sinal visualmente no kanban em si, so na lista do centro comercial.
- **Visita tecnica nao tem fluxo proprio** (secao 10.3.1): hoje e so mais um tipo de proxima acao/atividade, sem tela de agenda dedicada, confirmacao rapida ou geracao de orcamento no mesmo fluxo.

### Problemas de acessibilidade

Cobertos com profundidade em `docs/ACCESSIBILITY-AUDIT.md` (auditoria automatizada ja executada e corrigida nesta sessao, antes da refatoracao comecar). Resumo relevante para a Fase 3 desta refatoracao:
- Zero violacoes automatizadas atuais (axe-core, WCAG 2.0/2.1 A/AA) apos as correcoes de contraste e `aria-label` ja aplicadas.
- Pendencias que so revisao manual cobre: navegacao por teclado ponta a ponta, teste com leitor de tela real, gerenciamento de foco ao abrir/fechar paineis, zoom 200%, `prefers-reduced-motion` (hoje irrelevante porque nao ha animacao nao-trivial, mas passa a importar assim que a Fase 1/4 desta refatoracao introduzir motion).

### Problemas de responsividade

- **Tabelas sem alternativa mobile**: `<table>` de clientes/oportunidades nao tem breakpoint que troque para cards/rows empilhados (secao 10.5/13 exigem isso). Em viewport estreito (360x800), essas tabelas devem causar overflow horizontal ou compressao ilegivel — nao testado visualmente ainda nesta auditoria (Fase 3 fara a validacao formal nos 7 breakpoints da secao 13), mas o CSS atual nao tem nenhuma regra que resolva isso.
- **Pipeline/kanban sem visao mobile dedicada**: a secao 10.6 pede lista/etapa selecionavel em mobile em vez de kanban horizontal; hoje `PipelineBoard` nao tem esse modo alternativo.
- **Sidebar em mobile vira apenas `position: static`** (empilha no topo), nao um drawer como a secao 13 pede.
- **Sem breakpoints documentados como tokens**: os 2 breakpoints existentes sao valores soltos (`900px`, `560px`) dentro de `@media`, nao constantes nomeadas nem alinhadas aos 7 breakpoints de validacao da secao 13 (360x800 ate 1920x1080).

### Dependencias e riscos

- **Nenhuma biblioteca de UI/roteamento esta instalada** — qualquer decisao de adicionar `react-router` (necessario para atender a secao 11 de forma real) e uma mudanca de stack relevante. Pela secao 27 do proprio prompt, isso e um dos gatilhos explicitos para "parar e informar antes de agir": *"mudanca relevante de stack"*. Portanto, antes de instalar `react-router` (ou qualquer outra dependencia nova) na Fase 1/2, isso sera reportado especificamente como uma decisao a validar, e nao apenas assumido.
- **Nenhum manifest PWA, service worker, icone de app ou `<link rel="apple-touch-icon">` existe hoje** (`index.html` confirmado minimo, sem tema, sem manifest; sem diretorio `public/`). A secao 25 exige isso — sera construido do zero na Fase 1/4, incluindo gerar o conjunto de icones a partir de uma fonte SVG (nao existe logo/asset de marca no repositorio hoje; sera necessario um simbolo proprio simples, documentado como decisao de design, ja que a secao 7 preve esse caminho quando nao ha marca disponivel).
- **Suite E2E real usa o mesmo banco Supabase de homologacao/producao** (nao ha banco de teste isolado, decisao ja registrada em sessao anterior) — qualquer regressao introduzida pela refatoracao que quebre um fluxo critico sera pega pelos 11 specs existentes, mas a suite continua gravando dados reais prefixados a cada execucao (divida tecnica ja conhecida, nao desta fase).
- **`AGENTS.md`/backend nao preveem paginas separadas** — nenhuma rota do backend depende de URL de frontend, entao introduzir roteamento no cliente e seguro do ponto de vista de contrato de API; o risco e puramente de frontend (estado perdido durante a migracao se feita de forma abrupta).

### Plano de migracao

Migracao incremental, sem big-bang, preservando `App.tsx` funcional a cada passo (renderizacao condicional continua existindo até a extracao de cada secao estar validada):

1. **Fase 1 (proxima)**: fundacao do design system — tokens completos (espacamento, radius, sombra, motion, z-index, breakpoints, altura de controles, largura de sidebar) formalizados em `src/styles.css` (ou `src/styles/tokens.css` se a extracao de arquivo se justificar), tipografia, botoes, campos, badges, cards, feedback (empty/loading/error), shell e navegacao. Nesta fase, decidir e reportar explicitamente (nao assumir) se `react-router` entra ja aqui ou so quando a extracao por rota comecar de fato na Fase 2.
2. **Fase 2**: extrair e refazer visualmente, na ordem obrigatoria da secao 19: Central Comercial, Proximas Acoes, Ficha de Oportunidade, Ficha de Cliente, Listas, Notificacoes, Pipeline, Auvo admin — cada uma virando seu proprio modulo/rota, saindo de dentro de `App.tsx` progressivamente.
3. **Fase 3**: responsividade formal nos 7 breakpoints + acessibilidade manual (teclado, foco, ARIA, leitor de tela, `prefers-reduced-motion`).
4. **Fase 4**: PWA completo (manifest, service worker, icones, `beforeinstallprompt`), qualidade e E2E (specs novos cobrindo os fluxos da secao 20, Lighthouse/instalabilidade).

Ao final de cada fase: rodar validacoes (`typecheck`, `test`, `build`, `e2e` quando aplicavel), commit local na branch (sem push), resumo curto, e pausa para validacao humana antes da proxima fase — conforme exigido explicitamente pela secao 19 do prompt, inclusive apos esta propria Fase 0.

### Estado ao final da Fase 0

Auditoria concluida. Nenhum arquivo de codigo foi alterado. Aguardando validacao humana antes de iniciar a Fase 1 (fundacao do design system), incluindo uma decisao explicita sobre introduzir ou nao `react-router` nesta refatoracao, ja que é uma mudança de stack e o prompt pede para reportar isso antes de agir.

## Refatoracao de frontend — Fase 2.7/2.8: Funil, Integracao Auvo, Caixa Auvo, Relatorios e Administracao (2026-07-22)

Autorizacao do usuario para prosseguir sem pausa entre fases ate o fim da refatoracao ("va ate o fim do projeto, tem liberdade"). Continuando a partir da Fase 2.6 (Notificacoes), que ja estava concluida e commitada.

Achado ao auditar o estado real antes de codar: `PipelineBoard`, `AdminPanel`, `ReportsPanel` e `AuvoInboxPanel` ja usavam integralmente o vocabulario visual estabelecido nas Fases 1/2.1-2.6 (`panel`, `badge`, `button primary/secondary/ghost`, `table-wrap`, `admin-grid`, `metric-card`, `filter-actions`, `eyebrow`) — nao precisavam de redesenho visual. O problema era puramente arquitetural: a Sidebar ja linkava para `/pipeline` e `/configuracoes/integracoes/auvo`, mas essas rotas nao existiam em `<Routes>`; ambas caiam no catch-all `*`, que renderizava `AuthenticatedApp`, um componente de ~450 linhas com o quadro do funil, a area administrativa do Auvo, a Caixa de Entrada Auvo, o painel de administracao, o painel de relatorios, e formularios genericos de atividade/proxima acao duplicados — tudo empilhado numa unica pagina, sem navegacao real entre essas areas.

Trabalho desta fatia:

- **`PipelinePage`** (`src/features/pipeline/PipelinePage.tsx`, rota `/pipeline`): usa `loadCrmSnapshot()` (mesma chamada que ja existia) e cruza `commercialCenter.stalledOpportunities` com as oportunidades do quadro para acender um badge "parada" por card — item que a Fase 0 tinha registrado como gap ("o backend ja calcula stalledOpportunities... mas o cartao do Pipeline nao exibe esse sinal"). Fechado sem chamada extra ao backend.
- **`PipelineBoard`** refeito: os botoes de aprovar/perder direto no card (que dependiam de `window.prompt` para valor/data — UX abaixo do padrao ja estabelecido no resto do produto) foram removidos em favor de um botao "Abrir oportunidade" que navega para `/oportunidades/:id`, onde o fluxo de aprovacao/perda ja existe completo, validado e testado (`OportunidadePage`). Evita duplicar regra de negocio de aprovacao em dois lugares com qualidades diferentes (violaria a regra "nao duplicar logica de dominio no frontend"). Mover de etapa via `<select>` continua inline no card (acessivel por teclado, decisao ja tomada no Marco do Pipeline).
- **Visao mobile do funil**: adicionada faixa de abas por etapa (`.pipeline-mobile-tabs`, reaproveitando o estilo `.segmented-control` ja existente) visivel só em `max-width: 767px`; nesse breakpoint o quadro deixa de rolar horizontalmente e mostra uma coluna por vez via `data-mobile-hidden`. Fecha o gap "Pipeline/kanban sem visao mobile dedicada" da secao 10.6/Fase 0.
- **`AuvoAdminPage`** (rota `/configuracoes/integracoes/auvo`): status + eventos + detalhe sanitizado, extraido do catch-all sem mudanca de comportamento.
- **`CaixaAuvoPage`** (rota nova `/caixa-auvo`), **`RelatoriosPage`** (rota nova `/relatorios`) e **`AdministracaoPage`** (rota nova `/configuracoes/administracao`): cada uma carrega so os dados que o painel correspondente precisa (clientes ativos; etapas; etapas), em vez de depender do snapshot gigante carregado por `AuthenticatedApp`.
- **Sidebar** ganhou os itens "Relatorios", "Caixa Auvo" e "Administracao", cada um condicionado a sua permissao real (`reports:read`, `auvo_inbox:read`, `users:manage`) da mesma forma que "Integracao Auvo" ja era condicionado a `integrations:read`.
- **`AuthenticatedApp` removido inteiramente de `App.tsx`** (formularios genericos de "Registrar atividade"/"Criar proxima acao" e a "Linha do tempo" solta no fim da pagina): eram redundantes — `OportunidadePage` e `ClientePage` ja tem seus proprios formularios de atividade/proxima acao contextuais desde as Fases 2.3/2.4. `App.tsx` caiu de ~600 para ~185 linhas e agora so contem as telas de autenticacao e a tabela de rotas.
- **`EmptyState`** ganhou suporte a `children` opcional (usado pela nova pagina 404 dentro do shell autenticado, com link de volta para a Central Comercial) — antes nao existia pagina para rotas invalidas, o catch-all sempre renderizava o dashboard inteiro.

Validacao:

- `npm run typecheck`, `npm run test` (69 testes) e `npm run build` passaram sem alteracao de contrato de API/backend nesta fatia (mudanca 100% frontend).
- 4 specs E2E que assumiam o layout antigo empilhado numa unica pagina foram corrigidas para navegar pelas rotas reais novas (`customer-and-opportunity.spec.ts`, `admin.spec.ts`, `auvo-inbox.spec.ts`, `commercial-center-and-reports.spec.ts`).
- 6 novos specs de acessibilidade automatizada (`e2e/accessibility.spec.ts`) cobrindo Pipeline, Relatorios, Administracao, Caixa Auvo e Integracao Auvo — zero violacoes WCAG 2.0/2.1 A/AA automatizadas.
- Suite completa: `npx playwright test` — 19 specs originais + 6 novos de acessibilidade = todos passando contra o ambiente real de homologacao (mesmo Supabase da producao, criterio ja estabelecido no projeto).
- Aviso do Vite no build (`assets/index-*.js 549 kB`) registrado como pendencia de performance para a Fase 4 (code-splitting por rota), nao um bloqueio funcional.

Nao alterado nesta fatia: nenhum endpoint de backend, nenhuma migration, nenhuma regra de negocio. Commit local criado na branch `refactor/frontend-design-system`, sem push.

### Proximo passo

Fase 3 (responsividade formal nos breakpoints documentados + revisao manual de acessibilidade) e Fase 4 (PWA completo, code-splitting por rota, validacao final).
