# Modelo Operacional dos Agentes - Artec CRM

Data: 2026-07-24

Este documento complementa `docs/AUDITORIA-MESTRE-REARQUITETURA-2026-07-24.md` e descreve como usar os agentes especialistas criados em `.claude/agents`.

## Principio

Os agentes existem para manter a reconstrucao incremental, auditavel e fiel a operacao da Artec. Eles nao substituem leitura de codigo nem validacao real.

## Diretriz Visual Estrutural

O Venture CRM Dashboard UI Kit e a referencia visual estrita do produto. Os agentes nao devem sugerir nem aceitar divergencias para deixar a aplicacao "mais colorida".

- `artec-design-system-engineer` tem poder de veto sobre mudancas visuais que fujam do Venture sem justificativa objetiva.
- `artec-frontend-agent` deve implementar telas com primary/action neutro e cores apenas semanticas.
- `artec-page-specialists` deve apontar divergencias visuais por pagina antes de propor fluxo ou layout.
- Excecoes so sao aceitas por acessibilidade, contraste, ausencia do componente no Venture ou requisito operacional real da Artec.

## Diretriz UX Estrutural

O CRM deve evoluir para uma experiencia sem scroll global como padrao, baseada em boards/kanbans inteligentes e cards acionaveis.

- `artec-crm-product-architect` deve traduzir a rotina comercial em estados reais de card.
- `artec-frontend-agent` deve preferir board compacto, colunas, raias e overflow interno controlado em vez de listas verticais longas.
- `artec-page-specialists` deve apontar como cada pagina operacional cabe na viewport e quais areas podem rolar internamente.
- `artec-qa-release-guardian` deve exigir evidencia de ausencia de scroll global indesejado e validar que movimentos de card persistem estado real.
- Cards avancam por acao do atendente/comercial e mudanca persistida, nao por heuristica visual ou texto livre.

## Agentes Existentes Mantidos

- `artec-crm-product-architect`: regras comerciais e aderencia ao trabalho real.
- `artec-design-system-engineer`: Venture, tokens, UI, responsividade e screenshots.
- `artec-auvo-integration-specialist`: webhook, Caixa Auvo, payloads e matching.
- `artec-data-quality-e2e`: isolamento de fixtures, dados de homologacao e limpeza segura.
- `artec-qa-release-guardian`: gates, testes, regressao, a11y e release.

## Agentes Adicionados

- `artec-architecture-agent`: boundaries, modularizacao, ADRs e trade-offs.
- `artec-backend-agent`: APIs, use cases, Zod, erros, logs e RBAC.
- `artec-frontend-agent`: React, componentes, estado, formularios e responsividade.
- `artec-database-agent`: schema, migrations SQL, indices, constraints e backfill.
- `artec-security-agent`: auth, permissoes, segredos, PII e webhook.
- `artec-accessibility-agent`: WCAG, teclado, foco e light/dark.
- `artec-performance-agent`: bundle, renders, queries e budgets.
- `artec-documentation-agent`: README, runbooks, ADRs e progresso.
- `artec-page-specialists`: matriz por pagina atual.

## Quando Usar

Antes de mudancas estruturais:

1. `artec-architecture-agent`
2. `artec-crm-product-architect`
3. `artec-database-agent`, se houver schema/migration
4. `artec-qa-release-guardian`

Antes de mudancas visuais:

1. `artec-design-system-engineer`
2. `artec-frontend-agent`
3. `artec-accessibility-agent`
4. `artec-page-specialists`

Antes de mudancas Auvo:

1. `artec-auvo-integration-specialist`
2. `artec-security-agent`
3. `artec-data-quality-e2e`
4. `artec-qa-release-guardian`

Antes de release:

1. `artec-qa-release-guardian`
2. `artec-security-agent`
3. `artec-performance-agent`
4. `artec-documentation-agent`

## Agentes Deliberadamente Nao Criados

O prompt mestre lista agentes de Financeiro, Fluxo de Caixa, Contas a Receber, Contas a Pagar e Lancamentos. Eles nao foram criados porque o escopo atual do projeto, definido em `README.md` e `CONTEXTO-ROTINA-ATENDIMENTO-ARTEC-CRM.md`, proibe integrar financeiro ao Artec CRM.

Valores orcados e aprovados continuam sendo dados comerciais. Nao implementar faturamento, recebimento, caixa, conciliacao, contas a pagar, contas a receber ou DRE neste projeto sem uma decisao explicita de produto e arquitetura.

## Agentes Futuros

Criar apenas quando o modelo de dados correspondente existir:

- Visitas Agent
- Equipamentos Agent
- Enderecos Agent
- Ordens de Servico Agent
- Execucao Tecnica Agent
- Checklist/Fotos Agent
- Pos-venda/Garantia/Suporte Agent
- Contratos/Recorrencia Agent

## Criterio de Saida

Uma feature so avanca quando o agente relevante produziu:

- objetivo;
- arquivos afetados;
- riscos;
- criterio de aceite;
- validacoes;
- rollback;
- documentacao afetada.
