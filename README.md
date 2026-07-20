# Artec CRM

CRM comercial independente da Artec Ambientes Climatizados. Este projeto nao deve importar codigo, tabelas, migrations, services ou rotas financeiras do Artec Gestao.

## Scripts

- `npm run dev`: frontend Vite.
- `npm run dev:frontend`: frontend Vite.
- `npm run dev:server`: backend Fastify em TypeScript.
- `npm run build`: build do frontend e backend.
- `npm run start:server`: executa o backend compilado.
- `npm run typecheck`: valida TypeScript.
- `npm run test`: executa testes automatizados.
- `npm run prisma:generate`: gera o Prisma Client usado pelo backend.
- `npm run prisma:validate`: valida `prisma/schema.prisma`.
- `npm run prisma:format`: formata `prisma/schema.prisma`.
- `npm run notifications:reconcile`: reconcilia notificacoes internas de forma idempotente.
- `npm run auvo:homologation:status`: mostra um diagnostico seguro da captura de webhooks Auvo, sem exibir segredo, headers ou payloads.
- `npm run auvo:fixtures:export`: exporta payloads Auvo reais capturados para fixtures anonimizadas em `tmp/auvo-fixtures`.
- `npm run db:migrate`: aplica migrations do CRM.
- `npm run db:migrate:status`: consulta status das migrations.

## Variaveis

Copie `.env.example` para `.env.local` no ambiente local e nunca versione segredos.

- Frontend: `VITE_CRM_SUPABASE_URL`, `VITE_CRM_SUPABASE_ANON_KEY`, `VITE_CRM_API_URL`.
- Backend: `CRM_SUPABASE_URL`, `CRM_SUPABASE_ANON_KEY`, `CRM_DATABASE_URL`, `CRM_ALLOWED_ORIGINS`, `CRM_PORT`, `CRM_LOG_LEVEL`, `AUVO_WEBHOOK_SECRET`.
- Segredos nunca devem usar prefixo `VITE_`.

## Limites

- Autenticacao: Supabase Auth.
- Autorizacao real: backend, consultando `crm.user_memberships`.
- Runtime do backend: Prisma Client com driver adapter PostgreSQL.
- Migrations: runner SQL proprio com `pg`, checksum, advisory lock e `crm_internal.migration_history`.
- Schemas permitidos: `crm` e `crm_internal`.
- `crm_internal` nao deve receber grants diretos para frontend.
- Sem integracao financeira.
- Auvo somente em receptor de homologacao nesta fase; sem criacao automatica de cliente, oportunidade ou financeiro.

## Prisma e migrations

O Prisma ORM e a camada oficial de conexao e acesso a dados do backend operacional. O schema Prisma mapeia somente `crm` e `crm_internal`, sem mapear schemas financeiros ou tabelas do Supabase Auth como entidades editaveis.

As migrations SQL existentes em `database/migrations` continuam sendo o mecanismo oficial de evolucao do banco. Nao usar Prisma Migrate, `prisma migrate`, `prisma db push`, pasta `prisma/migrations` ou tabela `_prisma_migrations` nesta fase. O runner SQL existente permanece usando `pg` porque controla advisory lock, checksums e historico proprio.

## APIs do marco Clientes e Oportunidades

Todas exigem `Authorization: Bearer TOKEN_SUPABASE` e membership ativa no CRM.

- `GET /api/customers`, `POST /api/customers`, `GET/PATCH /api/customers/:id`.
- `POST /api/customers/:id/archive` e `POST /api/customers/:id/restore`.
- `GET /api/opportunities`, `POST /api/opportunities`, `GET/PATCH /api/opportunities/:id`.
- `POST /api/opportunities/:id/approve`, `POST /api/opportunities/:id/lose`, `POST /api/opportunities/:id/archive`.
- `GET /api/pipeline-stages` e `GET /api/loss-reasons`.

Oportunidades ativas exigem responsavel, proxima acao e data da proxima acao no frontend, na API e no banco. Aprovacao comercial exige valor aprovado, forma de pagamento, parcelas e previsao de execucao, sem criar qualquer registro financeiro.

## APIs do marco Atividades e Proximas Acoes

Todas exigem token Supabase valido e membership ativa.

- `GET /api/customers/:id/activities` e `GET /api/opportunities/:id/activities`.
- `POST /api/activities`, `PATCH /api/activities/:id`, `POST /api/activities/:id/archive`.
- `GET /api/next-actions`, `GET /api/next-actions/:id`, `POST /api/next-actions`, `PATCH /api/next-actions/:id`.
- `POST /api/next-actions/:id/complete`, `POST /api/next-actions/:id/postpone`, `POST /api/next-actions/:id/cancel`.

`crm.next_actions` preserva historico de acoes pendentes, concluidas, reagendadas e canceladas. Durante a compatibilidade com o marco anterior, `crm.oportunidades.current_next_action_id` aponta para a acao pendente atual e os campos legados `proxima_acao`/`proxima_acao_em` sao mantidos sincronizados pelo backend.

Auditoria tecnica usa `created_by` e `updated_by` definidos exclusivamente pelo backend a partir do usuario autenticado. O frontend nao envia o autor da auditoria.

## APIs do marco Notificacoes Internas

Todas exigem token Supabase valido e membership ativa.

- `GET /api/notifications`.
- `GET /api/notifications/unread-count`.
- `POST /api/notifications/:id/read`.
- `POST /api/notifications/read-all`.
- `POST /api/notifications/:id/archive`.
- `POST /api/notifications/:id/snooze`.
- `POST /api/notifications/reconcile`, restrito a `gestor` para homologacao.

As notificacoes sao persistentes, especificas por usuario e deduplicadas por condicao aberta. A reconciliacao pode ser chamada manualmente por `npm run notifications:reconcile` e futuramente por scheduler externo. Nao ha e-mail, WhatsApp ou push web nesta fase; o Auvo existe apenas como receptor de homologacao.

## APIs do marco Auvo Homologacao

O receptor publico usa segredo apenas no backend:

- `POST /api/webhooks/auvo/:secret`.

O endpoint aceita somente JSON, aplica limite de tamanho, sanitiza headers, calcula hash canonico do payload, deduplica por hash e persiste o evento bruto em `crm_internal.auvo_webhook_events`. Ele responde rapidamente e nao chama a API do Auvo antes da resposta.

As APIs administrativas exigem token Supabase valido, membership ativa e permissao de gestor:

- `GET /api/integrations/auvo/status`.
- `GET /api/integrations/auvo/events`.
- `GET /api/integrations/auvo/events/:id`.
- `POST /api/integrations/auvo/events/:id/reprocess`.
- `POST /api/integrations/auvo/events/:id/ignore`.

Esta fase nao interpreta eventos reais, nao cria cliente, nao cria oportunidade, nao grava financeiro e nao sincroniza dados de volta para o Auvo.

## Homologacao

Use `docs/HOMOLOGATION-RUNBOOK.md`. A Fundacao nao esta aprovada ate as migrations reais serem aplicadas, uma membership real de gestor existir e os testes de autorizacao passarem em ambiente conectado.
