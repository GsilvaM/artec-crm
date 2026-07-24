# Auditoria Mestre e Plano de Rearquitetura - Artec CRM

Data: 2026-07-24  
Branch auditado: `refactor/frontend-design-system`  
Modo: auditoria e planejamento. Nenhum codigo de producao foi alterado por este ciclo.

## 1. Escopo e Fontes

Esta auditoria responde ao "Prompt Mestre para Codex - Auditoria, Rearquitetura e Reconstrucao Completa do CRM da Artec".

Fontes locais lidas ou inspecionadas:

- `README.md`, `README-INSTALACAO.md`, `CONTEXTO-ROTINA-ATENDIMENTO-ARTEC-CRM.md`.
- `package.json`, `vite.config.ts`, `playwright.config.ts`, `vercel.json`.
- `.claude/agents/*.md`.
- `src/App.tsx`, `src/domain/crm.ts`, `src/domain/format.ts`, `src/components/**`, `src/features/**`, `src/styles.css`.
- `server/app.ts`, `server/crm/routes.ts`, `server/crm/types.ts`, `server/crm/validation.ts`, `server/crm/prisma-repository.ts`, `server/auth/rbac.ts`, `server/crm/auvo-parser.ts`, `server/crm/auvo-webhook.ts`.
- `prisma/schema.prisma`, `database/migrations/0001` a `0020`.
- `e2e/**`, `server/**/*.test.ts`, `src/**/*.test.ts`.
- `docs/audits/*.md`, `docs/REFATORACAO-CRM-PROGRESSO.md`, `docs/ANALISE-PIXEL-A-PIXEL-VENTURE-DESIGN-SYSTEM.md`, `docs/*.json`.

Arquivos esperados mas ausentes no repositorio:

- `AGENTS.md`
- `CLAUDE.md`
- `docs/PRODUCT-SPEC.md`
- `docs/DESIGN-SYSTEM.md`
- `docs/DEVELOPMENT-STATUS.md`

Como substitutos, foram usados o contexto operacional da raiz, as auditorias existentes em `docs/audits`, os JSONs do kit Venture e os agentes de `.claude/agents`.

## 2. Inventario do Projeto

### 2.1 Estrutura

O projeto tem 170 arquivos relevantes em `src`, `server`, `database`, `prisma`, `e2e` e `docs`.

Principais diretorios:

- `src`: frontend React/Vite.
- `src/features`: paginas por dominio: Central Comercial, Proximas Acoes, Clientes, Oportunidades, Pipeline, Relatorios, Notificacoes, Integracoes, Administracao.
- `src/components`: layout, UI reutilizavel e paineis legados.
- `server`: API Fastify, auth, RBAC, repository Prisma, parser Auvo, jobs de reconcile.
- `database`: runner proprio de migrations SQL.
- `prisma`: schema oficial do Prisma Client, sem Prisma Migrate.
- `e2e`: suite Playwright com login real de homologacao.
- `docs`: auditorias, tokens extraidos do Venture e progresso da refatoracao.

Maiores arquivos nao gerados:

- `src/styles.css`: 2587 linhas.
- `server/crm/prisma-repository.ts`: 2413 linhas.
- `server/app.test.ts`: 2152 linhas.
- `src/domain/crm.ts`: 588 linhas.
- `server/crm/types.ts`: 576 linhas.
- `src/features/commercial-center/CentralComercialPage.tsx`: 371 linhas.
- `server/crm/routes.ts`: 370 linhas.

### 2.2 Frontend

Stack:

- React 19, React Router 7, Vite 6, TypeScript.
- CSS global em `src/styles.css`.
- Icons via `lucide-react`.
- PWA via `vite-plugin-pwa`.
- Nao ha Tailwind CSS instalado ou configurado.
- Nao ha biblioteca de charts instalada.
- Nao ha cache client-side estruturado tipo TanStack Query; chamadas estao centralizadas em `src/domain/crm.ts`.

Pontos fortes:

- Rotas por pagina com `lazy`, reduzindo bundle inicial.
- Layout autenticado centralizado em `AppLayout`.
- Componentes UI basicos existem: Button, Badge, Avatar, Drawer, DataTable, Tabs, Toast, ConfirmDialog, PromptDialog, EmptyState, Skeleton.
- Central Comercial em trabalho ativo: metric strip, toolbar compacta, drawer de filtros, tabs de prioridade/higiene, skeleton proprio.
- E2E cobre navegacao, responsividade, acessibilidade light mode e varios fluxos do CRM.

Fragilidades:

