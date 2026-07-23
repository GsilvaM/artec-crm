# Contexto operacional da Artec para o desenvolvimento do CRM

> Documento de contexto para Claude Code, Codex ou outro agente responsável por desenvolver, refatorar e concluir o Artec CRM.
>
> Este material descreve **como a Artec realmente trabalha**, como os atendentes conduzem clientes e quais partes do sistema precisam receber mais atenção de UX. Ele não substitui `AGENTS.md`, `CLAUDE.md`, `docs/PRODUCT-SPEC.md`, `docs/DESIGN-SYSTEM.md` ou as demais regras técnicas do repositório. Deve ser lido junto com esses arquivos.
>
> Não incluir credenciais, senhas, tokens, connection strings, JWTs, chaves do Supabase ou segredos do Auvo neste documento, no código, em logs, commits ou fixtures.

---

## 1. Objetivo do CRM

O Artec CRM existe para transformar a rotina comercial e de atendimento da Artec Ambientes Climatizados em um fluxo organizado, rastreável e fácil de operar.

O sistema precisa:

- reduzir esquecimentos;
- deixar a próxima ação sempre evidente;
- organizar clientes e múltiplas oportunidades por cliente;
- facilitar follow-ups;
- controlar visitas, orçamentos, aprovações e perdas;
- registrar garantia, suporte e pós-venda sem confundir com venda;
- permitir que gestor, vendedor e atendimento saibam o que fazer agora;
- preservar histórico e auditoria;
- integrar futuramente a entrada de atendimentos do Auvo;
- medir desempenho comercial por período.

O CRM **não é ERP** e **não é financeiro**.

Não implementar:

- contas a pagar;
- contas a receber;
- fluxo de caixa;
- DRE;
- faturamento;
- baixa de pagamentos;
- cobrança;
- conciliação;
- movimentações financeiras;
- vínculos com o Artec Gestão.

Valores orçados e aprovados existem somente para análise comercial.

---

## 2. A empresa e a proposta de valor

A Artec Ambientes Climatizados atende principalmente a Grande Vitória/ES, com atuação residencial e empresarial.

Principais serviços:

- instalação de split, hi-wall e cassete;
- venda de equipamentos;
- manutenção preventiva;
- manutenção corretiva;
- higienização e limpeza;
- remoção e reinstalação;
- mudança de endereço;
- visita técnica consultiva;
- adequação de infraestrutura;
- atendimento de garantia;
- suporte;
- pós-venda;
- PMOC e contratos corporativos, quando aplicável.

A Artec não deve ser apresentada como uma empresa que apenas “instala ar-condicionado”.

A proposta é vender:

- conforto;
- segurança técnica;
- saúde respiratória;
- economia de energia;
- durabilidade do equipamento;
- proteção do patrimônio;
- acabamento;
- limpeza;
- pontualidade;
- tranquilidade;
- redução de risco;
- solução correta sem improviso.

O atendimento comercial deve funcionar como consultoria. O atendente não é um “tirador de pedido”; ele ajuda o cliente a entender o problema, organiza as informações e conduz para o próximo passo correto.

---

## 3. Pessoas e papéis na rotina

### Frederick / Fred

- gestor e diretor técnico;
- principal consultor técnico;
- realiza ou conduz visitas técnicas;
- define escopo, viabilidade, critérios técnicos e diretrizes;
- participa de vendas e negociações que exigem maior avaliação técnica.

### Thales

- operador comercial principal;
- responde leads e clientes;
- qualifica;
- registra contexto;
- organiza próxima ação;
- conduz follow-up;
- confirma agendamentos;
- mantém o CRM atualizado.

### Gustavo

- operador comercial;
- segue o mesmo playbook;
- deve usar linguagem breve, natural e consultiva;
- evita parecer robótico ou excessivamente vendedor.

### Atendimento

Pode atuar em:

