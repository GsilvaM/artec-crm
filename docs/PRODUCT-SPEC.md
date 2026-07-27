# Artec CRM - Product Spec

## Proposito

O Artec CRM organiza a rotina comercial e de atendimento da Artec Ambientes Climatizados. O produto deve ajudar gestor, comercial e atendimento a enxergar rapidamente o que precisa de acao, preservar historico e conduzir clientes com linguagem consultiva.

O CRM nao e ERP e nao e financeiro. Valores orcados e aprovados existem para gestao comercial, nunca como caixa, recebido, faturamento ou DRE.

## Usuarios

- Gestor: acompanha gargalos, produtividade, funil, relatorios, usuarios e integracao Auvo.
- Comercial: qualifica demandas, acompanha oportunidades, envia e acompanha orcamentos, faz follow-up.
- Atendimento: cadastra clientes, registra suporte, garantia, pos-venda e faz triagem inicial.

## Jornadas Prioritarias

1. Central Comercial
   Primeira tela apos login. Deve responder: "o que precisa ser feito agora?"

2. Proximas Acoes
   Tela diaria para concluir, reagendar, cancelar e registrar resultado de follow-up.

3. Cadastro Rapido
   Criar cliente com poucos campos, detectar duplicidade por telefone, criar oportunidade e definir responsavel/proxima acao.

4. Ficha da Oportunidade
   Mostrar cliente, demanda, etapa, situacao, responsavel, valores comerciais, visitas, historico e proxima acao.

5. Ficha do Cliente
   Reunir cadastro, telefones, empresa, enderecos, equipamentos, oportunidades, atividades, garantia, suporte e pos-venda.

6. Caixa Auvo
   Triagem assistida de atendimentos vindos do Auvo. Nada deve ser classificado silenciosamente.

7. Relatorios Comerciais
   Mostrar desempenho e gargalos sem linguagem financeira.

## Regras de Negocio

- Toda oportunidade ativa exige responsavel, proxima acao e data.
- Garantia, suporte e pos-venda pertencem ao historico do cliente e nao devem criar oportunidade automaticamente.
- O sistema pode sugerir duplicidade, responsavel e proxima acao, mas nao pode mesclar clientes, aprovar, perder ou encerrar automaticamente.
- A primeira identificacao de cliente deve considerar ID Auvo, telefone normalizado, e-mail, nome e empresa.
- Clientes duplicados devem ser tratados por revisao humana.
- Perda exige motivo e preserva historico.
- Aprovacao comercial exige valor aprovado, forma de pagamento, parcelas e previsao de execucao.
- Auvo em homologacao pode receber, persistir e interpretar sinais, mas a decisao final e humana.

## Demandas Comerciais Permitidas

- instalacao
- compra de equipamento
- instalacao + compra
- manutencao corretiva
- manutencao preventiva
- higienizacao
- remocao/reinstalacao
- mudanca de endereco
- visita tecnica consultiva
- contrato/PMOC
- corporativo
- outro

Garantia, suporte e pos-venda devem ser tratados fora do funil comercial, ainda que tenham proxima acao.

## Microcopy

Preferir:

- Nova oportunidade
- Agendar proxima acao
- Registrar follow-up
- Concluir acao
- Reagendar
- Aprovar orcamento
- Marcar como perdido
- Registrar garantia
- Registrar suporte
- Abrir cliente
- Abrir oportunidade

Evitar:

- workflow
- deal
- ticket, quando atendimento resolve
- mensagens genericas
- diagnostico tecnico sem visita
- promessas de preco ou prazo sem confirmacao

## Criterios de Aceite do Produto

- O usuario entende o proximo passo ao abrir a Central Comercial.
- Nenhuma oportunidade ativa fica sem proxima acao.
- Follow-up pode ser registrado em poucos cliques.
- Cadastro rapido nao exige formulario longo.
- Garantia e suporte nao poluem o funil.
- Caixa Auvo mostra sinais, sugestoes e bloqueios de decisao.
- Relatorios usam linguagem comercial, nao financeira.
- RBAC e auditoria continuam no backend.
