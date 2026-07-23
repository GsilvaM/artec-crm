# Prompt mestre de execução — reconstrução do Artec CRM

Atue como líder técnico e coordenador de uma refatoração integral de CRM comercial.

Projeto:

```text
C:\Users\Artec Climatizados\Desktop\artec-crm
```

Não faça commit nem push sem autorização explícita.

## Missão

Transformar o Artec CRM em uma ferramenta comercial confiável, bonita e realmente utilizável pela equipe da Artec.

Você deve corrigir:

- dados E2E e fixtures aparecendo na operação;
- modelo e processamento do webhook Auvo;
- erros de backend visíveis na interface;
- arquitetura de informação;
- design system;
- AppShell;
- Central Comercial;
- Funil;
- Clientes;
- Oportunidades;
- Próximas Ações;
- Notificações;
- Caixa Auvo;
- Relatórios;
- Administração;
- Integração Auvo.

Não trate isso como uma troca de CSS.

## Documentos obrigatórios

Leia integralmente:

- `AGENTS.md`;
- `CLAUDE.md`;
- `README.md`;
- `docs/CONTEXTO-ROTINA-ATENDIMENTO.md`;
- `docs/PRODUCT-SPEC.md`;
- `docs/DESIGN-SYSTEM.md`;
- `docs/DEVELOPMENT-STATUS.md`;
- `docs/AUDITORIA-ESTADO-ATUAL-ARTEC-CRM.md`;
- `docs/ANALISE-PIXEL-A-PIXEL-VENTURE-DESIGN-SYSTEM.md`;
- PDF Venture em `docs/references/`;
- `.claude/agents/*.md`;
- contratos, migrations, frontend, backend e testes.

## Subagentes obrigatórios

Use proativamente:

- `artec-crm-product-architect`;
- `artec-design-system-engineer`;
- `artec-auvo-integration-specialist`;
- `artec-data-quality-e2e`;
- `artec-qa-release-guardian`.

Peça relatórios independentes antes de implementar.

O agente principal deve reconciliar divergências e tomar decisões coerentes.

## Regra de verdade

Classifique cada conclusão:

- comprovada pelo código;
- comprovada pelo banco;
- comprovada por payload real;
- comprovada por screenshot;
- inferência;
- desconhecida.

Não invente estrutura do payload Auvo.

Não assuma que “webhook configurado” significa integração saudável.

## Etapa 0 — Estado real

Execute:

```powershell
git rev-parse --show-toplevel
git remote -v
git branch --show-current
git status --short --branch
git log --oneline -25
git diff --stat
git diff
```

Depois:

- liste migrations;
- status das migrations;
- env names sem valores;
- scripts;
- testes;
- rotas;
- tabelas Auvo;
- workers/reconcile;
- componentes;
- CSS;
- screenshots;
- fixtures E2E.

Não descarte alterações locais.

## Etapa 1 — Auditoria paralela

Delegue:

### Product architect

- validar funil, situações, próxima ação, garantia, suporte e relatórios;
- mapear cada página à rotina Artec;
- encontrar campos e fluxos sem sentido.

### Design engineer

- comparar screenshots atuais com o Venture;
- mapear tokens, componentes e layouts;
- produzir plano visual por página.

### Auvo specialist

- seguir o evento da rota ao banco e à Caixa;
- catalogar payloads reais;
- explicar 328 pendentes, 0 tentativas e 0 falhas;
- propor correções comprovadas.

### Data quality

- localizar criação de E2E Cliente/Oportunidade;
- verificar isolamento;
- encontrar fixtures órfãs;
- propor cleanup seguro.

### QA guardian

- inventariar testes;
- capturar baselines;
- mapear lacunas;
- definir gates.

Apresente a síntese e continue.

## Etapa 2 — Corrigir a base de dados operacional

Prioridade absoluta:

1. isolar E2E;
2. impedir novos fixtures na operação;
3. normalizar telefone e datas;
4. corrigir timezone;
5. remover textos técnicos da UI;
6. criar migração nova se necessária;
7. preservar auditoria.

Nunca editar migration aplicada.

Cleanup:

- dry-run;
- relatório;
- backup;
- confirmação;
- nenhuma exclusão cega.

## Etapa 3 — Reconstruir Auvo

Implemente:

```text
Ingress
→ evento idempotente
→ normalização tipada
→ snapshots
→ correlação
→ projeção de triagem
→ ação humana
```