- cadastro e localização de clientes;
- triagem inicial;
- garantia;
- suporte;
- pós-venda;
- entrada futura do Auvo;
- organização de informações para o comercial.

### Gestor

Precisa visualizar:

- tudo que está vencido;
- produtividade;
- oportunidades paradas;
- distribuição por responsável;
- valores orçados/aprovados;
- gargalos;
- auditoria;
- integração Auvo;
- usuários e configurações.

---

## 4. Princípios do atendimento

O atendimento da Artec deve ser:

- humano;
- rápido;
- curto;
- consultivo;
- seguro;
- sem pressão;
- orientado a próximo passo;
- tecnicamente responsável;
- natural para WhatsApp;
- claro para o cliente.

Sempre priorizar:

1. entender a demanda;
2. coletar somente os dados necessários;
3. evitar diagnóstico por mensagem;
4. conduzir para visita técnica quando necessário;
5. combinar o próximo passo;
6. registrar a próxima ação no CRM;
7. não deixar oportunidade ativa sem acompanhamento.

Nunca:

- inventar diagnóstico;
- inventar prazo;
- inventar preço;
- prometer desconto sem autorização;
- confirmar data ou horário não definidos;
- afirmar que uma análise foi feita quando ainda não foi;
- criar pressão desnecessária;
- encerrar com frase genérica;
- abandonar um lead sem próxima ação;
- criar oportunidade para garantia ou suporte automaticamente.

---

## 5. Fluxo geral de trabalho

### Etapa 1 — Entrada do contato

O contato pode chegar por:

- WhatsApp;
- telefone;
- indicação;
- site;
- redes sociais;
- Google;
- e-mail;
- Auvo, futuramente;
- retorno de cliente antigo.

A primeira tarefa do CRM é localizar possíveis duplicidades por:

1. ID externo do Auvo, quando existir;
2. telefone normalizado;
3. e-mail;
4. nome e empresa como sugestão.

O sistema nunca deve mesclar clientes automaticamente.

O atendente precisa enxergar rapidamente:

- quem é o cliente;
- se já existe histórico;
- se há oportunidades abertas;
- se já houve garantia ou suporte;
- qual foi o último contato;
- qual é a próxima ação.

### Etapa 2 — Classificação da demanda

A demanda deve ser classificada com poucas opções claras:

- instalação;
- compra de equipamento;
- instalação + compra;
- manutenção corretiva;
- manutenção preventiva;
- higienização;
- remoção/reinstalação;
- mudança de endereço;
- visita técnica consultiva;
- garantia;
- suporte;
- pós-venda;
- contrato/PMOC;
- corporativo;
- outro.

Essa classificação não deve criar etapas de funil demais.

### Etapa 3 — Qualificação

O atendente coleta somente informações úteis para decidir o próximo passo.

Campos comuns:

- quantidade de equipamentos;
- tipo do aparelho;
- marca;
- modelo;
- BTUs;
- se o cliente já possui o equipamento;
- cidade e bairro;
- endereço quando necessário;
- infraestrutura existente;
- tubulação;
- dreno;
- elétrica;
- sintomas;
- urgência;
- acesso;
- condomínio;
- fotos ou vídeos, quando úteis;
- melhor período;
- origem do lead;
- responsável.

A interface deve permitir qualificação progressiva. O formulário inicial não pode ser longo e cansativo.

### Etapa 4 — Definição do próximo passo

Possíveis próximos passos:

- solicitar fotos;
- solicitar modelo/etiqueta;
- confirmar cidade/bairro;
- agendar visita técnica;
- preparar orçamento;
- enviar orçamento;
- aguardar cliente;
- aguardar condomínio;
- aguardar fornecedor;
- aguardar análise técnica;
- confirmar visita;
- retomar em data combinada;
- registrar garantia;
- registrar suporte;
- encerrar como não comercial.

Toda oportunidade ativa deve ter:

- responsável;
- próxima ação;
- data e horário.

