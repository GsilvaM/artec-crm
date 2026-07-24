# Prompt — Refatoração exclusiva da página Central Comercial

Atue como:

- Product Designer sênior especializado em CRM B2B;
- Design Engineer especializado em Figma/Venture Design System;
- Desenvolvedor Frontend sênior em React e TypeScript;
- Especialista em UX operacional para equipes comerciais;
- Especialista em acessibilidade, responsividade e aplicações intensivas em dados.

Projeto:

```text
C:\Users\Artec Climatizados\Desktop\artec-crm
```

Página desta execução:

```text
/central-comercial
```

Não faça commit nem push sem autorização explícita.

---

# 1. Missão desta execução

Refatore **exclusivamente a página Central Comercial e os componentes compartilhados indispensáveis para ela**.

Não avance para Funil, Clientes, Oportunidades, Próximas Ações, Caixa Auvo, Relatórios ou outras páginas nesta execução.

O objetivo é transformar a Central Comercial em uma tela de trabalho comercial profissional, com o nível de acabamento de um CRM SaaS maduro, utilizando o **Venture CRM Dashboard UI Kit** e os tokens existentes em `docs/` como base visual.

A página precisa responder imediatamente:

```text
O que exige minha ação agora?
```

Não faça apenas troca de cor, radius ou tipografia.

A entrega deve alterar claramente:

- composição;
- hierarquia;
- densidade;
- alinhamento;
- distribuição dos blocos;
- filtros;
- cards;
- ações;
- estados vazios;
- responsividade;
- microinterações;
- legibilidade;
- qualidade visual.

---

# 2. Evidência visual atual

Use como baseline a screenshot atual da Central Comercial fornecida pelo usuário.

Dimensão observada:

```text
1919 × 986 px
```

Problemas visíveis comprovados pela screenshot:

1. A sidebar ocupa aproximadamente 200 px, mas possui pouca presença visual e baixa diferenciação entre grupos.
2. A busca global ocupa quase toda a topbar e desequilibra perfil, notificações e ações.
3. O título da página possui pouco contexto e nenhuma síntese operacional.
4. O painel de filtros ocupa aproximadamente 200 px de altura e domina a primeira dobra.
5. Os filtros ficam permanentemente expostos, mesmo quando não estão sendo usados.
6. Quase todos os containers possuem borda, criando aparência de painel administrativo.
7. As superfícies possuem pouca profundidade e praticamente o mesmo peso visual.
8. “Ações vencidas” e “Ações de hoje” estão em duas colunas de mesma altura.
9. A coluna “Ações de hoje” possui apenas um item, mas se estende verticalmente, gerando uma enorme área vazia.
10. O grid está usando altura esticada ou composição equivalente, em vez de altura natural do conteúdo.
11. Os cards de ação são largos, baixos e visualmente achatados.
12. As barras vermelhas e ocres de atraso ocupam quase toda a largura dos cards e chamam mais atenção do que cliente, ação e prazo.
13. “Concluir” e “Reagendar” são repetidos em todas as linhas com o mesmo peso.
14. O nome da ação, o cliente, a oportunidade, a categoria e o prazo não possuem hierarquia suficiente.
15. Os contadores das seções são muito pequenos.
16. Não existe faixa de indicadores comerciais na primeira dobra.
17. O resumo comercial está escondido abaixo da área operacional.
18. Estados vazios ocupam espaço demais em outras partes da página.
19. A tipografia operacional parece pequena, especialmente metadados e labels.
20. O uso de cor está concentrado em atraso e erro.
21. O layout não se aproxima dos padrões de cards, header, navegação e dashboard do Venture.
22. A página parece uma coleção de caixas, não uma central de trabalho.
23. Textos longos e dados de homologação podem quebrar a composição.
24. Não existe uma ação primária global clara, como “Nova oportunidade”, quando o fluxo atual permitir.
25. A tela não prioriza responsável, próxima ação e tempo restante de forma escaneável.

Esses problemas devem ser corrigidos visualmente e estruturalmente.

---

# 3. Escopo rígido

Pode alterar:

- página da Central Comercial;
- componentes usados diretamente por ela;
- tokens e estilos compartilhados necessários;
- AppShell, Sidebar e Topbar somente no que for necessário para a Central;
- endpoint `GET /api/commercial-center` e seus contratos somente quando necessário para entregar a UX;
- testes da Central;
- documentação do design system e progresso.