- Design system esta em CSS global, nao em pacote/tokens fortemente organizados.
- Tipos de frontend duplicam e divergem de tipos do backend. Exemplo: `Customer` no frontend omite campos que existem no backend/schema (`documento`, `estado`, `observacoes`, `nomeFantasia`, `auvoContactId`).
- `src/domain/crm.ts` acumula tipos, payloads e todas as chamadas HTTP, com alto acoplamento.
- Muitas telas ainda fazem data fetching manual com `useEffect`, `useState`, loading/error por pagina e refresh manual.
- Formularios misturam regra de UI com regra de negocio; validacao de negocio central no backend existe, mas a UI ainda replica partes do vocabulario.
- Sem Command Palette apesar de busca global no Topbar.
- Mobile existe e passa testes, mas a experiencia ainda e adaptacao responsiva da desktop, nao necessariamente mobile-first.
- Ainda ha encoding visual corrompido em varios outputs lidos no terminal, indicando risco de arquivos/documentos com acentuacao mal interpretada em alguns fluxos.

### 2.3 Backend

Stack:

- Fastify 5.
- Supabase Auth para autenticacao.
- RBAC proprio em `server/auth/rbac.ts`.
- Prisma Client com adapter PostgreSQL.
- Migrations SQL proprias via `pg`, checksum e `crm_internal.migration_history`.
- Zod para validacao de payload/query das APIs internas.

Pontos fortes:

- Separacao clara entre `crm` e `crm_internal`.
- API exige Bearer Supabase e membership ativa.
- RBAC simples e audivel.
- Webhook Auvo com segredo backend, limite de tamanho, content-type JSON, sanitizacao de headers e hash canonico.
- Reconcile interno agora existe em `/api/internal/reconcile`, protegido por `CRON_SECRET`, e `vercel.json` declara cron a cada 5 minutos.
- Nao ha integracao financeira, respeitando a decisao de produto.
- Auditoria e dedupe existem em varias entidades.

Fragilidades:

- `PrismaCrmDataRepository` concentra responsabilidades demais: consultas, regras, transicoes, notificacoes, Auvo, relatorios, mapeadores e helpers.
- `server/crm/routes.ts` e uma lista grande de endpoints com pouco agrupamento por modulo.
- Payload bruto do Auvo e parseado por guards manuais, nao por Zod versionado por `eventType`.
- Sem camada explicita de services/use cases separando regra de negocio de persistencia.
- Testes de repository real sao limitados; muitos testes de rota usam `FakeCrmRepository`.
- Logs existem no app, mas nao ha observabilidade operacional completa para jobs: duracao, latencia, ultima execucao persistida, heartbeat, status de fila por idade.

### 2.4 Banco

Modelos Prisma atuais:

- `UserMembership`
- `Customer`
- `PipelineStage`
- `LossReason`
- `Opportunity`
- `Quote`
- `Activity`
- `NextAction`
- `AuditLog`
- `Notification`
- `AuvoWebhookEvent`
- `AuvoInboxItem`
- `MigrationHistory`

Pontos fortes:

- Indices importantes existem para acoes por responsavel/status/data, oportunidades por responsavel/status, arquivamento, fixtures, Auvo por status/hash/external id.
- `AuvoWebhookEvent.dedupeKey` e unico.
- `Customer.auvoContactId` e unico.
- `Quote` versionado por oportunidade.
- `is_test_fixture` ja existe em `Customer`, `Opportunity` e `AuvoInboxItem`.
- Migrations 0001-0020 documentam evolucao progressiva e hardening.

Lacunas estruturais comprovadas:

- Nao existe entidade `Visit`/`Visita`.
- Nao existe entidade `Equipment`/`Equipamento`.
- Nao existe entidade `Address`/`Endereco`.
- Nao existe entidade `ServiceOrder`/`Ordem de Servico`.
- Nao existe modelo de checklist, fotos, relatorio tecnico, contrato ou recorrencia.
- "Visitas proximas" ainda dependem de `NextAction` e heuristica textual, nao de agenda tecnica estruturada.
- `tipoDemanda` e fechado e nao inclui todas as categorias descritas no contexto operacional, como manutencao preventiva, visita tecnica consultiva e outro.
- Status de oportunidade nao inclui "pausada"; pausa existe apenas como possivel texto em `situacao`.

### 2.5 Integracao Auvo

Fluxo atual:

```text
Webhook publico
-> valida secret/content-type/tamanho
-> sanitiza headers
-> persiste evento bruto em crm_internal.auvo_webhook_events
-> cron /api/internal/reconcile
-> processa CONTACT_* e SESSION_*
-> cria/atualiza auvo_inbox_items
-> usuario resolve na Caixa Auvo
```

