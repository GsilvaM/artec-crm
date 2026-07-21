# Artec CRM — Plano de implementação

Atualizado em: 2026-07-20

## 0. Auditoria do repositório

- [x] Identificar stack e gerenciador de pacotes.
- [x] Identificar scripts de lint, test, typecheck e build.
- [x] Mapear o limite do sistema financeiro existente.
- [x] Definir o diretório final do app independente.
- [x] Definir banco, autenticação, deploy e variáveis de ambiente do CRM.
- [x] Confirmar que não haverá conexão com o financeiro.

Resumo: o CRM fica em projeto independente, com scripts proprios e sem imports para `src/domain/financeiro`, `src/server/financeiro`, `src/routes/api/financeiro`, `prisma/` ou tabelas financeiras.

Decisao final de arquitetura:

- Aplicacao independente em projeto separado.
- URL planejada: `crm.artecclimatizados.com.br`.
- Mesmo projeto Supabase/PostgreSQL, com schemas isolados `crm` e `crm_internal`.
- Supabase Auth do mesmo projeto, mas acesso controlado por `crm.user_memberships`.
- Usuario do Artec Gestao nao ganha acesso automatico ao CRM.
- Backend do CRM valida sessao, aplica RBAC, registra auditoria, executa regras de negocio e protege segredos.
- Auvo fica bloqueado ate fundacao, Clientes, Oportunidades, proximas acoes, auditoria e Central Comercial persistente serem aprovados.

## 1. Fundação

- [x] Criar app isolado.
- [x] Configurar TypeScript estrito e testes.
- [x] Registrar decisao de nao criar lint proprio do CRM neste momento.
- [x] Implementar contrato de autenticacao real com Supabase Auth.
- [x] Implementar backend proprio validando JWT Supabase.
- [x] Implementar membership `crm.user_memberships` em migration.
- [x] Implementar `/api/health` real no backend.
- [x] Implementar `/api/me` protegido.
- [x] Implementar RBAC centralizado no backend.
- [x] Implementar CORS por variavel de ambiente.
- [x] Implementar tratamento global de erros e logs redigindo Authorization.
- [x] Criar design tokens, app shell e componentes base.
- [x] Configurar banco/migrations próprios.
- [x] Criar runner independente de migrations.
- [x] Criar tratamento de erros de servidor.
- [ ] Configurar observabilidade externa.

Critério de aceite: usuário autenticado acessa uma aplicação isolada, sem impacto no sistema financeiro, com build e testes passando.

Arquivos afetados na primeira fatia:

- `package.json`
- `index.html`
- `vite.config.ts`
- `tsconfig*.json`
- `src/*`
- `server/*`
- `database/migrations/*.sql`
- `database/*.ts`
- `docs/REPO-AUDIT.md`
- `docs/IMPLEMENTATION-PLAN.md`

Riscos:

- A autenticacao depende das envs `VITE_CRM_SUPABASE_URL` e `VITE_CRM_SUPABASE_ANON_KEY`.
- O backend depende das envs `CRM_SUPABASE_URL`, `CRM_SUPABASE_ANON_KEY`, `CRM_DATABASE_URL` e `CRM_ALLOWED_ORIGINS`.
- As migrations dependem de `CRM_DATABASE_URL` para serem executadas.
- A Fundacao ainda nao pode ser declarada pronta sem aplicar migrations reais e validar memberships reais no Supabase.
- O mapeamento definitivo do Auvo permanece bloqueado ate existirem payloads reais de homologacao.

Comandos de validacao da fatia:

- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run db:migrate:status`
- `npm run start:server`

## 2. Clientes e oportunidades

- [x] CRUD de clientes.
- [x] CRUD de oportunidades.
- [x] Etapa, situação, responsável e próxima ação.
- [x] Histórico de mudanças por auditoria de INSERT/UPDATE.
- [x] Busca e filtros nas APIs.
- [x] Lista operacional com criação, aprovação, perda e arquivamento.

Critério de aceite: cadastrar cliente, criar oportunidade e acompanhar sua linha do tempo.

Status em 2026-07-20: concluido no codigo e validado por typecheck, testes e build. A homologacao conectada depende de aplicar a migration `0007_complete_customers_opportunities_flow.sql` com `CRM_DATABASE_URL`, validar dados reais no Supabase e confirmar memberships reais.

## 3. Funil, follow-ups e agenda

- [x] Kanban com alternativa por ações rápidas (sem drag-and-drop; mover etapa via seletor acessível, aprovar/perder reutilizam os fluxos existentes).
- [x] Follow-ups de hoje e vencidos como proximas acoes filtraveis.
- [x] Concluir/reagendar/cancelar com resultado e historico.
- [ ] Agenda comercial.
- [x] Central Comercial.
- [x] Detecção de oportunidade ativa sem próxima ação pendente no backend.

Critério de aceite: nenhuma oportunidade ativa fica esquecida sem alerta.

Status em 2026-07-20: marco Atividades + Proximas Acoes concluido no codigo. Foram criadas APIs, tela operacional de acompanhamento e linha do tempo funcional. Homologacao conectada depende de aplicar migrations `0007` e `0008` no Supabase real.

## 4. Notificações

- [ ] Toasts.
- [x] Central persistente.
- [x] Badge e contadores.
- [x] Deduplicação.
- [x] Adiar, ler e arquivar.
- [ ] Preferências.

Critério de aceite: alertas prioritários são acionáveis e não geram duplicidade.

## 5. Auvo — homologação

- [x] Endpoint público seguro.
- [x] Persistência de payload bruto.
- [x] Idempotência.
- [x] Tela de eventos.
- [x] Reprocessamento.
- [ ] Capturar payloads reais.
- [ ] Fixtures anonimizadas e testes de contrato.

Critério de aceite: eventos repetidos não duplicam entradas e erros são auditáveis.

Status em 2026-07-20: receptor de homologacao concluido, migration `0013_harden_auvo_webhook_events` aplicada, APIs administrativas e tela de eventos disponiveis para gestor. A proxima etapa oficial e capturar payloads reais no Auvo antes de mapear eventos ou implementar Caixa de Entrada definitiva.

Preparacao da captura real: comando `npm run auvo:homologation:status` disponivel para verificar, sem vazar dados sensiveis, se o segredo esta configurado e se chegaram eventos sinteticos ou reais.

Preparacao de fixtures: comando `npm run auvo:fixtures:export` disponivel para gerar fixtures locais anonimizadas a partir de payloads reais capturados. O diretorio `tmp/auvo-fixtures` nao e versionado.

## 6. Auvo — Caixa de Entrada

- [ ] Mapear eventos reais.
- [ ] API de leitura e cache de token.
- [ ] Sugestão de cliente.
- [ ] Triagem completa.
- [ ] Garantia/suporte no histórico sem oportunidade.
- [ ] Vínculo com oportunidade existente.

Critério de aceite: atendimento do Auvo chega, é triado e gera o destino correto com histórico.

## 7. Orçamentos e fechamento comercial

- [ ] Versões de orçamento.
- [ ] Envio, revisão, aprovação e recusa.
- [ ] Campos obrigatórios de aprovação.
- [ ] Motivos de perda.
- [ ] Reabertura auditada.

Critério de aceite: valores comerciais são mensuráveis sem qualquer lançamento financeiro.

## 7b. Administração

- [x] CRUD de etapas do funil (criar, renomear, reordenar; etapas terminais protegidas contra renomeacao).
- [x] CRUD de motivos de perda (criar, ativar/desativar).
- [x] Gestao de usuarios/memberships (listar usuarios do Supabase Auth, conceder/revogar acesso ao CRM, trocar papel), substituindo o fluxo manual via SQL do runbook.
- [ ] Origens e tipos de demanda configuraveis (permanecem como texto livre na oportunidade; decisao deliberada de escopo, nao um gap esquecido).
- [ ] Visualizador de auditoria (`crm.audit_log` existe e e populado, mas sem tela de consulta ainda).

Status em 2026-07-21: rotas `/api/admin/*` restritas a `gestor` (permissoes `settings:read`, `settings:write`, `users:manage`, ja existentes no RBAC mas sem uso ate agora). Testado com dados reais de homologacao (leitura e escrita ponta a ponta via Playwright).

## 8. Relatórios e hardening

- [ ] Dashboard por período.
- [ ] Conversão, ticket, origens e perdas.
- [ ] Performance e índices.
- [ ] Testes E2E dos fluxos críticos.
- [ ] Auditoria de acessibilidade.
- [ ] Backup e runbook.
- [ ] Revisão de segurança.

## Registro de decisões

- 2026-07-20: Autenticacao sera Supabase Auth do mesmo projeto, com autorizacao independente por `crm.user_memberships`. Impacto: sem sistema proprio de senhas e sem acesso automatico de usuarios do financeiro.
- 2026-07-20: Banco do CRM usa schemas `crm` e `crm_internal` no mesmo PostgreSQL/Supabase. Impacto: isolamento por schema, RLS e grants; proibido usar `public` para tabelas CRM.
- 2026-07-20: Nao criar lint proprio do CRM nesta fase. Impacto: validacao fica por typecheck, testes e build ate decisao futura.
- 2026-07-20: Auvo fica bloqueado ate fundacao persistente, Clientes, Oportunidades, proximas acoes, auditoria e Central Comercial serem aprovados. Impacto: sem mocks nem simulacao de integracao.
- 2026-07-20: Backend real da Fundacao usa Fastify dentro de `server`. Impacto: frontend envia `Authorization: Bearer`; backend valida o token Supabase, consulta `crm.user_memberships` e deriva permissoes.
- 2026-07-20: Health check definitivo mudou para o backend em `GET /api/health`. Impacto: Vite mantem apenas proxy local para `/api`.
- 2026-07-20: Backend operacional passa a usar Prisma Client 7 com `@prisma/adapter-pg` para conexao, repositories e health check. Impacto: migrations SQL, runner proprio, checksum, advisory lock e `crm_internal.migration_history` continuam como fonte oficial de evolucao do banco; Prisma Migrate nao foi introduzido.
