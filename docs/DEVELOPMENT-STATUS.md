# Development Status

Atualizado em: 2026-07-20

## Escopo desta homologacao

- Repositorio: `C:\Users\Artec Climatizados\Desktop\artec-crm`
- Remote esperado: `https://github.com/GsilvaM/artec-crm.git`
- Branch: `main`
- Base local observada: `08c9ee1 chore: extract artec crm project`
- Marco trabalhado: Clientes e Oportunidades com banco real.
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
- `npm run test`: passou, 4 arquivos e 31 testes.
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
- Marco 2, Clientes e Oportunidades: concluido e homologado por API/backend/banco; validacao visual automatizada limitada pela ausencia de Playwright/E2E.
- Marco 3, Atividades e Proximas Acoes: proximo marco recomendado.

## Proximo marco

Homologar e expandir Atividades + Proximas Acoes sem iniciar Central Comercial, Notificacoes, Auvo, Relatorios ou financeiro.