Não deve alterar nesta execução:

- schema de domínio sem necessidade comprovada;
- etapas do funil;
- regras de Clientes;
- regras de Oportunidades;
- lógica completa da Caixa Auvo;
- relatórios;
- migrations aplicadas;
- módulos financeiros;
- outras páginas apenas para “padronizar tudo”.

Se uma alteração compartilhada afetar outras páginas, preserve compatibilidade e teste regressão.

---

# 4. Fontes obrigatórias

Leia integralmente antes de editar:

```text
README.md
CONTEXTO-ROTINA-ATENDIMENTO-ARTEC-CRM.md
docs/AUDITORIA-ESTADO-ATUAL-ARTEC-CRM.md
docs/ANALISE-PIXEL-A-PIXEL-VENTURE-DESIGN-SYSTEM.md
docs/REFATORACAO-CRM-DECISOES.md
docs/REFATORACAO-CRM-PROGRESSO.md
docs/REFATORACAO-CRM-PLANO-EXECUCAO.md
.claude/agents/*.md
```

Leia também todos os arquivos de tokens e componentes existentes em `docs/`, especialmente:

```text
docs/global colors.json
docs/color tokens.json
docs/typography.json
docs/buttons styles.json
docs/cards.json
docs/icons.json
docs/modals.json
docs/navigation.json
docs/navigation header.json
docs/selector.json
docs/small components.json
docs/table.json
docs/text field.json
```

Alguns nomes podem variar. Localize os arquivos reais.

## Regra de confiança dos tokens

A auditoria anterior identificou:

- JSONs de componentes e medidas: confiáveis;
- JSONs de cores e tipografia: possuem associações inconsistentes;
- análise pixel a pixel: fonte auditada para cores e escala tipográfica.

Use esta ordem:

1. JSON confiável de componente para dimensões e variantes;
2. análise pixel a pixel para cor e tipografia;
3. tokens semânticos já validados no código;
4. PDF Venture;
5. inferência documentada.

Não use silenciosamente valores contraditórios.

Não espalhe HEX pelo CSS.

---

# 5. Referências do Venture aplicáveis

Use como referências principais:

- Navigation;
- Header;
- Cards;
- Table;
- Small Components;
- Dashboard;
- Input Elements;
- Selector;
- Modals.

Princípios obrigatórios:

- Inter;
- Phosphor Icons, caso já adotado ou aprovado;
- tokens globais não usados diretamente;
- componentes usam tokens semânticos;
- radius base de 4 px conforme `cards.json`;
- bordas discretas;
- superfícies leves;
- tipografia legível;
- controles padronizados;
- ações secundárias em menus;
- cards com anatomia clara;
- dashboard com hierarquia;
- light mode como experiência principal;
- dark mode completo e confortável.

Não copiar:

- marca Venture;
- textos fictícios;
- dados fictícios;
- módulos financeiros;
- conteúdo de merchant/e-commerce;
- layouts que não correspondam à rotina Artec.

---

# 6. Auditoria obrigatória antes da implementação

Execute:

```powershell
git status --short --branch
git log --oneline -10
git diff --stat
git diff
```

Depois identifique:

- componente da rota `/central-comercial`;
- hooks;
- stores;
- tipos;
- endpoint;
- repository;
- queries;
- testes;
- CSS;
- componentes reutilizados;
- carregamento;
- erro;
- vazio;
- filtros;
- paginação;
- comportamento mobile.

Analise especificamente:

- por que as duas colunas esticam para a mesma altura;
- qual CSS produz a área vazia;
- quais cards possuem height/min-height;
- se existe `align-stretch`;
- se existem containers com `height: 100%`;
- se filtros ficam no estado local ou URL;
- se o endpoint retorna dados suficientes;
- se há N+1;
- se dados de fixtures estão sendo excluídos;
- se datas chegam em UTC;
- se raw ISO ainda chega à UI;
- se os blocos possuem contagem e status de carregamento próprios.

Apresente um diagnóstico curto e continue automaticamente.

---

# 7. Arquitetura visual alvo

## 7.1 Estrutura da página

Use uma composição semelhante:

```text
Global Topbar
Page Header + ações
Commercial Metrics
Compact Filter Toolbar
Main Work Grid
Secondary Commercial Grid
```