Pontos fortes:

- Ack rapido e persistencia antes de processamento.
- Hash canonico e dedupe.
- Sanitizacao de headers/payload.
- Reprocessar/ignorar existem.
- Caixa Auvo respeita regra: webhook nao cria oportunidade automaticamente.
- `AuvoInboxItem.isTestFixture` ja foi adicionado.
- Cron atual no `vercel.json` chama reconcile interno.

Fragilidades:

- Falta schema versionado de contrato Auvo por tipo de evento.
- Falta teste robusto do worker: retry, dead-letter, backoff, reclaim de processing travado e concorrencia.
- Falta painel de saude operacional: sucesso, latencia, idade da fila, ultima execucao, proximo retry.
- Falta match confidence: a Caixa mostra cliente sugerido binario, sem explicar criterio ou confianca.
- Falta backfill/mecanismo para popular `Customer.auvoContactId`, entao o melhor criterio de match pode continuar inutil em dados historicos.

### 2.6 Seguranca

Pontos fortes:

- Bearer token obrigatorio.
- Membership ativa obrigatoria.
- Permissoes por papel.
- Segredos nao ficam no frontend; README reforca que segredos nao devem usar `VITE_`.
- Rate limit para webhook e API autenticada.
- Headers de seguranca (`nosniff`, `DENY`, `no-referrer`, `no-store`).
- Sanitizacao de webhook e redaction de authorization/cookie em logs.

Riscos:

- O header `x-crm-include-test-fixtures` e opt-in autenticado, mas sem gate de ambiente. Para ferramenta interna, o risco e mais de produto/QA do que de vazamento externo.
- `.env` e `.env.local` existem no workspace. Devem permanecer fora de qualquer relatorio, log, commit ou screenshot.
- Sem CSRF especifico, mas API usa Bearer token e nao cookie de sessao como credencial primaria.
- XSS mitigado pelo React por padrao, mas payloads sanitizados do Auvo ainda devem continuar tratados como dados, nunca HTML.
- Acesso de gestor a payload sanitizado do Auvo precisa continuar redigindo PII/sensivel.

## 3. Diagnostico

### 3.1 Arquitetura

Pontos fortes:

- O projeto ja saiu do prototipo puro: tem RBAC, migrations proprias, testes, PWA, lazy routes, isolamento de fixtures e scheduler.
- O dominio comercial foi mantido separado do financeiro, uma decisao correta para a Artec.
- O backend e a fonte de verdade para regras criticas: oportunidade ativa, aprovacao, perda, membership, fixtures e Auvo.

Pontos fracos:

- O repository virou "deus do dominio". A proxima fase precisa extrair use cases por modulo antes de adicionar entidades estruturais.
- O frontend nao tem uma camada de estado/cache adequada para operacao diaria; reloads e refreshs manuais podem escalar mal.
- O design system ainda e mais uma folha global do que um sistema de componentes com contratos claros.
- O modelo atual suporta um CRM comercial basico, mas nao suporta a operacao completa descrita no prompt mestre: visita, equipe tecnica, execucao, checklist, fotos, relatorio, pos-venda estruturado, contrato e manutencao recorrente.

### 3.2 Codigo

Duplicacoes e responsabilidades misturadas:

- `TIPO_DEMANDA_OPTIONS` existe no backend e no frontend, com risco de divergencia.
- Tipos DTO sao duplicados em `server/crm/types.ts` e `src/domain/crm.ts`.
- `src/domain/crm.ts` mistura DTOs, payloads e client HTTP.
- `server/crm/prisma-repository.ts` mistura query, regra de negocio, transformacao e jobs.
- `src/styles.css` concentra todos os tokens e componentes visuais, tornando impacto de mudanca amplo e dificil de isolar.

Funcoes/arquivos grandes:

- `PrismaCrmDataRepository` deve ser decomposto antes de crescer com Visita/Equipamento/OS.
- `server/app.test.ts` e valioso, mas muito grande; pode ser separado por dominio.

### 3.3 UX

Pontos fortes:

- Central Comercial esta sendo redesenhada para responder "o que fazer agora".
- Proximas Acoes tem fluxo de concluir/reagendar/cancelar.
- Fichas de Cliente e Oportunidade tem timeline/atividades.
- Caixa Auvo exige decisao humana.

Gaps:

- Cadastro rapido ainda nao e progressivo o bastante.
- Duplicidade de cliente aparece depois; o ideal e detectar antes de salvar com confirmacao.
- Cliente e oportunidade ainda tem edicao incompleta na UI.
- Nao ha entidade Visita: o atendente nao consegue operar agenda tecnica de verdade.
- Nao ha "Minha fila" rica para gestor alternar responsavel/equipe.
- Nao ha drill-down em relatorios.
- Snooze de notificacao ainda deve evoluir para data escolhida, nao apenas adiamento fixo.

