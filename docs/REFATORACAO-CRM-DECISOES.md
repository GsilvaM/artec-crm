# Decisoes - Reconstrucao Artec CRM

Registro de decisoes tomadas quando havia conflito entre fontes ou ambiguidade.

## D001 - Precedencia de tokens: JSON novos de `docs/` vs. analise pixel-a-pixel

**Data**: 2026-07-23

**Conflito**: o prompt determina que tokens formais em `docs/` tem precedencia alta, mas os 13 arquivos JSON extraidos do PDF Venture nao sao uniformes em qualidade.

**Evidencia**:

- `docs/global colors.json`, `docs/color tokens.json`, `docs/typography.json`: nomes de propriedade derivados do texto de descricao da pagina do PDF, nao do nome semantico real da variavel Figma; ha contradicoes internas comprovadas.
- `docs/buttons styles.json`, `docs/table.json`, `docs/selector.json`, `docs/small components.json`, `docs/modals.json`, `docs/navigation.json`, `docs/navigation header.json`, `docs/cards.json`, `docs/text field.json`: usam sintaxe nativa de variantes do Figma e batem melhor com as medicoes independentes.

**Decisao**:

- Para dimensoes e variantes de componente, os JSON de `docs/` prevalecem.
- Para cor e tipografia, `docs/ANALISE-PIXEL-A-PIXEL-VENTURE-DESIGN-SYSTEM.md` continua sendo a fonte mais confiavel.

**Impacto**: cores e tipografia seguem a analise pixel-a-pixel; dimensoes de componente devem ser conferidas contra os JSON.

**Correcao posterior**: `docs/cards.json` especifica radius numerico de 4px para cards, corrigindo a suposicao anterior de que cards/painel nao tinham radius documentado.

## D002 - Commit local nao pushado

**Data**: 2026-07-23

**Achado**: existe historico local e mudancas locais no branch `refactor/frontend-design-system`.

**Decisao**: nao commitar, nao pushar e nao alterar historico sem autorizacao explicita do usuario.

## D003 - Central Comercial fechada antes do modelo estrutural

**Data**: 2026-07-24

**Contexto**: a Central Comercial recebeu redesign operacional com metric cards, filtros compactos, drawer, tabs, skeleton dedicado, correcao de dark mode da sidebar e correcoes de overflow mobile.

**Evidencia**:

- `npm.cmd run typecheck` passou.
- `npm.cmd run test` passou com 90/90 testes.
- `npm.cmd run e2e` passou com 41/41 testes, incluindo Central Comercial em dark mode via axe e 7 viewports sem overflow horizontal.

**Decisao**: considerar a frente atual da Central Comercial fechada como feature validada neste gate.

**Impacto**: proximas alteracoes nessa tela devem ser tratadas como novo ciclo, preferencialmente a partir da futura entidade `Visit`, e nao como continuacao solta do redesign.

## D004 - Visita, Equipamento e Endereco exigem ADR antes de migration

**Data**: 2026-07-24

**Contexto**: as auditorias apontam que a rotina real da Artec nao esta completamente representada no schema porque faltam entidades de visita tecnica, equipamento e endereco.

**Decisao**: criar uma ADR antes de qualquer migration. A ADR inicial e `docs/adr/ADR-0001-visitas-equipamentos-enderecos.md`.

**Impacto**: nenhuma tabela nova deveria ser criada antes da ADR. A futura migration deveria ser aditiva, com testes e plano de dry-run/backfill.

## D005 - Primeira fatia estrutural de Visita, Equipamento e Endereco no backend

**Data**: 2026-07-24

**Contexto**: apos a ADR-0001, a primeira mudanca estrutural real podia ser feita sem depender de UI ou backfill automatico.

**Decisao**: implementar a fatia backend aditiva com `crm.enderecos`, `crm.equipamentos`, `crm.visitas` e `crm.visitas_equipamentos`, usando migration SQL propria (`database/migrations/0021_criar_visitas_equipamentos_enderecos.sql`), modelos Prisma, RBAC, schemas Zod, repository e rotas HTTP.

**Evidencia**:

- `npm.cmd run typecheck` passou.
- `npm.cmd run test` passou com 91/91 testes.
- `npm.cmd run prisma:validate` passou.
- `npm.cmd run build` passou.

**Impacto**: o dominio agora tem base estruturada para agenda tecnica e equipamentos. A UI ainda deve ser feita em ciclo separado, primeiro na ficha do Cliente/Oportunidade e depois na Central Comercial.

## D006 - Visit real substitui heuristica de visita na Central Comercial

**Data**: 2026-07-24

**Contexto**: a Central Comercial mostrava "visitas proximas" a partir de texto em `NextAction`, o que misturava agenda tecnica com follow-up comercial.

**Decisao**: `upcomingVisits` da Central Comercial passa a consultar `crm.visitas` e a UI usa um bloco proprio de visitas. `NextAction` continua responsavel por follow-up, vencidas, hoje e higiene do funil.

**Evidencia**:

- Ficha do Cliente cria Endereco, Equipamento e Visita pela aba Estrutura.
- E2E de UI valida que a visita criada aparece no bloco "Agenda e visitas" da Central Comercial.
- `npm.cmd run e2e` passou com 42/42 testes.

