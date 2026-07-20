# Development Status

Atualizado em: 2026-07-20

## Escopo desta homologacao

- Repositorio: `C:\Users\Artec Climatizados\Desktop\artec-crm`
- Remote esperado: `https://github.com/GsilvaM/artec-crm.git`
- Branch: `main`
- Base local observada: `7e7fffa feat: homologate customers and opportunities`
- Marco trabalhado: Central Comercial com banco real.
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
- `0011_harden_activities_next_actions`: applied
- `0012_harden_internal_notifications`: applied

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

## Atividades

Homologado com dados reais de teste identificados como homologacao:

- Atividade comercial vinculada a oportunidade: passou.
- Atividade de garantia sem oportunidade: passou.
- Atividade de suporte sem oportunidade: passou.
- Atividade de pos-venda sem oportunidade: passou.
- Linha do tempo por cliente via `GET /api/customers/:id/activities`: passou.
- Linha do tempo por oportunidade via `GET /api/opportunities/:id/activities`: passou.
- Bloqueio de `opportunityId` pertencente a outro cliente: passou em teste automatizado e constraint de banco.
- Auditoria em `crm.audit_log`: passou para atividades.

## Proximas Acoes

Homologado com dados reais de teste identificados como homologacao:

- Criar proxima acao comercial vinculada a oportunidade: passou.
- Criar proxima acao de suporte sem oportunidade: passou.
- Categoria `commercial`, `warranty`, `support` e `after_sales` suportada no contrato.
- Reagendar preservando data anterior em `postponed_from`: passou.
- Cancelar com motivo: passou.
- Concluir acao atual de oportunidade ativa com acao substituta na mesma operacao: passou.
- Bloquear conclusao da unica acao atual sem substituta: coberto por teste automatizado.
- Filtros por categoria, status, vencidas, hoje, futuras, cliente, oportunidade e prioridade: cobertos no backend.
- Auditoria em `crm.audit_log`: passou para proximas acoes.

## Central Comercial

Homologado com dados reais de teste identificados como homologacao:

- Endpoint agregado `GET /api/commercial-center`: passou.
- Acoes vencidas: passou.
- Acoes de hoje: passou.
- Acoes futuras nao aparecem no bloco de hoje: passou.
- Filtro por categoria de proxima acao: passou.
- Filtros globais de periodo, responsavel, etapa, situacao, tipo de demanda, categoria e prioridade: implementados no endpoint e expostos na tela.
- Orcamentos aguardando retorno por etapa comercial: passou.
- Visitas proximas por titulo/situacao de acao: passou.
- Caixa Auvo em estado vazio real de homologacao: passou.
- Resumo comercial com novas oportunidades, valor orcado e valor aprovado: passou.
- Escopo de vendedor no backend: coberto por teste automatizado.
- Gestor visualiza blocos agregados: coberto por teste automatizado.

## Notificacoes internas

Homologado com banco real e dados operacionais existentes:

- Migration `0012_harden_internal_notifications`: aplicada.
- Tabela `crm.notificacoes` preservada e endurecida com `status`, `severity`, `resolved_at`, `metadata` e vinculos opcionais para cliente, oportunidade e proxima acao.
- Dedupe aberto por usuario e chave deterministica: implementado por indice unico parcial.
- Endpoints implementados:
  - `GET /api/notifications`;
  - `GET /api/notifications/unread-count`;
  - `POST /api/notifications/:id/read`;
  - `POST /api/notifications/read-all`;
  - `POST /api/notifications/:id/archive`;
  - `POST /api/notifications/:id/snooze`;
  - `POST /api/notifications/reconcile`, protegido para gestor.
- Comando `npm run notifications:reconcile`: executado duas vezes; primeira execucao gerou notificacoes reais de pendencias existentes, segunda execucao nao duplicou e apenas atualizou notificacoes abertas.
- Eventos implementados nesta rodada:
  - proxima acao vencida;
  - proxima acao chegando ao prazo;
  - oportunidade atribuida a outro usuario;
  - proxima acao atribuida/reatribuida a outro usuario;
  - oportunidade ativa sem proxima acao valida;
  - oportunidade parada.
