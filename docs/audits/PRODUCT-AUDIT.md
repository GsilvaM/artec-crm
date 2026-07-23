# Auditoria de produto — Artec CRM

Autor: Product Architect (auditoria de código, banco e testes; nenhuma tela foi navegada nesta
sessão). Branch: `refactor/frontend-design-system`.

## 0. Fontes e método

Lidos por completo: `CONTEXTO-ROTINA-ATENDIMENTO-ARTEC-CRM.md` (raiz), `docs/AUDITORIA-ESTADO-ATUAL-ARTEC-CRM.md`,
`prisma/schema.prisma`, todas as migrations em `database/migrations/0001`–`0019`, `server/crm/prisma-repository.ts`
(2574 linhas), `server/crm/validation.ts`, `server/crm/routes.ts`, `server/crm/types.ts`, `server/auth/rbac.ts`,
`src/domain/crm.ts`, e todos os arquivos de `src/features/**` e `src/components/*.tsx` relevantes (Central
Comercial, Próximas Ações, Oportunidades, Clientes, Notificações, Relatórios, Funil, Caixa Auvo, Administração).

`AGENTS.md` e `docs/PRODUCT-SPEC.md` **não existem no repositório** — usei `CONTEXTO-ROTINA-ATENDIMENTO-ARTEC-CRM.md`
como especificação de produto (é o documento que a própria instrução deste agente aponta como substituto) e
`docs/AUDITORIA-ESTADO-ATUAL-ARTEC-CRM.md` como hipótese visual a confirmar, nunca como fato. Todo achado abaixo
foi reverificado direto no código/banco desta sessão; quando a auditoria anterior citava algo que o código já
resolve, isso está marcado como resolvido, não repetido como pendência.

Classificação usada em cada achado:
- **comprovado pelo código** — lido diretamente em `.ts`/`.tsx`.
- **comprovado pelo banco** — lido diretamente em `schema.prisma` ou nas migrations SQL.
- **inferência forte** — decorre logicamente do código lido, mas depende de dado em produção ou de comportamento
  em runtime que não foi executado nesta sessão.
- **hipótese** — plausível, mas sem evidência direta encontrada; precisa de confirmação.
- **desconhecido** — não foi possível verificar com os arquivos disponíveis.

---

## 1. Achados críticos (ordem de impacto no trabalho real da Artec)

### 1.1 Não existe entidade Visita — "Visita Técnica Consultiva" é simulada por regex em texto livre

**Comprovado pelo banco + pelo código.** `prisma/schema.prisma` não tem nenhum model `Visit`/`Visita`. A busca por
"visita" no schema não retorna nada. Em `server/crm/prisma-repository.ts:803`, o bloco "Visitas próximas" da
Central Comercial é montado assim:

```ts
upcomingVisits: actionItems.filter((action) =>
  /visita/i.test(`${action.title} ${action.opportunitySituation ?? ""}`) && new Date(action.dueAt) >= startOfToday),
```

Ou seja: uma "visita" é qualquer `NextAction` cujo título ou situação contenha a palavra "visita" digitada por um
atendente em texto livre. Não existe data separada de horário, técnico responsável, endereço, confirmação,
acesso, equipamentos, objetivo ou resultado da visita — nenhum dos campos que `CONTEXTO-ROTINA-ATENDIMENTO-ARTEC-CRM.md`
seção 7 e seção 16 ("Visita") exigem explicitamente. Uma próxima ação que diga "Ligar sobre a visita de amanhã"
entra na lista; uma que diga "Confirmar horário técnico" (sem a palavra "visita") não entra, mesmo sendo a mesma
coisa.

Isso é a lacuna mais grave encontrada: o documento de contexto chama a visita técnica de "ponto central da
experiência Artec" e pede um fluxo completo com status, confirmação, conclusão e resultado — nada disso existe
como dado estruturado, só como heurística de string sobre um campo de próxima ação genérico.

**Impacto:** impossível gerar agenda de técnico, impossível saber quantas visitas confirmadas x aguardando
confirmação existem, impossível vincular resultado de visita a geração de orçamento como pede a seção 8.

### 1.2 Não existe entidade Equipamento nem Endereço — apenas rótulo de texto