**Impacto**: a agenda tecnica deixa de depender de texto livre. A proxima etapa e levar o mesmo modelo para a ficha da Oportunidade.

## D007 - Ficha da Oportunidade consome a estrutura tecnica sem substituir NextAction

**Data**: 2026-07-24

**Contexto**: apos Cliente e Central Comercial usarem `Address`, `Equipment` e `Visit`, faltava levar a mesma base para o contexto comercial da oportunidade.

**Decisao**: adicionar na ficha da Oportunidade um bloco tecnico dedicado para enderecos do cliente, equipamentos vinculados a oportunidade e visitas tecnicas filtradas por `opportunityId`. `NextAction` permanece como follow-up comercial; visita tecnica continua em `Visit`.

**Evidencia**:

- `npx.cmd playwright test e2e/opportunity-detail.spec.ts --project=chromium` passou com 2/2 testes.
- `npm.cmd run typecheck` passou.
- `npm.cmd run test` passou com 91/91 testes.
- `npm.cmd run build` passou.

**Impacto**: a Oportunidade agora tem contexto tecnico proprio para levantamento/instalacao sem duplicar o cadastro do Cliente e sem voltar a depender de texto livre para agenda.

## D008 - Cron de reconcile em producao segue limite do plano Hobby

**Data**: 2026-07-24

**Contexto**: `CRON_SECRET` foi configurado em Production/Preview, mas o deploy de producao com `*/5 * * * *` foi recusado pela Vercel porque o plano Hobby permite apenas cron diario.

**Decisao**: ajustar `vercel.json` para `0 8 * * *`, mantendo `/api/internal/reconcile` protegido por `CRON_SECRET`. Frequencia subdiaria fica condicionada a plano Pro ou scheduler externo.

**Evidencia**:

- Deploy `dpl_kXpqc5EZ3SrMdcvBdXhK19qrBApJ` ficou `Ready` e aliasado em `https://artec-crm.vercel.app`.
- `/api/internal/reconcile` em producao respondeu 200 com `Authorization: Bearer CRON_SECRET`.
- Status Auvo apos reconcile: `pendingEvents: 0`, `failedEvents: 0`.
- `npx.cmd vercel crons ls` confirmou `/api/internal/reconcile` com schedule `0 8 * * *`.

**Impacto**: o processamento automatico esta ativo em producao, mas com cadencia diaria. Se a operacao precisar SLA menor para Caixa Auvo/notificacoes, a decisao de infraestrutura ainda precisa ser tomada.

## D009 - Sinais do Auvo sao dados do CRM, nao apenas da Caixa Auvo

**Data**: 2026-07-24

**Contexto**: os payloads reais do Auvo trazem sinais uteis para toda a rotina comercial: origem, UTM, tags, campos customizados, classificacao, departamento/fila, atendente, tempos de atendimento e ultima mensagem.

**Decisao**: criar uma camada canonica `crm_internal.auvo_contact_signals` por `auvo_contact_id`, alem de um snapshot operacional em `auvo_inbox_items`. A Caixa Auvo passa a exibir um recorte para triagem, mas Cliente/Oportunidade devem poder consumir os mesmos sinais via contato Auvo.

**Criterio de ordenacao operacional**: identidade do contato, intencao/demanda, dono/fila, urgencia/SLA, origem/campanha, historico recente e metadados auxiliares.

**Evidencia**:

- Parser enriquecido em `server/crm/auvo-parser.ts`.
- Migration aditiva `database/migrations/0022_enriquecer_sinais_caixa_auvo.sql`.
- Contrato `AuvoParsedSignals` exposto para backend/frontend.
- Testes focados passaram: `server/crm/auvo-parser.test.ts` e `server/app.test.ts`.

**Impacto**: a informacao do Auvo deixa de ficar presa ao evento bruto ou a tela de triagem. A ficha do Cliente ja pode receber sinais canônicos quando houver `auvoContactId`; a Oportunidade deve consumir esses sinais na proxima fatia de UI/decisao comercial.

## D010 - Parser Auvo e inteligencia operacional sao camadas separadas

**Data**: 2026-07-24

**Contexto**: para uma usabilidade profissional, o CRM nao deve apenas exibir campos do payload; ele deve ordenar trabalho por identidade, intencao, dono/fila, urgencia/SLA, origem, historico e metadados.

**Decisao**: manter `server/crm/auvo-parser.ts` focado em entender o formato bruto do payload e criar `server/crm/auvo-intelligence.ts` para derivar `intent`, `urgency`, `suggestedAction`, `confidence`, `missingData`, `slaState`, `needsHumanReview` e `summary`.

**Evidencia**:

- `npm.cmd test -- server/crm/auvo-intelligence.test.ts server/crm/auvo-parser.test.ts server/app.test.ts` passou com 70/70 testes.
- `npm.cmd run typecheck` passou.
- `npm.cmd run build` passou.

**Impacto**: a UI passa a poder consumir `derived` para reduzir carga cognitiva, mantendo payload bruto e sinais extraidos disponiveis para auditoria/backfill.

## D011 - Backfill Auvo e deploy exigem migration 0022 aplicada