- Regras antirruido:
  - nao notifica atribuicao feita pelo proprio usuario;
  - dedupe por condicao;
  - reconciliacao idempotente;
  - conclusao, cancelamento, reagendamento e encerramento resolvem notificacoes relacionadas.
- Interface:
  - sino com contador de nao lidas;
  - painel compacto;
  - secao de notificacoes internas com filtros por pendentes, lidas e arquivadas;
  - acoes para marcar como lida, arquivar e adiar.

Limitacoes:

- Pagina dedicada `/notificacoes` ainda nao foi separada em rota propria; a visualizacao completa inicial fica na tela autenticada atual.
- Playwright/E2E visual nao foi executado porque o projeto nao possui infraestrutura configurada.
- Notificacoes de Auvo, webhook, e-mail, WhatsApp e push web nao foram implementadas.

## Correcoes do Marco 5

- Backend ganhou endpoints persistentes de notificacoes internas.
- Repository Prisma ganhou reconciliação idempotente e resolucao automatica em operacoes de proxima acao/oportunidade.
- CLI `notifications:reconcile` foi criado para scheduler externo futuro.
- Frontend ganhou sino, contador, painel compacto e lista operacional de notificacoes.
- Testes de API cobrem lista, contador, leitura, snooze, arquivamento, isolamento por usuario e RBAC do reconcile.

## Correcoes do Marco 4

- Backend ganhou endpoint `GET /api/commercial-center`.
- Repository Prisma passou a montar blocos agregados sem sequencia N+1 no frontend.
- Frontend passou a carregar a Central Comercial junto do snapshot autenticado.
- Tela inicial autenticada passou a destacar pendencias operacionais antes dos cadastros.
- Tela inicial passou a ter painel de filtros globais da Central com aplicar e limpar filtros sem recarregamento completo.
- Blocos implementados: acoes vencidas, acoes de hoje, oportunidades sem proxima acao, orcamentos aguardando retorno, visitas proximas, oportunidades paradas, Caixa Auvo vazia e resumo comercial.
- Acoes rapidas reutilizam o fluxo existente de concluir e reagendar proximas acoes.

## Correcoes do Marco 3

- Migration `0011` adicionou `category` e `archived_at` a `crm.next_actions`.
- Migration `0011` tornou `crm.atividades.cliente_id` obrigatorio apos backfill seguro a partir da oportunidade.
- Migration `0011` adicionou triggers para impedir atividade ou proxima acao vinculada a oportunidade de outro cliente.
- Backend passou a validar cliente existente antes de gravar atividade ou proxima acao.
- Backend, contratos e UI passaram a trabalhar com categorias de proximas acoes.
- Lista de proximas acoes passou a aceitar filtros por categoria e futuras.

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
- `npm run test`: passou, 4 arquivos e 41 testes.
- `npm run build`: passou.
- `npm run notifications:reconcile`: passou e confirmou idempotencia sem duplicar notificacoes abertas.
- E2E: nao executado porque nao existe script `e2e` ou Playwright no `package.json`.

## Nao alterado

- Nenhuma alteracao de autenticacao fora do uso previsto de Supabase JWT e membership.
- Nenhum commit ou push.
- Nenhum valor sensivel registrado.
- Nenhum objeto financeiro foi alterado.
- Nenhuma integracao Auvo foi iniciada.
- Nenhuma funcionalidade de e-mail, WhatsApp, push web, relatorios avancados, Auvo real ou deploy foi iniciada.

## Marcos

- Marco 1, Homologacao conectada da Fundacao: concluido e homologado.
- Marco 2, Clientes e Oportunidades: concluido e homologado por API/backend/banco; validacao visual automatizada limitada pela ausencia de Playwright/E2E.
- Marco 3, Atividades e Proximas Acoes: concluido e homologado por API/backend/banco; validacao visual automatizada limitada pela ausencia de Playwright/E2E.
- Marco 4, Central Comercial: concluido e homologado por API/backend/banco; validacao visual automatizada limitada pela ausencia de Playwright/E2E.
- Marco 5, Notificacoes internas: concluido e homologado por API/backend/banco; validacao visual automatizada limitada pela ausencia de Playwright/E2E.

## Proximo marco

Implementar o receptor de homologacao do Auvo, ainda sem transformar automaticamente atendimentos em oportunidades e sem iniciar mapeamento definitivo antes de capturar payloads reais.
