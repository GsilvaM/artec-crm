# Progresso - Reconstrucao Artec CRM

Atualizado a cada gate. Ultima atualizacao: Pipeline/Funil validado como board sem-scroll da ADR-0004.

## Gate Atual

Gate estrutural de modelo de produto.

A frente visual da Central Comercial esta fechada. A primeira fatia estrutural saiu do ADR para schema/migration/API/backend/UI inicial; Cliente, Central Comercial e Oportunidade ja consomem a base nova sem substituir indevidamente Proximas Acoes.

## Concluido

- **Gate 0**: estado Git levantado, hierarquia de fontes verificada, tokens JSON de `docs/` inventariados e decisao D001 registrada em `docs/REFATORACAO-CRM-DECISOES.md`.
- **Gate 1**: 5 auditorias formais escritas em `docs/audits/*.md`, com sintese em `docs/audits/ROOT-CAUSE-SYNTHESIS.md`.
- **Lote P0 - integridade de dados**: `next_actions`/Central Comercial passaram a excluir fixtures via join a `customer.isTestFixture`; timezone de `getCommercialCenter` from/to corrigido; corrida em `receiveAuvoWebhookEvent` corrigida tratando `P2002` como duplicata legitima; teardown de E2E reforcado.
- **Lote P1 - confiabilidade operacional**: endpoint `/api/internal/reconcile` protegido por `CRON_SECRET`; `vercel.json` com cron diario compativel com o plano Hobby da Vercel; "Reprocessar" Auvo passou a reprocessar de fato; `AuvoInboxItem` ganhou `is_test_fixture`; corpo de notificacao de acao vencida deixou de exibir ISO cru.
- **Lote P4 - fidelidade de design**: radius de card/painel e badge alinhado a 4px; `.cell-primary-text` criada; badges de status inconsistentes em `AuvoInboxPanel.tsx` corrigidos com `badge-warning-soft`.
- **Regressao propria corrigida**: filtro de fixtures em `getCommercialCenter`/`listNextActions` quebrou um E2E de teclado; resolvido com opt-in por header no mesmo padrao de Clientes/Oportunidades/Busca.
- **Central Comercial fechada como feature validada**: header operacional, metric cards clicaveis, toolbar compacta, drawer de filtros menos comuns, chips removiveis, tabs de "Prioridade agora" e "Higiene do funil", grids dedicados com `align-items: start`, skeleton especifico e correcoes de overflow mobile.
- **Cobertura da Central Comercial**: E2E especifico para metric cards, tabs, filtro de etapa, drawer de filtros, limpeza de filtros e dark mode via axe com `colorScheme: "dark"`.
- **Auditoria mestre e agentes especialistas**: `docs/AUDITORIA-MESTRE-REARQUITETURA-2026-07-24.md` consolida inventario, diagnostico, referencias, wireframes, backlog e DoD; `docs/AGENTS-OPERATING-MODEL.md` documenta o uso dos agentes em `.claude/agents`.
- **ADR estrutural criada antes de migration**: `docs/adr/ADR-0001-visitas-equipamentos-enderecos.md` definiu a proposta inicial para Visita, Equipamento e Endereco antes da criacao de SQL.
- **Primeira fatia estrutural implementada no backend**: `database/migrations/0021_criar_visitas_equipamentos_enderecos.sql`, `prisma/schema.prisma`, RBAC, schemas Zod, repository Prisma e rotas HTTP cobrem Endereco, Equipamento, Visita e relacionamento VisitEquipment. A conclusao/cancelamento de visita registra Activity rastreavel.
- **Primeira fatia estrutural exposta na UI**: ficha do Cliente ganhou aba Estrutura para cadastrar/listar Enderecos, Equipamentos e Visitas; visitas abertas podem ser concluidas/canceladas pela ficha.
- **Central Comercial usando Visit real**: bloco "Agenda e visitas" deixou de depender de regex/texto em `NextAction` e passou a consumir `crm.visitas`, com lista dedicada de visitas e navegacao para Cliente/Oportunidade.
- **Ficha da Oportunidade usando a estrutura tecnica**: detalhe de oportunidade ganhou bloco proprio para enderecos do cliente, equipamentos vinculados a oportunidade e visitas tecnicas do contexto comercial. O fluxo permite criar endereco, vincular equipamento, agendar visita e concluir/cancelar visita sem transformar `NextAction` em agenda tecnica.