**Data**: 2026-07-24

**Contexto**: a camada Auvo enriquecida adiciona colunas em `crm_internal.auvo_inbox_items` e a tabela canonica `crm_internal.auvo_contact_signals`. O codigo novo ja escreve esses campos no recebimento do webhook e le o snapshot canonico na ficha do Cliente.

**Decisao**: tratar a migration `0022_enriquecer_sinais_caixa_auvo.sql` como gate obrigatorio antes de deploy do build atual. O backfill historico deve ser executado depois da migration via `npm.cmd run auvo:signals:backfill`, com limite controlado e resultado auditado.

**Evidencia**:

- `server/auvo-signals-backfill.ts` reaplica parser/intelligence em eventos `SESSION_*` e `CONTACT_*` sem alterar status do webhook.
- `npm.cmd run auvo:signals:backfill -- --help` retorna uso sem abrir conexao com o banco.
- Limite invalido em `auvo:signals:backfill` falha antes de abrir conexao.
- Caixa Auvo e `auvo_contact_signals` evitam sobrescrita por evento antigo.
- `npm.cmd run prisma:validate`, `npm.cmd run typecheck`, testes focados 70/70 e `npm.cmd run build` passaram.

**Impacto**: nao fazer deploy validado desta frente antes da `0022`. O caminho correto e aplicar migration, rodar backfill com contagem auditada e so entao redeployar.

## D012 - Oportunidade consome sinais Auvo pelo Cliente vinculado

**Data**: 2026-07-24

**Contexto**: os sinais Auvo sao relevantes para todo o ciclo comercial, nao apenas para a Caixa Auvo ou ficha do Cliente. A Oportunidade precisa mostrar origem, intencao, urgencia, SLA e pendencias do atendimento que originou ou contextualiza a demanda.

**Decisao**: `OpportunityRecord` passa a aceitar `auvoSignals`; no detalhe da oportunidade, o backend consulta `crm_internal.auvo_contact_signals` a partir do `auvoContactId` do Cliente vinculado. Listagens continuam leves e retornam `auvoSignals: null`.

**Evidencia**:

- `server/crm/prisma-repository.ts` carrega `cliente.auvoContactId` e anexa `mapAuvoSignals` no `getOpportunity`.
- `src/features/opportunities/OportunidadePage.tsx` exibe `AuvoSignalSummary` compacto no resumo da oportunidade.
- `npm.cmd run typecheck`, `npm.cmd run prisma:validate`, testes focados 70/70 e `npm.cmd run build` passaram.

**Impacto**: o contexto comercial passa a enxergar a leitura operacional do atendimento sem depender do payload bruto e sem sobrecarregar listagens.

## D013 - Caixa Auvo sugere campos comerciais sem automatizar decisao

**Data**: 2026-07-24

**Contexto**: depois de separar parser e inteligencia, a UI da Caixa Auvo ainda iniciava a criacao de oportunidade com defaults genericos, desperdicando origem, intencao, pendencias e SLA ja derivados.

**Decisao**: ao abrir "Criar oportunidade", a Caixa Auvo preenche campos iniciais a partir de `AuvoParsedSignals.derived`: origem vem de `signals.origin` ou "Auvo"; tipo de demanda vem de `intent`; situacao reflete pendencias/SLA; proxima acao sugere coleta de dados ou visita tecnica. O usuario continua revisando e confirmando antes de criar qualquer registro.

**Evidencia**:

- `src/components/AuvoInboxPanel.tsx` envia `origem` no payload `create_opportunity`.
- Helpers locais mapeiam `intent` para `tipoDemanda`, `situacao` e `proximaAcao`.
- `npm.cmd run typecheck`, `npm.cmd run prisma:validate`, testes focados 70/70 e `npm.cmd run build` passaram.

**Impacto**: a rotina de triagem fica mais proxima de um CRM profissional: o sistema resume e sugere, mas nao fecha classificacao ou oportunidade sozinho.

## D014 - Match Cliente-Auvo exige score explicavel antes de backfill

**Data**: 2026-07-24

**Contexto**: o backlog Auvo historico tinha match binario e `Customer.auvoContactId` vazio, mas preencher essa chave automaticamente por telefone ou email pode vincular contatos errados quando houver duplicidade, telefone compartilhado ou dados incompletos.

**Decisao**: criar uma camada backend pura de score em `server/crm/auvo-customer-match.ts` e um CLI dry-run em `server/auvo-customer-match-dry-run.ts`. O relatorio traz `score`, `confidence`, `reasons` e `blockers`; nenhum dado e gravado por essa rotina.

**Evidencia**:

- `npm.cmd run auvo:customers:match-dry-run -- --help` retorna uso sem abrir rotina real.
- Limite invalido falha antes de abrir conexao.
- `npm.cmd test -- server/crm/auvo-customer-match.test.ts server/crm/auvo-intelligence.test.ts server/crm/auvo-parser.test.ts server/app.test.ts` passou com 74/74.
- `npm.cmd run prisma:validate` e `npm.cmd run build` passaram.

**Impacto**: o proximo backfill de `Customer.auvoContactId` deve partir desse relatorio e aplicar apenas candidatos de alta confianca sem bloqueios, preferencialmente com revisao humana ou etapa de aprovacao explicita.