Requisitos:

- Zod;
- adapters por event type real;
- state machine;
- retries;
- dead-letter;
- observabilidade;
- reprocessamento;
- backfill;
- sem oportunidade automática.

Para `CONTACT_NEW`, `CONTACT_UPDATE`, `SESSION_NEW`, `SESSION_UPDATE`:

- derive schemas dos payloads reais;
- escreva fixtures anonimizadas;
- escreva testes;
- não invente campos.

Defina nome canônico:

1. nome válido;
2. empresa;
3. telefone;
4. Contato sem nome.

Nunca “Atendimento - nome”.

## Etapa 4 — Design system

Use o PDF Venture e o documento pixel a pixel.

Regras:

- Inter;
- tokens globais nunca usados diretamente;
- aliases semânticos;
- controles 32/37/40/48;
- radius base 4 px;
- Phosphor Icons;
- light default;
- dark opcional;
- 14 px mínimo para corpo operacional;
- menos bordas;
- superfícies em camadas;
- ação primária clara;
- acessibilidade.

Implemente uma página interna de demonstração somente em desenvolvimento.

## Etapa 5 — AppShell

Refatore:

- sidebar 232–248 px;
- rail 64 px;
- topbar em duas camadas;
- busca global;
- perfil em menu;
- sino;
- toolbar da página;
- mobile drawer;
- foco e teclado.

## Etapa 6 — Páginas prioritárias

### Central Comercial

- filtros compactos;
- indicadores;
- fila prioritária;
- agenda;
- orçamentos;
- higiene do funil;
- gráficos pequenos;
- dados canônicos.

### Próximas Ações

- minha fila;
- grupos por tempo;
- list/agenda;
- conclusão guiada;
- criação da próxima ação;
- telefone/WhatsApp;
- overflow.

### Funil

- drag-and-drop;
- rollback;
- colunas 280–320 px;
- cards informativos;
- cores de etapa;
- total/valor;
- mobile por tabs;
- sem select permanente.

### Caixa Auvo

- split view;
- sessão consolidada;
- preview;
- match;
- ação primária;
- detalhes técnicos restritos.

### Clientes

- criação em drawer;
- tabela útil;
- duplicidade comparável;
- última interação e próxima ação.

### Oportunidades

- criação progressiva;
- campos obrigatórios;
- views;
- lógica comercial.

## Etapa 7 — Notificações e relatórios

Notificações:

- dedupe;
- grupos;
- contexto;
- CTA;
- sem raw ISO;
- preferências;
- snooze real.

Relatórios:

- funil;
- conversão;
- tempo em etapa;
- origem;
- demanda;
- aprovado;
- ticket;
- perda;
- ações;
- visitas;
- Auvo SLA.

Nenhum conceito financeiro.

## Etapa 8 — Evidência visual

Para cada página:

1. screenshot antes;
2. screenshot Venture relevante;
3. screenshot depois;
4. desktop light;
5. desktop dark;
6. mobile;
7. diferenças intencionais;
8. aprovação.

Não declarar conclusão apenas por testes verdes.

## Etapa 9 — Validação

Execute:

```powershell
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
npm run db:migrate:status
npm run typecheck
npm run test
npm run build
npx playwright test
```

Adicione testes para:

- idempotência;
- schemas Auvo;
- correlation;
- retry;
- E2E isolation;
- timezone;
- kanban move/rollback;
- completion chaining;
- notifications dedupe;
- reports filters;
- mobile;
- a11y;
- visual screenshots.

## Proibições

Não:

- fazer commit/push;
- expor segredo;
- versionar env;
- alterar financeiro;
- inventar payload;
- criar oportunidade por webhook;
- editar migration aplicada;
- apagar dados sem dry-run;
- usar screenshot como fundo;
- produzir apenas documentação;
- declarar sucesso sem evidência visual e funcional.

## Relatório final

Inclua:

1. estado inicial;
2. causas raiz;
3. payloads reais;
4. schema;
5. migrations;
6. cleanup;
7. Auvo;
8. design system;
9. páginas;
10. screenshots;
11. testes;
12. performance;
13. acessibilidade;
14. riscos;
15. pendências;
16. arquivos;
17. nenhum segredo;
18. nenhum financeiro;
19. nenhum commit/push;
20. estado final honesto.