---

## 6. Fluxo por tipo de demanda

### 6.1 Instalação ou compra de equipamento

Perguntas iniciais:

- quantos aparelhos;
- quantos BTUs;
- qual modelo;
- já possui o equipamento ou quer comprar;
- cidade e bairro;
- existe tubulação;
- existe dreno;
- existe ponto elétrico;
- qual é o tipo de ambiente;
- condomínio possui regras ou área técnica.

Quando faltar informação técnica, a prioridade é conduzir para visita técnica consultiva.

A visita deve avaliar:

- local ideal;
- capacidade adequada;
- tubulação;
- dreno;
- elétrica;
- posição da condensadora;
- acabamento;
- acesso;
- segurança;
- regras do condomínio;
- materiais;
- mão de obra;
- viabilidade.

O CRM precisa permitir:

- registrar todos os equipamentos;
- registrar ambientes;
- registrar infraestrutura;
- anexar ou referenciar fotos;
- criar tarefa para visita;
- gerar resumo técnico/comercial;
- criar orçamento;
- acompanhar aprovação;
- registrar previsão de execução.

### 6.2 Manutenção corretiva: “não gela”, vazamento ou falha

O atendente deve perguntar brevemente:

- tipo/modelo;
- BTUs, quando souber;
- se liga normalmente;
- se faz barulho;
- se pinga;
- se desliga;
- quando começou;
- cidade/bairro.

Não passar preço médio do serviço antes do diagnóstico.

Em casos de gás ou vazamento:

- explicar que é necessário diagnosticar;
- não tratar carga de gás como solução automática;
- verificar causa;
- quando necessário, levar condensadora para oficina;
- realizar testes adequados, inclusive água e vácuo quando aplicável.

O sistema deve destacar:

- risco de diagnóstico incompleto;
- necessidade de visita;
- sintomas;
- histórico do equipamento;
- garantia;
- próxima ação técnica.

### 6.3 Higienização e limpeza

Registrar:

- tipo de aparelho;
- quantidade;
- localização;
- acesso;
- histórico de limpeza;
- sintomas de sujeira/odor;
- necessidade de desmontagem;
- possibilidade de retirada.

Quando houver objeção de preço, o atendente explica brevemente que o serviço inclui cuidado técnico, produtos adequados, desmontagem quando aplicável, preservação do equipamento e qualidade do ar.

### 6.4 Ar-condicionado de janela — ACJ

Quando houver retirada em Vitória ou região atendida:

- preferir retirada pela manhã;
- tentar limpar na oficina;
- devolver e reinstalar no mesmo dia, quando viável.

Quando a limpeza for no local:

- avaliar funcionamento;
- acesso;
- segurança;
- necessidade de visita técnica prévia.

O CRM deve permitir marcar:

- “retirada pela manhã”;
- “oficina”;
- “tentativa de devolução no mesmo dia”;
- acesso;
- dimensões;
- necessidade de apoio.

### 6.5 Remoção, reinstalação ou mudança de endereço

Registrar:

- endereço de retirada;
- endereço de instalação;
- andar;
- elevador;
- acesso;
- quantidade;
- equipamentos;
- infraestrutura no novo local;
- necessidade de transporte;
- janela de horário;
- riscos de acesso.

A interface precisa aceitar múltiplos endereços dentro da mesma oportunidade.

### 6.6 Garantia, suporte e pós-venda

Esses casos pertencem ao histórico do cliente.

Não criar oportunidade automaticamente.

Registrar:

- cliente;
- aparelho;
- modelo;
- nota fiscal;
- data da compra/instalação;
- fabricante;
- instalador responsável;
- sintoma;
- fotos;
- código de erro;
- próxima ação;
- responsável;
- prazo de retorno.

Quando o aparelho é novo ou está em garantia:

- orientar inicialmente o cliente a contatar o instalador responsável, quando aplicável;
- evitar ações que possam comprometer garantia;
- acionar fabricante quando necessário;
- a Artec pode atender como autorizada Elgin, conforme o caso.

### 6.7 Atendimento corporativo / B2B / PMOC

Antes de pedir proposta formal por e-mail, coletar no WhatsApp:

- empresa;
- contato;
- cidade/bairro;
- quantidade de equipamentos;
- marcas/modelos;
- tipo de serviço;
- periodicidade;
- unidades/endereço;
- urgência;
- necessidade documental;
- responsável pela aprovação.

Depois, conduzir para:

- visita;
- levantamento;
- proposta;
- documentos;
- contrato;
- programação.

O CRM precisa permitir:

- múltiplos locais;
- vários equipamentos;
- contatos da empresa;
- documentos solicitados;
- decisores;
- prazo de proposta;
- acompanhamento por responsável.

### 6.8 Fora da área principal

Para locais fora da Grande Vitória:

- solicitar fotos e vídeos;
- avaliar viabilidade antes de deslocar;
- registrar distância;
- não prometer atendimento imediato;
- decidir se haverá visita.

---

## 7. Visita técnica

A Visita Técnica Consultiva é um ponto central da experiência Artec.

Ela não deve parecer cobrança isolada ou barreira. Ela serve para:

- reduzir erro;
- definir escopo;
- transmitir confiança;
- explicar alternativas;
- proteger cliente e empresa;
- gerar orçamento correto.

Valor padrão informado quando o cliente pergunta diretamente:

- R$ 150,00.

Pode existir política de isenção mediante avaliação sincera no Google, conforme diretriz comercial vigente.

A visita costuma durar cerca de 15–20 minutos em demandas simples de diagnóstico, podendo variar conforme complexidade.

O CRM deve ter fluxo de visita com:

- data;
- horário;
- responsável técnico;
- endereço;
- contato;
- demanda;
- equipamentos;
- acesso;
- observações;
- status;
- confirmação;
- conclusão;
- resultado;
- próximos passos.

A confirmação deve ser simples e objetiva.

Exemplo de microcopy interna:

- “Visita confirmada”
- “Aguardando confirmação”
- “Reagendar visita”
- “Registrar resultado”
- “Gerar orçamento”
- “Criar próxima ação”

---

## 8. Orçamento e negociação

Após visita ou avaliação:

1. registrar escopo;
2. preparar orçamento;
3. enviar;
4. registrar data de envio;
5. criar próxima ação;
6. acompanhar percepção do cliente;
7. esclarecer dúvida;
8. aprovar, perder ou pausar.

Follow-up de orçamento não deve perguntar apenas “conseguiu abrir?”.

Preferir:

- “O que achou do orçamento?”
- “Faz sentido para você?”
- “Ficou alguma dúvida sobre o escopo, valores ou condição?”
- “Como ficou por aí?”

Condições comerciais usuais:

- 5% de desconto à vista;
- cartão em até 3x sem juros;
- Pix;
- cartão.

Ao aprovar, o CRM deve exigir:

- valor aprovado;
- forma de pagamento;
- quantidade de parcelas;
- previsão de execução.

Essas informações são comerciais, não financeiras.

---

## 9. Follow-up

Follow-up é uma das ações mais frequentes do sistema.

O atendente precisa conseguir:

- ver vencidos;
- ver ações de hoje;
- concluir;
- reagendar;
- registrar resultado;
- criar próxima ação no mesmo fluxo;
- abrir contexto do cliente;
- abrir oportunidade;
- copiar telefone;
- registrar observação.

Resultados úteis:

- cliente respondeu;
- sem retorno;
- aguardando cliente;
- nova data combinada;
- orçamento aprovado;
- oportunidade perdida;
- outro.

O resultado não deve aprovar ou perder automaticamente. O usuário deve confirmar a ação comercial.

### Tom do follow-up

- curto;
- sem cobrança;
- contextual;
- baseado na última conversa;
- com pergunta objetiva.

