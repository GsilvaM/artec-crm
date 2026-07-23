# Auditoria integral do estado atual — Artec CRM

## 1. Escopo e evidências

Esta auditoria compara:

- 15 screenshots atuais do Artec CRM, em viewports entre 1908×872 e 1919×943 px;
- o PDF do Venture CRM Dashboard UI Kit, com 15 páginas;
- o documento `ANALISE-PIXEL-A-PIXEL-VENTURE-DESIGN-SYSTEM.md`;
- a rotina real de atendimento e venda da Artec;
- padrões de produtos comerciais consolidados, especialmente HubSpot, Pipedrive, Attio, Close e Salesforce;
- sintomas visíveis da integração Auvo;
- regras já definidas para o projeto.

A auditoria visual é baseada no que está efetivamente visível. As conclusões de backend estão classificadas em:

- **evidência visual**: comprovada pelas screenshots;
- **forte indício**: comportamento visível que exige confirmação no código, banco e logs;
- **hipótese a verificar**: não deve ser tratada como fato até a auditoria técnica.

## 2. Conclusão executiva

O sistema atual já possui rotas, entidades, autenticação, RBAC, tabelas, kanban, notificações, Caixa Auvo e telas administrativas. O problema principal não é ausência de páginas: é a falta de uma camada coerente de produto.

Hoje o CRM apresenta quatro falhas combinadas:

1. **A interface ainda é um painel administrativo genérico.**
2. **Dados de teste e dados técnicos vazam para a operação.**
3. **As páginas não traduzem a lógica comercial da Artec.**
4. **O webhook Auvo parece armazenar eventos, mas ainda não os transforma em informação operacional limpa.**

O projeto não deve receber outra “rodada cosmética”. A próxima refatoração precisa atuar simultaneamente em:

- modelo de dados operacional;
- pipeline de normalização do Auvo;
- higiene de dados;
- arquitetura de informação;
- design system;
- componentes;
- páginas;
- testes;
- observabilidade.

## 3. Auditoria pixel a pixel do shell atual

### 3.1 Viewports analisados

| Superfície | Dimensão observada |
|---|---:|
| Login | 1918×909 |
| Central Comercial, topo | 1916×897 |
| Central Comercial, continuação | 1914×904 |
| Funil escuro | 1919×907 |
| Clientes escuro | 1918×909 |
| Oportunidades escuro | 1919×906 |
| Próximas ações escuro | 1917×909 |
| Notificações escuro | 1918×556 |
| Caixa Auvo escuro | 1915×907 |
| Administração clara | 1908×872 |
| Integração Auvo clara | 1918×934 |
| Funil claro | 1913×940 |
| Clientes claro | 1909×940 |
| Oportunidades claro | 1916×943 |
| Próximas ações clara | 1915×915 |

### 3.2 Sidebar

Medições aproximadas extraídas das screenshots:

- largura no conjunto escuro: 203–204 px;
- largura no conjunto claro: 214–216 px;
- o Venture propõe sidebar expandida próxima de 248 px e rail compacta de 64 px;
- o item ativo possui cerca de 170–180 px de largura;
- o conteúdo começa a aproximadamente 220–230 px da borda esquerda.

Problemas:

- os itens inativos no modo claro têm contraste tão baixo que parecem desabilitados;
- a hierarquia entre grupos é fraca;
- a marca é pequena e sem presença;
- não existe colapso funcional evidente;
- falta footer de workspace/usuário;
- o item ativo é um retângulo escuro pesado, desconectado do restante;
- a largura muda entre screenshots, indicando inconsistência de layout ou captura;
- o menu não comunica prioridade operacional;
- a sidebar não se aproxima da anatomia da página 9 do Venture.

Direção:

- largura desktop de 232–248 px;
- modo recolhido de 64 px;
- grupos “Operação”, “Acompanhamento” e “Configurações”;
- labels com 14 px e contraste normal;
- ativo com superfície semântica, borda lateral ou destaque de marca;
- footer com usuário/workspace;
- drawer no mobile;
- ícones Phosphor consistentes.

### 3.3 Topbar

Estado atual:

- altura visual estimada em 48–54 px;
- busca ocupa quase toda a largura;
- conta, sino e sair ficam comprimidos à direita;
- page title fica separado abaixo;
- no modo escuro, a topbar parece apenas uma linha de inputs.

Problemas:

- pouca hierarquia;
- busca excessivamente dominante;
- ações globais e ações da página não são diferenciadas;
- ausência de breadcrumb/contexto;
- shortcut “Ctrl K” é mostrado, mas a busca não parece um verdadeiro command/search experience;
- perfil é tratado como botão textual longo;
- “Sair” recebe peso visual semelhante a ações de trabalho.

Direção inspirada na página 10 do Venture:

- primeira linha: busca global, ajuda/opções, notificações e perfil;
- segunda linha: título, view switcher, filtros, ordenação e CTA;
- altura aproximada: 64–72 px na linha global e 52–64 px na toolbar da página;
- botão sair dentro do menu de perfil;
- ações da página à direita;
- busca limitada a uma largura funcional, não 100% do canvas.

### 3.4 Tema escuro

Cores dominantes observadas:

- fundo principal próximo de `#141218`;
- superfícies próximas de `#121318`, `#202126`;
- bordas cinza em praticamente todos os containers;
- texto branco e cinzas claros;
- ação primária lilás acinzentada.

Problemas:

- fundo quase preto em toda a interface;
- superfícies pouco diferenciadas;
- excesso de bordas;
- contraste de hierarquia insuficiente;
- uso de cor concentrado em erros;
- sensação de sistema técnico e hostil;
- cards se misturam;
- campos, tabelas e containers têm peso quase idêntico.

Direção:

- tema claro como padrão operacional;
- dark mode opcional, construído com tokens semânticos;
- fundo escuro azul-cinza, não preto puro;
- superfícies em pelo menos três níveis;
- borda apenas quando necessária;
- cor semântica para prioridade, etapa, sucesso, aviso e erro;
- cards com espaço, header e agrupamento, não apenas retângulos.

### 3.5 Tema claro

Pontos positivos:

- legibilidade geral melhor;
- aproximação maior da base clara do Venture;
- tabelas ficam menos opressivas.

Problemas:

- áreas muito brancas e vazias;
- cards e tabelas continuam sem personalidade;
- falta profundidade e agrupamento;
- formulário e tabela competem;
- ainda parece scaffold/admin panel;
- uso da cor Irish/Artec é tímido;
- nenhuma mudança estrutural significativa entre claro e escuro.

## 4. Auditoria por página

## 4.1 Login

### Estado observado

- card central de aproximadamente 420×523 px;
- fundo quase preto sem elementos de marca;
- título “Central comercial independente”;
- texto técnico: “Entre com a conta Supabase. O backend validará sua membership…”;
- campos E-mail e Senha;
- botão lilás de largura total;
- enorme área vazia.

### Problemas

- expõe tecnologia interna ao usuário;
- “membership” não é linguagem operacional;
- não explica valor do produto;
- ausência de “mostrar senha”;
- ausência de recuperação de senha;
- ausência de erro contextual;
- ausência de loading e prevenção de duplo clique visível;
- marca genérica “A”;
- não utiliza a linguagem visual do PDF;
- não usa a identidade da Artec.

### Refatoração

- remover qualquer menção a Supabase, backend e membership;
- título: “Acesse o Artec CRM”;
- subtítulo: “Organize clientes, oportunidades e próximas ações em um só lugar.”;
- logo real da Artec;
- show/hide password;
- mensagens de erro humanas;
- loading no botão;
- recuperação de acesso, se suportada;
- light e dark completos;
- layout responsivo;
- optional split panel com resumo de operação, sem exagero visual.

## 4.2 Central Comercial

### Estado observado

- painel de filtros ocupa toda a primeira dobra;
- filtros em duas linhas, dentro de um grande retângulo;
- blocos em grid 2×N;
- “Ações vencidas” e “Ações de hoje” usam cards horizontais;
- barras vermelhas/ocres ocupam quase toda a largura dos cards;
- blocos vazios têm altura desproporcional;
- “Resumo comercial” aparece pequeno no final;
- dados genéricos de homologação e E2E;
- notificações repetidas;
- raw timestamps dentro do texto.

### Problemas de UX

- não responde rapidamente “o que devo fazer agora?”;
- filtros dominam a tela;
- todas as seções têm peso semelhante;
- cards não possuem anatomia clara;
- excesso de ações repetidas;
- barras de atraso parecem progress bars, mas apenas repetem informação;
- vazios ocupam grande espaço;
- resumo comercial está escondido;
- falta responsável e contexto claros;
- falta ação guiada;
- não existe agrupamento por prioridade real;
- distribuição visual é irregular.