## Validado

Validacoes herdadas do lote anterior:

- `prisma validate` ok.
- 20 migrations aplicadas (0001-0020).
- `typecheck` limpo.
- `vitest` 90/90.
- `build` frontend+server ok.
- `playwright` 36/36.

Revalidacao executada em 2026-07-24:

- `npm.cmd run typecheck`: ok.
- `npm.cmd run test`: 91/91.
- `npm.cmd run e2e`: 42/42 em 4.3 min.
- `npm.cmd run prisma:validate`: ok.
- `npm.cmd run build`: ok.
- E2E incluiu Central Comercial em dark mode e 7 viewports sem overflow horizontal.
- Teste HTTP novo cobre criar endereco, criar equipamento, criar visita, concluir visita e rejeitar query invalida de visitas.
- E2E de UI cobre criar endereco, equipamento e visita na ficha do Cliente e confirmar a visita na Central Comercial.
- `npm.cmd run db:migrate`: aplicou `0021_criar_visitas_equipamentos_enderecos` no banco local/E2E.
- `npx.cmd playwright test e2e/opportunity-detail.spec.ts --project=chromium`: 2/2, cobrindo abertura da ficha e criacao de endereco/equipamento/visita no bloco tecnico da oportunidade.
- `npm.cmd run test`: 91/91.
- `npm.cmd run build`: ok.
- `npm.cmd run typecheck`: ok apos rerodada isolada; a primeira tentativa em paralelo com `build` falhou por corrida de `prisma generate`, nao por erro de tipos.
- Deploy de producao `dpl_kXpqc5EZ3SrMdcvBdXhK19qrBApJ` ficou `Ready` e aliasado em `https://artec-crm.vercel.app`.
- `/api/health` em producao retornou `status: ok` e `database: connected`.
- `/api/internal/reconcile` em producao respondeu 200 com `CRON_SECRET`; apos reconciliar, status Auvo ficou com `pendingEvents: 0` e `failedEvents: 0`.
- `npx.cmd vercel crons ls` confirmou `/api/internal/reconcile` com schedule `0 8 * * *`.
- Parser Auvo enriquecido para extrair sinais comerciais/operacionais: origem, UTM, tags, campos customizados, classificacao, departamento, atendente, tempos de atendimento, ultima mensagem e status da janela.
- `server/crm/auvo-intelligence.ts` separado do parser bruto para derivar intencao, urgencia, acao sugerida, confianca, dados faltantes, SLA e resumo.
- `database/migrations/0022_enriquecer_sinais_caixa_auvo.sql` cria snapshot na Caixa Auvo e tabela canonica `crm_internal.auvo_contact_signals` por `auvo_contact_id`.
- Contrato `AuvoParsedSignals` passa a trafegar na Caixa Auvo e na ficha de Cliente quando houver contato Auvo vinculado, com subobjeto `derived` para a UI consumir decisao em vez de payload bruto.
- `src/components/AuvoSignalSummary.tsx` centraliza a leitura visual de `derived` para Caixa Auvo e ficha de Cliente: resumo, prioridade, acao sugerida, confianca, SLA e pendencias ficam acima dos metadados auxiliares.
- Ficha da Oportunidade passa a receber `auvoSignals` no detalhe, herdando o snapshot canonico do Cliente vinculado por `auvoContactId`, e exibe `AuvoSignalSummary` compacto no contexto comercial.
- Caixa Auvo passa a usar `AuvoParsedSignals.derived` para pre-preencher criacao de oportunidade: origem vem do payload, tipo de demanda vem da intencao, situacao reflete SLA/pendencias e proxima acao sugere coleta de dados ou visita tecnica.
- Match Cliente-Auvo ganhou camada backend pura em `server/crm/auvo-customer-match.ts`, com score explicavel, confianca, motivos e bloqueios de ambiguidade antes de qualquer backfill de `Customer.auvoContactId`.
- `server/auvo-customer-match-dry-run.ts` e `npm.cmd run auvo:customers:match-dry-run` geram relatorio dry-run em JSON sem gravar dados.
- Agents de frontend fecharam primeira rodada Auvo: Caixa Auvo ganhou cartao "Match Cliente-Auvo" com confianca estimada/evidencias; `AuvoSignalSummary` ganhou `title`, `description`, `showDetails` e modo compacto mais informativo; Cliente/Oportunidade exibem contexto Auvo com texto orientado a rotina.
- QA frontend corrigiu semantica do painel Auvo: filtros com `aria-pressed`, blocos ricos fora de `<dl>`, badge de status com seletor dedicado e dropdown tratado como lista simples de botoes.
- Proximas Acoes deixou de ser uma tabela simples e passou a ser uma task list operacional: metric cards clicaveis por fila, cards de acao com cliente/contexto/prazo/prioridade/status e comandos diretos de concluir, reagendar e cancelar.
- Proximas Acoes agora usa filtros operacionais por responsabilidade, categoria e prioridade sobre o contrato existente de `/api/next-actions`, mantendo os metric cards como filas de status/prazo.
- Revisao visual de Proximas Acoes registrada em `docs/artifacts/proximas-acoes-desktop-1366.png` e `docs/artifacts/proximas-acoes-mobile-390.png`; E2E focado valida filtros operacionais, axe valida acessibilidade e responsivo valida 7 viewports sem overflow horizontal.
- Ficha do Cliente ganhou visao geral operacional com cards de oportunidades ativas, proxima acao, visitas abertas e qualidade do cadastro, mantendo identidade/contato e sinais Auvo como contexto reutilizavel.
- Revisao visual da ficha do Cliente registrada em `docs/artifacts/cliente-visao-geral-desktop-1366.png` e `docs/artifacts/cliente-visao-geral-mobile-390.png`.
- Lista de Clientes deixou a tabela generica e passou a ser carteira operacional em cards, com resumo de clientes ativos, oportunidades vinculadas e possiveis duplicidades, preservando busca, criacao, paginacao e arquivamento.
- Revisao visual da lista de Clientes registrada em `docs/artifacts/clientes-lista-desktop-1366.png` e `docs/artifacts/clientes-lista-mobile-390.png`.
- Relatorios comerciais deixou de ser painel/tabelas e passou a ser dashboard operacional com filtros compactos, indicadores principais, funil por etapa, conversao por origem, eficiencia de follow-up e perdas.
- Revisao visual de Relatorios registrada em `docs/artifacts/relatorios-dashboard-desktop-1366.png` e `docs/artifacts/relatorios-dashboard-mobile-390.png`.
- Lista de Oportunidades deixou a tabela generica e passou a ser carteira operacional em cards, com resumo de ativas, valor aprovado e oportunidades sem proxima acao, preservando busca, criacao e paginacao.
- Revisao visual da lista de Oportunidades registrada em `docs/artifacts/oportunidades-lista-desktop-1366.png` e `docs/artifacts/oportunidades-lista-mobile-390.png`; axe capturou e a refatoracao corrigiu contraste dos avatares no novo contexto de card.
- Diretriz visual estrutural alterada: Venture deixa de ser apenas inspiracao e passa a ser contrato visual estrito. CSS e agents foram atualizados para remover a justificativa de uma UI mais colorida e preservar cores apenas como semantica operacional.
- `docs/adr/ADR-0002-estrategia-estilos-tailwind.md` registra a decisao de nao migrar para Tailwind sem piloto controlado. `src/styles.css` permanece como camada legacy enquanto um piloto isolado e avaliado.
- `docs/adr/ADR-0003-aderencia-visual-estrita-venture.md` registra que primary/action deve ser neutro conforme Venture; excecoes exigem acessibilidade, lacuna do kit ou requisito operacional real.
- `docs/adr/ADR-0004-ux-sem-scroll-board-inteligente.md` registra a nova diretriz de UX: telas operacionais devem funcionar como board/kanban inteligente sem scroll global como padrao, com cards avancando por mudanca real feita pelo atendente/comercial.
- Notificacoes virou a primeira tela concreta da ADR-0004: board com raias "Resolver agora", "Acompanhar" e "Historico", sem scroll global em `mobile-390` e `desktop-1366`, com overflow restrito as colunas/raias.
- Revisao visual de Notificacoes registrada em `docs/artifacts/notificacoes-board-desktop-1366.png` e `docs/artifacts/notificacoes-board-mobile-390.png`.
- Proximas Acoes virou board sem-scroll de follow-up com raias "Vencidas", "Hoje", "Proximas", "Concluidas" e "Canceladas"; metric cards agora focam raias em vez de esconder o restante da carteira.
- Revisao visual de Proximas Acoes no padrao ADR-0004 registrada em `docs/artifacts/proximas-acoes-board-desktop-1366.png` e `docs/artifacts/proximas-acoes-board-mobile-390.png`.
- Oportunidades virou kanban sem-scroll por `etapaNome`, com formulario de criacao recolhido e colunas com overflow interno; abertura de ficha e criacao seguem os contratos existentes.
- Revisao visual de Oportunidades no padrao ADR-0004 registrada em `docs/artifacts/oportunidades-board-desktop-1366.png` e `docs/artifacts/oportunidades-board-mobile-390.png`.
- Clientes virou board sem-scroll por segmento operacional, com raias "Atencao", "Com oportunidades" e "Sem oportunidade"; o formulario de criacao fica recolhido e as colunas usam overflow interno.
- Revisao visual de Clientes no padrao ADR-0004 registrada em `docs/artifacts/clientes-board-desktop-1366.png` e `docs/artifacts/clientes-board-mobile-390.png`.
- Validacao focada de Clientes no padrao ADR-0004 em 2026-07-24: `npm.cmd run typecheck` ok; `npx.cmd playwright test e2e/customer-detail.spec.ts e2e/customer-and-opportunity.spec.ts --project=chromium` passou com 5/5; `npx.cmd playwright test e2e/accessibility.spec.ts --project=chromium --grep "clientes list"` passou com 1/1.
- Pipeline/Funil agora tem regiao operacional sem-scroll, colunas com overflow interno, containment para o scroll horizontal do kanban e controle de movimentacao por estado real persistido (`etapaId`).
- Revisao visual de Pipeline/Funil no padrao ADR-0004 registrada em `docs/artifacts/pipeline-board-desktop-1366.png` e `docs/artifacts/pipeline-board-mobile-390.png`.
- Validacao focada de Pipeline/Funil em 2026-07-24: `npx.cmd playwright test e2e/pipeline.spec.ts --project=chromium` passou com 3/3; `npm.cmd run typecheck` ok; `npx.cmd playwright test e2e/accessibility.spec.ts --project=chromium --grep "pipeline board"` passou no retry isolado apos `/api/health` confirmar `database: connected`.
- `server/auvo-signals-backfill.ts` e `npm.cmd run auvo:signals:backfill` permitem reaplicar parser/intelligence nos eventos Auvo historicos depois da migration `0022`, sem alterar status dos webhooks.
- `CONTACT_*` agora alimenta snapshot canonico no recebimento do webhook, nao apenas no reconcile diario.
- `last_event_received_at` protege `crm_internal.auvo_contact_signals` contra sobrescrita por evento antigo; a Caixa Auvo tambem consulta o `receivedAt` do `lastEventId` antes de aceitar atualizacao antiga.
- `npm.cmd run auvo:signals:backfill -- --help` exibe uso sem conectar no banco; limite invalido falha antes de abrir conexao.
- Validacoes focadas da frente Auvo em 2026-07-24: `npm.cmd run prisma:validate` ok; `npm.cmd run typecheck` ok; `npm.cmd test -- server/crm/auvo-customer-match.test.ts server/crm/auvo-intelligence.test.ts server/crm/auvo-parser.test.ts server/app.test.ts` passou com 74/74; `npm.cmd run build` ok apos integracao dos agents frontend.