## D015 - Match visual na Caixa Auvo e preview, nao score oficial

**Data**: 2026-07-24

**Contexto**: a Caixa Auvo precisava preparar a UI para match confidence antes de existir endpoint dedicado retornando o score backend oficial. Ja ha dados locais suficientes para orientar o atendente, mas nao para persistir decisao automatica.

**Decisao**: exibir um cartao "Match Cliente-Auvo" com confianca estimada e evidencias baseadas nos dados ja carregados no frontend. O score visual e um preview operacional; o score oficial para backfill continua sendo o relatorio backend `auvo:customers:match-dry-run`.

**Evidencia**:

- `src/components/AuvoInboxPanel.tsx` mostra match forte/provavel/pendente com evidencias.
- `src/components/AuvoSignalSummary.tsx` ganhou props para contexto em Cliente/Oportunidade.
- QA removeu semantica incorreta de menu e tirou blocos ricos de dentro de `<dl>`.
- `npm.cmd run typecheck`, testes focados 74/74, `npm.cmd run prisma:validate` e `npm.cmd run build` passaram.

**Impacto**: a UI fica mais profissional e pronta para consumir endpoint futuro de match, sem confundir preview visual com backfill autorizado.

## D016 - Proximas Acoes vira task list operacional

**Data**: 2026-07-24

**Contexto**: a tela de Proximas Acoes era uma tabela densa. Isso dificultava a rotina de atendimento porque o usuario precisava escanear colunas para entender fila, prioridade, vencimento e proximo comando.

**Decisao**: transformar a visualizacao principal em task list operacional, mantendo a API existente. A tela passa a ter metric cards por fila e cards de acao com cliente, contexto, vencimento, prioridade, status e comandos diretos.

**Evidencia**:

- `src/features/next-actions/ProximasAcoesPage.tsx` foi reestruturada para lista de cards.
- `src/styles.css` recebeu classes `next-actions-*` com responsividade propria.
- `npm.cmd run typecheck`, testes focados 74/74 e `npm.cmd run build` passaram.

**Impacto**: a tela passa a ser orientada a execucao recorrente, coexistindo com `Visit` como agenda tecnica e preservando `NextAction` como follow-up operacional.

## D017 - Tailwind exige ADR e piloto antes de migracao

**Data**: 2026-07-24

**Contexto**: `src/styles.css` ultrapassou 3000 linhas e virou gargalo para agents de frontend. Tailwind pode reduzir CSS global novo, mas uma migracao imediata seria transversal e arriscada.

**Decisao**: registrar `docs/adr/ADR-0002-estrategia-estilos-tailwind.md` e condicionar Tailwind a um piloto controlado em uma superficie isolada. Ate la, `src/styles.css` permanece como camada legacy.

**Evidencia**:

- Nao ha Tailwind configurado no projeto atual.
- ADR-0002 define criterios de piloto, gates e consequencias.
- `npm.cmd run typecheck` e `npm.cmd run build` passaram sem introduzir dependencia nova.

**Impacto**: os proximos agents de frontend nao devem instalar/migrar Tailwind sem executar o piloto e registrar resultado.

## D018 - Proximas Acoes filtra a carteira antes da fila visual

**Data**: 2026-07-24

**Contexto**: apos virar task list operacional, a tela ainda carregava a carteira inteira e so separava as acoes por vencidas/hoje/proximas/concluidas/canceladas. Para rotina comercial real, gestores e atendimento precisam refinar a carteira por responsavel, categoria e prioridade antes de escolher a fila.

**Decisao**: usar o contrato existente de `/api/next-actions` para carregar Proximas Acoes com filtros de responsabilidade, categoria e prioridade. Os metric cards continuam representando fila de prazo/status dentro do recorte filtrado.

**Evidencia**:

- `src/features/next-actions/ProximasAcoesPage.tsx` adiciona filtros de responsavel, categoria e prioridade enviados a `loadNextActions`.
- `src/styles.css` adiciona `next-actions-controls` com responsividade propria.
- `npm.cmd run typecheck`, `npm.cmd test -- server/app.test.ts`, `npx.cmd playwright test e2e/next-actions.spec.ts --project=chromium`, `npx.cmd playwright test e2e/accessibility.spec.ts --project=chromium --grep "proximas acoes"` e `npx.cmd playwright test e2e/responsive.spec.ts --project=chromium --grep "sem overflow horizontal"` passaram.
- Screenshots revisados: `docs/artifacts/proximas-acoes-desktop-1366.png` e `docs/artifacts/proximas-acoes-mobile-390.png`.

**Impacto**: a tela se aproxima de uma rotina profissional de agenda/follow-up sem criar endpoint novo e sem misturar filtro operacional com status visual da fila.

## D019 - Ficha do Cliente abre com resumo operacional

**Data**: 2026-07-24

**Contexto**: a ficha do Cliente ja concentrava cadastro, oportunidades, proximas acoes, estrutura tecnica, visitas e sinais Auvo, mas a aba inicial mostrava principalmente dados cadastrais. Para uma rotina profissional de atendimento, o usuario precisa entender rapidamente risco, proximo passo e contexto tecnico.