### Problemas de dados

- nomes “Cliente Homologação…” e IDs artificiais;
- ações futuras marcadas como atrasadas em outras telas;
- raw ISO em notificações;
- “Caixa Auvo sem atendimento” contradiz screenshots da Caixa com itens;
- forte indício de cache, filtro, endpoint ou estado de leitura inconsistente.

### Nova composição

Primeira dobra:

1. PageHeader:
   - “Central Comercial”;
   - responsável/escopo atual;
   - atualizar;
   - filtros compactos em popover/drawer.
2. Faixa de indicadores:
   - vencidas;
   - hoje;
   - visitas;
   - orçamentos aguardando retorno;
   - sem próxima ação;
   - Caixa Auvo.
3. Grid principal 8/4:
   - esquerda: fila “Prioridade agora”;
   - direita: agenda do dia + próximas visitas.
4. Grid secundário:
   - orçamentos aguardando retorno;
   - oportunidades paradas;
   - higiene do funil;
   - alertas da integração.
5. Resumo comercial com gráficos pequenos.

Cada item da fila deve mostrar:

- título da ação;
- cliente canônico;
- oportunidade;
- responsável;
- categoria;
- prazo relativo e data absoluta;
- prioridade;
- uma ação primária;
- menu de ações secundárias.

## 4.3 Funil

### Estado observado

- 7–8 colunas visíveis;
- largura aproximada de 190–220 px por coluna;
- scrollbar horizontal;
- primeira coluna com 34 registros;
- outras quase vazias;
- cards com select permanente;
- dados E2E;
- muito espaço vazio vertical;
- cor quase inexistente;
- cartões estáticos.

### Problemas

- cartões comprimidos;
- fonte pequena;
- etapa repetida no select;
- mover etapa por select é lento e visualmente pobre;
- ausência de drag-and-drop;
- nenhuma cor de etapa;
- nenhuma soma por etapa;
- ausência de owner filter;
- ausência de “rot”/oportunidade parada;
- distribuição de 34 leads na primeira coluna torna o board inútil;
- cards não mostram valor e próxima ação com clareza;
- mobile não pode usar esse modelo horizontal;
- o funil não expressa o processo real da Artec.

### Nova lógica

Etapas base:

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

Regras:

- situação não é etapa;
- próxima ação não é etapa;
- ativo sem próxima ação deve gerar alerta;
- aprovado exige valor e condições comerciais;
- perdido exige motivo;
- conclusão deve preservar histórico.

Nova UI:

- colunas de 280–320 px;
- drag-and-drop com atualização otimista e rollback;
- menu “Mover para” como alternativa acessível;
- cor semântica no header, não no card inteiro;
- card com cliente, demanda, valor, situação, owner e próxima ação;
- indicador de atraso;
- total e valor por coluna;
- quick filters;
- mobile por tabs de etapa;
- lista alternativa;
- virtualização ou paginação por coluna para volumes altos.

## 4.4 Clientes

### Estado observado

- formulário “Novo cliente” sempre aberto;
- ocupa aproximadamente 350 px de altura;
- botão de largura total;
- tabela abaixo;
- registros E2E e badges “possível duplicidade”;
- telefones sem formatação;
- nenhuma paginação visível na captura.

### Problemas

- criação compete com consulta;
- tela principal deveria priorizar localizar e operar clientes;
- registros de teste contaminam a visão;
- duplicidade aparece em massa, mas sem fluxo de resolução;
- ausência de última interação e próxima ação;
- ausência de origem;
- ausência de cidade/bairro visíveis;
- ações “Abrir” e “Arquivar” repetidas;
- formulário não é progressivo;
- falta drawer;
- falta seleção e ação em lote;
- falta máscara e normalização de telefone.

### Nova UI

- CTA “Novo cliente” abre drawer;
- busca global e filtros;
- tabela com:
  - cliente;
  - telefone formatado;
  - empresa;
  - cidade/bairro;
  - oportunidades ativas;
  - última interação;
  - próxima ação;
  - responsável;
  - ações;
- possível duplicidade abre uma comparação;
- não mesclar automaticamente;
- view de cards no mobile;
- E2E/testes isolados da operação.

## 4.5 Oportunidades

### Estado observado

- formulário completo sempre aberto;
- valores default expostos com texto “Valor padrão preenchido — ajuste se necessário”;
- oportunidade sem valor, owner ou infraestrutura visível;
- tabela com nomes E2E;
- lógica comercial insuficiente.

