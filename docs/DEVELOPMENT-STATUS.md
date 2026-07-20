# Development Status

Atualizado em: 2026-07-20

## Escopo desta homologacao

- Repositorio: `C:\Users\Artec Climatizados\Desktop\artec-crm`
- Remote esperado: `https://github.com/GsilvaM/artec-crm.git`
- Branch: `main`
- Base local observada: `08c9ee1 chore: extract artec crm project`
- Marco trabalhado: Foundation conectada e homologada no Supabase/PostgreSQL via Prisma.
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

## Validacoes executadas

- `npm run db:migrate:status`: passou, todas as migrations aplicadas.
- `npm run prisma:format`: passou.
- `npm run prisma:validate`: passou.
- `npm run prisma:generate`: passou.
- `npm run typecheck`: passou.
- `npm run test`: passou, 4 arquivos e 27 testes.
- `npm run build`: passou.
- E2E: nao executado porque nao existe script `e2e` ou Playwright no `package.json`.

## Nao alterado

- Nenhuma alteracao de autenticacao fora do uso previsto de Supabase JWT e membership.
- Nenhum commit ou push.
- Nenhum valor sensivel registrado.
- Nenhum objeto financeiro foi alterado.
- Nenhuma integracao Auvo foi iniciada.

## Marcos

- Marco 1, Homologacao conectada da Fundacao: concluido e homologado.
- Marco 2, Clientes e Oportunidades: proximo marco recomendado.

## Proximo marco

Homologar Clientes e Oportunidades com banco real:

1. Login no frontend com o usuario gestor.
2. Criar, listar, buscar, editar, arquivar e restaurar clientes.
3. Criar, editar, aprovar, perder, arquivar e restaurar oportunidades.
4. Validar auditoria, RBAC e ausencia de qualquer efeito financeiro.