Observacao operacional: `npm run ...` via PowerShell falha neste ambiente por bloqueio de `npm.ps1`; usar `npm.cmd`.

## Pendencias Honestas

- **Dark mode do produto inteiro ainda nao esta fechado**: Central Comercial passou em dark mode via axe, mas as demais paginas ainda precisam de cobertura dark dedicada antes de declarar suporte completo.
- Cliente/Oportunidade ainda nao tem edicao completa apos criacao; `origem` ainda precisa ser coletado por formulario.
- Match cliente-contato Auvo ainda precisa de score explicavel; `auvoContactId` historico segue uma lacuna operacional ate a aplicacao da `0022` e execucao validada do backfill.
- Cobertura ainda deve ser expandida para worker Auvo real, corrida de webhook duplicado, kanban rollback e notification dedupe.
- Degrau de altura de controle 37px do kit ainda esta pendente.
- Proximas Acoes ja ganhou task list operacional, filtros por responsavel/categoria/prioridade e revisao visual com screenshots; proximas melhorias devem ser de fluxo (criacao/edicao inline ou agrupamento por responsavel), nao mais de base visual.
- Caixa Auvo ainda precisa evoluir para split-view com match confidence.
- Clientes, Oportunidades e Relatorios ja receberam redesenho operacional validado; ainda faltam evolucoes de fluxo como edicao cadastral, criacao contextual e analises comerciais mais profundas, alem de revisao visual retroativa para remover cores decorativas que tenham sobrado antes da ADR-0003.
- Central Comercial e Caixa Auvo precisam ser reavaliadas contra a ADR-0004: cards verticais com scroll deixam de ser objetivo final e viram etapa intermediaria ate board sem-scroll. Notificacoes, Proximas Acoes, Oportunidades, Clientes e Pipeline/Funil ja receberam conversao estrutural.
- Baseline visual completo (8 viewports x 13 paginas) ainda nao foi capturado como artefato formal, apesar do E2E de overflow cobrir 7 viewports.