### 3.4 UI

Pontos fortes:

- AppShell, Sidebar e Topbar existem.
- Tokens Venture foram estudados.
- Central Comercial em progresso usa metric cards, tabs e grids dedicados.
- Dark mode da sidebar teve cor corrigida em `src/styles.css` no workspace atual.

Gaps:

- Tailwind CSS nao existe, apesar do prompt mestre exigir migracao completa.
- Cards, badges, tabelas e controles ainda divergem parcialmente do Venture.
- Tabelas desktop ainda usam grade classica em varias telas; Venture sugere linhas-cartao e menor peso visual.
- Relatorios nao tem graficos.
- Sem Command Palette.
- Sem Calendar/Timeline/Charts/FAB/Bottom Navigation como componentes formalizados do design system.

### 3.5 Backend e Performance

Gargalos potenciais:

- Consultas complexas em `getCommercialCenter` e relatorios ficam centralizadas no repository. Antes de escalar dados, precisam de EXPLAIN/indices validados por volume real.
- Frontend faz multiplas chamadas paralelas sem cache compartilhado.
- Sem budget automatizado de bundle/Lighthouse.
- Playwright roda com 1 worker por depender de ambiente compartilhado.

### 3.6 Banco

Problemas de modelagem prioritarios:

- Ausencia de `Visit`, `Equipment`, `Address`.
- Ausencia de `ServiceOrder`, `ExecutionChecklist`, `Attachment/Photo`, `TechnicalReport`, `Contract`, `RecurringMaintenance`.
- `Opportunity` acumula campos de orcamento/aprovacao mas nao tem caminho estruturado para execucao tecnica.
- `Activity` e generica demais para cobrir tudo que a operacao precisa medir.

## 4. Pesquisa de Referencia

Fontes consultadas:

- HubSpot mobile dashboards e mobile CRM: dashboards no bottom navigation, filtros de periodo, tarefas e acoes em mobile.
- Salesforce mobile: home personalizada com prioridade de reunioes, tarefas, leads e oportunidades; dashboards embutidos em registros.
- Pipedrive: mobile insights, pipeline, atividades, filtros e foco em follow-up.
- Kommo: pipeline + list view, filtros salvos, automacoes disparadas por mudanca de etapa, conversas como centro da operacao.
- monday CRM: boards centrais Leads/Deals/Accounts/Contacts, Emails & Activities em mobile, validacoes vindas do web.
- Zoho CRM: dashboards mobile com KPIs, charts, drill-down para registros subjacentes.
- Freshsales: home mobile com notificacoes, calendario semanal, overdue tasks, quick add, metric cards clicaveis, deal filters salvos.
- Agendor: multiplos funis, automacoes, tarefas, negocios parados por tempo limite na etapa.
- Bitrix24: bottom navigation customizavel, CRM mobile com deals, timeline, atividades, calendario, quick actions e comunicacao integrada.

Boas praticas a adaptar para Artec:

- Home operacional por prioridade, nao dashboard decorativo.
- Bottom navigation mobile com 4-5 areas mais usadas: Central, Acoes, Clientes, Oportunidades, Busca.
- Quick Add persistente: cliente, oportunidade, atividade, visita, acao.
- Registro com timeline completa e acoes contextuais.
- Pipeline + lista: kanban para visao, lista para trabalho denso.
- Filtros salvos e "Minha fila".
- Metric cards clicaveis sempre levando ao conjunto de registros.
- Drill-down de graficos/tabelas para lista filtrada.
- Match de duplicidade explicavel: criterio, confianca, decisao humana.
- Atividades e proximos passos sempre a um toque no mobile.

Nao copiar:

- Financeiro/faturas/pagamentos dos CRMs generalistas. O Artec CRM deve continuar comercial, sem ERP/financeiro.
- Automacoes que aprovam, perdem, encerram ou diagnosticam tecnicamente sem humano.
- UI inflada com modulos que a Artec nao usa no dia a dia.

## 5. Agents Especialistas

Existentes em `.claude/agents`:

- `artec-crm-product-architect`
- `artec-design-system-engineer`
- `artec-auvo-integration-specialist`
- `artec-data-quality-e2e`
- `artec-qa-release-guardian`

Lacuna: o prompt mestre pede agentes globais e por pagina. Em vez de criar arquivos de agente agora, a recomendacao e atualizar `.claude/agents` em um ciclo separado, apos validar nomenclatura e escopo. Catalogo proposto:

Agentes globais:

- Architecture Agent: modularizacao, boundaries, ADRs, dependencias.
- Product Manager Agent: priorizacao, aceite, impacto operacional.
- UX Research Agent: fluxo real de atendimento, mobile, cliques, friccao.
- UI Designer Agent: Venture, tokens, layouts, estados.
- Frontend Agent: componentes, rotas, estado, performance client.
- Backend Agent: use cases, APIs, contratos, logs.
- Database Agent: schema, migrations, indices, integridade, backfill.
- Auvo Integration Agent: webhook, payloads, retries, match, Caixa.
- Performance Agent: bundle, rendering, queries, budgets.
- QA Agent: matriz requisito-teste, e2e, regressao.
- Accessibility Agent: WCAG light/dark, teclado, foco.
- Security Agent: auth, RBAC, secrets, PII, headers.
- Documentation Agent: README, runbooks, ADRs, changelog.

Agentes por pagina/domino atuais:

- Central Comercial Agent
- Proximas Acoes Agent
- Clientes Agent
- Oportunidades Agent
- Pipeline Agent
- Caixa Auvo Agent
- Notificacoes Agent
- Relatorios Agent
- Administracao/Usuarios Agent
- Integracoes Auvo Admin Agent

Agentes futuros, somente quando o modelo existir:

- Visitas Agent
- Equipamentos Agent
- Enderecos Agent
- Ordens de Servico Agent
- Execucao Tecnica Agent
- Checklist/Fotos Agent
- Pos-venda/Garantia/Suporte Agent
- Contratos/Recorrencia Agent

Observacao importante: agentes "Financeiro", "Fluxo de Caixa", "Contas a Receber", "Contas a Pagar" e "Lancamentos" do prompt mestre nao devem ser criados para este CRM sem uma decisao explicita de produto, porque contradizem o README e o contexto operacional atual.

## 6. Wireframes Obrigatorios

### 6.1 Central Comercial

Desktop:

```text
+--------------------------------------------------------------------------------+
| Topbar: busca global | notificacoes | usuario                                  |
+--------------------------------------------------------------------------------+
| Sidebar | Header: Central Comercial | Atualizado | Atualizar | Nova oportunidade |
|         +-----------------------------------------------------------------------+
|         | KPI strip: Vencidas | Hoje | Visitas | Retornos | Sem acao | Auvo     |
|         +-----------------------------------------------------------------------+
|         | Filtros compactos: De | Ate | Etapa | Filtros avancados | Aplicar     |
|         +-----------------------------------------------------------------------+
|         | Prioridade agora (tabs Vencidas/Hoje) | Agenda e visitas              |
|         +-----------------------------------------------------------------------+
|         | Orcamentos aguardando retorno        | Higiene do funil               |
|         +-----------------------------------------------------------------------+
|         | Alertas e notificacoes               | Resumo comercial               |
+--------------------------------------------------------------------------------+
```

Mobile:

```text
+----------------------------------+
| Topbar compacta + busca          |
+----------------------------------+
| Central Comercial                |
| Atualizado / Atualizar           |
+----------------------------------+
| KPI strip 2 colunas              |
+----------------------------------+
| Filtros: De Ate Etapa + Drawer   |
+----------------------------------+
| Prioridade agora                 |
| tabs: Vencidas | Hoje            |
+----------------------------------+
| Agenda e visitas                 |
+----------------------------------+
| Retornos / Higiene / Alertas     |
+----------------------------------+
| Bottom nav: Central Acoes Busca  |
+----------------------------------+
```

Estados: loading skeleton, erro de API, vazio por bloco, filtros sem resultado, sucesso ao concluir/reagendar, drawer de filtros.

### 6.2 Proximas Acoes

Desktop:

```text
+---------------------------------------------------------------------+
| Header: Proximas Acoes | Minha fila/Todos | Responsavel | Categoria |
+---------------------------------------------------------------------+
| Agrupadores: Vencidas | Hoje | Amanha | Semana | Futuras            |
+---------------------------------------------------------------------+
| Task list: checkbox | titulo | cliente/oportunidade | prazo | acoes  |
+---------------------------------------------------------------------+
```

Mobile:

```text
+-------------------------------+
| Proximas Acoes                |
| chips: Minha fila, Vencidas   |
+-------------------------------+
| Cards de tarefa               |
| Concluir / Reagendar / Mais   |
+-------------------------------+
| FAB: Nova acao                |
+-------------------------------+
```