### Problemas

- tela mistura criar e consultar;
- defaults técnicos vazam;
- “tipo de demanda” e “situação” são inputs livres ou pouco estruturados;
- ausência de responsável obrigatório visível;
- ausência de etapa clara no formulário;
- ausência de valor estimado/orçado/aprovado;
- ausência de visita;
- ausência de origem;
- ausência de prioridade;
- ausência de qualificação progressiva;
- tabela não responde qual oportunidade exige ação.

### Nova UI

- CTA abre drawer em passos curtos:
  1. cliente e demanda;
  2. responsável, etapa e situação;
  3. próxima ação e data;
  4. dados opcionais.
- lista com filtros e views salvas;
- colunas:
  - oportunidade;
  - cliente;
  - demanda;
  - etapa;
  - situação;
  - responsável;
  - próxima ação;
  - valor comercial;
  - status;
- criar oportunidade só com próxima ação válida;
- garantia/suporte não criam oportunidade;
- ficha com timeline, visitas, orçamento e ações rápidas.

## 4.6 Próximas Ações

### Estado observado

- tabs: vencidas, hoje, próximas, concluídas, canceladas;
- tabela larga;
- três botões por linha;
- “Ação futura” aparece em vencidas;
- dados genéricos;
- sem agrupamento por horário ou responsável;
- sem fluxo guiado.

### Problemas

- possível erro de timezone/classificação;
- completar não parece encadear a próxima ação;
- excesso de botões repetidos;
- falta ações em lote;
- falta calendário/agenda;
- contexto pouco legível;
- status e categoria têm peso mínimo;
- não existe visão “Minha fila”;
- ação de contato não abre telefone/WhatsApp.

### Nova UI

- visão “Minha fila” como padrão;
- agrupamento:
  - atrasadas;
  - hoje;
  - amanhã;
  - esta semana;
  - sem data;
- modos lista e agenda;
- ação primária “Concluir”;
- ao concluir, abrir drawer:
  - resultado;
  - observação;
  - criar próxima ação;
  - aprovar/perder, se aplicável;
- ações secundárias em overflow;
- filtros por responsável, categoria, período, prioridade;
- datas em timezone do usuário;
- testes de borda para meia-noite e DST.

## 4.7 Notificações

### Estado observado

- cards largos e quase idênticos;
- notificações duplicadas;
- raw ISO timestamp dentro do corpo;
- botões “Lida”, “Adiar” e “Arquivar” repetidos;
- nenhuma origem visual clara;
- pouca diferença entre atenção e urgente.

### Problemas

- notificação replica tarefa, mas não ajuda a agir;
- duplicação gera ruído;
- mensagens técnicas;
- ausência de agrupamento por tempo;
- ausência de dedupe por assunto;
- ausência de contexto clicável;
- “Lida” é um estado e está apresentado como ação permanente;
- adiar não mostra data;
- nenhuma preferência ou categoria.

### Nova lógica

Gerar notificações somente para:

- ação vencida;
- ação próxima do prazo;
- oportunidade atribuída;
- oportunidade sem próxima ação;
- erro da integração;
- item Auvo aguardando triagem acima do SLA.

Não gerar para cada edição.

Nova UI:

- drawer compacto no sino;
- página completa com grupos “Hoje”, “Esta semana”, “Anteriores”;
- filtros: não lidas, urgentes, integração;
- item com ícone, título, contexto, tempo relativo, CTA;
- mark read no próprio item;
- snooze com data;
- dedupe por `type + entity + window`;
- linguagem humana;
- raw data apenas no painel técnico.

## 4.8 Caixa Auvo

### Estado observado

- título “Triagem de atendimentos”;
- tabs de status;
- linhas/cards largos;
- nomes “Atendimento - [nome]”;
- origem técnica `ZAPI_WHATSAPP`;
- telefone cru;
- “Cliente sugerido: Nenhum encontrado”;
- várias ações alinhadas na base;
- badge “Novo” no extremo direito;
- ausência de mensagem/conversa.

### Problemas

- item representa evento técnico, não um contato comercial;
- falta resumo da conversa;
- falta data relativa;
- telefone não formatado;
- nome canônico mal construído;
- ações demais;
- ausência de confiança do match;
- ausência de owner;
- ausência de SLA;
- nenhum detalhe de erro;
- sem split view;
- cada evento pode estar virando um item, em vez de uma sessão/contato consolidado.

