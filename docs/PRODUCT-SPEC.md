# Artec CRM — Especificação do produto

## 1. Visão

O Artec CRM é um sistema comercial independente para organizar leads, clientes, oportunidades, orçamentos, follow-ups e histórico de relacionamento da Artec Ambientes Climatizados.

Ele fica em repositório/projeto independente do `artec-gestao`, sem integração financeira e sem dependência de runtime com o sistema existente.

## 2. Problema a resolver

Hoje grande parte do processo comercial acontece dentro das conversas do WhatsApp/Auvo. Isso dificulta saber:

- quem precisa de retorno;
- qual é a próxima ação;
- há quanto tempo um lead está parado;
- quais orçamentos aguardam decisão;
- quais oportunidades foram aprovadas ou perdidas;
- quais motivos causam perda;
- qual origem traz melhores oportunidades;
- se garantia e suporte foram acompanhados sem poluir o funil.

## 3. Resultado esperado

Ao abrir o sistema, o usuário deve entender em poucos segundos:

1. o que está atrasado;
2. o que precisa ser feito hoje;
3. quais novos atendimentos do Auvo aguardam triagem;
4. quais orçamentos aguardam envio ou retorno;
5. quais oportunidades estão sem próxima ação;
6. como está o pipeline do período.

## 4. Conceitos do domínio

### Cliente

Pessoa física ou empresa com dados de contato e histórico. Pode existir sem oportunidade e ter várias oportunidades ao longo do tempo.

### Oportunidade

Demanda comercial específica, como instalação, venda de equipamento, manutenção, higienização, remoção/reinstalação ou contrato corporativo.

### Etapa

Posição no funil comercial.

### Situação

Condição atual que explica a espera ou andamento, sem alterar a etapa.

### Próxima ação

Ação concreta, com responsável e data, necessária para a oportunidade continuar avançando.

### Atividade

Registro do que já aconteceu: mensagem, ligação, visita, envio de orçamento, observação ou alteração de etapa.

### Garantia/suporte

Atendimento vinculado ao histórico do cliente, com tarefas próprias, mas sem oportunidade, pipeline ou valor comercial.

## 5. Central Comercial

Blocos prioritários:

- Follow-ups vencidos
- Ações para hoje
- Novos atendimentos Auvo
- Oportunidades sem próxima ação
- Visitas e compromissos de hoje
- Orçamentos aguardando envio
- Orçamentos aguardando resposta
- Leads parados além do limite
- Resumo do mês

Cada bloco deve permitir ir diretamente ao item e executar a ação.

## 6. Funil

Etapas padrão:

1. Novo lead
2. Em atendimento
3. Visita ou avaliação
4. Orçamento em elaboração
5. Orçamento enviado
6. Negociação
7. Aprovado
8. Concluído

Estados laterais:

- Pausado
- Perdido

O administrador poderá ajustar nomes, cores discretas, ordem e SLA das etapas futuramente, preservando o histórico.

## 7. Card da oportunidade

Informações essenciais:

- cliente;
- tipo de demanda;
- bairro/cidade, quando disponível;
- valor orçado ou aprovado;
- responsável;
- tempo na etapa;
- situação;
- próxima ação e data;
- indicador de atraso;
- origem.

Ações rápidas:

- registrar contato;
- concluir/reagendar próxima ação;
- avançar etapa;
- enviar para aprovado;
- pausar;
- marcar perdido;
- abrir detalhes.

## 8. Cliente e linha do tempo

A ficha do cliente deve reunir:

- dados cadastrais;
- oportunidades ativas e anteriores;
- orçamentos;
- atividades;
- garantia, suporte e pós-venda;
- atendimentos vinculados do Auvo;
- anexos e observações;
- tags.

A linha do tempo é cronológica, filtrável e auditável.

## 9. Orçamentos

Uma oportunidade pode ter várias versões de orçamento.

Campos mínimos:

- número/identificador interno;
- valor;
- data de envio;
- versão;
- observação;
- status: rascunho, enviado, revisado, aprovado, recusado, expirado;
- anexo ou link, quando existir.

Ao marcar “Orçamento enviado”, exigir valor e data de envio. Ao aprovar, exigir valor aprovado, forma de pagamento, parcelas e previsão de execução.

## 10. Perda

Ao marcar perdido, exigir motivo. Seed inicial:

- preço;
- sem retorno;
- fechou com concorrente;
- adiou a demanda;
- problema resolvido;
- fora da área atendida;
- sem perfil;
- inviabilidade técnica;
- outro.

Permitir reabrir com auditoria.

## 11. Busca e filtros

Busca global por:

- nome;
- telefone;
- empresa;
- descrição;
- ID externo do Auvo.

Filtros:

- responsável;
- etapa;
- situação;
- origem;
- tipo de serviço;
- cidade/bairro;
- próxima ação;
- atrasados;
- período;
- valor;
- tags.

Filtros usados com frequência devem poder ser salvos futuramente.

## 12. Fora de escopo

- contas a pagar ou receber;
- fluxo de caixa;
- DRE;
- emissão fiscal;
- cobrança;
- baixa de pagamento;
- sincronização com o financeiro;
- ordens de serviço completas;
- cópia integral das conversas do WhatsApp;
- envio de mensagens pelo CRM no MVP;
- automação de venda baseada em IA sem confirmação humana.