Estados: loading, sem acoes, erro, acao concluida, reagendada, cancelada, exige proxima acao quando aplicavel.

### 6.3 Cliente

Desktop:

```text
+-----------------------------------------------------------------------+
| Cliente: nome | telefone | badges duplicidade/origem | editar          |
+-----------------------------------------------------------------------+
| Resumo | Oportunidades | Equipamentos | Enderecos | Historico | Acoes |
+-----------------------------------------------------------------------+
| Coluna principal: relacionamento e oportunidades                       |
| Lateral: proxima acao, contatos, dados cadastrais, duplicidades        |
+-----------------------------------------------------------------------+
```

Mobile:

```text
+-------------------------------+
| Cliente + acoes rapidas       |
+-------------------------------+
| Tabs horizontais              |
+-------------------------------+
| Cards: proxima acao, dados,   |
| oportunidades, historico      |
+-------------------------------+
```

### 6.4 Oportunidade

Desktop:

```text
+-----------------------------------------------------------------------+
| Oportunidade | etapa | situacao | responsavel | editar | aprovar/perder |
+-----------------------------------------------------------------------+
| Proxima acao destacada | Orcamento | Visita | Equipamentos | Historico   |
+-----------------------------------------------------------------------+
| Timeline operacional                                                 |
| Painel lateral: cliente, valores comerciais, previsao, risco          |
+-----------------------------------------------------------------------+
```

Mobile:

```text
+-------------------------------+
| Oportunidade + etapa          |
| Proxima acao fixa             |
+-------------------------------+
| Acoes: follow-up, visita,     |
| orcamento, aprovar, perder    |
+-------------------------------+
| Tabs: resumo, historico, etc. |
+-------------------------------+
```

### 6.5 Caixa Auvo

Desktop alvo:

```text
+----------------------------------------------------------------------------+
| Caixa Auvo | status | busca | filtros                                       |
+----------------------------------------------------------------------------+
| Lista de atendimentos              | Detalhe selecionado                     |
| - nome/canal/status/confiança      | contato, payload sanitizado, matches    |
| - data/ultima atualizacao          | acoes: criar op, vincular, suporte...   |
+----------------------------------------------------------------------------+
```

Mobile:

```text
+-------------------------------+
| Caixa Auvo + filtros          |
+-------------------------------+
| Lista de cards                |
+-------------------------------+
| Tap abre detalhe em drawer    |
+-------------------------------+
```

## 7. Regras de Negocio que Devem Ser Centralizadas

Regras ja centrais no backend:

- Oportunidade ativa exige responsavel, proxima acao e data.
- Perda exige motivo.
- Aprovacao exige valor aprovado, forma de pagamento, parcelas e previsao.
- Garantia/suporte/pos-venda nao criam oportunidade automaticamente.
- Webhook Auvo nao cria oportunidade automaticamente.
- Fixtures escondidas por padrao.
- RBAC por papel.

Regras a centralizar ou reforcar:

- Vocabulario de `tipoDemanda` em uma fonte compartilhada ou gerada.
- Labels de enums/status/tipoDemanda.
- Pausa/nutricao como estado real, nao texto livre.
- Classificacao de visita como entidade real.
- Duplicidade de cliente antes da criacao.
- Match Auvo com criterio e confianca.
- Status operacional de visita, execucao, checklist e pos-venda.
- Notificacoes e dedupe com testes dedicados.

## 8. Backlog Decomposto

### Epic: Fundacao Arquitetural

Feature: Modularizar dominio backend  
Subfeature: Extrair use cases do repository  
Task: Criar camada `server/crm/use-cases`

- Objetivo: separar regra de negocio de persistencia antes de novas entidades.
- Arquivos afetados: `server/crm/prisma-repository.ts`, `server/crm/routes.ts`, novos arquivos em `server/crm/use-cases`.
- Dependencias: testes atuais verdes.
- Impacto: alto.
- Riscos: regressao em APIs existentes.
- Rollback: manter repository como fachada e extrair incrementalmente.
- Criterios de aceite: rotas mantem contrato; typecheck/test passam; repository reduz responsabilidades sem mudar comportamento.
- Subtasks: mapear metodos por dominio; extrair oportunidades; extrair next actions; extrair notifications; extrair auvo; atualizar testes.

Feature: Contratos compartilhados  
Subfeature: DTOs e labels  
Task: Eliminar divergencia frontend/backend

- Objetivo: evitar duplicacao de enums, labels e payloads.
- Arquivos afetados: `src/domain/crm.ts`, `server/crm/types.ts`, `server/crm/validation.ts`.
- Riscos: imports cruzados indevidos entre frontend/backend.
- Rollback: manter facade de compatibilidade.
- Criterios: `tipoDemanda`, status e labels saem de fonte unica ou gerada.