Exemplos de direção:

- “Passando só para dar continuidade…”
- “Como ficou por aí?”
- “Você comentou que retornaria de viagem hoje. Qual dia fica melhor para programarmos os próximos passos?”
- “Lembrei da nossa última conversa e estou passando só para saber como está o andamento por aí. O condomínio já deu início na instalação da área técnica?”
- “Acredito que essa demanda já deve ter avançado por aí. Ou continuam precisando de alguma assistência na área de climatização?”

Evitar:

- “Conseguiu resolver?” de forma seca;
- “Se ainda fizer sentido, seguimos à disposição…”;
- mensagens longas;
- pressão;
- tom de cobrança;
- reapresentação desnecessária em conversa já existente.

Quando o cliente assume que retornará:

- encerrar de forma simples;
- pode usar apenas 🤝🏽 ou 👍🏽;
- não criar nova condução verbal desnecessária.

---

## 10. Situações e etapas

Etapa, situação e próxima ação são conceitos diferentes.

### Etapas do funil

1. Novo lead
2. Em atendimento
3. Visita ou avaliação
4. Orçamento em elaboração
5. Orçamento enviado
6. Negociação
7. Aprovado
8. Concluído

Saídas:

- Pausado
- Perdido

### Situações

Exemplos:

- Em andamento
- Aguardando cliente
- Aguardando Frederick
- Aguardando visita
- Aguardando orçamento
- Aguardando fornecedor
- Aguardando condomínio
- Aguardando obra
- Aguardando área técnica
- Sem retorno
- Agendado
- Pausado

A situação explica o contexto atual. Não deve virar coluna do funil.

### Próxima ação

Exemplos:

- Retornar ao cliente
- Solicitar fotos
- Confirmar visita
- Preparar orçamento
- Enviar orçamento
- Acompanhar decisão
- Confirmar execução
- Solicitar nota fiscal
- Aguardar análise técnica

Toda oportunidade ativa precisa de uma próxima ação válida.

---

## 11. Perda, pausa e sem retorno

Ao marcar como perdida:

- exigir motivo;
- registrar observação;
- registrar data;
- registrar usuário;
- preservar histórico.

Motivos úteis:

- preço;
- escolheu concorrente;
- desistiu;
- sem orçamento;
- sem disponibilidade;
- problema resolvido;
- fora da área;
- sem retorno;
- obra adiada;
- condomínio não aprovou;
- equipamento não adquirido;
- outro.

Leads sem retorno não devem poluir o funil indefinidamente.

Registrar:

- quantidade de tentativas;
- datas;
- mensagens;
- última interação;
- próxima tentativa;
- momento de arquivar ou nutrir.

---

## 12. Pós-aprovação e execução

Depois da aprovação:

- confirmar escopo;
- confirmar condição;
- registrar previsão de execução;
- agendar;
- informar equipe;
- preservar observações de acesso;
- criar resumo operacional;
- acompanhar conclusão.

Resumo interno para equipe deve conter:

- nome do cliente;
- serviço;
- endereço/bairro;
- quantidade de aparelhos;
- marca/modelo/BTUs;
- o que será feito;
- acesso;
- horário;
- materiais;
- pontos comerciais;
- pontos técnicos;
- contatos;
- observações.

Depois da execução:

- registrar conclusão;
- registrar resultado;
- registrar pendências;
- criar pós-venda;
- registrar garantia;
- solicitar avaliação quando fizer sentido.

---

## 13. Linguagem e microcopy do CRM

A interface deve usar português do Brasil natural.

Preferir:

- Nova oportunidade
- Agendar próxima ação
- Registrar follow-up
- Concluir ação
- Reagendar
- Aprovar orçamento
- Marcar como perdido
- Arquivar
- Limpar filtros
- Abrir cliente
- Abrir oportunidade
- Registrar garantia
- Registrar suporte
- Criar visita
- Enviar orçamento
- Aguardando cliente
- Aguardando visita
- Dar andamento
- Deixar tudo alinhado
- Programar próximos passos