### Nova UI

Split view:

- painel esquerdo: lista de itens de triagem;
- painel direito: detalhes e ações.

Lista:

- nome canônico;
- telefone formatado;
- origem “WhatsApp / Auvo”;
- último contato;
- preview da última mensagem;
- status;
- responsável;
- indicador de match.

Detalhe:

- dados normalizados;
- conversa/timeline;
- cliente sugerido;
- motivos do match;
- payload técnico recolhido e restrito a gestor;
- ações:
  - criar oportunidade;
  - vincular oportunidade;
  - cadastrar cliente;
  - garantia;
  - suporte;
  - pós-venda;
  - não comercial;
  - duplicado.

Ação primária única. Restante em menu.

## 4.9 Relatórios

### Sintoma informado

A screenshot correspondente não foi incluída de forma legível no conjunto, mas o usuário relata:

- layout sem sentido;
- ausência de gráficos;
- pouca informação relevante.

### Relatórios corretos para a Artec

Visão executiva:

- novos leads;
- oportunidades criadas;
- valor orçado;
- valor aprovado;
- conversão;
- ticket médio aprovado;
- follow-ups vencidos;
- visitas agendadas;
- tempo médio até orçamento.

Gráficos:

- funil por etapa;
- conversão entre etapas;
- tempo em cada etapa;
- oportunidades por origem;
- demandas por tipo;
- aprovação por responsável;
- motivos de perda;
- ações vencidas por responsável;
- evolução mensal;
- SLA da Caixa Auvo;
- conversão da triagem Auvo.

Não usar:

- receita;
- faturamento;
- recebido;
- caixa;
- DRE.

Permitir:

- período;
- responsável;
- origem;
- tipo de demanda;
- etapa;
- drill-down para registros.

## 4.10 Administração

### Estado observado

- tema claro mais legível;
- tabs já implementadas;
- tabela de etapas;
- botões Reordenar/Renomear por linha;
- form de nova etapa no rodapé;
- badge “terminal”.

### Problemas

- reordenação por prompt/botão é pouco natural;
- falta drag handle;
- ações repetidas;
- form pequeno e desconectado;
- tipo terminal precisa de explicação;
- ausência de impacto/contagem;
- falta confirmação de alterações críticas.

### Nova UI

- tabs:
  - Etapas;
  - Motivos de perda;
  - Usuários;
  - Integrações.
- drag-and-drop de etapas;
- regras de etapa terminal visíveis;
- impedir mudanças inválidas;
- drawer para editar;
- auditoria;
- contagem de oportunidades afetadas;
- ações destrutivas com confirmação.

## 4.11 Integração Auvo

### Evidências visíveis

- “Webhook Configurado”;
- 328 pendentes;
- 0 falhas;
- último evento em 23/07/2026 08:13;
- eventos `CONTACT_UPDATE`, `SESSION_UPDATE`, `SESSION_NEW`, `CONTACT_NEW`;
- todos aparecem como “Recebido”;
- tentativas iguais a 0;
- painel direito vazio até selecionar;
- filtro usa select nativo.

### Forte indício

O receptor está armazenando eventos, mas o fluxo de processamento não está transformando consistentemente os eventos em snapshots normalizados e itens de triagem. “328 pendentes, 0 falhas e 0 tentativas” é um forte indício de worker/reconcile não executado, status mal definido ou fila sem consumo. Isso precisa ser confirmado no código e banco.

### Problemas

- “configurado” não significa saudável;
- ausência de delivery rate;
- ausência de last successful processing;
- ausência de fila por estado;
- ausência de erros de parser;
- ausência de versão de schema;
- ausência de retry;
- ausência de correlação contact/session/message;
- lista mostra eventos crus, não impacto;
- payload técnico precisa ficar restrito;
- falta reprocessamento em lote;
- falta health check do worker.

## 5. Higiene de dados e E2E

### Evidência

A interface exibe:

- `E2E Cliente ...`;
- `E2E Oportunidade ...`;
- `Cliente Homologação ...`;
- IDs aleatórios em títulos;
- telefones repetidos;
- badges de duplicidade em massa.

### Problema

Testes E2E estão usando a mesma visão de dados da operação ou não limpam seus fixtures. Isso invalida:

- funil;
- relatórios;
- Central Comercial;
- duplicidade;
- próximas ações;
- notificações.

### Correção obrigatória

Implementar uma estratégia:

1. ambiente/banco isolado para E2E; ou
2. tenant/workspace isolado; ou
3. coluna `data_origin`/`is_test_fixture` com filtro obrigatório no backend.

Preferência:

- banco ou schema dedicado para E2E;
- limpeza determinística;
- nomes com run ID;
- teardown;
- testes de isolamento;
- produção nunca consulta fixtures.

Não apagar dados em massa sem dry-run e backup.

## 6. Nova arquitetura da integração Auvo

## 6.1 Princípio

O webhook não é a Caixa de Entrada.

O webhook entrega eventos técnicos. O CRM deve:

1. receber;
2. validar;
3. persistir com idempotência;
4. normalizar;
5. correlacionar;
6. projetar uma visão operacional;
7. apresentar a triagem;
8. executar ação humana.

## 6.2 Pipeline proposto

```text
Auvo
  ↓
Webhook ingress
  ↓
Evento recebido e deduplicado
  ↓
Normalizer por tipo/versão
  ↓
Snapshots de contato, sessão e mensagem
  ↓
Correlator
  ↓
Item único de triagem por sessão/contato
  ↓
Ação explícita do atendente
  ↓
Cliente/oportunidade/garantia/suporte/pós-venda
```

## 6.3 Ingress

Requisitos:

- endpoint HTTPS;
- autenticação/segredo conforme o formato real do Auvo Chat;
- nunca reutilizar credencial de API como segredo interno;
- limite de body;
- Content-Type;
- raw body disponível caso a assinatura use o corpo original;
- allowlist de headers;
- idempotency key:
  - ID oficial do evento, se existir;
  - fallback de hash estável;
- gravação rápida;
- resposta 2xx/202 sem processamento pesado;
- tempo alvo inferior a 2 segundos;
- logs sem payload sensível.

## 6.4 Estados do evento

```text
received
normalizing
normalized
projected
ignored
retry_wait
failed
```

Não usar “pendente” para tudo.

Campos mínimos:

- provider;
- event_type;
- event_id;
- schema_version;
- received_at;
- provider_timestamp;
- payload_hash;
- status;
- attempts;
- next_retry_at;
- last_error_code;
- last_error_message_redacted;
- processed_at;
- contact_external_id;
- session_external_id;
- message_external_id;
- correlation_key;
- fixture/test flag.

## 6.5 Normalização

Criar adapters separados para os tipos reais encontrados:

- `CONTACT_NEW`;
- `CONTACT_UPDATE`;
- `SESSION_NEW`;
- `SESSION_UPDATE`;
- outros tipos somente depois de payload real.

Cada adapter:

- usa schema Zod;
- aceita versões conhecidas;
- preserva unknown fields em metadata;
- não inventa campos;
- normaliza telefone;
- normaliza data;
- normaliza nome;
- extrai IDs externos;
- retorna erro tipado.

## 6.6 Regra do nome canônico

Ordem:

1. nome válido do contato;
2. nome da empresa, quando aplicável;
3. telefone formatado;
4. “Contato sem nome”.

Nunca usar como título operacional:

- `Atendimento - [nome]`;
- event type;
- session ID;
- UUID;
- nome de fixture.

## 6.7 Correlação

Ordem sugerida:

1. external contact ID;
2. external session/contact relation;
3. telefone normalizado;
4. e-mail;
5. sugestão fuzzy apenas para revisão humana.

Nunca mesclar automaticamente por nome.

## 6.8 Projeções

### Contact events

- atualizam snapshot do contato Auvo;
- não criam cliente CRM automaticamente;
- atualizam sugestão de match.

### Session events

- atualizam snapshot da conversa/sessão;
- abrem ou atualizam um item de triagem;
- não criam oportunidade.

### Message events

- atualizam preview;
- atualizam última interação;
- entram na timeline técnica;
- não geram um novo card por mensagem.

## 6.9 Item de triagem

Um item deve representar a unidade de trabalho, não o evento.

Campos:

- canonical_name;
- normalized_phone;
- source;
- session_id;
- last_message_preview;
- last_interaction_at;
- suggested_customer_id;
- match_reason;
- match_confidence;
- assignee;
- status;
- SLA;
- classification;
- resolved_at;
- resolution.

## 6.10 Erros e retry

- erros transitórios: retry exponencial;
- erros de schema: failed/dead-letter;
- máximo de tentativas;
- botão reprocessar;
- reprocessamento em lote;
- stack somente em log interno;
- mensagem humana no painel;
- alertar gestor quando taxa de falha ultrapassar limiar;
- não mostrar raw error para atendente.