### Epic: Design System

Feature: Design tokens  
Subfeature: Preparar Tailwind sem migracao brusca  
Task: Avaliar introducao de Tailwind

- Objetivo: cumprir prompt mestre sem quebrar UI atual.
- Arquivos afetados: `package.json`, configs, `src/styles.css`, componentes UI.
- Dependencias: decisao explicita porque e mudanca ampla.
- Impacto: alto.
- Riscos: churn visual, conflitos com CSS atual.
- Rollback: manter CSS global e migrar componente a componente.
- Criterios: plano aprovado, screenshot baseline, sem regressao visual.

Feature: Componentes obrigatorios  
Subfeature: Biblioteca UI interna  
Task: Catalogar componentes atuais vs faltantes

- Componentes existentes: Button, Badge, Avatar, Drawer, Dialog/Confirm/Prompt, DataTable, Tabs, Toast, EmptyState, Skeleton.
- Faltantes: Sheet, Stepper, Timeline formal, Calendar, Tooltip, Dropdown formal, Breadcrumb, Search, Filter, Charts, KPI Cards formal, FAB, Bottom Navigation, Command Palette.
- Criterios: cada componente com estados loading/empty/error/disabled/focus quando aplicavel.

### Epic: Operacao Comercial

Feature: Central Comercial  
Subfeature: Finalizar redesign atual  
Task: Validar Central Comercial em light/dark/mobile

- Objetivo: fechar o ciclo ja iniciado no workspace.
- Arquivos afetados: `CentralComercialPage.tsx`, `CommercialActionBlock.tsx`, `CommercialOpportunityBlock.tsx`, `CommercialMetricCard.tsx`, `src/styles.css`, e2e.
- Dependencias: preservar mudancas locais existentes.
- Impacto: medio.
- Riscos: overflow mobile, axe dark mode, regressao visual.
- Rollback: reverter apenas arquivos da Central, nao mexer em backend.
- Criterios: e2e Central passa, responsivo sem overflow, axe Central dark passa, screenshot desktop/mobile.

Feature: Proximas Acoes  
Subfeature: Minha fila e task list  
Task: Transformar tabela em lista operacional

- Objetivo: reduzir cliques e aproximar do uso diario.
- Arquivos: `ProximasAcoesPage.tsx`, `ActionOperationForm.tsx`, UI components.
- Criterios: gestor alterna todos/minha fila; vendedor ve propria fila; agrupamento por prazo; concluir/reagendar/cancelar em ate 2 cliques.

Feature: Cadastro rapido  
Subfeature: Duplicidade antes de salvar  
Task: Endpoint e UI de preflight

- Objetivo: evitar cliente duplicado sem bloquear decisao humana.
- Arquivos: `server/crm/routes.ts`, repository/use-case, `ClientesPage.tsx`.
- Criterios: telefone duplicado abre confirmacao; usuario pode abrir cliente existente ou continuar; nunca mescla automaticamente.

### Epic: Modelo Operacional Artec

Feature: Visitas  
Subfeature: Entidade estruturada  
Task: Criar modelo Visit

- Objetivo: substituir heuristica textual de visita.
- Arquivos: nova migration, `prisma/schema.prisma`, repository/use-cases, APIs, UI.
- Dependencias: decisao de campos e migracao.
- Impacto: alto.
- Riscos: modelagem errada compromete agenda tecnica.
- Rollback: feature flag e manter compatibilidade com NextAction.
- Criterios: visita tem data/hora, tecnico, endereco, objetivo, status, confirmacao, resultado e proxima acao.

Feature: Equipamentos  
Subfeature: Cadastro por cliente/oportunidade  
Task: Criar modelo Equipment

- Objetivo: registrar tipo, marca, modelo, BTUs, tensao, ambiente, serie, garantia.
- Criterios: ficha cliente exibe equipamentos; oportunidade pode referenciar equipamentos; suporte/garantia usam equipamento.

Feature: Enderecos  
Subfeature: Multiplos enderecos  
Task: Criar modelo Address

- Objetivo: suportar retirada/instalacao/corporativo.
- Criterios: oportunidade aceita endereco de retirada e destino; visita referencia endereco.

### Epic: Auvo

Feature: Contratos de payload  
Subfeature: Schemas versionados  
Task: Zod por `eventType`

- Objetivo: falhar de forma auditavel quando payload mudar.
- Arquivos: `server/crm/auvo-parser.ts`, fixtures, testes.
- Criterios: CONTACT_* e SESSION_* tem fixtures anonimizadas; payload invalido vira erro rastreavel ou ignored explicito, nao processed silencioso.