**Decisao**: transformar a aba inicial em uma visao geral operacional com cards de oportunidades ativas, proxima acao, visitas abertas e qualidade do cadastro. Identidade/contato continuam disponiveis no mesmo painel, e `AuvoSignalSummary` permanece como leitura de contexto quando houver contato Auvo vinculado.

**Evidencia**:

- `src/features/customers/ClientePage.tsx` adiciona `customer-overview`, metric cards e calculos derivados locais.
- `src/styles.css` adiciona estilos responsivos para `customer-overview-*` e `customer-identity-panel`.
- Screenshots revisados: `docs/artifacts/cliente-visao-geral-desktop-1366.png` e `docs/artifacts/cliente-visao-geral-mobile-390.png`.
- `npm.cmd run typecheck`, `npm.cmd test -- server/app.test.ts`, `npx.cmd playwright test e2e/customer-detail.spec.ts --project=chromium --grep "opens a customer detail"` e `npm.cmd run build` passaram.

**Impacto**: a ficha do Cliente fica mais orientada a decisao e atendimento recorrente sem criar backend novo nem misturar `Visit` com `NextAction`.

## D020 - Lista de Clientes vira carteira operacional

**Data**: 2026-07-24

**Contexto**: a lista de Clientes ainda era uma tabela generica, enquanto a ficha ja passou a consolidar sinais comerciais, estrutura tecnica e follow-up. Para atendimento recorrente, a entrada da carteira precisa mostrar identidade, contato, localizacao, oportunidades e risco de duplicidade sem depender de leitura horizontal de colunas.

**Decisao**: substituir a tabela de `ClientesPage` por cards operacionais, preservando o contrato de `loadCustomersPage`, busca por Enter, paginacao, criacao de cliente e arquivamento. A pagina passa a exibir resumo superior de clientes ativos, oportunidades vinculadas e possiveis duplicidades.

**Evidencia**:

- `src/features/customers/ClientesPage.tsx` foi reestruturada para `customers-summary`, `customers-board` e `customer-card-*`.
- `src/styles.css` adiciona estilos responsivos para a carteira de clientes.
- E2Es que dependiam de tabela foram atualizados para abrir clientes pelos cards.
- Screenshots revisados: `docs/artifacts/clientes-lista-desktop-1366.png` e `docs/artifacts/clientes-lista-mobile-390.png`.
- `npm.cmd run typecheck`, `npx.cmd playwright test e2e/customer-detail.spec.ts e2e/customer-and-opportunity.spec.ts --project=chromium`, `npx.cmd playwright test e2e/accessibility.spec.ts --project=chromium --grep "clientes list"`, `npx.cmd playwright test e2e/responsive.spec.ts --project=chromium --grep "sem overflow horizontal"` e `npm.cmd run build` passaram.

**Observacao**: uma execucao isolada de `customer-detail.spec.ts` falhou durante login com tela "API temporariamente indisponivel" enquanto havia build em paralelo; a mesma spec passou em retry isolado.

**Impacto**: Clientes fica consistente com o modelo profissional adotado em Central Comercial, Proximas Acoes e ficha do Cliente, sem dependencia nova e sem mudanca de backend.

## D021 - Relatorios vira dashboard operacional

**Data**: 2026-07-24

**Contexto**: Relatorios comerciais ainda apresentava metric cards e tabelas dentro de um painel unico. Isso era funcional, mas pouco orientado a decisao: o gestor precisava montar mentalmente receita aprovada, valor em aberto, eficiencia de follow-up, funil, origem e perdas.

**Decisao**: reestruturar `ReportsPanel` como dashboard operacional sem card externo envolvendo cards internos. O topo traz filtros compactos, seguido de indicadores principais, funil por etapa, conversao por origem, eficiencia de follow-up e motivos de perda.

**Evidencia**:

- `src/components/ReportsPanel.tsx` foi reescrito mantendo `loadCommercialReport` e os filtros existentes.
- `src/styles.css` adiciona `reports-*` e `report-*` com responsividade propria.
- `e2e/commercial-center-and-reports.spec.ts` foi atualizado para a nova semantica do dashboard.
- Screenshots revisados: `docs/artifacts/relatorios-dashboard-desktop-1366.png` e `docs/artifacts/relatorios-dashboard-mobile-390.png`.
- `npm.cmd run typecheck`, `npx.cmd playwright test e2e/commercial-center-and-reports.spec.ts --project=chromium --grep "commercial reports"`, `npx.cmd playwright test e2e/accessibility.spec.ts --project=chromium --grep "relatorios page"`, `npx.cmd playwright test e2e/responsive.spec.ts --project=chromium --grep "sem overflow horizontal"`, `npm.cmd test -- server/app.test.ts` e `npm.cmd run build` passaram.

**Observacao**: uma primeira execucao do E2E de Relatorios falhou durante login com a tela "API temporariamente indisponivel" enquanto outra validacao ainda rodava; o mesmo teste passou em retry isolado.

**Impacto**: a area de gestao passa a entregar leitura executiva mais clara sem backend novo, dependencia nova ou alteracao de schema.

## D022 - Lista de Oportunidades vira carteira operacional

**Data**: 2026-07-24

