# Artec CRM - Development Status

Atualizado em: 2026-07-27

## Branch Atual

`refactor/frontend-design-system`

Ultimo marco confirmado:

- React Router mantido como roteador ativo.
- Componentes Radix/shadcn reaproveitados em `src/components/ui`.
- Arvore antiga TanStack/React Start nao deve voltar ao app ativo.
- Layout da Central Comercial aproximado das imagens de referencia.
- Login desktop ajustado contra `central.png`: divisao 50/50, coluna direita em `x=888`, H1 em `y=267` e formulario em `y=413` no viewport 1440x900.
- Shell/Central Comercial ajustados contra as referencias: sidebar 236px, topbar 67px desktop, topbar 64px mobile, header mobile 206px, cards de metrica 121/122px e coluna lateral 355px.
- `npm run typecheck` e `npm run build:frontend` passaram apos o refactor visual.

## Estado das 10 Frentes

### 1. Homologar Central Comercial

Estado: parcialmente pronto.

Evidencia:

- Tela ativa: `src/features/commercial-center/CentralComercialPage.tsx`.
- E2E existente: `e2e/commercial-center-and-reports.spec.ts`.

Pendencias:

- Rodar E2E com `EMAIL_LOGIN` e `SENHA`.
- Validar visual autenticado em desktop e mobile.
- Ajustar testes antigos que ainda esperam filtros de data/etapa na toolbar principal.

### 2. Fortalecer Proximas Acoes

Estado: implementado em fluxo principal, pendente homologacao real.

Evidencia:

- Tela ativa: `src/features/next-actions/ProximasAcoesPage.tsx`.
- Operacoes: `src/features/next-actions/useActionOperation.ts`.
- E2E: `e2e/next-actions.spec.ts`.
- Quando uma acao e a proxima acao atual de uma oportunidade ativa, o formulario sugere automaticamente uma nova acao e vencimento ao concluir/cancelar.
- `src/features/next-actions/ActionOperationForm.tsx` agora traz atalhos de resultado, cancelamento e vencimento para reduzir digitacao no follow-up diario.
- `e2e/next-actions.spec.ts` cobre a presenca dos atalhos de resultado no fluxo de conclusao.

Pendencias:

- Rodar E2E com usuario real para validar concluir/reagendar/cancelar com dados conectados.
- Validar sem scroll global/overflow depois do novo design system em ambiente autenticado.

### 3. Melhorar Cadastro Rapido

Estado: implementado em fluxo principal, pendente homologacao real.

Evidencia:

- Clientes: `src/features/customers/ClientesPage.tsx`.
- Oportunidades: `src/features/opportunities/OportunidadesPage.tsx`.
- API: `POST /api/customers` e `POST /api/opportunities`.
- Cadastro de cliente agora mostra tipo de pessoa, alerta local de telefone parecido e atalho para criar oportunidade com o cliente recem-cadastrado ja selecionado.
- `src/features/customers/ClientesPage.tsx` permite criar cliente + demanda comercial + proxima acao no mesmo envio, usando o usuario atual como responsavel.
- `e2e/customer-and-opportunity.spec.ts` cobre o fluxo curto cliente + oportunidade + pipeline.

Pendencias:

- Rodar E2E com usuario real e validar se os campos opcionais do primeiro contato estao suficientes para a rotina da Artec.

### 4. Aprimorar Ficha da Oportunidade

Estado: implementado em fluxo principal, pendente homologacao real.

Evidencia:

- Tela: `src/features/opportunities/OportunidadePage.tsx`.
- E2E: `e2e/opportunity-detail.spec.ts`.
- Topo da ficha agora destaca proxima acao com estado operacional, mostra higiene da oportunidade e preserva atalhos de concluir/reagendar, aprovar, perder e arquivar.
- A ficha agora calcula uma "Proxima decisao" baseada em acao vencida/ausente, visita aberta, orcamento enviado/revisado ou aprovacao, apontando para o bloco correto.
- `e2e/opportunity-detail.spec.ts` verifica a presenca do painel de proxima decisao.

Pendencias:

- Validar visual autenticado em desktop/mobile e ajustar densidade dos blocos inferiores.

### 5. Aprimorar Ficha do Cliente

Estado: em melhoria incremental.

Evidencia:

- Tela: `src/features/customers/ClientePage.tsx`.
- E2E: `e2e/customer-detail.spec.ts`.
- Topo da ficha agora possui painel operacional com estado do relacionamento, metricas de oportunidades, garantia/suporte, equipamentos e ultima interacao.
- A ficha oferece atalho para nova oportunidade ja com cliente selecionado e botoes para garantia/suporte e proxima acao.

Pendencias:

- Refinar redundancia dos alertas antigos acima das abas.
- Validar visual autenticado em desktop/mobile e ajustar densidade das abas inferiores.

### 6. Separar Garantia/Suporte do Funil

Estado: implementado em fluxo principal, pendente homologacao real.

Evidencia:

- `server/crm/validation.ts` exclui garantia/suporte/pos-venda dos tipos comerciais de oportunidade.
- Caixa Auvo tem acoes de garantia, suporte e pos-venda.
- `src/features/customers/ClientePage.tsx` registra garantia/suporte/pos-venda como atividade do cliente, sem oportunidade, e permite agendar retorno tecnico com categoria `warranty`, `support` ou `after_sales`.
- `server/app.test.ts` cobre atividade de garantia/suporte sem criar oportunidade comercial.
- `e2e/customer-detail.spec.ts` verifica a aba Garantia e suporte com formulario de retorno tecnico separado.

Pendencias:

- Rodar E2E com usuario real para confirmar cadastro e retorno tecnico no ambiente conectado.

### 7. Evoluir Caixa Auvo com Triagem Assistida

Estado: em melhoria incremental.

Evidencia:

- Painel: `src/components/AuvoInboxPanel.tsx`.
- Parser/inteligencia: `server/crm/auvo-parser.ts`, `server/crm/auvo-intelligence.ts`.
- Match: `server/crm/auvo-customer-match.ts`.
- E2E: `e2e/auvo-inbox.spec.ts`.
- Painel agora mostra recomendacao de triagem baseada em intencao, dados faltantes, revisao humana e confianca do match Cliente-Auvo.
- CSS especifico adicionado para split-view, fila, painel de decisao, match, recomendacao e formulario, mantendo comportamento mobile fila/detalhe.

Pendencias:

- Validar payloads reais recentes.
- Cobrir todos os modos de decisao em E2E.
- Testar resolucao real dos modos criar oportunidade, garantia, suporte, pos-venda, duplicado e nao comercial.

### 8. Melhorar Relatorios Comerciais

Estado: em melhoria incremental.

Evidencia:

- Tela: `src/features/reports/RelatoriosPage.tsx`.
- Componente: `src/components/ReportsPanel.tsx`.
- API: `GET /api/reports/commercial`.
- E2E: `e2e/commercial-center-and-reports.spec.ts`.
- Linguagem revisada para leitura operacional: aprovado no periodo, conversao, orcamento em retorno e eficiencia de follow-up.
- CSS especifico adicionado para filtros, cards de decisao, listas por etapa/origem/perda e blocos de follow-up.

Pendencias:

- Adicionar gargalos por responsavel e follow-up quando dados permitirem.
- Validar visual autenticado em desktop/mobile com dados reais.

### 9. Recriar Documentacao Essencial

Estado: recriada em versao enxuta.

Arquivos recriados:

- `docs/PRODUCT-SPEC.md`
- `docs/DESIGN-SYSTEM.md`
- `docs/HOMOLOGATION-RUNBOOK.md`
- `docs/DEVELOPMENT-STATUS.md`

Pendencias:

- Atualizar quando fluxos forem homologados.

### 10. Validar E2E com Usuario Real

Estado: pendente de credenciais/ambiente conectado.

Evidencia:

- Suite existe em `e2e`.
- `e2e/support/auth.ts` exige `EMAIL_LOGIN` e `SENHA`.

Pendencias:

- Rodar `npm run e2e`.
- Corrigir testes desatualizados pela mudanca da toolbar da Central.
- Registrar resultado no runbook.

## Proximo Bloco Recomendado

1. Atualizar E2E da Central Comercial para refletir o novo drawer de filtros.
2. Rodar `npm run typecheck`, `npm run build:frontend` e testes unitarios.
3. Com credenciais, rodar `npm run e2e`.
4. Refinar Proximas Acoes para reduzir cliques de follow-up.