## Riscos

- Ha mudancas locais nao commitadas e arquivos untracked no workspace. Nao fazer commit/push sem autorizacao explicita.
- `CRON_SECRET` ja foi configurado em Production/Preview na Vercel e o cron diario esta ativo. O plano Hobby bloqueia crons mais frequentes que diario; para reconcile a cada 5 minutos sera necessario plano Pro ou scheduler externo.
- Aplicacao local da migration `0022` ficou bloqueada por `ETIMEDOUT` na conexao direta com o banco em 2026-07-24; o codigo e o backfill foram validados sem DB, mas a migration ainda precisa ser aplicada quando a conexao normalizar.
- Deploy do build atual exige migration `0022` aplicada antes, porque o runtime ja escreve colunas novas em `auvo_inbox_items` e consulta `crm_internal.auvo_contact_signals`.
- A modelagem de Visita/Equipamento/Endereco e aditiva, mas ainda pode gerar impacto grande em UI e operacao se a exposicao for feita sem faseamento.

## Proximo Passo

1. Aplicar a migration `0022` assim que a conexao direta com o banco voltar.
2. Rodar `npm.cmd run auvo:signals:backfill` apos a `0022` para popular snapshots historicos, validando contagem aplicada/falha antes de deploy.
3. Melhorar a ergonomia de conclusao de visita para sugerir proxima acao sem automatizar decisao comercial.
4. Executar piloto controlado de estrategia de estilos se Tailwind for aprovado como proxima frente frontend.
5. Criar endpoint ou fluxo de aprovacao para aplicar match Cliente-Auvo de alta confianca sem backfill cego.