Feature: Match confidence  
Subfeature: Explicar sugestao de cliente  
Task: Retornar criterio e score

- Objetivo: tornar triagem confiavel.
- Criterios: UI mostra "match por telefone", "match por Auvo ID", "possivel match por email"; usuario decide.

Feature: Saude operacional  
Subfeature: Dashboard Auvo Admin  
Task: Exibir latencia, fila, falhas e retries

- Criterios: gestor sabe se worker esta atrasado; reprocessar aciona fluxo compreensivel; failed tem lastError e proximo passo.

### Epic: Relatorios

Feature: Drill-down  
Subfeature: Metric card clicavel  
Task: Navegar para lista filtrada

- Objetivo: cada numero leva ao detalhe.
- Criterios: etapa/origem/motivo abre oportunidades filtradas; filtros preservados.

Feature: Charts  
Subfeature: Graficos comerciais  
Task: Adicionar biblioteca leve de charts

- Objetivo: visualizar funil, conversao e tempo.
- Riscos: peso de bundle.
- Criterios: lazy loaded na rota Relatorios; acessivel; sem tratar aprovado como faturamento.

## 9. Checkpoints Obrigatorios

Antes de iniciar implementacao:

- Estado Git conhecido.
- Decidir se mudancas locais atuais da Central Comercial sao base oficial.
- Capturar screenshot baseline das telas principais.
- Confirmar se migracao para Tailwind e obrigatoria agora ou sera incremental.
- Confirmar entidades estruturais: Visit, Equipment, Address.

Ao finalizar cada feature:

- `npm run prisma:validate`
- `npm run typecheck`
- `npm run test`
- `npm run e2e` quando tocar fluxo usuario
- Screenshot desktop/mobile
- Axe light/dark nas telas afetadas
- Sem overflow horizontal mobile
- Sem segredo em logs, screenshots ou docs
- Documentacao atualizada

## 10. Criterios de Aceite Globais

Nenhuma feature deve ser aceita se:

- duplicar regra de negocio que ja existe no backend;
- depender de texto livre para entidade operacional critica;
- quebrar separacao CRM comercial vs financeiro;
- criar oportunidade automaticamente a partir do Auvo;
- esconder garantia/suporte/pos-venda dentro do funil comercial;
- exibir enum bruto para usuario;
- exibir timestamp ISO cru;
- nao tratar loading, empty, error e sucesso;
- degradar mobile;
- remover RBAC ou filtros de fixture;
- nao tiver plano de rollback.

## 11. DoD Mestre

Codigo:

- Modular, tipado, sem duplicacao relevante, comentarios apenas onde ajudam.

Frontend:

- Responsivo, acessivel, consistente, com foco visivel e estados completos.

Backend:

- Regras centralizadas, erros publicos claros, logs operacionais, testes.

Banco:

- Indices e constraints revisados, migrations idempotentes no runner proprio, backfill com dry-run quando houver dados existentes.

Performance:

- Lazy loading preservado, queries revisadas, bundle observado.

UX:

- Menos cliques nas tarefas diarias; Central responde "o que fazer agora"; mobile nao e cidadania de segunda classe.

Documentacao:

- README/runbook/ADR atualizados conforme mudanca.

## 12. Proximos Ciclos Recomendados

1. Fechar a frente atual da Central Comercial: validar, corrigir eventuais falhas, screenshots e e2e.
2. Criar/atualizar agentes em `.claude/agents` para cobrir arquitetura, frontend, backend, banco, seguranca, acessibilidade e paginas atuais.
3. Extrair roadmap tecnico em issues/tarefas pequenas.
4. Decidir a estrategia Tailwind: migracao completa imediata vs ponte incremental com tokens.
5. Iniciar modelagem de Visita, Equipamento e Endereco com ADR antes de qualquer migration.

## 13. Referencias Externas Consultadas

- HubSpot: mobile dashboards, mobile tasks, mobile CRM.
- Salesforce: mobile dashboards/workflow e home do Sales Cloud mobile.
- Pipedrive: mobile CRM e Insights.
- Kommo: pipeline, mobile app, lead/contact management.
- monday CRM: mobile CRM, pipeline e dashboards.
- Zoho CRM: analytics dashboards mobile.
- Freshsales: home mobile, deals mobile, activities dashboard.
- Agendor: funil, automacoes e tarefas.
- Bitrix24: mobile CRM, bottom navigation, deals, tasks e timeline.

As referencias foram usadas como principios de produto e UX, nao como copia visual.