Wireframe recomendado:

```text
┌────────────────────────────────────────────────────────────────────┐
│ CENTRAL COMERCIAL                       Nova oportunidade  Atualizar │
│ Prioridades, agenda e acompanhamento da operação de hoje            │
└────────────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Vencidas │ Hoje     │ Visitas  │ Retornos │ Sem ação │ Caixa    │
│ 5        │ 1        │ 0        │ 1        │ 0        │ 4        │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

┌────────────────────────────────────────────────────────────────────┐
│ Período: Hoje   Responsável: Todos   Filtros (2)    Limpar          │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┬──────────────────────────────┐
│ PRIORIDADE AGORA                    │ AGENDA E VISITAS             │
│ [Tabs: Vencidas 5 | Hoje 1]         │ [próximos compromissos]      │
│ [work item]                         │                              │
│ [work item]                         │                              │
│ [work item]                         │                              │
└─────────────────────────────────────┴──────────────────────────────┘

┌───────────────────────────────┬────────────────────────────────────┐
│ ORÇAMENTOS AGUARDANDO RETORNO │ HIGIENE DO FUNIL                  │
│                               │ sem próxima ação / paradas         │
└───────────────────────────────┴────────────────────────────────────┘

┌─────────────────────────────────────┬──────────────────────────────┐
│ ALERTAS E NOTIFICAÇÕES              │ RESUMO COMERCIAL             │
│                                     │ métricas e tendências        │
└─────────────────────────────────────┴──────────────────────────────┘
```

A composição pode ser refinada depois de analisar os dados reais, mas deve manter essa hierarquia.

## 7.2 Primeira dobra

Em desktop 1440×900, a primeira dobra deve mostrar:

- PageHeader;
- indicadores;
- toolbar de filtros compacta;
- início completo da fila prioritária;
- agenda ou visitas.

Não permitir que filtros consumam a maior parte da primeira dobra.

---

# 8. PageHeader

Criar ou refatorar um `PageHeader` com:

- eyebrow discreto: `Operação do dia`;
- título: `Central Comercial`;
- descrição curta:
  - `Priorize ações, visitas e retornos que exigem atenção agora.`;
- informação de última atualização;
- botão secundário `Atualizar`;
- ação primária `Nova oportunidade`, somente se o fluxo já existir e puder ser aberto sem inventar regra;
- responsividade;
- loading no atualizar;
- feedback de sucesso/erro.

Não usar um título solto sem contexto.

---

# 9. Indicadores comerciais

Criar uma faixa de `CommercialMetricCard`.

Métricas mínimas, usando apenas dados reais existentes:

- Ações vencidas;
- Ações de hoje;
- Visitas próximas;
- Orçamentos aguardando retorno;
- Oportunidades sem próxima ação;
- Itens novos da Caixa Auvo, quando o endpoint suportar.

Cada card deve possuir:

- label;
- valor;
- ícone;
- tone semântico;
- texto auxiliar opcional;
- estado loading;
- estado erro;
- clique para aplicar filtro ou rolar até a seção correspondente;
- foco visível;
- altura compacta;
- nenhuma borda pesada.

Não adicionar gráfico ou variação percentual sem dado real.

---

# 10. Filtros

Substituir o grande painel permanente por uma toolbar compacta.

## Desktop

Mostrar:

- período;
- responsável, quando existir;
- etapa;
- prioridade;
- botão `Filtros`;
- chips dos filtros ativos;
- `Limpar`.

Filtros menos usados devem abrir em:

- popover;
- drawer;
- painel expansível.

## Mobile

Todos os filtros devem abrir em drawer.

## Regras

- preservar filtros na URL quando for tecnicamente adequado;
- manter filtros ao abrir um item e voltar;
- mostrar número de filtros ativos;
- aplicar e limpar com feedback;
- não disparar requests duplicados;
- usar debounce onde necessário;
- cancelar request anterior;
- loading sem bloquear a página inteira;
- labels visíveis;
- datas em pt-BR;
- acessibilidade por teclado.

O painel expandido não deve ocupar mais que o necessário.

---

# 11. Fila principal — Prioridade agora

Em vez de duas caixas gigantes de mesma altura, criar um módulo principal.

Use tabs ou segmented control:

```text
Vencidas (5)
Hoje (1)
```