Evitar:

- linguagem jurídica;
- frases excessivamente formais;
- textos genéricos;
- “workflow” quando “fluxo” resolve;
- “ticket” quando “atendimento” é mais claro;
- “deal” quando “oportunidade” é adequado;
- “lead frio” sem contexto;
- mensagens de erro vagas.

Exemplo de erro útil:

> Defina a próxima ação e a data antes de manter esta oportunidade ativa.

---

## 14. O que os atendentes mais usam

O frontend deve priorizar, nesta ordem:

### 14.1 Central Comercial

Primeira tela após login.

Deve mostrar:

- ações vencidas;
- ações de hoje;
- visitas;
- orçamentos aguardando retorno;
- oportunidades sem próxima ação;
- oportunidades paradas;
- notificações;
- Caixa Auvo;
- resumo comercial.

O objetivo é responder:

> O que precisa ser feito agora?

### 14.2 Próximas Ações

Tela de uso diário intenso.

Precisa ser rápida para:

- filtrar;
- concluir;
- reagendar;
- cancelar;
- criar ação seguinte;
- abrir cliente;
- abrir oportunidade;
- registrar resultado.

### 14.3 Ficha da Oportunidade

Deve mostrar de forma clara:

- cliente;
- demanda;
- etapa;
- situação;
- responsável;
- valor;
- orçamento;
- próxima ação;
- prazo;
- histórico;
- visitas;
- atividades;
- aprovação;
- perda.

Não esconder a próxima ação.

### 14.4 Ficha do Cliente

Deve reunir:

- cadastro;
- telefones;
- empresa;
- endereços;
- equipamentos;
- oportunidades;
- atividades;
- garantia;
- suporte;
- pós-venda;
- documentos;
- última interação;
- próxima ação.

### 14.5 Cadastro rápido

Precisa permitir:

- criar cliente com poucos campos;
- detectar telefone duplicado;
- continuar com confirmação;
- criar oportunidade;
- já definir responsável;
- já definir próxima ação.

### 14.6 Funil

O kanban é importante, mas não pode ser a única visão.

Cada cartão deve mostrar:

- cliente;
- demanda;
- etapa;
- situação;
- responsável;
- valor;
- próxima ação;
- data;
- atraso.

### 14.7 Notificações

Notificar somente o que exige ação:

- follow-up vencido;
- ação próxima do prazo;
- oportunidade atribuída;
- oportunidade sem ação;
- erro de integração.

Não notificar cada edição.

### 14.8 Caixa Auvo

Quando os payloads reais forem mapeados:

- criar oportunidade;
- vincular oportunidade;
- garantia;
- suporte;
- pós-venda;
- cadastrar cliente;
- não comercial;
- duplicado.

Nada deve ser classificado silenciosamente.

---

## 15. Requisitos de UX

A interface deve ser:

- colorida, mas profissional;
- agradável para uso prolongado;
- fluida;
- rápida;
- responsiva;
- acessível;
- desktop-first;
- boa em tablet e celular;
- densa sem parecer confusa.

Priorizar:

- ações em um ou dois cliques;
- filtros persistentes;
- busca global;
- atalhos;
- drawers para edição rápida;
- formulários curtos;
- autocomplete;
- skeleton;
- estados vazios;
- mensagens úteis;
- confirmação de ações destrutivas;
- teclado;
- foco visível;
- contraste;
- feedback imediato.

Evitar:

- cartões gigantes;
- excesso de modais;
- excesso de gradiente;
- cores sem significado;
- menus de três pontos para ações frequentes;
- formulário enorme;
- aparência de planilha improvisada;
- kanban como única visão;
- excesso de animações.

---

## 16. Informações e campos prioritários

### Cliente

