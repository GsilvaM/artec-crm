# Artec CRM — Runbook de incidentes e política de backup

Atualizado em: 2026-07-21

Este documento cobre dois assuntos distintos que se complementam:

1. **Política de backup** — o que garante que dados do CRM não se percam.
2. **Runbook de incidentes** — o que fazer quando algo dá errado em produção.

Este documento assume a topologia já registrada em `docs/DEPLOY.md`: frontend estático + backend Fastify servless na Vercel, banco Postgres gerenciado pelo Supabase, migrations próprias (não Prisma Migrate) controladas por `database/migrate.ts` com advisory lock e histórico em `crm_internal.migration_history`.

## 1. Política de backup

### 1.1 Banco de dados (fonte de verdade de todo o CRM)

O Supabase Postgres é a única fonte de dados persistente do CRM (schemas `crm` e `crm_internal`). Não existe estado de negócio fora dele — o frontend não guarda nada localmente além do access token de sessão.

- **Backups automáticos do Supabase**: todo projeto Supabase (mesmo no plano gratuito) mantém backups diários automáticos com retenção que varia por plano (tipicamente 7 dias no plano Free/Pro básico; planos superiores oferecem Point-in-Time Recovery — PITR — com granularidade de segundos). **Ação obrigatória do responsável pelo projeto**: confirmar no painel Supabase (Project Settings → Database → Backups) qual é o plano ativo, a retenção real configurada, e se PITR está disponível/habilitado. Este repositório não tem acesso ao painel Supabase para verificar isso automaticamente — é uma configuração de infraestrutura, não de código.
- **Frequência recomendada mínima**: diária, com retenção de pelo menos 7 dias. Se o volume de oportunidades/orçamentos crescer a ponto de um incidente de 1 dia ser inaceitável, avaliar upgrade de plano para habilitar PITR.
- **Restauração**: feita pelo painel Supabase (Database → Backups → Restore) ou suporte Supabase para PITR. Uma restauração de banco é uma operação destrutiva sobre o projeto Supabase inteiro — **nunca deve ser executada sem confirmação explícita do responsável pelo negócio**, porque reverte todas as tabelas do projeto (não apenas o schema `crm`) ao ponto escolhido.
- **Migrations como registro complementar**: todas as mudanças de schema ficam versionadas em `database/migrations/*.sql` e registradas com checksum em `crm_internal.migration_history` (ver `npm run db:migrate:status`). Isso não substitui backup de dados, mas garante que o schema pode ser reconstruído do zero de forma determinística em caso de provisionamento de um banco novo.

### 1.2 Segredos e configuração

Segredos (`CRM_DATABASE_URL`, `CRM_SUPABASE_ANON_KEY`, `AUVO_WEBHOOK_SECRET`, etc.) vivem apenas nas variáveis de ambiente da Vercel (Production/Preview) e em `.env.local` local, nunca versionados. Não há backup de segredos além do que cada responsável guarda em um cofre de senhas pessoal/da empresa — recomenda-se manter uma cópia dos valores de produção em um gerenciador de senhas (não em texto plano, não neste repositório).

### 1.3 Código-fonte

O código vive no GitHub (`github.com/GsilvaM/artec-crm`), com histórico completo via Git. Isso cobre backup de código; não cobre dados.

## 2. Runbook de incidentes

Para cada tipo de incidente: **sintoma → diagnóstico → ação → prevenção**.

### 2.1 `GET /api/health` retorna `database: disconnected` (ou não responde)

- **Sintoma**: usuários não conseguem logar nem carregar dados; health check falha.
- **Diagnóstico**:
  1. Confirmar se é um problema do Supabase (painel Supabase → Status) ou da Vercel (painel Vercel → Deployments/Functions → logs da função `api/index`).
  2. Verificar se `CRM_DATABASE_URL`/`CRM_DATABASE_POOL_URL` ainda são válidas (rotação de senha do Postgres no Supabase invalida a connection string existente).
  3. Se o erro for de esgotamento de conexões (comum em serverless sob carga), confirmar que `CRM_DATABASE_POOL_URL` (pooler de transação, porta 6543, `pgbouncer=true`) está configurada — sem ela, cada invocação serverless concorrente abre conexão direta e pode esgotar o limite do Postgres.
- **Ação**: corrigir a variável de ambiente na Vercel e re-deployar (redeploy sem build novo já pega env vars atualizadas em "Redeploy" no painel), ou aguardar recuperação do Supabase se for outage do provedor.
- **Prevenção**: monitorar `GET /api/health` externamente (ex: um cron simples ou serviço de uptime) — hoje não há monitoramento automático configurado; é uma lacuna conhecida, não bloqueante para o produto, mas recomendada como próximo passo de observabilidade.

### 2.2 Migration falhou no meio (`npm run db:migrate`)

- **Sintoma**: comando retorna erro, ou uma nova migration nunca aparece como aplicada em `npm run db:migrate:status`.
- **Diagnóstico**: o runner usa `pg_advisory_lock` durante a execução — se o processo morreu no meio (ex: conexão caiu), o lock pode ainda estar preso até a conexão expirar. Rodar `npm run db:migrate:status` para ver o que já foi aplicado (com checksum) e o que falta.
- **Ação**:
  1. Nunca editar uma migration já aplicada (checksum quebraria a validação). Se o SQL estava errado, criar uma nova migration corretiva com `npm run db:migrate:create <nome>`.
  2. Se o lock ficou preso e o processo original não existe mais, ele libera sozinho quando a sessão Postgres que o segurava encerra; se necessário, verificar sessões ativas no Supabase SQL editor com `SELECT * FROM pg_locks WHERE locktype = 'advisory';` antes de qualquer ação manual no banco.
  3. Rodar `npm run db:migrate` novamente após confirmar que o lock foi liberado.