Também pode haver `Todas`, caso seja útil.

## WorkQueueItem

Cada item deve exibir, nesta ordem:

1. título da ação;
2. cliente;
3. oportunidade/contexto;
4. responsável;
5. categoria;
6. data e hora;
7. tempo relativo;
8. prioridade;
9. ação primária;
10. menu de ações secundárias.

Anatomia recomendada:

```text
[avatar]  Retornar sobre orçamento                   [Vencida há 2 dias]
          Cliente • Oportunidade
          Comercial • Hoje, 10:00 • Responsável

                                              [Concluir] [⋯]
```

## Regras visuais

- altura natural entre aproximadamente 72 e 96 px;
- nenhuma progress bar de largura total para atraso;
- usar badge, ícone, borda lateral ou pequena faixa semântica;
- título com 14–16 px;
- corpo com 14 px;
- metadados com 12 px;
- avatar ou initials;
- line-clamp para textos longos;
- tooltip para conteúdo truncado;
- uma ação principal;
- `Reagendar`, `Abrir cliente`, `Abrir oportunidade` e demais ações no menu quando adequado;
- hover e focus claros;
- sem borda em cada subelemento.

## Comportamento

- concluir usa o fluxo real existente;
- reagendar usa dialog/drawer existente;
- atualização otimista apenas quando segura;
- rollback em erro;
- toast humano;
- item removido da fila somente depois de sucesso;
- manter contadores sincronizados.

---

# 12. Agenda e visitas

O painel lateral deve ter altura natural.

Nunca deve ser esticado para acompanhar a fila principal.

Usar:

```css
align-items: start;
height: fit-content;
```

ou solução equivalente compatível com a arquitetura atual.

Mostrar:

- próximas visitas;
- compromissos de hoje;
- horário;
- cliente;
- bairro/cidade, quando disponível;
- responsável;
- status;
- ação abrir.

Estado vazio:

```text
Nenhuma visita próxima
As visitas agendadas aparecerão aqui.
```

O vazio deve ser compacto, aproximadamente 120–160 px, não ocupar metade da viewport.

---

# 13. Orçamentos aguardando retorno

Cada item deve mostrar:

- cliente;
- oportunidade;
- data do envio;
- dias aguardando;
- valor, quando existente;
- responsável;
- próxima ação;
- CTA `Abrir oportunidade`.

Não mostrar apenas uma linha genérica.

Usar lista compacta ou cards leves.

---

# 14. Higiene do funil

Agrupar:

- oportunidades sem próxima ação;
- oportunidades paradas.

Pode usar tabs ou dois subblocos compactos.

Cada item deve mostrar:

- cliente;
- oportunidade;
- etapa;
- tempo parado;
- responsável;
- ação recomendada.

Estado vazio deve ser positivo e compacto:

```text
Todas as oportunidades estão acompanhadas
Nenhuma oportunidade ativa está sem próxima ação.
```

Não usar caixas vazias gigantes.

---

# 15. Notificações e Caixa Auvo

Na Central, mostrar apenas resumo operacional.

## Notificações

- no máximo 3–5 itens;
- título;
- contexto;
- tempo relativo;
- CTA;
- sem raw ISO;
- sem ações repetidas;
- link `Ver todas`.

## Caixa Auvo

- quantidade de itens novos;
- itens acima do SLA;
- último recebimento;
- CTA `Abrir Caixa Auvo`.

Não mostrar payload técnico.

Não inventar conteúdo caso a integração não forneça.

---

# 16. Resumo comercial

Mover os indicadores relevantes para posição visível.

Métricas permitidas:

- novas oportunidades;
- aprovadas;
- perdidas;
- valor aprovado;
- ticket médio aprovado.

Usar:

- cards compactos;
- sparkline somente se houver série real;
- texto humano;
- período aplicado;
- valores comerciais, não financeiros.

Não usar receita, faturamento, recebido, contas ou fluxo de caixa.

---

# 17. Grid e alturas

Corrigir explicitamente o problema de seções com mesma altura.

Requisitos:

- cada painel usa altura de conteúdo;
- `align-items: start`;
- nenhuma seção usa `height: 100%` sem motivo;
- nenhuma seção vazia estica por causa da seção vizinha;
- grid de 12 colunas;
- gaps derivados dos tokens;
- desktop:
  - fila principal 7–8 colunas;
  - agenda 4–5 colunas;
