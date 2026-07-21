# Artec CRM - Matriz de acesso

Atualizado em: 2026-07-21

## Principios

- O frontend usa Supabase Auth apenas para login e obtencao do access token.
- O backend Fastify valida o access token e consulta `crm.user_memberships`.
- O frontend nunca recebe `CRM_DATABASE_URL`, service role, token Auvo ou segredo de webhook.
- O schema `crm_internal` e exclusivo do backend, jobs e migrations.
- Nenhum objeto do CRM deve ser criado no schema `public`.
- Nenhuma tabela, view, funcao ou foreign key do CRM deve apontar para objetos financeiros.

## Schemas

| Schema | Uso | Acesso navegador | Acesso backend | Observacao |
| --- | --- | --- | --- | --- |
| `crm` | Dados funcionais do CRM | Somente via RLS e grants minimos para usuarios autenticados | Sim | A autorizacao definitiva para APIs fica no backend. |
| `crm_internal` | Webhooks, jobs, logs, migrations | Nao | Sim | Grants removidos de `anon` e `authenticated`. |
| `public` | Fora do escopo do CRM | Nao criar objetos CRM | Nao usar para CRM | Pertence ao projeto existente/Supabase. |

## Tabelas Funcionais

| Tabela | Gestor | Vendedor | Atendimento | Navegador direto | Backend |
| --- | --- | --- | --- | --- | --- |
| `crm.user_memberships` | Leitura e administracao | Leitura propria | Leitura propria | `SELECT` via RLS | Leitura para auth/RBAC |
| `crm.clientes` | Leitura/escrita | Leitura/escrita futura | Leitura/escrita futura | RLS ativa | Futuro CRUD |
| `crm.etapas_funil` | Leitura | Leitura | Leitura | RLS ativa | Futuro funil |
| `crm.motivos_perda` | Leitura | Leitura | Leitura | RLS ativa | Futuro fechamento |
| `crm.oportunidades` | Todas | Proprias | Triagem/atribuicao futura | RLS ativa | Futuro CRUD |
| `crm.atividades` | Leitura/escrita | Proprias e das oportunidades sob responsabilidade | Atendimento conforme escopo | RLS ativa | Linha do tempo funcional |
| `crm.next_actions` | Todas | Proprias | Atendimento conforme escopo | RLS ativa | Acompanhamento e follow-ups |
| `crm.audit_log` | Leitura | Nao | Nao | RLS gestor | Backend grava futuramente |
| `crm.notificacoes` | Proprias | Proprias | Proprias | RLS por usuario | Futuras notificacoes |

## Tabelas Internas

| Tabela | Navegador direto | Backend | Observacao |
| --- | --- | --- | --- |
| `crm_internal.migration_history` | Nao | Runner de migrations | Historico com checksum. |
| `crm_internal.auvo_webhook_events` | Nao | Receptor de homologacao Auvo | Persistir payload bruto, hash e headers sanitizados; expor ao frontend apenas via API admin com payload sanitizado. |
| `crm_internal.auvo_inbox_items` | Nao | Futuro processamento Auvo | Nao usar antes de payloads reais e Caixa de Entrada definitiva. |
| `crm_internal.auvo_sync_jobs` | Nao | Futuro worker | Nao usar antes da fase Auvo. |
| `crm_internal.integration_logs` | Nao | Backend/admin | Nao expor payload sensivel. |

## Administracao (rotas `/api/admin/*`, exclusivas de gestor)

- Backend le `auth.users` (id, email) via `CRM_DATABASE_URL` para listar candidatos a membership. Confirmado por teste direto: o role usado pela conexao Postgres do backend tem `SELECT` em `auth.users` (mesmo projeto Supabase). Nenhum service role foi adicionado; a leitura usa a mesma credencial de banco ja existente.
- `crm.etapas_funil`: `nome` e `ordem` sao `UNIQUE` no schema. Etapas terminais (`is_terminal = true`: hoje `Aprovado`, `Concluido` e `Perdido`) nao podem ser renomeadas via API, porque `approveOpportunity`/`loseOpportunity` localizam a etapa por nome exato (`getStageIdByName`). Reordenar etapas terminais e permitido.
- `crm.motivos_perda`: sem exclusao definitiva pela API; apenas `is_active` (soft-disable), preservando historico de oportunidades ja perdidas com aquele motivo.
- `crm.user_memberships`: upsert via `/api/admin/users/:userId/membership`. Um gestor nao pode desativar a propria membership (bloqueio de auto-exclusao). Nao existe fluxo de convite/criacao de conta Supabase pela API — usuarios novos continuam sendo criados manualmente no painel do Supabase Auth (fora do escopo, exigiria service role).

## Funcoes Security Definer

| Funcao | Search path | Exposta para | Uso |
| --- | --- | --- | --- |
| `crm.is_active_member()` | `crm, pg_temp` | `authenticated` | RLS para usuario com membership ativa. |
| `crm.current_member_role()` | `crm, pg_temp` | `authenticated` | RLS por papel. |
| `crm.has_role(text)` | `crm, pg_temp` | `authenticated` | RLS de gestor. |

Todas as funcoes `security definer` devem manter `search_path` explicito e minimo.

## Escopo operacional

- Gestor visualiza e opera todos os clientes, oportunidades, atividades e proximas acoes.
- Vendedor localiza clientes para evitar duplicidade, mas oportunidades e proximas acoes ficam restritas ao responsavel no backend e nas policies aplicaveis.
- Atendimento pode registrar historico de garantia, suporte e pos-venda sem criar oportunidade automaticamente.
- Auditoria tecnica deve usar `created_by` e `updated_by` definidos pelo backend a partir do token Supabase validado. Nao confiar em `current_user` do banco como identidade do usuario da aplicacao.
