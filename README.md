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
- `npm run db:migrate`: aplica migrations do CRM.
- `npm run db:migrate:status`: consulta status das migrations.

## Variaveis

Copie `.env.example` para `.env.local` no ambiente local e nunca versione segredos.

- Frontend: `VITE_CRM_SUPABASE_URL`, `VITE_CRM_SUPABASE_ANON_KEY`, `VITE_CRM_API_URL`.
- Backend: `CRM_SUPABASE_URL`, `CRM_SUPABASE_ANON_KEY`, `CRM_DATABASE_URL`, `CRM_ALLOWED_ORIGINS`, `CRM_PORT`, `CRM_LOG_LEVEL`.
- Segredos nunca devem usar prefixo `VITE_`.

## Limites

- Autenticacao: Supabase Auth.
- Autorizacao real: backend, consultando `crm.user_memberships`.
- Schemas permitidos: `crm` e `crm_internal`.
- `crm_internal` nao deve receber grants diretos para frontend.
- Sem integracao financeira.
- Sem Auvo nesta fase.

## Homologacao

Use `docs/HOMOLOGATION-RUNBOOK.md`. A Fundacao nao esta aprovada ate as migrations reais serem aplicadas, uma membership real de gestor existir e os testes de autorizacao passarem em ambiente conectado.