**Contexto**: a lista de Oportunidades ainda era uma tabela generica, destoando de Clientes, Proximas Acoes, Central Comercial e Relatorios. Para rotina comercial, o vendedor/gestor precisa enxergar etapa, situacao, cliente, proxima acao, valor e status em leitura vertical e responsiva.

**Decisao**: substituir a tabela de `OportunidadesPage` por cards operacionais, preservando `loadOpportunitiesPage`, busca por Enter, criacao e paginacao. A pagina passa a ter resumo superior de oportunidades ativas, valor aprovado e registros sem proxima acao.

**Evidencia**:

- `src/features/opportunities/OportunidadesPage.tsx` foi reestruturada para `opportunities-summary`, `opportunities-board` e `opportunity-card-*`.
- `src/styles.css` adiciona estilos responsivos para a carteira de oportunidades.
- E2Es que dependiam de tabela foram atualizados para abrir oportunidades pelos cards.
- Screenshots revisados: `docs/artifacts/oportunidades-lista-desktop-1366.png` e `docs/artifacts/oportunidades-lista-mobile-390.png`.
- `npm.cmd run typecheck`, `npx.cmd playwright test e2e/opportunity-detail.spec.ts e2e/customer-and-opportunity.spec.ts --project=chromium`, `npx.cmd playwright test e2e/accessibility.spec.ts --project=chromium --grep "opportunities list"`, `npx.cmd playwright test e2e/responsive.spec.ts --project=chromium --grep "sem overflow horizontal"`, `npm.cmd test -- server/app.test.ts` e `npm.cmd run build` passaram.

**Observacao**: o novo axe da lista encontrou contraste insuficiente nos avatares porque `.opportunity-card-client span` sobrescrevia a cor branca do componente `Avatar`; o seletor foi restringido para `span:not(.avatar)` e o teste passou.

**Impacto**: Oportunidades fica alinhada ao visual operacional inspirado no Venture e ao mesmo padrao de QA das frentes ja fechadas, sem backend novo, dependencia nova ou alteracao de schema.

## D023 - Venture deixa de ser inspiracao e vira contrato visual estrito

**Data**: 2026-07-24

**Contexto**: os agents apontaram que a refatoracao visual ainda continha uma autorizacao implicita para nao seguir estritamente o Venture, em especial pela preferencia de deixar a aplicacao mais colorida. O CSS confirmava esse desvio ao documentar um `primary` azul em vez do `Action/Primary` neutro do kit.

**Decisao**: remover essa brecha. `src/styles.css` passa a usar primary/action neutro do Venture, dark mode nao pode virar paleta alternativa colorida e os agents passam a rejeitar propostas visuais baseadas em cor decorativa.

**Evidencia**:

- `docs/adr/ADR-0003-aderencia-visual-estrita-venture.md` formaliza a decisao.
- `.claude/agents/artec-design-system-engineer.md` define Venture como fonte normativa e confere poder de veto a divergencias sem justificativa objetiva.
- `.claude/agents/artec-frontend-agent.md` e `.claude/agents/artec-page-specialists.md` exigem cor apenas semantica.
- `docs/AGENTS-OPERATING-MODEL.md` registra a diretriz visual estrutural.
- `src/styles.css` troca `--action-primary-*`, `--color-tertiary`, `--color-teal`, `--primary-container` e dark primary para neutros Venture.

**Impacto**: as proximas frentes frontend devem perseguir fidelidade visual ao Venture, nao uma interpretacao mais colorida. Cores continuam permitidas para status, prioridade, alerta, tag, categoria e feedback operacional.

## D024 - CRM operacional deve ser board inteligente sem scroll global

**Data**: 2026-07-24

**Contexto**: a direcao de UX desejada para o Artec CRM e semelhante a Kommo e outros CRMs profissionais: cards inteligentes em quadro/kanban, mostrando a rotina comercial inteira na tela, com avancos feitos pelo atendente a partir de mudancas reais de estado.

**Decisao**: adotar a ADR-0004. Telas operacionais devem evitar scroll global como padrao, priorizando board compacto, colunas, raias, tabs e paineis de decisao. Scroll fica restrito a areas internas controladas. Cards so avancam por mudanca persistida de etapa, situacao, proxima acao, visita, resolucao Auvo, aprovado/perdido, arquivamento ou estado equivalente.

**Evidencia**:

- `docs/adr/ADR-0004-ux-sem-scroll-board-inteligente.md` formaliza a diretriz.
- `.claude/agents/artec-crm-product-architect.md` passa a exigir board inteligente e estados reais da rotina.
- `.claude/agents/artec-frontend-agent.md` passa a rejeitar lista vertical longa como padrao operacional.
- `.claude/agents/artec-page-specialists.md` passa a exigir proposta sem-scroll/board por pagina.
- `.claude/agents/artec-qa-release-guardian.md` passa a exigir evidencia de ausencia de scroll global indesejado.

**Impacto**: as telas ja refatoradas em cards ainda precisam de uma segunda revisao: sair de carteira vertical com scroll para board operacional compacto quando forem paginas de trabalho diario.

## D025 - Notificacoes vira primeiro board sem-scroll da ADR-0004

