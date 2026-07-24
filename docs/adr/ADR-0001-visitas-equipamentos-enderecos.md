# ADR-0001 - Modelagem de Visitas, Equipamentos e Enderecos

Data: 2026-07-24  
Status: aceita; primeira fatia backend implementada em 2026-07-24.

## Contexto

O Artec CRM hoje representa clientes, oportunidades, atividades, proximas acoes, orcamentos, notificacoes e triagem Auvo. A rotina real da Artec exige tambem:

- visita tecnica consultiva com data, horario, tecnico, endereco, objetivo, acesso, confirmacao, resultado e proximos passos;
- equipamentos por cliente/oportunidade, com tipo, marca, modelo, BTUs, tensao, ambiente, serie, garantia e observacoes;
- multiplos enderecos, inclusive retirada e instalacao na mesma oportunidade.

Hoje esses conceitos sao simulados por texto livre em `Opportunity.descricao`, `Activity` e `NextAction`. A Central Comercial ainda identifica "visitas proximas" a partir de proximas acoes, nao de uma agenda tecnica estruturada.

## Decisao

Criar tres entidades estruturais de dominio comercial/operacional:

1. `Address`
2. `Equipment`
3. `Visit`

Criar tambem uma tabela de relacionamento:

4. `VisitEquipment`

Estas entidades pertencem ao schema `crm`. Elas nao criam financeiro, nao criam ordem de servico automaticamente e nao alteram a regra de que o Auvo exige decisao humana antes de criar oportunidade.

## Modelo Proposto

### Address

Representa um endereco reutilizavel do cliente e referenciavel por visitas.

Campos propostos:

- `id`
- `customerId`
- `label`
- `kind`: `service`, `billing`, `pickup`, `installation`, `other`
- `street`
- `number`
- `complement`
- `neighborhood`
- `city`
- `state`
- `postalCode`
- `reference`
- `accessNotes`
- `isPrimary`
- `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `archivedAt`

Regras:

- `customerId` obrigatorio.
- Cadastro pode ser progressivo; endereco completo nao deve bloquear cadastro rapido.
- `archivedAt` preserva historico.
- Um cliente pode ter varios enderecos.
- Vinculo direto Opportunity-Address fica fora da primeira entrega, salvo necessidade confirmada; `Visit.addressId` cobre a agenda inicial.

### Equipment

Representa aparelho/equipamento associado ao cliente e opcionalmente a uma oportunidade/endereco.

Campos propostos:

- `id`
- `customerId`
- `opportunityId` opcional
- `addressId` opcional
- `type`: `split_hi_wall`, `cassette`, `window_ac`, `floor_ceiling`, `multi_split`, `other`
- `brand`
- `model`
- `btus`
- `voltage`
- `environment`
- `serialNumber`
- `installedAt`
- `warrantyUntil`
- `notes`
- `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `archivedAt`

Regras:

- `customerId` obrigatorio.
- `opportunityId` e opcional porque equipamentos podem existir no historico do cliente sem nova venda.
- `addressId` e opcional para permitir cadastro progressivo.
- Garantia, suporte e pos-venda devem poder referenciar equipamento sem criar oportunidade.

### Visit

Representa visita tecnica consultiva ou visita operacional vinculada a cliente e, quando aplicavel, oportunidade.

Campos propostos:

- `id`
- `customerId`
- `opportunityId` opcional
- `addressId` opcional
- `scheduledStartAt`
- `scheduledEndAt`
- `technicianUserId` opcional
- `status`: `draft`, `awaiting_confirmation`, `confirmed`, `completed`, `cancelled`, `no_show`
- `objective`
- `accessNotes`
- `confirmationNotes`
- `result`
- `nextSteps`
- `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `archivedAt`

Regras:

- Visita ativa precisa de `customerId`, `scheduledStartAt`, `status` e objetivo.
- `scheduledStartAt` deve ser `timestamptz`.
- `completed` deve ter `result`.
- `cancelled` deve ter observacao ou motivo.
- Visita nao aprova, perde nem encerra oportunidade automaticamente.
- Ao concluir visita, a UI deve sugerir criar atividade e proxima acao; a decisao continua humana.

### VisitEquipment

Relaciona visitas a equipamentos avaliados ou envolvidos.

Campos propostos:

- `visitId`
- `equipmentId`
- `notes`

Regras:

- Chave unica composta `visitId, equipmentId`.
- Permite uma visita avaliar varios aparelhos e um aparelho participar de varias visitas ao longo do historico.

## Impacto em APIs

Rotas implementadas na primeira fatia:

- `GET /api/customers/:id/addresses`
- `POST /api/customers/:id/addresses`
- `GET /api/addresses/:id`
- `PATCH /api/addresses/:id`
- `POST /api/addresses/:id/archive`
- `GET /api/customers/:id/equipment`
- `GET /api/opportunities/:id/equipment`
- `POST /api/customers/:id/equipment`
- `GET /api/equipment/:id`
- `PATCH /api/equipment/:id`
- `POST /api/equipment/:id/archive`
- `GET /api/visits`
- `GET /api/visits/:id`
- `POST /api/visits`
- `PATCH /api/visits/:id`
- `POST /api/visits/:id/complete`
- `POST /api/visits/:id/cancel`

Permissoes implementadas:

- `addresses:read`, `addresses:write`
- `equipment:read`, `equipment:write`
- `visits:read`, `visits:write`

## Impacto em UI

Central Comercial:

- Implementado: "Agenda e visitas" consome `Visit`, nao regex/texto de `NextAction`.
- Implementado: metric card "Visitas" conta visitas futuras confirmadas/aguardando confirmacao.

Ficha do Cliente:

- Implementado: aba Estrutura com Enderecos, Equipamentos e Visitas.
- Implementado: cadastro progressivo de endereco, equipamento e visita.
- Implementado: visita pode ser concluida/cancelada a partir da ficha.
- Suporte/garantia deve poder selecionar equipamento.

Ficha da Oportunidade:

- Adicionar bloco de visita tecnica.
- Adicionar equipamentos e enderecos vinculados ao contexto da oportunidade.

Proximas Acoes:

- Continuar existindo como fila de follow-up; visita nao substitui proxima acao.
- Visita pode gerar proxima acao ao ser criada/concluida.

## Migration Implementada

Migration criada: `database/migrations/0021_criar_visitas_equipamentos_enderecos.sql`.

A fatia implementada inclui:

1. Tabelas `crm.enderecos`, `crm.equipamentos`, `crm.visitas` e `crm.visitas_equipamentos`.
2. Modelos Prisma `Address`, `Equipment`, `Visit` e `VisitEquipment`.
3. Validações Zod para criacao/atualizacao/conclusao/cancelamento/listagem.
4. Rotas HTTP com auth e RBAC.
5. Teste HTTP de criacao de endereco, equipamento, visita, conclusao da visita e query invalida.

Decisoes preservadas para ciclos seguintes:

- `technicianUserId` fica UUID opcional inicialmente; a amarracao fina com membership/tecnico dedicado fica para UI/operacao.
- Opportunity nao ganhou relacao direta com multiplos enderecos neste ciclo; `Visit.addressId` e `Equipment.addressId` cobrem a primeira entrega.
- Nenhum backfill automatico foi criado.

## Backfill

Nao ha backfill automatico seguro para transformar texto livre em visitas/equipamentos/enderecos.

Backfill permitido somente como dry-run:

- localizar atividades/proximas acoes com `visit|visita` para sugerir visitas;
- localizar descricoes com BTUs/marca/modelo para sugestao de equipamento;
- nunca gravar automaticamente sem revisao humana.

## Consequencias

Positivas:

- Agenda tecnica deixa de depender de texto livre.
- Suporte/garantia ganham contexto de equipamento.
- Remocao/reinstalacao e corporativo passam a aceitar multiplos enderecos.
- Relatorios futuros podem medir visita, confirmacao, no-show e tempo ate orcamento.

Custos:

- Aumenta superficie de UI e API.
- Exige migration e novos testes.
- Exige decisao cuidadosa sobre tecnico responsavel e permissao.

Riscos:

- Modelagem excessiva pode tornar cadastro inicial lento.
- Criar visita sem integrar com proxima acao pode duplicar trabalho do atendente.
- Se `Visit` substituir `NextAction` indevidamente, follow-up comercial perde clareza.

Mitigacao:

- Cadastro progressivo.
- Visita e proxima acao coexistem.
- UI sugere proximos passos em vez de automatizar decisao comercial.
- Primeira entrega deve ser minima e operacional: cadastrar endereco, equipamento e visita; listar na ficha; mostrar visitas na Central.

## Criterios de Aceite para a Primeira Implementacao

Concluidos:

- `prisma validate` passa.
- Migration 0021 foi criada sem Prisma Migrate.
- Migration 0021 foi aplicada no banco local/E2E pelo runner proprio (`npm.cmd run db:migrate`).
- APIs novas exigem auth e RBAC.
- Visita concluida/cancelada gera Activity rastreavel.
- Nenhum fluxo cria financeiro.
- Nenhum webhook Auvo cria visita ou oportunidade sem decisao humana.
- Teste HTTP cobre criar endereco, criar equipamento, criar visita, concluir visita e query invalida.
- Central Comercial mostra visitas reais, nao heuristica por texto.
- Ficha do Cliente lista e cria enderecos/equipamentos/visitas.
- E2E de UI cobre criar endereco, criar equipamento, criar visita e ver na Central.

Pendente para declarar a fatia completa na UI:

- Ficha da Oportunidade exibir bloco de visita tecnica/equipamentos/endereco.
- Garantia/suporte selecionar equipamento explicitamente ao registrar atendimento.

## Rollback

- A primeira entrega deve ser aditiva.
- Antes de dados reais, uma migration de reversao ainda e possivel.
- Depois de uso real, preferir `archivedAt` e feature flag em vez de drop de tabelas.