- **Prevenção**: sempre rodar migrations manualmente contra produção antes do deploy que depende delas (já é o processo documentado em `docs/DEPLOY.md`), nunca via CI automatizado sem supervisão.

### 2.3 Segredo do webhook Auvo (`AUVO_WEBHOOK_SECRET`) vazou ou precisa rotacionar

- **Sintoma**: suspeita de exposição do segredo (ex: logado por engano, compartilhado em canal errado) ou rotina de rotação preventiva.
- **Ação**:
  1. Gerar um novo valor aleatório forte (ex: `openssl rand -hex 32`).
  2. Atualizar `AUVO_WEBHOOK_SECRET` nas variáveis de ambiente da Vercel (Production) e redeployar.
  3. Atualizar a URL do webhook cadastrada no painel do Auvo para incluir o novo segredo (`https://<dominio>/api/webhooks/auvo/<novo-segredo>`), já que o segredo faz parte do path, não de um header.
  4. Validar recebendo um evento de teste do Auvo e conferindo em `/api/integrations/auvo/events` (ou na Caixa de Entrada, para eventos `SESSION_*`) que ele foi recebido com status `received`/`processed`.
- **Prevenção**: o segredo nunca é logado (`sanitizeWebhookHeaders` remove headers sensíveis; o path completo com segredo não é logado pelo Fastify por padrão). A comparação usa `timingSafeEqual` para evitar side-channel de timing.

### 2.4 Deploy da Vercel quebrado (build falhou ou função serverless não sobe)

- **Sintoma**: novo deploy não fica "Ready" na Vercel, ou fica "Ready" mas `/api/health` quebra.
- **Diagnóstico**: ver logs de build na Vercel (erro de `tsc`/`vite build`) ou logs de runtime da função (erro ao montar `server/bootstrap.ts`, geralmente env var faltando ou inválida — `loadConfig` usa Zod e falha rápido com mensagem clara sobre qual variável está errada).
- **Ação**: usar "Redeploy" de um deployment anterior conhecido como bom (Vercel mantém deployments antigos acessíveis e permite promover um deployment anterior para produção instantaneamente — isso é o mecanismo de rollback, não requer reverter commits no Git).
- **Prevenção**: rodar `npm run typecheck && npm test && npm run build` localmente antes de fazer push para `main` (branch que dispara deploy automático).

### 2.5 Rate limit bloqueando usuários legítimos (falso positivo)

- **Sintoma**: usuários reais recebendo `429 rate_limited` em uso normal.
- **Diagnóstico**: o limite atual é 600 requisições/minuto por IP para todas as rotas autenticadas (`server/app.ts`), e 60/minuto por IP especificamente para o webhook público do Auvo. Verificar se múltiplos usuários estão atrás do mesmo IP corporativo/NAT, o que divide a cota entre eles.
- **Ação**: ajustar o `max` do rate limit correspondente em `server/app.ts` e redeployar. Não é necessário desabilitar o rate limit inteiro — apenas calibrar o limite.
- **Prevenção**: os limites atuais foram calibrados para uso normal de um CRM interno de poucas dezenas de usuários; revisar se a equipe crescer significativamente.

### 2.6 Exclusão ou alteração indevida de dados (erro humano ou de operação)

- **Sintoma**: cliente, oportunidade ou orçamento apagado/alterado por engano.
- **Ação**:
  1. Clientes e oportunidades usam **arquivamento lógico** (`archivedAt`), não exclusão física — `POST /api/customers/:id/archive` e `POST /api/opportunities/:id/archive` podem ser revertidos com as rotas `/restore` correspondentes. Isso cobre a maioria dos casos de "apaguei sem querer".
  2. Para dados realmente perdidos (ex: um `UPDATE` manual direto no banco), a única recuperação é via backup do Supabase (seção 1.1) — restauração pontual (PITR, se disponível) é preferível a um rollback completo do banco, pois afeta apenas os dados no intervalo de tempo do incidente.
  3. Qualquer ação manual direta no banco de produção (fora das migrations versionadas) deve ser evitada; se for estritamente necessária, documentar o que foi feito e por quê.
- **Prevenção**: o backend nunca expõe `DELETE` físico para entidades de negócio — apenas arquivar/restaurar. Motivos de perda (`crm.motivos_perda`) também usam soft-disable (`is_active`), preservando histórico de oportunidades já perdidas com aquele motivo.

## 3. Contatos e responsabilidade

Não há uma rotação formal de plantão configurada — o CRM é operado por uma equipe pequena (ver `CONTEXTO-ROTINA-ATENDIMENTO-ARTEC-CRM.md` para os papéis de negócio). Em caso de incidente, o responsável técnico com acesso à Vercel e ao Supabase deve ser acionado diretamente. Recomenda-se, como melhoria futura, formalizar quem tem acesso de administrador a cada painel (Vercel, Supabase, Auvo) para evitar depender de uma única pessoa.
