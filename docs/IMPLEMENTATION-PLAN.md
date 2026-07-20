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
- O webhook Auvo permanece fora da implementacao ate existirem payloads reais de homologacao.

Comandos de validacao da fatia:

- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run db:migrate:status`
- `npm run start:server`

## 2. Clientes e oportunidades

- [ ] CRUD de clientes.
- [ ] CRUD de oportunidades.
- [ ] Etapa, situação, responsável e próxima ação.
- [ ] Histórico de mudanças.
- [ ] Busca e filtros.
- [ ] Lista e ficha detalhada.

Critério de aceite: cadastrar cliente, criar oportunidade e acompanhar sua linha do tempo.

## 3. Funil, follow-ups e agenda

- [ ] Kanban com alternativa por ações rápidas.
- [ ] Follow-ups de hoje e vencidos.
- [ ] Concluir/reagendar com resultado.
- [ ] Agenda comercial.
- [ ] Central Comercial.
- [ ] Detecção de oportunidade sem próxima ação.

Critério de aceite: nenhuma oportunidade ativa fica esquecida sem alerta.

## 4. Notificações

- [ ] Toasts.
- [ ] Central persistente.
- [ ] Badge e contadores.
- [ ] Deduplicação.
- [ ] Adiar, ler e arquivar.
- [ ] Preferências.

Critério de aceite: alertas prioritários são acionáveis e não geram duplicidade.

## 5. Auvo — homologação

- [ ] Endpoint público seguro.
- [ ] Persistência de payload bruto.
- [ ] Idempotência.
- [ ] Tela de eventos.
- [ ] Reprocessamento.
- [ ] Capturar payloads reais.
- [ ] Fixtures anonimizadas e testes de contrato.

Critério de aceite: eventos repetidos não duplicam entradas e erros são auditáveis.

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