**Data**: 2026-07-24

**Contexto**: Notificacoes era uma fila vertical com filtros de status. Apos a ADR-0004, isso ainda preservava scroll global e nao representava o novo alvo de CRM operacional em board inteligente.

**Decisao**: reestruturar `NotificacoesPage` como board com tres raias: "Resolver agora", "Acompanhar" e "Historico". A pagina mantem filtros/status e acoes existentes, mas o trabalho passa a ficar em colunas com overflow interno controlado. O card continua avancando por acoes persistidas (`read`, `snooze`, `archive`, `readAll`), nao por heuristica de texto.

**Evidencia**:

- `src/features/notifications/NotificacoesPage.tsx` monta as raias operacionais a partir de status/severidade.
- `src/components/ui/NotificationList.tsx` ganhou modo compacto reutilizavel para colunas.
- `src/styles.css` adiciona `notifications-board`, `notifications-lane` e altura de viewport sem scroll global.
- `e2e/notifications.spec.ts` valida raias, filtros e ausencia de scroll global/horizontal em `mobile-390` e `desktop-1366`.
- Screenshots revisados: `docs/artifacts/notificacoes-board-desktop-1366.png` e `docs/artifacts/notificacoes-board-mobile-390.png`.
- `npm.cmd run typecheck`, `npx.cmd playwright test e2e/notifications.spec.ts --project=chromium`, `npx.cmd playwright test e2e/accessibility.spec.ts --project=chromium --grep "notificacoes page"` e `npm.cmd run build` passaram.

**Observacao**: uma execucao inicial do axe falhou antes da pagina por "API temporariamente indisponivel"; `/api/health` respondeu saudavel em seguida e o mesmo teste passou no retry isolado.

**Impacto**: Notificacoes passa a ser a primeira tela concreta do padrao sem-scroll/board inteligente. A pendencia remanescente da area e de regra/backend (`notification dedupe`), nao mais da estrutura visual base.

## D026 - Proximas Acoes vira board sem-scroll de follow-up

**Data**: 2026-07-24

**Contexto**: Proximas Acoes ja tinha metric cards e filtros operacionais, mas ainda escondia a carteira em uma lista unica filtrada. Isso contrariava a ADR-0004 porque o atendente precisava alternar filtros para entender a rotina inteira.

**Decisao**: transformar `ProximasAcoesPage` em board com cinco raias fixas: "Vencidas", "Hoje", "Proximas", "Concluidas" e "Canceladas". Os metric cards deixam de esconder o restante da carteira e passam a focar/realcar a raia correspondente. Cada card continua avancando apenas por acoes reais persistidas (`complete`, `postpone`, `cancel`) via API existente.

**Evidencia**:

- `src/features/next-actions/ProximasAcoesPage.tsx` passa a agrupar acoes por raia operacional.
- `src/styles.css` adiciona altura de viewport, overflow interno em raias e board horizontal controlado.
- `e2e/next-actions.spec.ts` valida raias, filtros e ausencia de scroll global/horizontal em `mobile-390` e `desktop-1366`.
- Screenshots revisados: `docs/artifacts/proximas-acoes-board-desktop-1366.png` e `docs/artifacts/proximas-acoes-board-mobile-390.png`.
- `npm.cmd run typecheck`, `npx.cmd playwright test e2e/next-actions.spec.ts --project=chromium`, `npx.cmd playwright test e2e/accessibility.spec.ts --project=chromium --grep "proximas acoes page"` e `npm.cmd run build` passaram.

**Observacao**: quando E2E/axe rodaram em paralelo, o login caiu em "API temporariamente indisponivel"; `/api/health` respondeu saudavel em seguida e os testes passaram isolados.

**Impacto**: Proximas Acoes passa de task list vertical para board de follow-up alinhado a Kommo/Pipedrive, preservando regras de negocio e sem backend novo.

## D027 - Oportunidades vira kanban sem-scroll por etapa comercial

**Data**: 2026-07-24

**Contexto**: a lista de Oportunidades ja havia deixado a tabela generica, mas ainda era uma carteira vertical com cards e formulario de criacao fixo. Para aderir a ADR-0004, a tela principal precisa mostrar as etapas comerciais como board e reduzir scroll global.

**Decisao**: transformar `OportunidadesPage` em kanban sem-scroll agrupado por `etapaNome`, que e o estado comercial real da oportunidade. O formulario de criacao deixa de ocupar o topo como padrao e passa a abrir por botao "Nova oportunidade". O card continua abrindo a ficha da oportunidade; mudancas de etapa/status continuam ocorrendo nos fluxos persistidos existentes, nao por heuristica visual.

**Evidencia**:

- `src/features/opportunities/OportunidadesPage.tsx` agrupa oportunidades por etapa e renderiza `opportunity-kanban`.
- `src/styles.css` adiciona `opportunities-board-page`, `opportunity-kanban`, `opportunity-lane` e overflow interno em colunas.
- `e2e/opportunity-detail.spec.ts` valida abertura da ficha e ausencia de scroll global/horizontal em `mobile-390` e `desktop-1366`.
- `e2e/customer-and-opportunity.spec.ts` foi ajustado para abrir o formulario recolhido antes da criacao.
- Screenshots revisados: `docs/artifacts/oportunidades-board-desktop-1366.png` e `docs/artifacts/oportunidades-board-mobile-390.png`.
- `npm.cmd run typecheck`, `npx.cmd playwright test e2e/opportunity-detail.spec.ts e2e/customer-and-opportunity.spec.ts --project=chromium`, `npx.cmd playwright test e2e/accessibility.spec.ts --project=chromium --grep "opportunities list"` e `npm.cmd run build` passaram.