- tablet:
  - 1 coluna ou 7/5 quando houver espaço;
- mobile:
  - tudo empilhado.

Não usar masonry artificial que prejudique ordem de leitura.

---

# 18. AppShell e sidebar

Nesta execução, alterar o shell somente o necessário para a Central.

Melhorias permitidas:

- sidebar com contraste correto;
- item ativo refinado;
- grupos legíveis;
- topbar mais equilibrada;
- busca com largura máxima;
- perfil em menu;
- `Sair` dentro do menu do perfil;
- sino consistente;
- toolbar da página separada.

Preservar rotas e navegação.

Não refatorar páginas não relacionadas.

---

# 19. Tokens e estilos

Usar tokens semânticos.

Exemplos de categorias:

```text
background.app
background.surface
background.subtle
content.primary
content.secondary
content.tertiary
border.subtle
border.strong
action.primary
action.secondary
status.critical
status.warning
status.positive
status.informative
```

Regras:

- nenhum HEX direto em componente;
- radius conforme token validado;
- sombras sutis;
- bordas reduzidas;
- focus ring consistente;
- light e dark;
- reduced motion;
- duração de 120–200 ms;
- não criar segundo design system.

---

# 20. Componentes desta página

Criar ou consolidar somente se forem usados imediatamente:

```text
CommercialCenterPage
CommercialPageHeader
CommercialMetricGrid
CommercialMetricCard
CommercialFilterToolbar
CommercialFilterDrawer
WorkQueuePanel
WorkQueueTabs
WorkQueueItem
AgendaPanel
UpcomingVisitItem
QuoteReturnItem
PipelineHygienePanel
CompactEmptyState
CommercialSummary
CommercialSectionHeader
```

Não criar componentes abstratos sem uso.

Cada componente deve possuir API tipada e estados:

- loading;
- empty;
- error;
- success;
- disabled;
- hover;
- focus.

---

# 21. Loading, erro e vazio

## Loading

- skeleton por seção;
- não bloquear toda a página;
- evitar layout shift;
- botão Atualizar com estado próprio.

## Erro

- erro por bloco quando possível;
- mensagem humana;
- opção tentar novamente;
- detalhe técnico apenas em log;
- não exibir stack, SQL, UUID ou raw error.

## Vazio

- compacto;
- específico;
- orientado ao próximo passo;
- sem ilustração gigante;
- sem ocupar altura artificial.

---

# 22. Responsividade

Validar:

```text
1920×1080
1440×900
1366×768
1024×768
768×1024
430×932
390×844
360×800
```

## Mobile

- sidebar em drawer;
- topbar compacta;
- título e ações empilhados;
- métricas em grid 2×N ou carrossel acessível;
- filtros em drawer;
- tabs roláveis;
- cards em uma coluna;
- ações principais visíveis;
- menus com touch target adequado;
- sem overflow horizontal;
- sem texto abaixo de 12 px;
- corpo operacional 14 px.

---

# 23. Acessibilidade

Seguir WCAG 2.2.

Validar:

- contraste em light e dark;
- foco;
- teclado;
- ordem de tabulação;
- landmarks;
- headings;
- tabs;
- menus;
- popovers;
- drawers;
- labels;
- aria-live para atualização;
- aria-busy;
- touch targets;
- reduced motion;
- zoom 200%.

A auditoria deve rodar também no dark mode.

---

# 24. Backend e contrato da Central

A prioridade é frontend.

Pode alterar o endpoint da Central somente se necessário para:

- retornar métricas;
- evitar N+1;
- entregar dados canônicos;
- retornar responsável;
- fornecer datas corretas;
- suportar filtros;
- fornecer counts;
- suportar loading por bloco;
- melhorar performance.

Regras:

- preservar RBAC;
- excluir fixtures no backend;
- não expor dados técnicos;
- não acessar financeiro;
- não alterar migrations aplicadas;
- criar testes;
- manter compatibilidade quando possível.

Não crie novos dados apenas para preencher o layout.

---

# 25. Processo de implementação

## Etapa A — Baseline

Capturar:

```text
1440×900
390×844
```

Guardar em pasta ignorada:

```text
artifacts/refactor/central-commercial/before/
```

## Etapa B — Wireframe

Antes de alterar muito código, produzir um wireframe textual ou HTML simples da nova composição.

