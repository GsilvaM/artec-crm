# Artec CRM - Runbook de homologacao da Fundacao

Atualizado em: 2026-07-20

## 1. Configurar variaveis sem versionar segredos

Crie `.env.local` na raiz deste projeto ou configure variaveis no provedor de deploy. Nao edite `.env.example` com valores reais.

Obrigatorias para frontend:

```bash
VITE_CRM_SUPABASE_URL=
VITE_CRM_SUPABASE_ANON_KEY=
VITE_CRM_API_URL=
```

Obrigatorias para backend e migrations:

```bash
CRM_SUPABASE_URL=
CRM_SUPABASE_ANON_KEY=
CRM_DATABASE_URL=
CRM_ALLOWED_ORIGINS=https://crm.artecclimatizados.com.br
CRM_SERVER_HOST=0.0.0.0
CRM_PORT=4100
CRM_LOG_LEVEL=info
```

Nunca use prefixo `VITE_` em segredos. Nao coloque service role no frontend.

## 2. Verificar status das migrations

```bash
npm run db:migrate:status
```

Se `CRM_DATABASE_URL` nao estiver configurada, o comando deve falhar antes de conectar.

## 3. Aplicar migrations

```bash
npm run db:migrate
```

O runner usa `crm_internal.migration_history`, checksum e advisory lock. Nao aplique mudancas manuais fora das migrations.

## 4. Criar primeiro usuario no Supabase Auth

Crie o usuario pelo painel do Supabase Auth ou pelo fluxo oficial de convite/recuperacao. Nao crie senha fixa versionada.

Anote apenas o `auth.users.id` do usuario criado.

## 5. Adicionar primeira membership de gestor

Execute no SQL editor com credencial administrativa do Supabase:

```sql
INSERT INTO crm.user_memberships (user_id, role, is_active, created_by)
VALUES ('UUID_DO_USUARIO', 'gestor', true, 'UUID_DO_USUARIO');
```

Depois, faca login no CRM e chame `/api/me`.

## 6. Testar papeis e estados

Crie usuarios ou ajuste memberships para verificar:

- `gestor`: `/api/me` retorna role `gestor` e permissoes gerenciais.
- `vendedor`: `/api/me` retorna role `vendedor` e permissoes reduzidas.
- `atendimento`: `/api/me` retorna role `atendimento` e permissoes reduzidas.
- Sem membership: `/api/me` retorna `403` com `membership_missing`.
- Membership inativa: `/api/me` retorna `403` com `membership_inactive`.

O frontend deve mostrar telas distintas para nao autenticado, sem configuracao, sem membership, inativo, acesso negado e erro temporario da API.

## 7. Verificar isolamento de `crm_internal`

Com usuario autenticado comum, confirme que acesso direto via PostgREST ao schema `crm_internal` nao esta disponivel. Tambem verifique grants:

```sql
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'crm_internal'
  AND grantee IN ('anon', 'authenticated');
```

O resultado esperado para acesso direto do navegador e vazio.

## 8. Health check e `/api/me`

Backend local:

```bash
npm run dev:server
```

Health:

```bash
curl http://localhost:4100/api/health
```

Usuario atual:

```bash
curl http://localhost:4100/api/me \
  -H "Authorization: Bearer TOKEN_SUPABASE"
```

O health check nao deve expor URLs privadas, segredos, detalhes do banco ou mensagens completas de erro.

## Criterio de aprovacao

A Fundacao so pode ser considerada pronta para homologacao quando:

- migrations reais forem aplicadas no Supabase;
- primeiro gestor real tiver membership ativa;
- `/api/me` passar para gestor, vendedor e atendimento;
- casos sem membership e inativos forem rejeitados;
- `crm_internal` nao estiver exposto ao navegador;
- frontend e backend passarem em typecheck, testes e build.
