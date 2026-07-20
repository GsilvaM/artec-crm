# Auditoria do repositorio para o Artec CRM

Data: 2026-07-20

## Stack identificada

- Aplicacao CRM: React 19, TypeScript, Vite 6, Supabase Auth, Fastify, PostgreSQL/Supabase, Vitest.
- Gerenciador: npm, com `package-lock.json` proprio.
- Backend do CRM: `server/`, com Fastify, autenticacao por Bearer token Supabase e RBAC centralizado.
- Frontend do CRM: `src/`, com checagem UX baseada em `/api/me`.

## Scripts do projeto CRM

- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm run test`
- `npm run db:migrate`
- `npm run db:migrate:status`

## Limite protegido do financeiro

O Artec Gestao permanece em projeto separado. O CRM nao deve importar dominios financeiros, consultar tabelas financeiras, usar services financeiros, alterar migrations financeiras ou depender de runtime do sistema financeiro.

## Decisao de estrutura

O CRM foi extraido para `C:\Users\Artec Climatizados\Desktop\artec-crm` como projeto independente. As instrucoes especificas ficam em `AGENTS.md` na raiz deste projeto.

## Scripts do CRM

O CRM possui `package.json` proprio com:

- `npm run dev`
- `npm run dev:frontend`
- `npm run dev:server`
- `npm run build`
- `npm run build:frontend`
- `npm run build:server`
- `npm run start:server`
- `npm run typecheck`
- `npm run test`
- `npm run db:migrate`
- `npm run db:migrate:status`
- `npm run db:migrate:create -- nome_da_migration`

## Banco e autenticacao do CRM

Decisao atual: usar o mesmo projeto Supabase e o mesmo PostgreSQL, mas com schemas isolados:

- `crm` para dados funcionais.
- `crm_internal` para eventos internos, logs, jobs e historico de migrations.

A autenticacao usa Supabase Auth do mesmo projeto. Acesso ao CRM depende de registro ativo em `crm.user_memberships`; usuario existente no Artec Gestao nao recebe acesso automatico. O frontend usa envs proprias (`VITE_CRM_SUPABASE_URL` e `VITE_CRM_SUPABASE_ANON_KEY`) e a conexao de migration usa `CRM_DATABASE_URL`.

O backend proprio fica em `server`, usa Fastify, valida o token Supabase recebido em `Authorization: Bearer`, consulta `crm.user_memberships`, deriva permissoes por RBAC centralizado e expoe `GET /api/health` e `GET /api/me`. O Vite nao e health check definitivo; ele apenas faz proxy local para `/api`.

As migrations ficam em `database/migrations/`, com runner proprio, checksum, lock e historico em `crm_internal.migration_history`. Nenhuma migration do Prisma financeiro foi alterada.

## Confirmacao de separacao

Nenhuma conexao com o financeiro foi criada. Nenhum arquivo de `src/`, `prisma/`, API financeira, autenticacao Supabase, migrations financeiras, `package.json` raiz ou lockfile foi alterado para implementar esta primeira fatia.