- nome;
- tipo de pessoa;
- telefone;
- telefone normalizado;
- e-mail;
- documento;
- empresa;
- bairro;
- cidade;
- estado;
- endereços;
- observações;
- origem;
- tags;
- ID Auvo;
- ativo/arquivado.

### Equipamento

- tipo;
- marca;
- modelo;
- BTUs;
- tensão;
- ambiente;
- número de série;
- data de instalação;
- garantia;
- observações.

### Oportunidade

- cliente;
- título;
- demanda;
- origem;
- descrição;
- responsável;
- etapa;
- situação;
- valor estimado;
- valor orçado;
- valor aprovado;
- forma de pagamento;
- parcelas;
- previsão de execução;
- motivo de perda;
- próxima ação;
- data;
- prioridade.

### Atividade

- tipo;
- cliente;
- oportunidade opcional;
- descrição;
- autor;
- data;
- origem.

### Próxima ação

- título;
- categoria;
- responsável;
- vencimento;
- prioridade;
- status;
- resultado;
- reagendamento;
- cancelamento.

### Visita

- cliente;
- oportunidade;
- endereço;
- data;
- horário;
- técnico;
- confirmação;
- acesso;
- equipamentos;
- objetivo;
- resultado.

---

## 17. Regras de automação

Automação pode:

- sugerir cliente duplicado;
- sugerir responsável;
- sugerir próxima ação;
- alertar atraso;
- alertar oportunidade sem ação;
- preencher dados confiáveis do Auvo;
- gerar resumo;
- criar lembrete;
- calcular tempo na etapa;
- destacar oportunidade parada.

Automação não pode:

- aprovar;
- perder;
- encerrar;
- classificar garantia como venda;
- criar oportunidade por webhook;
- mesclar cliente;
- diagnosticar tecnicamente;
- prometer preço;
- mover silenciosamente o funil.

---

## 18. Relatórios comerciais

Métricas:

- novos leads;
- oportunidades criadas;
- oportunidades por etapa;
- valor orçado;
- valor aprovado;
- aprovações;
- perdas;
- conversão;
- ticket médio aprovado;
- origem;
- serviços procurados;
- motivos de perda;
- tempo até orçamento;
- tempo até aprovação;
- follow-ups vencidos;
- follow-ups realizados;
- recuperação por follow-up;
- produtividade por responsável;
- tempo de triagem Auvo.

Nunca mostrar valor aprovado como:

- faturamento;
- receita;
- recebido;
- caixa.

---

## 19. Critérios de sucesso do app

O app está adequado à rotina da Artec quando:

- o atendente entra e entende imediatamente o que fazer;
- nenhum lead ativo fica sem próxima ação;
- o histórico é confiável;
- a ficha do cliente mostra todo o relacionamento;
- garantia e suporte não poluem o funil;
- o follow-up é rápido;
- o agendamento é claro;
- a visita técnica fica organizada;
- o orçamento tem acompanhamento;
- o gestor enxerga gargalos;
- o sistema é agradável para uso diário;
- a linguagem parece Artec;
- o backend protege RBAC;
- o banco preserva auditoria;
- o CRM continua independente do financeiro.

---

## 20. Instrução para Claude Code

Antes de implementar ou refatorar qualquer tela:

1. leia este documento;
2. leia `AGENTS.md`;
3. leia `CLAUDE.md`;
4. leia `docs/PRODUCT-SPEC.md`;
5. leia `docs/DESIGN-SYSTEM.md`;
6. leia `docs/DEVELOPMENT-STATUS.md`;
7. audite o estado real do repositório;
8. preserve as regras já implementadas;
9. não invente fluxos;
10. priorize as áreas de uso diário dos atendentes;
11. valide backend, banco, RBAC, testes e interface;
12. não faça commit ou push sem autorização explícita.

A implementação deve refletir o trabalho real da Artec, e não apenas copiar a aparência de outro CRM.