**Observacao**: uma execucao inicial do axe falhou antes da pagina por "API temporariamente indisponivel"; `/api/health` respondeu saudavel em seguida e o mesmo teste passou isolado.

**Impacto**: Oportunidades passa a refletir o modelo profissional de kanban comercial. A proxima evolucao natural e adicionar movimentacao de etapa com rollback/teste explicito quando o backend de transicao estiver coberto.

## D028 - Clientes vira board sem-scroll por segmento operacional

**Data**: 2026-07-24

**Contexto**: a lista de Clientes ja havia sido redesenhada como carteira em cards, mas ainda mantinha leitura vertical e formulario de criacao sempre aberto. Para aderir a ADR-0004, a tela precisa mostrar a carteira inteira como board operacional, ajudando o atendente a priorizar duplicidades, clientes com oportunidades e clientes sem oportunidade ativa.

**Decisao**: transformar `ClientesPage` em board sem-scroll com tres raias: "Atencao", "Com oportunidades" e "Sem oportunidade". A raia de atencao concentra possiveis duplicidades por telefone; as demais segmentam a rotina comercial por vinculo real com oportunidades. O formulario de criacao passa a abrir por botao "Novo cliente", preservando o fluxo existente sem ocupar a area operacional por padrao.

**Evidencia**:

- `src/features/customers/ClientesPage.tsx` agrupa clientes por segmento operacional e renderiza `customer-kanban`.
- `src/styles.css` adiciona `customers-board-page`, `customer-kanban`, `customer-lane` e overflow interno em colunas, com ajuste mobile sem scroll global.
- `e2e/customer-detail.spec.ts` valida abertura da ficha e ausencia de scroll global/horizontal em `mobile-390` e `desktop-1366`.
- `e2e/customer-and-opportunity.spec.ts` foi ajustado para abrir o formulario recolhido antes da criacao.
- Screenshots revisados: `docs/artifacts/clientes-board-desktop-1366.png` e `docs/artifacts/clientes-board-mobile-390.png`.
- `npm.cmd run typecheck`, `npx.cmd playwright test e2e/customer-detail.spec.ts e2e/customer-and-opportunity.spec.ts --project=chromium` e `npx.cmd playwright test e2e/accessibility.spec.ts --project=chromium --grep "clientes list"` passaram.

**Impacto**: Clientes deixa de ser uma carteira vertical e passa a operar como quadro de triagem comercial. A proxima evolucao natural e permitir acoes contextuais por card, como criar oportunidade, resolver duplicidade ou vincular contato Auvo, sempre por estado persistido.

## D029 - Pipeline/Funil vira board sem-scroll validado

**Data**: 2026-07-24

**Contexto**: o Funil ja era um kanban por etapa e ja movia cards por estado real persistido (`etapaId`) com rollback em caso de erro. Mesmo assim, a pagina ainda dependia de altura fixa por coluna e o scroll horizontal do board podia vazar para o documento, contrariando a ADR-0004.

**Decisao**: criar uma regiao operacional explicita em `PipelinePage`, com altura de viewport, overflow global bloqueado e colunas ocupando o espaco disponivel. O scroll horizontal permanece interno ao board e o scroll vertical fica restrito ao corpo de cada etapa. O controle de movimentacao por select e drag/drop continua chamando `updateOpportunity`, preservando avanco por mudanca real feita pelo atendente/comercial.

**Evidencia**:

- `src/features/pipeline/PipelinePage.tsx` envolve tabs/board em `pipeline-page` com `aria-label="Board operacional do funil"`.
- `src/styles.css` adiciona containment, altura de viewport, `min-height: 0` e overflow interno no board/colunas.
- `e2e/pipeline.spec.ts` valida kanban, controle de movimentacao persistida e ausencia de scroll global/horizontal em `mobile-390` e `desktop-1366`.
- Screenshots revisados: `docs/artifacts/pipeline-board-desktop-1366.png` e `docs/artifacts/pipeline-board-mobile-390.png`.
- `npx.cmd playwright test e2e/pipeline.spec.ts --project=chromium`, `npm.cmd run typecheck` e `npx.cmd playwright test e2e/accessibility.spec.ts --project=chromium --grep "pipeline board"` passaram.

**Observacao**: uma execucao inicial do axe falhou no login antes de chegar ao Funil enquanto `typecheck` rodava em paralelo; `/api/health` respondeu `database: connected` e o mesmo axe passou no retry isolado.

**Impacto**: Pipeline/Funil agora esta alinhado a ADR-0004 na estrutura de viewport. A proxima evolucao de produto e testar explicitamente drag/drop ou mover por select com rollback de API, alem de enriquecer cards com sinais de visita/equipamento quando isso fizer sentido comercial.