## 6.11 Backfill dos 328 eventos

Ordem:

1. snapshot/backup;
2. dry-run;
3. classificar tipos e versões;
4. contar parse success/failure;
5. validar 20 amostras de cada tipo;
6. processar em lotes;
7. gerar relatório;
8. comparar quantidade de sessões e contatos;
9. impedir duplicação;
10. atualizar Caixa Auvo.

## 7. Referências de CRM aplicáveis

### HubSpot

Aplicar:

- workspace focado no trabalho diário;
- tarefas filtráveis;
- views salvas;
- guided execution;
- tabela configurável;
- conclusão em lote.

### Pipedrive

Aplicar:

- pipeline visual;
- atividades vinculadas ao negócio e contato;
- deal rotting;
- próxima atividade visível no card;
- notificações orientadas a higiene do funil.

### Attio

Aplicar:

- table e kanban como views do mesmo dado;
- filtros, sort e colunas configuráveis;
- modelo de objetos, listas e views;
- dashboards de funil, tempo em etapa e mudanças de etapa.

### Close

Aplicar:

- inbox orientada a ações;
- tarefas, mensagens e oportunidades com contexto;
- prioridade alta visível;
- contato rápido pelo item;
- “data da tarefa” como momento de aparecer na fila.

### Salesforce

Aplicar:

- timeline de atividade;
- tabelas acessíveis;
- validação por linha e tabela;
- record page com ações contextuais.

## 8. Roadmap ordenado

## P0 — Parar a contaminação e diagnosticar

1. congelar novas alterações visuais superficiais;
2. auditar branch, diff, migrations e status;
3. identificar origem dos registros E2E;
4. isolar fixtures;
5. auditar os 328 eventos;
6. mapear payloads reais;
7. medir endpoints e erros;
8. criar testes de classificação de data/timezone;
9. criar screenshots baseline;
10. criar feature flags para nova UI, se necessário.

Gate:

- nenhum fixture E2E aparece em consultas operacionais;
- payloads reais catalogados;
- diagnóstico do worker concluído.

## P1 — Corrigir Auvo e dados

1. criar/ajustar migration sem alterar migrations aplicadas;
2. implementar state machine;
3. adapters Zod;
4. snapshots;
5. correlação;
6. triage projection;
7. retry/dead-letter;
8. backfill dry-run;
9. processar eventos;
10. reconstruir Caixa Auvo.

Gate:

- nenhum evento duplicado;
- 95%+ dos payloads conhecidos normalizados;
- erros tipados;
- triagem consolidada por sessão/contato;
- nenhum evento cria oportunidade automaticamente.

## P2 — Design system

1. tokens globais;
2. tokens semânticos;
3. Inter;
4. Phosphor;
5. Button;
6. Input;
7. Select/Combobox;
8. DatePicker;
9. Badge;
10. Tabs;
11. DataTable;
12. Drawer/Dialog;
13. Toast;
14. Empty/Error/Loading states;
15. AppShell.

Gate:

- Story/sandbox page com todos os estados;
- light e dark;
- contraste;
- testes de componentes.

## P3 — Operação diária

1. AppShell;
2. Central Comercial;
3. Próximas Ações;
4. Funil;
5. Caixa Auvo;
6. Clientes;
7. Oportunidades;
8. fichas.

Gate:

- screenshots antes/depois;
- fluxos críticos E2E;
- aprovação visual humana.

## P4 — Inteligência e gestão

1. notificações;
2. relatórios;
3. administração;
4. integração técnica;
5. observabilidade;
6. performance;
7. mobile.

## 9. Critérios de aceite global

- nenhuma tela principal exibe fixtures E2E;
- nenhuma tela exibe raw ISO para atendente;
- nenhuma tela exibe event type como linguagem principal;
- nenhum webhook cria oportunidade;
- Central prioriza trabalho;
- Funil é realmente movível;
- Próximas Ações encadeia follow-up;
- Caixa Auvo consolida eventos;
- relatórios respondem perguntas comerciais;
- design usa tokens semânticos;
- light e dark completos;
- body operacional mínimo 14 px;
- screenshots evidenciam transformação;
- typecheck, testes, build e Playwright passam;
- nenhum segredo;
- nenhum financeiro;
- sem commit/push não autorizado.
