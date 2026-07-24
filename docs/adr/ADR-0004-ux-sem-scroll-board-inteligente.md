# ADR-0004 - UX sem scroll global e board inteligente

**Data**: 2026-07-24

## Status

Aceita.

## Contexto

A direcao de produto mudou de telas verticais com listas e cards para uma experiencia de CRM profissional baseada em board/kanban inteligente, semelhante a Kommo, Pipedrive e outros CRMs comerciais maduros.

O objetivo e que o atendente e o comercial vejam a rotina inteira na tela, sem depender de rolagem global para entender o que fazer. Cards devem ser unidades inteligentes de trabalho, avancando quando o usuario muda um estado real da rotina.

## Decisao

1. Telas operacionais devem evitar scroll global como padrao.
2. A viewport deve mostrar os grupos principais da rotina.
3. Listas longas devem ser transformadas em board/kanban, colunas, raias, paineis de decisao ou tabs compactas.
4. Scroll so e aceitavel em areas internas controladas: coluna, drawer, detalhe expandido, modal ou lista secundaria.
5. Cards devem conter contexto acionavel: cliente, demanda, origem, etapa/situacao, responsavel, proxima acao, prazo, visita/equipamento e sinais Auvo quando existirem.
6. Card so deve avancar por mudanca real persistida: etapa, situacao, proxima acao, visita, resolucao Auvo, aprovado/perdido, arquivamento ou status equivalente.
7. Heuristica por texto nao deve mover card entre colunas.

## Consequencias

- Refatoracoes visuais futuras devem priorizar board compacto em vez de listas verticais.
- E2E responsivo deve evoluir de "sem overflow horizontal" para tambem verificar scroll global indesejado em paginas operacionais.
- Fichas de detalhe podem ter scroll quando forem documentos/registro, mas devem priorizar resumo fixo e paineis de decisao no primeiro viewport.
- A Central Comercial, Proximas Acoes, Caixa Auvo, Pipeline, Clientes, Oportunidades e Notificacoes devem ser reavaliadas contra esta ADR.

## Excecoes

- Relatorios longos, auditoria, administracao e historico detalhado podem usar scroll quando o conteudo for naturalmente documental.
- Mobile pode usar navegacao em drawer/bottom-sheet e colunas com overflow interno, desde que a tela principal continue orientada por grupos visiveis e acao imediata.