Apresentar:

- estrutura;
- hierarquia;
- componentes;
- dados necessários;
- diferenças em relação ao atual.

Depois continuar automaticamente.

## Etapa C — Fundação

- tokens;
- shell necessário;
- PageHeader;
- métricas;
- filtros.

## Etapa D — Operação

- fila prioritária;
- agenda;
- orçamentos;
- higiene;
- notificações;
- Caixa;
- resumo.

## Etapa E — Estados e responsividade

- loading;
- vazio;
- erro;
- mobile;
- dark.

## Etapa F — Validação visual

Capturar novamente:

```text
1440×900
390×844
```

Guardar em:

```text
artifacts/refactor/central-commercial/after/
```

Comparar:

- antes;
- Venture;
- depois.

Refinar pelo menos uma vez depois da primeira captura.

---

# 26. Testes

Executar:

```powershell
npm run typecheck
npm run test
npm run build
npx playwright test
```

Também executar Prisma/status caso backend ou contrato sejam alterados:

```powershell
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
npm run db:migrate:status
```

Adicionar testes para:

- filtros;
- chips;
- limpar filtros;
- contadores;
- tabs da fila;
- concluir;
- reagendar;
- loading;
- vazio;
- erro;
- atualizar;
- fixtures excluídas;
- timezone;
- mobile;
- dark;
- teclado;
- foco;
- a11y;
- ausência de overflow;
- screenshots.

---

# 27. Critérios de rejeição

A entrega será rejeitada se:

- apenas trocar cores;
- manter o grande painel de filtros;
- manter os dois blocos principais com altura igual;
- manter enorme espaço vazio em “Ações de hoje”;
- manter progress bars de atraso em todos os cards;
- manter borda em todos os containers;
- manter tipografia pequena;
- manter ações repetidas com o mesmo peso;
- manter o resumo escondido;
- não usar os tokens;
- não apresentar screenshot antes/depois;
- não validar mobile;
- não validar dark;
- criar componentes sem aplicar;
- alterar outras páginas sem necessidade;
- declarar sucesso apenas porque os testes passaram.

---

# 28. Critérios de aceite

A página será aceita quando:

- a primeira dobra orientar claramente o trabalho;
- filtros estiverem compactos;
- indicadores estiverem visíveis;
- fila prioritária estiver clara;
- altura dos painéis for natural;
- nenhum bloco vazio estiver esticado;
- cards tiverem hierarquia;
- atraso for semântico e discreto;
- uma ação principal estiver evidente;
- ações secundárias estiverem em menu;
- agenda estiver clara;
- orçamentos estiverem compreensíveis;
- higiene do funil estiver visível;
- resumo comercial estiver útil;
- light e dark estiverem refinados;
- mobile estiver funcional;
- screenshots mostrarem transformação evidente;
- typecheck, testes, build e Playwright passarem;
- nenhuma regra de negócio for quebrada;
- nenhum segredo for exposto;
- nenhum financeiro for introduzido;
- nenhum commit ou push for feito.

---

# 29. Relatório final

Apresente:

1. estado inicial;
2. arquivos lidos;
3. tokens usados;
4. diagnóstico;
5. causa do layout esticado;
6. wireframe;
7. componentes criados;
8. componentes alterados;
9. endpoint alterado, se houver;
10. PageHeader;
11. métricas;
12. filtros;
13. fila prioritária;
14. agenda;
15. visitas;
16. orçamentos;
17. higiene do funil;
18. notificações;
19. Caixa Auvo;
20. resumo comercial;
21. loading;
22. vazio;
23. erro;
24. light mode;
25. dark mode;
26. mobile;
27. acessibilidade;
28. performance;
29. screenshot antes;
30. screenshot depois;
31. comparação com Venture;
32. diferenças intencionais;
33. testes;
34. build;
35. arquivos criados;
36. arquivos alterados;
37. pendências;
38. riscos;
39. confirmação de nenhum segredo;
40. confirmação de nenhum financeiro;
41. confirmação de nenhum commit;
42. confirmação de nenhum push;
43. estado final honesto.

---

# 30. Início

Comece auditando somente a rota `/central-comercial`.

Não altere outras páginas.

Não faça commit nem push.

Não pare depois do diagnóstico: implemente, capture, compare, refine e valide.