**Comprovado pelo banco.** Nenhum model de Equipamento ou Endereço em `schema.prisma`. Toda a seção 16
("Equipamento": tipo, marca, modelo, BTUs, tensão, ambiente, número de série, data de instalação, garantia,
observações) e a exigência da seção 6.5 ("A interface precisa aceitar múltiplos endereços dentro da mesma
oportunidade") e da seção 6.1 ("registrar todos os equipamentos; registrar ambientes; registrar infraestrutura")
não têm nenhum campo correspondente em nenhuma tabela. A palavra "equipamento" só aparece como rótulo estático
do enum `tipo_demanda` (`"Instalação ou compra de equipamento"`) e em fixtures de teste do Auvo — nunca como
dado capturável.

**Impacto:** para instalação, remoção/reinstalação, higienização e corporativo/PMOC — que são a maior parte do
volume de trabalho descrito no documento de contexto (seções 6.1, 6.3, 6.5, 6.7) — não há onde registrar
quantidade de aparelhos, BTUs, marca/modelo, tubulação/dreno/elétrica, nem múltiplos endereços de retirada e
instalação. Tudo isso hoje só pode virar texto solto dentro de `descricao` (que nem é exposto no formulário de
criação — ver 1.4) ou de uma `Activity` de tipo `note`.

### 1.3 Campo "Cliente" no schema é mais rico do que o tipo exposto ao frontend — dados existem no banco/backend mas são invisíveis na UI

**Comprovado pelo código.** `prisma/schema.prisma` (`model Customer`) e `server/crm/types.ts`
(`CustomerRecord`) têm `nomeFantasia`, `documento`, `estado`, `observacoes` e `auvoContactId`. O backend já
aceita esses campos na criação (`server/crm/validation.ts`, `customerCreateSchema`, linhas 40–53). Mas
`src/domain/crm.ts` (`Customer` type, usado por toda a UI) **não inclui nenhum desses cinco campos**, e nem
`ClientesPage.tsx` nem `ClientePage.tsx` os leem, mostram ou editam. `estado` e `documento` (CPF/CNPJ) e
"observações" são campos explicitamente pedidos na seção 16 do contexto e simplesmente não têm caminho de UI.

### 1.4 Ficha do Cliente e ficha da Oportunidade não têm edição — só criação inicial e algumas transições pontuais

**Comprovado pelo código.** `updateCustomer()` existe em `src/domain/crm.ts:439` mas **não é chamado em nenhum
lugar do `src/`** (confirmado por busca em todo o diretório). Um cliente criado com nome ou telefone errado não
pode ser corrigido pela interface — só arquivado.

Para oportunidade, `updateOpportunity()` só é chamado com `{ etapaId }` (mudança de etapa) ou `{ responsavelId }`
(reatribuição) em `OportunidadePage.tsx` e `PipelinePage.tsx`. Não existe nenhum caminho de UI para editar
`título`, `tipoDemanda`, `descrição`, `origem`, `valorEstimado` ou `situação` depois que a oportunidade é criada.
`situação` — que a seção 10 do contexto descreve como algo que muda com frequência ("Aguardando cliente" →
"Aguardando visita" → ...) — é exibida como texto estático (`<dd>{opportunity.situacao}</dd>`) sem nenhum
controle de edição em `OportunidadePage.tsx`.

**Impacto direto na rotina descrita no documento:** a seção 9 (Follow-up) supõe que o atendente atualiza a
situação constantemente; hoje isso não é possível sem editar via banco.

### 1.5 Campo "origem" nunca é coletado por nenhum formulário — quebra o relatório de conversão por origem

**Comprovado pelo código.** `origem` existe no tipo `Opportunity`, no payload de criação
(`CreateOpportunityPayload.origem?`) e é usado por `ReportsPanel.tsx` ("Conversão por origem") e por
`CommercialReport.conversionByOrigin`. Busca por `origem` em todo `src/` mostra que **nenhum `<input>` ou
`<select>` da aplicação está vinculado a esse campo** — nem em `OportunidadesPage.tsx` (formulário principal de
criação), nem em `AuvoInboxPanel.tsx` (criação a partir da Caixa Auvo). Toda oportunidade criada pela interface
hoje nasce com `origem = null`. O relatório "Conversão por origem" (seção 18 do contexto: "origem" é métrica
obrigatória) está condenado a ficar vazio para qualquer dado novo, mesmo que o backend e o relatório estejam
implementados corretamente.

### 1.6 Vocabulário fechado de `tipo_demanda` não tem "outro" nem "manutenção preventiva" — CHECK de banco pode rejeitar demanda legítima

**Comprovado pelo banco.** A migration `0019_adicionar_constraints_tipo_demanda_e_motivo_perda.sql` fecha
`tipo_demanda` em exatamente seis valores: `instalacao, manutencao_corretiva, higienizacao, acj,
remocao_reinstalacao, corporativo_b2b_pmoc`. A própria seção 6 do `CONTEXTO-ROTINA-ATENDIMENTO-ARTEC-CRM.md`
(Etapa 2, linhas 218–236) lista como opções de classificação, além dessas: "manutenção preventiva" (distinta de
corretiva — é citada separadamente nas seções 2 e 4), "visita técnica consultiva" e **"outro"** como
válvula de escape explícita. Hoje, se um atendente tenta registrar uma demanda que não é nenhuma das seis
categorias (por exemplo, uma consultoria avulsa ou uma manutenção preventiva contratual fora de PMOC), o `CHECK`
de banco (`oportunidades_tipo_demanda_check`) rejeita o insert e o Zod (`server/crm/validation.ts:38`) rejeita
antes disso. Não existe fallback "outro" no vocabulário fechado.

**Risco de negócio real:** não é hipotético — o próprio comentário da migration 0018 registra que já existia em
produção um valor `manutencao` fora do vocabulário atual, que precisou de backfill manual antes do fechamento.
Isso mostra que a Artec já usa (ou já usou) categorias que o enum atual não cobre.

### 1.7 Não existe status "pausada" — "Pausado" é só um texto sugerido em "situação"

**Comprovado pelo banco + pelo código.** O enum de status de oportunidade (`schema.prisma`, `opportunityBaseSchema`
em `validation.ts:72`, e o tipo `Opportunity.status` em `src/domain/crm.ts:71`) é
`"rascunho" | "ativa" | "ganha" | "perdida" | "arquivada"`. Não há `"pausada"`. O contexto (seção 10) trata
"Pausado" como uma **saída do funil**, no mesmo nível que "Perdido" — ou seja, uma oportunidade pausada deveria
sair do fluxo ativo. Na implementação atual, "Pausado" só existe como uma sugestão de texto livre dentro de
`SITUACAO_SUGGESTIONS` (`src/domain/crm.ts:17-28`); a oportunidade continua com `status = "ativa"`, continua
exigindo responsável/próxima ação/data (regra de `assertActiveOpportunityHasNextAction`), continua contando
como "ativa" em relatórios e continua podendo cair em "oportunidades paradas" ou "sem próxima ação" da Central
Comercial. Não há tratamento diferenciado nem para o cenário da seção 11 ("momento de arquivar ou nutrir" um
lead sem retorno).

### 1.8 Notificações de atraso/vencimento/sem-ação/parada dependem de um job que não tem nenhum agendamento automático configurado

**Comprovado pelo código.** Quatro dos seis tipos de notificação (`overdue_next_action`, `due_soon_next_action`,
`missing_next_action`, `stalled_opportunity`) só são criados dentro de `reconcileNotifications()`
(`server/crm/prisma-repository.ts:1037`), que é restrito a `gestor` (`notifications:reconcile`) e é exposto via
`POST /api/notifications/reconcile` (`server/crm/routes.ts:108`). Busca em todo `src/` por "reconcile" não
encontra nenhuma chamada — **não existe botão, tela ou automação no frontend que dispare essa rota**. Existe um
script `npm run notifications:reconcile` (`server/notifications-reconcile.ts`) e outro para eventos Auvo
(`npm run auvo:events:reconcile`), mas `vercel.json` não declara nenhum `crons`, e não há nenhuma outra
configuração de agendamento no repositório.

**Efeito prático:** a página de Notificações e o sino de notificações da Central Comercial só recebem esses
quatro tipos se alguém (fora da aplicação) rodar esses scripts manualmente ou tiver configurado um cron externo
que não está neste repositório. Os outros dois tipos (`opportunity_assigned`, `next_action_reassigned`) são
criados de forma síncrona no momento da ação e funcionam independentemente disso.
Como a Central Comercial calcula "Ações vencidas"/"Ações de hoje" com consulta direta em `NextAction` (não em
`Notification`), esses widgets continuam corretos mesmo sem o reconcile rodar — mas a página de Notificações e
o alerta de "oportunidade sem próxima ação" cedo (antes do vencimento aparecer nas listas diretas) ficam
sistematicamente desatualizados. **Isso é o mecanismo técnico exato por trás do sintoma que a auditoria visual
anterior registrou** ("Caixa Auvo sem atendimento" contradizendo screenshots com itens, notificações
desatualizadas) — aqui está a causa raiz confirmada em código, não mais hipótese.

### 1.9 Corpo de notificação embute timestamp ISO cru — o problema que a auditoria visual apontou continua no código

**Comprovado pelo código.** `server/crm/prisma-repository.ts:1057`:

```ts
body: `${action.title} venceu em ${action.dueAt.toISOString()}.`,
```

`NotificationList.tsx` renderiza `item.body` sem nenhum reformatação. Isso quer dizer que qualquer usuário que
veja essa notificação lerá algo como `Retornar ao cliente venceu em 2026-07-21T14:00:00.000Z.` — data em UTC, em
formato técnico, sem conversão para `America/Sao_Paulo` nem para `pt-BR`. `docs/AUDITORIA-ESTADO-ATUAL-ARTEC-CRM.md`
já apontava "raw ISO timestamp dentro do corpo" como problema visual; o código mostra que a causa não foi
corrigida — ela está na geração do texto da notificação no backend, não é um problema de formatação na tela.

### 1.10 Cadastro de cliente não verifica duplicidade antes de salvar

**Comprovado pelo código.** `ClientesPage.tsx` (`handleCreate`) chama `createCustomer(form)` diretamente ao
submeter, sem nenhuma consulta prévia de duplicidade. `duplicatePhoneCustomerIds` só é calculado quando o
cliente já existe e é lido/listado (`prisma-repository.ts:1906-1937`), aparecendo como badge "possível
duplicidade" depois do fato consumado. Não existe endpoint nem chamada de "verificar telefone antes de salvar".
Isso contraria diretamente a seção 5 do contexto ("A primeira tarefa do CRM é localizar possíveis duplicidades
[...] O sistema nunca deve mesclar clientes automaticamente" — implicando checagem prévia com confirmação) e a
seção 14.5 ("Cadastro rápido... detectar telefone duplicado; continuar com confirmação"). Além disso, quando o
badge aparece depois, não há nenhum fluxo de comparação/resolução — nem em `ClientesPage.tsx` nem em
`ClientePage.tsx` — apenas o aviso de texto.

---

## 2. Central Comercial — "o que exige minha ação agora?"

Arquivo: `src/features/commercial-center/CentralComercialPage.tsx` + blocos
`CommercialActionBlock.tsx`/`CommercialOpportunityBlock.tsx`.

**A pergunta não é respondida com clareza — comprovado pelo código.** A página renderiza sete blocos
(`Ações vencidas`, `Ações de hoje`, `Visitas próximas`, `Orçamentos aguardando retorno`, `Oportunidades sem
próxima ação`, `Oportunidades paradas`, `Notificações relevantes`) mais Caixa Auvo e Resumo comercial, **todos
com o mesmo peso visual** (mesma classe `panel commercial-card`, mesmo tamanho, em grid). Não existe nenhuma
fila unificada de "prioridade agora" nem ordenação por urgência entre blocos — o usuário precisa varrer nove
seções para entender o que é mais crítico. Cada bloco também trunca em 5 itens (`items.slice(0, 5)`) sem link
"ver todos" — se houver 12 ações vencidas, 7 ficam invisíveis sem qualquer indicação de que existem mais.

**Achados específicos:**

- **"Orçamentos aguardando retorno" depende de comparação de string sem acento com o nome da etapa
  (comprovado pelo código + pelo banco).** `prisma-repository.ts:802`:
  `["Orcamento enviado", "Negociacao"].includes(opportunity.stageName)`. As etapas são seedadas sem acento
  (`0007_complete_customers_opportunities_flow.sql`), então hoje bate. Mas `AdminPanel.tsx` permite renomear
  qualquer etapa não-terminal — inclusive essas duas — sem nenhum aviso de que o nome é usado em lógica de
  negócio. Se um gestor renomear "Orcamento enviado" para "Orçamento enviado" (grafia correta em português,
  que é exatamente o que a seção 13 do contexto pede: "evitar... textos genéricos" e usar "português do Brasil
  natural"), o bloco "Orçamentos aguardando retorno" da Central Comercial silenciosamente some para todas as
  oportunidades naquela etapa, sem erro visível. **Risco real e imediato, não hipotético.**
- **Nomes das etapas seedadas não têm acentuação** (`Visita ou avaliacao`, `Orcamento em elaboracao`,
  `Orcamento enviado`, `Negociacao`, `Concluido` — comprovado pelo banco, `0007_complete_customers_opportunities_flow.sql:84-93`).
  Esses nomes aparecem literalmente em toda a interface (colunas do funil, badges, filtros, Central Comercial).
  Contraria a seção 13 do contexto ("A interface deve usar português do Brasil natural").
- **Filtro "Situação" na Central Comercial é um `<input>` de texto livre**, exigindo que o usuário digite
  exatamente a string salva (`filters.situation`), sem autocomplete das sugestões existentes
  (`SITUACAO_SUGGESTIONS` não é usado aqui, só no formulário de criação). Comprovado pelo código.
- Resumo comercial mistura contagem de "novas oportunidades"/"aprovadas"/"perdidas" com valor aprovado e ticket
  médio no mesmo bloco pequeno — não há indicação de gargalos (tempo em etapa, oportunidades por
  responsável) que a seção 3 do contexto pede explicitamente para o gestor ("distribuição por responsável",
  "gargalos").
- Positivo, comprovado: os filtros (`period`, `etapa`, `situação`, `tipo de demanda`, `categoria`, `prioridade`)
  são passados ao backend via querystring e há chips removíveis por filtro — isso está bem implementado.
- Positivo, comprovado: fixtures de teste (`is_test_fixture`) são excluídas consistentemente das consultas que
  alimentam a Central Comercial (`prisma-repository.ts:735,764,774,848,857,1911`).

---

## 3. Próximas Ações — não existe "Minha fila" nem agrupamento por tempo

Arquivo: `src/features/next-actions/ProximasAcoesPage.tsx`.

**Comprovado pelo código.** Os únicos filtros disponíveis são cinco abas de status/vencimento: `Vencidas, Hoje,
Próximas, Concluídas, Canceladas`. Não existe:

- **Filtro por responsável** na tela (o tipo `NextActionFilters` suporta `responsibleUserId`, mas nenhum
  controle de UI o usa aqui). Para o papel `vendedor`, o backend já restringe automaticamente
  `responsibleUserId: actor.id` (`prisma-repository.ts:689` — isso é RBAC funcionando corretamente, positivo e
  comprovado). Mas para `gestor`, que vê todos os responsáveis por padrão, **não há nenhuma forma de filtrar
  por colega ou de alternar para "minha fila"** — o conceito de "Minha fila" citado como visão padrão desejada
  não existe nem para o próprio gestor.
- **Agrupamento por tempo.** O filtro "Próximas" é um balde único (`!isOverdue && !isTodayAction`) sem separar
  amanhã / esta semana / sem data, ao contrário do que a seção 14.2 do contexto e a auditoria visual anterior
  pedem.
- **Ações em lote.** Cada linha tem botões individuais (Concluir/Reagendar/Cancelar); não há seleção múltipla
  nem conclusão em massa.
- **Modo agenda/calendário.** Só existe tabela.
- **Contato rápido.** A coluna "Cliente" só navega para a ficha; não há link `tel:`/WhatsApp direto na linha,
  ao contrário do que existe (corretamente) na ficha do cliente (`ClientePage.tsx` tem `<a href="tel:">`).
- **Filtro por categoria/prioridade na tela** — o tipo suporta, mas não há controles renderizados nesta página
  (existem na Central Comercial, mas não aqui, onde o volume de uso diário é maior segundo a seção 14.2).

Ponto positivo e bem implementado, comprovado pelo código: o fluxo de "concluir com encadeamento" —
`useActionOperation.ts` verifica se a oportunidade ligada está ativa e se a ação sendo concluída é a
`currentNextActionId`; se for, obriga a criação de uma próxima ação antes de permitir a conclusão
(`requiresReplacement`). Isso implementa corretamente a regra "oportunidade ativa nunca fica sem próxima ação"
tanto no cliente quanto no servidor (o servidor teria que ser confirmado à parte, mas a intenção estrutural está
certa e o front força isso na UI).

---

## 4. Oportunidades — criação não é progressiva, campos relevantes ausentes do formulário

Arquivo: `src/features/opportunities/OportunidadesPage.tsx`.

**Comprovado pelo código: a criação não é progressiva.** É um único formulário fixo, sempre aberto no topo da
página de listagem (mesmo padrão que `docs/AUDITORIA-ESTADO-ATUAL-ARTEC-CRM.md` já apontava como problema —
"formulário completo sempre aberto", "tela mistura criar e consultar" — e que continua exatamente assim no
código atual, não foi corrigido). Os campos do formulário são: cliente, título, tipo de demanda, situação
(datalist), próxima ação, data da próxima ação. Faltam do formulário principal, mesmo já existindo no modelo de
dados:

- `origem` (ver 1.5 — nunca é coletado em lugar nenhum);
- `valorEstimado` (existe no payload, mas não há `<input>` no formulário);
- `descrição` (existe no tipo `Opportunity`, não há textarea em lugar nenhum da aplicação);
- responsável (sempre é o usuário atual — correto como default rápido, mas não há opção de atribuir a outra
  pessoa direto na criação, o que a seção 6.7 pede para casos corporativos conduzidos em equipe);
- prioridade — **não existe como campo em nenhuma camada** (banco, backend, frontend — ver 4.1 abaixo).

### 4.1 Campo "prioridade" da Oportunidade não existe em nenhuma camada

**Comprovado pelo banco + pelo código.** `schema.prisma` não tem coluna de prioridade em `Opportunity`.
`OpportunityRecord` (`server/crm/types.ts:37-68`) não tem `priority`. `Opportunity` (`src/domain/crm.ts:46-74`)
não tem `priority`. A seção 16 do contexto lista "prioridade" como campo esperado da Oportunidade. Hoje só
`NextAction` e `Notification` têm prioridade — a oportunidade em si nunca é priorizável, o que limita qualquer
ordenação de "o que atacar primeiro" no funil e na Central Comercial a heurísticas indiretas (atraso, dias
parada).

### 4.2 Tipo de demanda é exibido como valor bruto do enum, não como rótulo em português

**Comprovado pelo código, em dois lugares:** `OportunidadePage.tsx:201`
(`<dd>{opportunity.tipoDemanda}</dd>`) e `PipelineBoard.tsx:122` (`<dd>{opportunity.tipoDemanda}</dd>`). Nos
dois casos deveria usar `TIPO_DEMANDA_OPTIONS.find(o => o.value === tipoDemanda)?.label`, que já existe e é
usado corretamente no formulário de criação. O usuário final vê `instalacao` ou `manutencao_corretiva` em vez
de "Instalação ou compra de equipamento" / "Manutenção corretiva" na ficha e no card do funil — viola
diretamente a seção 13 ("evitar... mensagens técnicas") e o próprio objetivo do vocabulário fechado (criado
justamente para ter rótulos comerciais claros).

### 4.3 Card do funil não mostra responsável nem soma por coluna

**Comprovado pelo código.** `PipelineBoard.tsx` mostra cliente, título, tipo (bruto, ver 4.2), origem (se
houver — nunca há, ver 1.5), valor, situação e próxima ação — mas **não mostra o responsável pela
oportunidade**, campo que a seção 14.6 do contexto exige explicitamente em cada cartão ("Cada cartão deve
mostrar: cliente; demanda; etapa; situação; responsável; valor; próxima ação; data; atraso"). O cabeçalho de
cada coluna só mostra a contagem de cards (`<span className="badge">{stageOpportunities.length}</span>`), sem
soma de valor por etapa. Não há filtro por responsável no funil (`PipelinePage.tsx` não expõe nenhum filtro).

### 4.4 Funil carrega só a primeira página de oportunidades (sem paginação)

**Inferência forte, comprovado pelo código quanto ao mecanismo.** `PipelinePage.tsx` usa `loadCrmSnapshot()`,
que chama `/api/opportunities` sem cursor. O backend usa `DEFAULT_LIST_LIMIT = 100` quando nenhum limite é
passado (`prisma-repository.ts:63-68`). Diferente de `OportunidadesPage.tsx`, que pagina corretamente com
"Carregar mais oportunidades", o Funil **não tem "carregar mais" nem indicação de que existem mais de 100
oportunidades** — se o total (ativas + concluídas + perdidas, todas retornadas juntas nesse endpoint sem filtro
de status) ultrapassar 100, colunas mais adiante no funil (ou colunas com maior volume) ficam truncadas sem
aviso. Não pude confirmar o volume real de dados em produção nesta sessão (por isso "inferência forte", não
"comprovado"), mas o mecanismo de truncamento silencioso está confirmado no código.

### 4.5 Vínculo manual de oportunidade na Caixa Auvo exige digitar o ID cru

**Comprovado pelo código.** Em `AuvoInboxPanel.tsx:278`, a ação "Vincular a oportunidade existente" pede um
`<input>` de texto livre rotulado "ID da oportunidade" — o atendente precisa saber e digitar um UUID de cabeça.
Não há busca/autocomplete de oportunidades do cliente sugerido, apesar de a lista de oportunidades do cliente já
estar acessível via `loadOpportunitiesByCustomer`. Isso é inviável na prática para uso diário.

---

## 5. Ficha do Cliente e Ficha da Oportunidade

### Ficha do Cliente (`ClientePage.tsx`)

Pontos bem resolvidos, comprovados pelo código: abas (visão geral / oportunidades / próximas ações / garantia e
suporte / linha do tempo) refletem corretamente a separação pedida pela seção 6.6 do contexto (garantia/suporte/
pós-venda como histórico do cliente, nunca oportunidade — `SUPPORT_ACTIVITY_TYPES` filtra isso corretamente);
aviso de duplicidade de telefone; próxima ação mais próxima destacada no topo; ações rápidas de ligar/e-mail.

Lacunas, comprovadas pelo código:

- Sem edição de cadastro (ver 1.4).
- Campos do banco não expostos: `documento`, `estado`, `observações`, `nome fantasia` (ver 1.3).
- Sem seção de "Equipamentos" nem "Endereços" (ver 1.2) — a seção 14.4 do contexto pede que a ficha do cliente
  reúna "equipamentos" e "endereços" e nenhum dos dois existe como dado estruturado.
- Sem campo "origem" nem "tags" nem "ID Auvo" visíveis, apesar de ao menos `auvoContactId` existir no banco.
- Duplicidade de telefone é só um aviso de texto — não linka para o(s) outro(s) cadastro(s), não oferece
  comparação nem mesclagem assistida.
- "Nova ação de atendimento" na aba Próximas Ações sempre cria com `category: "support"` fixo
  (`ClientePage.tsx:116`), mesmo que o atendente esteja criando uma ação comercial de acompanhamento — não há
  seletor de categoria nesse formulário específico (existe corretamente em outros lugares do app).

### Ficha da Oportunidade (`OportunidadePage.tsx`)

Pontos bem resolvidos, comprovados pelo código: aprovar exige valor + forma de pagamento + parcelas + previsão
de execução, tudo num formulário dedicado (`mode === "approve"`) — bate com a seção 8 do contexto e com o CHECK
de banco; perder exige motivo obrigatório de uma lista pré-cadastrada (`mode === "lose"`), reforçando o CHECK de
banco `oportunidades_perdida_exige_motivo_check` da migration 0019; próxima ação nunca fica escondida — aparece
no resumo com badge de atraso; arquivar pede confirmação e preserva histórico.

Lacunas, comprovadas pelo código:

- Sem edição de `situação`, `título`, `tipo de demanda`, `descrição`, `origem`, `valor estimado` depois da
  criação (ver 1.4).
- `tipoDemanda` exibido em bruto (ver 4.2).
- `valorOrcamento` é mostrado na ficha (`opportunity.valorOrcamento`), mas o `QuotesPanel` mantém sua própria
  lista versionada de orçamentos (`Quote[]`, com `valor` próprio por versão) — não há indicação visual de qual
  dos dois é a fonte de verdade nem confirmação de que `valorOrcamento` é sincronizado automaticamente ao criar
  um novo `Quote` (não encontrei, na leitura de `prisma-repository.ts`, nenhum ponto que atualize
  `oportunidade.valor_orcamento` a partir de `createQuote`/`updateQuote` — **hipótese a confirmar**: pode haver
  dois números de orçamento divergentes na mesma tela).
- Sem "prioridade" (campo inexistente, ver 4.1).
- Não há como registrar equipamentos/infraestrutura/endereços na oportunidade (ver 1.2), então o "resumo
  operacional" pedido na seção 12 do contexto (para passar à equipe de execução) não tem de onde puxar dados
  estruturados — dependeria inteiramente de texto livre em `Activity`.

---

## 6. Notificações

Arquivos: `NotificacoesPage.tsx`, `useNotifications.ts`, `NotificationList.tsx`.

- **Geração automática depende de job sem agendamento** — achado 1.8, o mais grave desta área.
- **Corpo com timestamp ISO cru** — achado 1.9.
- **Adiar (snooze) é fixo em 24 horas**, sem seletor de data (`useNotifications.ts:61-64`:
  `new Date(Date.now() + 24 * 60 * 60 * 1000)`). Contraria a direção "snooze com data" que a própria auditoria
  visual anterior já recomendava, e não dá controle real ao usuário. Comprovado pelo código.
- **Sem agrupamento por tempo** (Hoje / Esta semana / Anteriores) — a página só tem abas de status
  (Pendentes/Lida/Arquivada), não de período. Comprovado pelo código.
- **Sem filtro por tipo/severidade** na tela (o tipo `NotificationFilters` suporta `type` e `severity`, mas
  `NotificacoesPage.tsx` só usa `status`). Comprovado pelo código.
- Ponto positivo, comprovado: os seis tipos de notificação gerados
  (`overdue_next_action, due_soon_next_action, opportunity_assigned, next_action_reassigned,
  missing_next_action, stalled_opportunity, internal_error`) mapeiam bem aos cinco tipos que a seção 14.7 do
  contexto pede ("follow-up vencido; ação próxima do prazo; oportunidade atribuída; oportunidade sem ação; erro
  de integração") — não há notificação disparada "a cada edição". A lógica de negócio de geração está correta;
  o problema é de disparo (1.8) e de formatação de texto (1.9), não de escopo.
- Ponto positivo, comprovado: cada notificação tem `dedupeKey` e o reconcile resolve (`status: "resolved"`)
  notificações cuja condição deixou de existir — mecanismo de dedupe real, não é hipótese.

---

## 7. Relatórios

Arquivo: `RelatoriosPage.tsx` → `ReportsPanel.tsx`.

- **Nenhum valor financeiro (faturamento/receita/caixa) é exibido** — comprovado pelo código; todas as métricas
  do painel (`novos leads, oportunidades criadas, valor orçado, valor aprovado, aprovações, ticket médio,
  conversão, follow-ups vencidos/concluídos, dias até orçamento/aprovação/perda, por etapa, por origem, motivos
  de perda`) são estritamente comerciais, exatamente como a seção 18 do contexto exige. Este é o ponto mais
  bem-resolvido da auditoria.
- **Sem nenhum gráfico** — apenas números em cartões e tabelas HTML simples (`table`/`tr`/`td`). Não há biblioteca
  de gráficos importada em nenhum lugar do projeto (busca por bibliotecas de chart não encontrou nada usado).
  A auditoria visual anterior já pedia "funil por etapa, conversão entre etapas, tempo em etapa" como
  visualizações — hoje são só listas tabulares. Isso não viola nenhuma regra do `CONTEXTO-ROTINA-ATENDIMENTO`
  (que pede as métricas, não necessariamente gráficos), mas para "o gestor enxerga gargalos" (critério de
  sucesso da seção 19) uma tabela de "oportunidades por etapa" sem visualização comparativa dificulta essa
  leitura rápida. Classificação: achado de UX, não de regra de negócio quebrada.
- **`conversionByOrigin` sempre virá vazio ou com uma única linha "null"/vazia** na prática, porque `origem`
  nunca é preenchido pela UI (ver 1.5) — o relatório em si está correto, o problema é upstream.
- **Acesso restrito a `gestor`** (`reports:read` só está em `rolePermissions.gestor`,
  `server/auth/rbac.ts:26-45`) e a navegação lateral esconde corretamente o item para quem não tem permissão
  (`Sidebar.tsx:45`, `canViewReports`) — isso é RBAC funcionando como esperado, comprovado e correto, não é uma
  falha.

---

## 8. Fluxos incorretos ou ausentes (resumo consolidado)

| Fluxo esperado (CONTEXTO) | Situação real | Classificação |
|---|---|---|
| Visita técnica como entidade estruturada (seção 7, 16) | Não existe; é regex sobre título de próxima ação | comprovado pelo banco + código |
| Registrar equipamentos/infraestrutura (seção 6.1, 16) | Não existe nenhuma tabela | comprovado pelo banco |
| Múltiplos endereços por oportunidade (seção 6.5) | Não existe nenhum campo | comprovado pelo banco |
| Detectar duplicidade antes de salvar, com confirmação (seção 5, 14.5) | Só detecta depois de salvo, sem fluxo de resolução | comprovado pelo código |
| "Minha fila" como padrão em Próximas Ações (seção 14.2) | Não existe filtro de responsável na tela; só RBAC de vendedor restringe automaticamente | comprovado pelo código |
| Agrupamento por tempo em Próximas Ações e Notificações | Não existe em nenhuma das duas telas | comprovado pelo código |
| Criação progressiva de oportunidade em passos (seção 3, Etapa 3) | Formulário único e fixo, igual ao estado já criticado na auditoria visual anterior | comprovado pelo código |
| Prioridade da oportunidade (seção 16) | Campo inexistente em banco/backend/frontend | comprovado pelo banco + código |
| "Pausado" como saída distinta do funil (seção 10, 11) | Só existe como texto livre em situação; status continua "ativa" | comprovado pelo banco + código |
| Notificação de atraso/sem-ação populada automaticamente (seção 14.7) | Depende de job sem cron configurado no repositório | comprovado pelo código |
| Relatórios sem dado financeiro (seção 18) | Corretamente implementado | comprovado pelo código (positivo) |
| Garantia/suporte/pós-venda não criam oportunidade (seção 6.6) | Corretamente implementado (activities, não oportunidades) | comprovado pelo código (positivo, já confirmado nesta sessão) |
| Webhook Auvo não cria oportunidade (seção 17) | Corretamente implementado (fluxo passa por Caixa Auvo → ação humana) | comprovado pelo código (positivo, já confirmado nesta sessão) |

---

## 9. Campos faltantes (consolidado)

**Cliente:** `documento`, `estado`, `observações`, `nome fantasia` (existem no banco/backend, não expostos na UI);
`endereços` (plural), `equipamentos`, `origem`, `tags`, `ID Auvo` visível ao usuário — nenhum dos últimos cinco
existe em qualquer camada.

**Oportunidade:** `prioridade` (inexistente em toda camada); `origem`, `valor estimado`, `descrição` (existem no
modelo, sem campo de captura na UI); múltiplos endereços; equipamentos vinculados.

**Visita:** entidade inteira ausente (data, horário, técnico, endereço, contato, demanda, equipamentos, acesso,
observações, status, confirmação, conclusão, resultado, próximos passos — nenhum existe).

**Equipamento:** entidade inteira ausente.

---

## 10. Estados inválidos possíveis hoje

1. Oportunidade com `situação = "Pausado"` (texto livre) mas `status = "ativa"` — continua exigindo próxima
   ação/responsável/data e aparecendo em todas as filas de "ativa", mesmo que a intenção do atendente fosse
   pausar/nutrir o lead sem urgência (comprovado pelo código/banco, ver 1.7).
2. Nome de etapa do funil renomeado pelo gestor via Administração pode quebrar silenciosamente o bloco
   "Orçamentos aguardando retorno" da Central Comercial, sem qualquer aviso de dependência (comprovado pelo
   código, ver 2, item 1).
3. Cliente duplicado (mesmo telefone) criado sem aviso prévio, permanecendo como dois cadastros com histórico e
   oportunidades desconectados até alguém notar o badge (comprovado pelo código, ver 1.10).
4. Cliente com nome contendo "homolog" ou iniciado por "E2E " que seja um cliente real da Artec seria
   automaticamente marcado como fixture de teste e desapareceria de todas as telas operacionais
   (`isTestFixtureName`, `prisma-repository.ts:2361-2363`) — o heurístico de nome não distingue teste real de
   coincidência de nome. Classificação: inferência forte (depende de nomenclatura real de clientes, não
   verificável nesta sessão).
5. Novo cliente de teste E2E criado com o telefone fixture `11999990000` mas com nome que não contém "E2E " nem
   "homolog" não seria automaticamente marcado como `is_test_fixture` na criação (`isTestFixtureName` só
   verifica o nome, não o telefone — o telefone só foi usado no backfill único da migration 0017). Comprovado
   pelo código; risco de regressão da contaminação de dados que a migration 0017 tentou resolver.
6. `valorOrcamento` da oportunidade e o valor do `Quote` mais recente podem divergir sem nenhuma indicação na UI
   de qual é a fonte de verdade (hipótese, ver seção 5).

---

## 11. Requisitos por página (o que falta para cada tela citada na missão)

**Central Comercial:** unificar blocos em uma fila única ordenada por urgência real (vencidas > hoje > paradas
sem ação > visitas > orçamentos), ou pelo menos hierarquizar visualmente o que é mais crítico; corrigir a
comparação de nome de etapa para não depender de string exata; adicionar link "ver todos" quando um bloco tiver
mais de 5 itens; autocomplete no filtro de situação.

**Próximas Ações:** adicionar filtro/toggle "Minha fila" vs "Todos" (relevante sobretudo para gestor);
agrupamento por tempo (atrasadas/hoje/amanhã/esta semana/sem data); ação de contato rápido por linha; ações em
lote; filtro por responsável, categoria e prioridade nesta tela (hoje só existem na Central Comercial).

**Oportunidades:** tornar a criação progressiva (ou ao menos mover para um drawer, tirando o formulário fixo do
topo da listagem); adicionar campos de origem, valor estimado e descrição ao formulário; adicionar campo de
prioridade em todas as camadas; corrigir exibição de `tipoDemanda` para usar o rótulo, não o valor bruto; permitir
editar situação/título/descrição depois da criação; no funil, mostrar responsável e soma de valor por coluna,
paginar ou remover o limite implícito de 100 registros.

**Ficha do Cliente:** adicionar edição de cadastro; expor documento/estado/observações/nome fantasia; adicionar
seções de equipamentos e endereços (dependem de novo modelo de dados); linkar duplicidade ao(s) cadastro(s)
conflitante(s) com opção de comparar.

**Ficha da Oportunidade:** permitir editar título/tipo de demanda/descrição/origem/valor estimado/situação;
esclarecer relação entre `valorOrcamento` e `Quote` mais recente; corrigir exibição do tipo de demanda.

**Notificações:** configurar disparo automático do reconcile (cron ou trigger equivalente); corrigir texto do
corpo para não embutir ISO cru (formatar em `pt-BR`/fuso local); permitir escolher data de adiamento em vez de
fixo 24h; agrupar por período; expor filtro de tipo/severidade na tela.

**Relatórios:** nenhuma mudança de regra necessária; considerar visualização gráfica para funil/conversão/tempo em
etapa quando o volume de dados justificar (dependente de origem estar populado, ver 1.5, para o relatório de
conversão por origem fazer sentido).

---

## 12. Critérios de aceite propostos (derivados dos achados acima)

1. Toda oportunidade `ativa` sem próxima ação válida aparece em no máximo uma fila fácil de encontrar, e essa
   fila nunca depende de comparação de string com nome de etapa editável por admin.
2. Visita técnica é uma entidade com data, técnico, endereço, status e resultado — não uma busca por palavra
   "visita" em texto livre.
3. Nenhum formulário de criação de oportunidade permite salvar sem `origem` OU o relatório de conversão por
   origem exibe explicitamente "sem origem registrada" como categoria válida, em vez de ficar vazio
   silenciosamente.
4. Toda notificação de atraso/vencimento é gerada em, no máximo, N minutos após a condição ocorrer, por um
   mecanismo agendado e monitorável — não por script manual.
5. Nenhum texto de notificação, ficha ou card exibe timestamp ISO cru ou valor de enum bruto (`tipoDemanda`,
   `status`) sem passar por uma função de rótulo em português.
6. Cliente e oportunidade podem ser editados após a criação, com auditoria preservada.
7. Renomear uma etapa do funil não altera o comportamento de nenhuma lógica de negócio (ou o sistema impede /
   avisa explicitamente sobre etapas com dependência de nome).
8. Pausar uma oportunidade é uma transição de estado registrada (não um texto livre), e oportunidades pausadas
   não contam como "ativas sem ação" indefinidamente.

---

## 13. Riscos

- **Alto — dependência de job sem agendamento (1.8):** o sistema de notificações centrais pode estar
  silenciosamente parado em produção agora mesmo, sem qualquer erro visível, porque nada dispara o reconcile
  automaticamente. Confirmar com o time de operação se existe cron externo (ex.: Vercel Cron configurado fora do
  `vercel.json` do repo, GitHub Actions, ou serviço de terceiro) antes de assumir que é urgente corrigir — mas
  se não houver, é o achado de maior risco operacional desta auditoria.
- **Alto — string de nome de etapa acoplada a lógica de negócio (seção 2):** qualquer renomeação de etapa pelo
  gestor (ação permitida e documentada na própria tela de Administração) pode quebrar Central Comercial sem
  aviso algum.
- **Médio-alto — vocabulário fechado sem "outro" (1.6):** já há evidência de valor fora do vocabulário em
  produção antes do fechamento; a mesma situação pode se repetir e bloquear o cadastro de uma demanda legítima.
- **Médio — ausência de entidades Visita e Equipamento (1.1, 1.2):** não é um bug pontual, é uma lacuna
  estrutural de modelo de dados que limita todas as telas de instalação, remoção/reinstalação, corporativo/PMOC
  e visita técnica a texto livre. Corrigir depois exige migração de dados, não só UI.
- **Médio — dados não editáveis (1.4):** qualquer erro de digitação em cliente/oportunidade fica permanente até
  alguém editar via banco diretamente.
- **Baixo-médio — heurística de fixture de teste por nome (item 10.4/10.5):** pode tanto esconder clientes reais
  quanto deixar passar fixtures novas, dependendo de como o time de QA e o time comercial nomeiam registros no
  dia a dia.

---

## 14. O que já está correto e não deve ser retrabalhado

Para não gerar retrabalho, reforço o que a leitura desta sessão confirma como implementado corretamente e
alinhado ao `CONTEXTO-ROTINA-ATENDIMENTO-ARTEC-CRM.md`:

- Cliente e oportunidade são entidades e tabelas distintas, 1:N, com `clienteId` em `Opportunity`.
- Etapa (`etapaId`), situação (`situacao`) e próxima ação (`proximaAcao`/`currentNextActionId`) são colunas
  distintas, não uma sobrepondo a outra.
- `assertActiveOpportunityHasNextAction` + CHECK de aplicação em `opportunityCreateSchema.superRefine` impedem
  oportunidade ativa sem responsável/próxima ação/data.
- Garantia, suporte e pós-venda são `Activity`, nunca `Opportunity` — a Caixa Auvo e a ficha do cliente
  respeitam essa separação.
- Webhook Auvo nunca cria oportunidade automaticamente — toda resolução da Caixa Auvo passa por ação humana
  explícita (`resolveAuvoInboxItem`).
- Valores são tratados como comerciais: nenhuma tela usa "faturamento/receita/caixa/recebido".
- Perda exige motivo (CHECK de banco `oportunidades_perdida_exige_motivo_check` + UI que obriga seleção).
- Aprovação exige valor + condições comerciais (formulário dedicado + payload obrigatório).
- Fixtures de teste E2E (`is_test_fixture`) são consistentemente excluídas das consultas operacionais
  (listagens, Central Comercial, relatórios).
- RBAC de vendedor restringe automaticamente a visão de próximas ações ao próprio usuário no backend; navegação
  lateral esconde corretamente itens sem permissão (Relatórios, Administração, Integração Auvo, Caixa Auvo).
- Fluxo de "concluir ação" força a criação de uma próxima ação de reposição quando a ação concluída é a
  `currentNextActionId` de uma oportunidade ativa, tanto no cliente quanto (a se confirmar) no servidor.
- Funil com drag-and-drop e rollback otimista (implementado nesta sessão, conforme contexto informado).

---

## 15. Itens desconhecidos / fora do alcance desta sessão

- Comportamento real em produção do worker/reconcile do Auvo e de notificações — não executei nada, só li
  código estático. Classificação de tudo relacionado a "roda ou não roda hoje" é inferência a partir do código,
  não observação direta de logs/produção.
- Volume real de oportunidades por cliente/funil em produção, necessário para confirmar com certeza o impacto
  prático do truncamento de 100 registros no Funil (item 4.4).
- Se existe algum cron externo (Vercel Cron fora do `vercel.json` do repo, GitHub Actions, Supabase Edge
  Function agendada, etc.) chamando `/api/notifications/reconcile` ou os scripts `npm run *:reconcile` — não
  verificável só pelo repositório de código.
- Conteúdo real dos 15 screenshots citados em `docs/AUDITORIA-ESTADO-ATUAL-ARTEC-CRM.md` — não foram
  fornecidos nesta sessão; tudo que essa auditoria anterior descreve como "visto na tela" permanece hipótese até
  ser reconfirmado visualmente, mesmo quando o código aqui dá evidência indireta de que o sintoma persiste (como
  em 1.9).
