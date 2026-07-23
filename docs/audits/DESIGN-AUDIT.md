# Auditoria de Design — Artec CRM × Venture Design System

**Data:** 2026-07-23
**Branch:** `refactor/frontend-design-system`
**Escopo desta auditoria:** releitura dos 13 JSON de `docs/*.json` (componentes), cruzamento com `docs/ANALISE-PIXEL-A-PIXEL-VENTURE-DESIGN-SYSTEM.md` e com o código real (`src/styles.css` + `src/components/**` + `src/features/**`). Nenhum código foi alterado nesta passagem — é somente diagnóstico.
**Páginas cobertas em profundidade:** Próximas Ações, Clientes, Caixa Auvo (`AuvoInboxPanel.tsx` / `CaixaAuvoPage.tsx`), Relatórios, Administração, Notificações.

> Nota sobre a regra "nenhuma tela concluída sem screenshot": este documento é auditoria, não implementação — nenhuma tela foi alterada aqui, então não há "conclusão" a capturar. Screenshots (light + dark, desktop + mobile) são um item do plano de implementação (seção 8) e devem ser anexados quando as correções forem de fato aplicadas.

---

## 1. Confiabilidade das fontes — reconfirmado + 2 achados novos

Mantida a decisão já tomada nesta sessão: os 10 JSON de **componente** (`buttons styles.json`, `table.json`, `selector.json`, `small components.json`, `modals.json`, `navigation.json`, `navigation header.json`, `cards.json`, `text field.json`) usam a sintaxe nativa de variantes do Figma (`"size:medium/hierarchy:primary/state:default/...": "152px x 37px"`) e batem com o `ANALISE-PIXEL-A-PIXEL...md`; os 3 JSON de cor/tipografia (`global colors.json`, `color tokens.json`, `typography.json`) têm chaves corrompidas pela extração e **não são fonte para cor/tipografia** — usar o `.md` (seções 4–6).

Dois achados novos que ajustam essa decisão:

### 1.1 `icons.json` não contém dados de ícones

O arquivo `docs/icons.json` (545 bytes de nome, mas conteúdo real inspecionado) não descreve a biblioteca de ícones — seu conteúdo é a página **"notesV1"** (topbar + sidebar + cards de notas), praticamente idêntico em estrutura ao que já está coberto por `navigation.json` + `navigation header.json` + `cards.json`. Isto é consistente com o que o `.md` já registrava (seção 7: "a página de ícones mostra 894 glifos, mas não inclui o nome textual de cada ícone" — o extrator de JSON aparentemente não conseguiu processar a página 1 do PDF e reaproveitou/duplicou dados de outra página sob o nome do arquivo). **Ação:** não há nada de ícones para extrair de `icons.json`; a fonte de nomes de ícone continua sendo o pacote `@phosphor-icons/react` (ou, na decisão já tomada, `lucide-react` por equivalência semântica) — não o PDF/JSON.

### 1.2 `cards.json` **especifica radius numérico** — corrige uma premissa do contexto desta sessão

O contexto recebido para esta tarefa afirma que `--radius-component: 4px` foi aplicado "não em cards/painéis, que o doc não especifica numericamente". Isso não é mais verdade: `docs/cards.json` → bloco `"radii"` traz, para **todas** as variantes de card do catálogo:

| Variante (chave no JSON) | Radius |
|---|---|
| `cardsCompaniesGridRadius` | `4px` |
| `cardsIntegrationsCardRadius` | `4px` |
| `cardsContactRadius` | `4px` |
| `cardsNotesCard2Radius` | `4px` |
| `cardsTaskCardRadius` | `4px` |
| `cardContentRadius` | `4px` |
| `imageRadius` (thumb dentro do card) | `4px` |
| `contentRadius` (chip de ícone) | `8px` |
| `profileRadius` (rodapé de card) | `0px 0px 4px 4px` |

E o `.md`, seção 8.1, já dizia: *"Cards usam borda muito leve... radius pequeno"* / seção 10.11: *"Cards usam pouco arredondamento, borda fina e sombra mínima."* As duas fontes concordam: **os cards do Venture usam praticamente o mesmo raio dos controles (4px), não um raio maior de "superfície".**

O código atual não segue isso — ver seção 3.3.

---

## 2. Matriz de tokens — Venture (JSON) → `src/styles.css`

### 2.1 Alturas de controle (regra do prompt: "controles 32/37/40/48")

Cruzando `buttons styles.json` (`spacing.*Size`), a régua real do Venture tem **quatro** degraus, não três:

| Tamanho Venture | Altura texto (ex. primary/secondary) | Altura icon-only |
|---|---:|---:|
| `small` | **32px** (`128px x 32px`) | 32px |
| `medium` | **37px** (`152px x 37px`) | 36px |
| `large` | **40px** (`175px x 40px`) | 40px |
| `extraLarge` | **48px** (`190px x 48px`) | 48px |

`src/styles.css` (linhas 316–318) define só três tokens:

```css
--control-height-sm: 32px;
--control-height-md: 40px;
--control-height-lg: 48px;
```

**Falta o degrau de 37px** (`medium`, o tamanho mais comum do catálogo — é o default em quase todas as variantes de hierarquia). `.button` (linha 451) usa `min-height: var(--control-height-md)` = **40px**, ou seja, todo botão de texto do produto hoje renderiza no tamanho `large` do Venture (40px), não no `medium` (37px) que é o tamanho padrão do kit para ações de tabela/formulário. Isso é sistemático — afeta todo botão "secondary"/"primary"/"destructive"/"ghost" do app, incluindo os das 6 páginas auditadas (Concluir/Reagendar/Cancelar em Próximas Ações, Abrir/Arquivar em Clientes, todos os botões de ação em Caixa Auvo, Aplicar filtros em Relatórios, Adicionar/Renomear/Reordenar em Administração, Ler todas/Adiar/Arquivar em Notificações).

`.icon-button` (linha 532) também usa `var(--control-height-md)` = 40×40 → isso corresponde ao tier `large` icon-only do Venture (40×40), não ao `medium` (36×36). Coerente entre si (ambos "large"), mas não com o rótulo "md" do nome da variável.

**Veredito:** não é urgente mudar o valor de fato usado hoje (40px é legível e já testado em produção), mas o **nome/escala do token está incompleto** frente à regra "32/37/40/48" pedida explicitamente no prompt de design system. Recomendação (não aplicada nesta auditoria): adicionar `--control-height-compact: 37px` e decidir conscientemente se botões de linha de tabela (Concluir/Reagendar/Cancelar, Abrir/Arquivar) devem usar esse tier compacto em vez do atual 40px — reduziria a altura de linha nas tabelas densas (Clientes, Próximas Ações) sem violar a régua do kit.

### 2.2 Radius

| Token CSS | Valor | Uso real | Venture equivalente | Status |
|---|---|---|---|---|
| `--radius-component` | `4px` | `.button`, `.icon-button`, `.nav-item`, inputs/selects (aplicado nesta sessão) | `buttonsRadius`/`inputBaseRadius`/`navigationSidebarMenuRadius` = `4px` | **fiel** |
| `--radius-sm` | `6px` | dropdown items, chips pequenos | sem equivalente direto — Venture usa 4px pra quase tudo pequeno | **diverge** (leve) |
| `--radius-md` | `8px` | `.panel`, `.metric-card`, `.work-list li`, `.quote-item`, `.auvo-inbox-item`, `.timeline-list li`, `.pipeline-card`, `.notification-list li`, `.notification-popover`, `.table-wrap`, `.confirm-dialog` (via `.panel`) | `cardsContactRadius`/`cardsTaskCardRadius`/`cardContentRadius` = `4px`; `typetaskDetailsRadius`/`notificationPanelRadius` = `8px` | **misto** — ver 3.3 |
| `--radius-lg` | `12px` | `.search-dropdown`, `.pipeline-column` | sem componente Venture equivalente medido (kit não usa 12px em lugar nenhum do catálogo) | **diverge**, mas não crítico (menus/kanban não catalogados) |
| `--radius-full` | `999px` | badges pill, avatar, toast, sheet handle | Badge Venture = `4px` (retangular arredondado leve), **não pill** — ver 3.4 | **diverge** |

### 2.3 Sidebar

`--sidebar-width: 248px` (linha 315) — **bate exatamente** com `navigation.json` → `spacing.statefullSize` = `"248px x 1024px"` (estado expandido da sidebar) e com o `.md` seção 8.2/10.9 ("Sidebar expandida... 248 px úteis"). Já corrigido nesta sessão, confirmado correto pela releitura do JSON — nada a mudar aqui.

---

## 3. Matriz de componentes: Venture → componente React/CSS

### 3.1 Button (`buttons styles.json` + `Button.tsx`)

| Aspecto | Venture (medido) | Código atual | Status |
|---|---|---|---|
| Radius | `4px` (todas as variantes/estados) | `var(--radius-component)` = 4px | **fiel** |
| Altura texto default | `37px` (medium) | `40px` (`--control-height-md`) | **diverge** (+3px, ver 2.1) |
| Padding horizontal (medium) | `8px 12px` | `0 var(--space-4)` = `0 16px` | **diverge** (+4px cada lado) |
| Gap ícone↔label | `8px` (medium) | `var(--space-2)` = 8px | **fiel** |
| Variantes de hierarquia | primary, secondary, secondaryBorder, destructive, tertiary, link | `Button.tsx`: primary, secondary, ghost, destructive | **parcial** — "ghost" do código mistura tertiary/link do Venture (texto sem fundo); não há distinção entre secondary-com-borda e tertiary-sem-borda como o kit tem |
| Estado disabled | opacidade reduzida sobre a mesma cor base | `button:disabled { opacity:0.72 }` (global, linha 405-408) | **fiel** em espírito (o kit também reduz contraste, não inverte cor) |
| Loading | não documentado no kit | spinner customizado (`.button.loading`) | N/A — extensão do produto, aceitável |

### 3.2 Table (`table.json` + `DataTable.tsx` + `styles.css`)

Este é o achado mais importante para **Próximas Ações** e **Clientes**, as duas páginas que mais usam tabela.

| Aspecto | Venture (medido) | Código atual | Status |
|---|---|---|---|
| Anatomia | linhas são **cartões separados** (`rowsRadius: 5px`, `rowsGap: 16px`, `rowsPadding: 16px`) sobre fundo da página — cada linha é uma superfície própria arredondada, não uma grade contínua | `<table>` HTML clássica: `border-collapse: collapse`, `border-bottom: 1px solid var(--border)` em cada `th`/`td` (styles.css 1479-1500) | **diverge estruturalmente** — o Venture explicitamente evita "grades pesadas" (doc §9.24/§10.12: *"evita grades pesadas; usa separadores e superfície"*), o código atual é exatamente a grade pesada que o kit evita |
| Radius do container | `tableHeaderRadius: 5px`, `rowsRadius: 5px`, `listRadius: 5px` | `.table-wrap { border-radius: var(--radius-md) }` = 8px | **diverge** (8px vs 5px) |
| Altura de linha (compacta) | `tableBaseListSize`/`typecontactListSize`: **52-53px** | `th, td { padding: 12px }`, sem altura fixa — altura resultante ≈ 12px×2 + line-height(14px×1.4≈20px) ≈ **44px** (estimado, não medido em runtime) | **aproximado**, dentro da faixa mas não confirmado — recomenda-se medir em runtime antes de declarar fiel |
| Header | superfície clara, radius `5px`, padding `12px` | `th { color: var(--foreground-muted); font-size: var(--text-sm) }`, sem background nem padding distinto do body | **diverge** — Venture separa visualmente o header com superfície própria; código atual só diferencia por cor de texto |
| Badge em célula | `badgeSize: 58x18`, `badgeRadius: 4px` | `.badge` usa `border-radius: var(--radius-full)` (pill) | **diverge** (ver 3.4) |
| Avatar em célula | `displayPictureSize: 24x24`, `displayPictureRadius: 24px` (circular) | `.avatar-sm` = 24×24, `border-radius: var(--radius-full)` | **fiel** |
| Ações em célula | dots-vertical (overflow menu) por linha | botões de texto lado a lado (`Concluir`/`Reagendar`/`Cancelar`; `Abrir`/`Arquivar`) | **diverge de padrão, mas é decisão de produto defensável** — ações nomeadas são mais claras que um menu de overflow para 2-3 ações; não recomendo mudar só por fidelidade visual |

**Correção da instrução do prompt:** "não confunda fidelidade visual com posicionamento absoluto" — o achado acima **não é** sobre posição, é sobre um padrão estrutural (grade vs. cartões separados) que o próprio documento de origem descreve como uma decisão de design deliberada do kit ("evita grades pesadas"). É um achado legítimo de fidelidade, não um pixel-chasing.

### 3.3 Cards (`cards.json` + uso genérico via `.panel`/`.work-list li`/etc.)

Como já estabelecido na seção 1.2, **todos** os cards do Venture usam radius de **4px** (exceto o chip de ícone interno, 8px). O código usa `--radius-md` (**8px**) para praticamente toda superfície tipo card: `.panel`, `.metric-card`, `.auvo-inbox-item`, `.work-list li`, `.quote-item`, `.timeline-list li`, `.pipeline-card`, `.notification-list li`, `.notification-popover`, `.table-wrap`, `.confirm-dialog`.

Isso é uma divergência sistemática e de escopo amplo — praticamente todo "card" visual do produto está 4px mais arredondado que o kit de referência. Não é grave visualmente (8px ainda lê como "raio pequeno"), mas é uma inconsistência real com a fonte, e a instrução do prompt pede "radius 4px como base" — o próprio prompt já assume isso deveria ser 4px.

### 3.4 Badge (`small components.json` + `Badge.tsx`)

| Aspecto | Venture (medido) | Código atual | Status |
|---|---|---|---|
| Forma | retangular com radius pequeno — `typecontainedColor*Radius`: **4px**; só a variante *outlined* usa `36px` (quase pill, mas ainda com canto reto perceptível em telas pequenas) | `.badge { border-radius: var(--radius-full) }` = pill total (999px) | **diverge** — o Venture usa badge "contained" (preenchido, 4px) como padrão para status, não pill |
| Altura | `25px` (small) / `33px` (large) | `min-height: 24px` | **próximo** (25px vs 24px, 1px de diferença — irrelevante) |
| Padding | `4px 6px` (contained small) | não declarado explicitamente, herda de `padding: 0 8px` | **aproximado** |
| Dot indicator | badges com bolinha de status usam dot **separado** do badge (`ellipse817Size: 8x8`, cor sólida da família) + label mais claro atrás | `.badge-positive::before` etc. — mesma ideia (dot + fundo tintado), mas o dot é 6×6 (linha 1543) vs Venture 8×8 | **quase fiel**, diferença pequena |

### 3.5 Navigation / Sidebar (`navigation.json` + `Sidebar.tsx`)

| Aspecto | Venture (medido) | Código atual | Status |
|---|---|---|---|
| Largura expandida | `248px` | `--sidebar-width: 248px` | **fiel** |
| Altura de item de menu | `36px` (`activeyesDropdownnoSize`/`activenoDropdownnoSize`) | `.nav-item { min-height: var(--control-height-md) }` = 40px | **diverge** (+4px) |
| Padding do item | `8px 8px` (todos os lados) + gap `12px` ícone↔label | `padding: 0 var(--space-3)` = só horizontal (12px), vertical vem do min-height | **aproximado** — resultado visual similar, mas não é o mesmo mecanismo |
| Radius do item ativo | `4px` (`activeyesDropdownnoRadius`) | `var(--radius-component)` = 4px (aplicado nesta sessão) | **fiel** |
| Cor de fundo do item ativo | Neutral 30 — `#F2F2F2` (valor idêntico nas duas fontes independentes: `navigation.json` cor `activeyesDropdownno` e o `.md` §4.1 "renderizado" de Neutral 30) | `.nav-item.active/:hover { background: var(--surface-muted) }` → `--surface-muted: var(--background-secondary)` → `--background-secondary: var(--venture-neutral-20)` = `#f7f9fb` | **diverge de degrau** — usa Neutral 20 onde o kit usa Neutral 30 para o estado "selected" (ver `.md` §5.4, tabela Action: Secondary/Selected = Neutral 30). É uma diferença sutil de contraste, não visualmente grosseira, mas é um desvio de um degrau inteiro na escala documentada. |
| Ícones | Phosphor Light, 16/20/24px | `lucide-react`, tamanho não fixado no CSS (herda `1em`/default do SVG, tipicamente 24px) | decisão documentada (manter lucide) — **aceito como divergência deliberada**, não é bug |

### 3.6 Header/Topbar (`navigation header.json` + `Topbar.tsx`)

| Aspecto | Venture (medido) | Código atual | Status |
|---|---|---|---|
| Search bar | `360×41px`, radius `4px` | `.search-box { min-height: 40px; border-radius: var(--radius-component) }` largura flexível (`flex:1`, sem max-width) | **próximo em altura, diverge em largura** — Venture fixa 360px, código deixa fluido (aceitável para responsividade, mas não é o mesmo comportamento) |
| Perfil (chip usuário) | `122×32px` | `.user-chip { min-height: 40px }` | **diverge** (+8px) |
| Badge de notificação no sino | não documentado com medida própria neste JSON, mas o padrão geral de badge pequeno do kit é 4px de radius, não círculo | `.icon-button span` (badge do sino) usa `border-radius: var(--radius-full)` — círculo | **diverge**, mas contagem numérica pequena (1-2 dígitos) fica melhor em círculo que em retângulo — decisão de produto defensável |
| Notification popover | painel dedicado (`Notifications Panel`, 9.27) 499×857px, padding 24px, gap 20px | `.notification-popover { width: min(420px, ...); padding: 14px }` | **diverge** — mais estreito (420 vs 499) e com padding quase metade (14 vs 24) |

---

## 4. Auditoria por página

Para cada página: anatomia-alvo do Venture (via seção 9/14 do `.md` + JSON relevante), estado atual (classes/medidas reais), divergências, e critérios de rejeição para uma futura correção.

### 4.1 Próximas Ações (`ProximasAcoesPage.tsx`)

**Mapeamento oficial (doc §14):** Task List → Próximas Ações, decisão **ADOTAR** (não "adaptar" — o doc pede a anatomia, não uma reinterpretação livre).

**Anatomia-alvo (Task List, doc §9.25 + `table.json` `typetaskList*`):** checkbox de conclusão, título, due date com ícone de calendário, labels/badges, avatar(es) de membro responsável, menu de overflow; item concluído com contraste reduzido (`completedyes*` vs `completedno*` no JSON — mesma estrutura, cor de texto mais apagada).

**Estado atual:** `DataTable` genérico com colunas Ação / Cliente / Contexto / Categoria / Vencimento / Prioridade / Status / Ações. É uma tabela de dados tabulares clássica, **não** a anatomia de lista de tarefas que o documento pede explicitamente para esta página. Não há checkbox de conclusão inline (a conclusão é feita via botão "Concluir" que abre um formulário à parte), não há due date com ícone, não há avatar de responsável na linha.

**Divergência mais relevante da leva de 6 páginas:** esta é a página com o mapeamento mais explícito e mais claramente descumprido — o doc não deixa ambiguidade ("ADOTAR" Task List), e a implementação escolheu uma tabela genérica em vez disso.

**Filtros:** `.segmented-control` (botões pill-ish, `border-radius: var(--radius-md)`=8px) — sem equivalente direto no catálogo Venture (não há "segmented control de filtro de página" medido nos JSON); aceitável como padrão de produto, mas usa radius 8px onde o resto do sistema tende a 4px.

**Critérios de rejeição para uma futura tela corrigida:**
- [ ] Linha de tarefa não pode voltar a ser uma `<tr>` com bordas de grade completa — precisa virar cartão de linha (radius 4-5px, sem border-bottom pesado entre linhas, com `gap` entre linhas em vez de linha divisória).
- [ ] Badge "vencida"/prioridade não pode ser pill (`radius-full`) — usar radius 4px conforme 3.4.
- [ ] Botões de linha (Concluir/Reagendar/Cancelar) devem ser avaliados no tier `medium` (37px) do Venture, não `large` (40px), para não competir visualmente com a densidade da lista.
- [ ] Texto operacional não pode ficar abaixo de 14px (regra do prompt) — confirmar que nenhuma coluna usa `--text-2xs`/`--text-xs` (12px) para o conteúdo principal da linha (categoria/status em badge a 12px é aceitável, título da ação não).

### 4.2 Clientes (`ClientesPage.tsx`)

**Mapeamento oficial (doc §14):** Table → Clientes, decisão **ADAPTAR** (aqui sim, adaptação é explicitamente permitida, incluindo manter paginação real por cursor — o que o código já faz).

**Anatomia-alvo (Table, doc §9.24):** headers em superfície clara distinta do body; linhas com avatar + texto + badge + ações; ordenação por chevron no header.

**Estado atual:** `DataTable` com colunas Nome (avatar + nome + badge condicional "possível duplicidade") / Telefone / Empresa / Oportunidades / Ações (Abrir, Arquivar). Isso **acerta o modelo de conteúdo** do Venture (avatar+texto+badge na primeira coluna, ações nomeadas na última) — é a página com melhor aderência de conteúdo da leva, mesmo com o problema estrutural de grade (§3.2) e radius (§3.3) compartilhado com todas as tabelas do produto.

**Achado de bug real (não é fidelidade visual, é CSS quebrado):** a coluna Nome usa `<span className="cell-primary-text">{customer.nome}</span>` (`ClientesPage.tsx` linha 88) e a mesma classe aparece em `OportunidadesPage.tsx`, mas **`.cell-primary-text` não existe em `src/styles.css`** — confirmado por grep, zero ocorrências. O nome do cliente herda estilo do `<td>` sem nenhum destaque próprio (sem peso de fonte diferenciado do resto da linha), o que é provavelmente não-intencional dado que o nome deveria ser o dado primário/mais destacado da linha (padrão que o Venture segue: nome em peso maior que metadados ao lado).

**Ordenação:** nenhuma das colunas tem chevron de ordenação (o Venture documenta isso como padrão do header de tabela) — `DataTable.tsx` não implementa sort. Não é urgente (paginação por cursor limita o valor de ordenação client-side), mas é uma lacuna de anatomia.

**Formulário "Novo cliente":** usa `.panel.compact-form` com inputs `min-height: 40px`, radius `var(--radius-component)` (4px) — já fiel ao Venture Text Field (`inputBaseRadius: 4px`), altura 40 vs Venture 41px é irrelevante.

**Critérios de rejeição:**
- [ ] Criar `.cell-primary-text` (peso de fonte maior/cor `--foreground` vs. resto `--foreground-muted`) ou remover a classe órfã se a decisão for não destacar o nome.
- [ ] Mesmos critérios de tabela da seção 4.1 (radius, estrutura de linha).
- [ ] Badge "possível duplicidade" usa `className="badge warning"` — confirmar que isso realmente aplica `color: var(--warning)` sobre o badge neutro (funciona, mas é o único badge do produto que combina duas classes soltas em vez de usar uma tonalidade dedicada do componente `Badge.tsx`; considerar padronizar).

### 4.3 Caixa Auvo (`AuvoInboxPanel.tsx` + `CaixaAuvoPage.tsx`)

**Mapeamento oficial (doc §14):** não há entrada explícita para "Caixa Auvo" na tabela de mapeamento — a entrada mais próxima é `Notifications → Sino e página de notificações (ADOTAR densidade e hierarquia)`, já que a Caixa Auvo é fundamentalmente uma fila de triagem de eventos recebidos, mais parecida com um painel de notificações acionáveis do que com uma Task List (que já está reservada para Próximas Ações) ou uma Table clássica.

**Correção a um pressuposto do prompt desta tarefa:** o prompt pediu para comparar Caixa Auvo com a anatomia "Task List" do documento — mas o próprio documento **não mapeia** Task List para Caixa Auvo (mapeia para Próximas Ações, seção 4.1 acima). A comparação mais fiel à intenção documentada é com **Notifications Panel** (doc §9.27) e com o padrão de "card" genérico (doc §9.23), não Task List. Uso essa base abaixo.

**Anatomia-alvo (Notifications Panel + Card genérico):** card por item com avatar/ícone, título, metadado (canal + data), badge de status, corpo/contexto, ações contextuais primárias + secundárias, footer/CTA quando aplicável.

**Estado atual:** `.auvo-inbox-item` (radius 8px, border 1px, padding 14px) contém: avatar + título + metadado (`item.channelType - formatDateTime`) + badge de status + `<dl>` de fatos (telefone, cliente sugerido, resolução, motivo) + barra de ações. **Isso acerta bem a anatomia de card de notificação/triagem** — é estruturalmente a página mais próxima do padrão "card com ações contextuais" do kit, mesmo com o radius 8px vs. 4-5px do Venture.

**Ponto forte real (vale registrar, não é só divergência):** a hierarquia de ações (`SECONDARY_MENU_ACTIONS` agrupadas num dropdown "Mais ações", `DISMISS_ACTIONS` visualmente separadas e com classe `muted-action`) segue exatamente o princípio do Venture de hierarquia de ação por hierarquia visual (doc §5.4: Primary/Secondary/Outline/Destructive como famílias distintas, não 8 botões idênticos) — isso é citado no próprio comentário do CSS (linha 1810-1813) como achado de diagnóstico visual desta mesma refatoração, e é fiel ao espírito do kit.

**Inconsistência de badge de status:** `STATUS_BADGE_CLASS` mistura dois padrões — `novo`/`processado`/`erro_integracao` usam badges "soft" dedicados (`badge-informative`, `badge-positive`, `badge-alert-danger`, todos com dot + fundo tintado), mas `em_analise`/`aguardando_dados` usam a classe genérica `warning` (que só aplica `color: var(--warning)`, sem fundo tintado nem dot) — o resultado visual é um badge "pelado" (fundo cinza padrão + texto laranja) ao lado de badges plenamente tintados, quebrando a consistência da própria lista. É um achado de componente, não de layout.

**`CaixaAuvoPage.tsx`:** wrapper simples (`page-heading` + estado de loading + delega tudo para `AuvoInboxPanel`) — sem divergência própria a registrar além do que já foi listado.

**Critérios de rejeição:**
- [ ] Badge de status: criar tonalidade "warning-soft" (fundo `--background-warning` + dot, no padrão dos outros 3 badges de status) para `em_analise`/`aguardando_dados` em vez da classe `warning` genérica.
- [ ] Radius do card (`.auvo-inbox-item`) alinhado à seção 3.3 (4-5px) se a decisão de padronizar cards for adotada.
- [ ] Manter a hierarquia de ações atual — não é regressão, é acerto a preservar.

### 4.4 Relatórios (`RelatoriosPage.tsx` + `ReportsPanel.tsx`)

**Mapeamento oficial (doc §14):** Dashboard charts → Relatórios comerciais, decisão **ADAPTAR apenas métricas reais** (não pede reprodução literal dos gráficos de exemplo, que são fictícios/e-commerce).

**Anatomia-alvo (Dashboard Charts, doc §9.29):** sparkline de barras, progress bars horizontais, donut, heatmap semanal, paleta monocromática por densidade.

**Estado atual:** grid de 12 `.metric-card` (número + label, sem qualquer elemento gráfico) seguido de 3 tabelas simples (`Oportunidades por etapa`, `Conversão por origem`, `Motivos de perda`) dentro de `.admin-grid` (single column, `grid-template-columns: 1fr` — reaproveitando um layout pensado para Administração, não para relatório). **Não há nenhum elemento visual/gráfico na página** — nem sparkline, nem barra de progresso, nem donut. Isso é esperado dado que "adaptar apenas métricas reais" não exige gráficos, mas é uma divergência estrutural relevante frente à anatomia documentada (uma página chamada "Relatórios" com zero visualização de dados é a maior lacuna funcional/de anatomia entre as 6 páginas auditadas — mesmo sem exigir fidelidade pixel a pixel ao dashboard de exemplo).

**Filtros:** `.filter-grid` (4 colunas fixas: De/Até/Etapa) — Venture não documenta um filtro de relatório específico neste conjunto de JSON, sem comparação direta possível.

**`.admin-grid` reaproveitado:** o nome da classe (`admin-grid`) revela que o layout de 3 tabelas foi copiado do padrão de Administração — no viewport onde `.admin-grid` tem `grid-template-columns: 1fr` (sempre, não só mobile — não há regra responsiva que mude isso para 2-3 colunas em desktop), as 3 tabelas de relatório empilham verticalmente mesmo em telas largas, o que é ineficiente para um relatório com esse volume de dados tabulares curtos.

**Critérios de rejeição:**
- [ ] Em desktop (≥1024px), as 3 tabelas de relatório devem correr lado a lado (ou 2+1) — `.admin-grid` com `1fr` fixo não deveria ser reaproveitado aqui sem uma variante de largura maior, ou a página precisa de uma classe própria.
- [ ] Métricas numéricas (`.metric-card`) sem nenhum indicador de tendência/comparação — se o backend já tiver dado histórico, considerar ao menos uma seta/percentual de variação (não presente hoje, não é regressão, é lacuna).
- [ ] Qualquer visualização adicionada deve usar a paleta monocromática por densidade documentada (doc §9.29), não as 6 cores de matiz (`--interaction-*`) usadas em badges — são propósitos visuais diferentes (dado quantitativo vs. categorização).

### 4.5 Administração (`AdministracaoPage.tsx` + `AdminPanel.tsx`)

**Mapeamento oficial (doc §14):** sem entrada própria — é uma tela de CRUD (etapas de funil, motivos de perda, usuários) sem equivalente direto no catálogo do kit, que é orientado a e-commerce/CRM de contato, não a administração de metadados de pipeline.

**Componentes usados e sua fidelidade:**
- **Tabs** (`Tabs.tsx`): 3 abas (Etapas/Motivos de perda/Usuários), texto puro sem ícone, ativa por underline (`.tab-trigger.is-active { border-bottom-color: var(--primary) }`). Doc §9.19: *"Tabs com ícone+texto... Ativo por underline ou fundo escuro"* — a variante "underline sem ícone" **existe** no kit (`tabOutlineMenu`/`tabOutlineTabs` em `small components.json`, que não têm campo de ícone declarado, diferente de `tabFilledMenu`), então isso é **fiel** a uma das duas variantes documentadas, só não é a variante com ícone. Altura: `.tab-trigger { min-height: 40px }` vs. Venture `tabOutlineMenuSize` altura **48px** (small components) ou **69px** (header, mais alto pois inclui breadcrumb) — diverge, mas dentro de faixa razoável.
- **Tabelas de Etapas/Motivos/Usuários:** `<table>` clássica igual às demais páginas — mesma divergência estrutural da seção 3.2, sem elemento diferencial aqui.
- **PromptDialog** (renomear/reordenar etapa): não inspecionado em detalhe nesta auditoria (fora do escopo explícito dos 13 JSON de componente — não há um `prompt-dialog.json` dedicado); estruturalmente equivalente a um modal simples de formulário, usa `.panel` como as demais superfícies elevadas.

**Critérios de rejeição:**
- [ ] Mesmos critérios de tabela da seção 3.2/4.1 se a decisão de corrigir tabelas for adotada globalmente (não faz sentido corrigir só em Clientes/Próximas Ações e deixar Administração com grade pesada).
- [ ] Badge "terminal" (etapa) e badge "você" (usuário atual) usam a classe genérica `.badge` sem tonalidade — aceitável (são metadados neutros, não status), não é uma divergência a corrigir.

### 4.6 Notificações (`NotificacoesPage.tsx` + `NotificationList.tsx`)

**Mapeamento oficial (doc §14):** Notifications → Sino e página de notificações, decisão **ADOTAR densidade e hierarquia**.

**Anatomia-alvo (Notifications Panel, doc §9.27 + `modals.json` `notificationPanel*`):** painel ~499×857px, padding 24px, gap 20px entre itens, tabs All/Tasks/Archived, "Mark all as read", filtros, configurações, cards de notificação com ações contextuais, CTA inferior de largura total.

**Estado atual — página cheia (`NotificacoesPage.tsx`):**
- Filtros por status (`active`/`read`/`archived`) como botões (`.filter-actions`), não como tabs — aceitável, é uma escolha de padrão diferente mas com a mesma função (o Venture tem *tabs* All/Tasks/Archived; aqui são botões toggle). Rótulos batem conceitualmente: `active`≈"Pendentes", `read`, `archived`≈"Arquivada" — mas falta o filtro por tipo ("Tasks" no Venture não tem equivalente no domínio atual, aceitável).
- "Ler todas" presente (equivalente a "Mark all as read") — **fiel** à ação documentada.
- Cada item (`.notification-list li`): severidade (badge `.severity`, cores urgent/attention/info), título, corpo, timestamp+status, ações (Lida/Adiar/Arquivar). Isso cobre bem a anatomia de card de notificação com ações contextuais.
- **Divergência de densidade:** `.notification-list li { padding: 12px }`, gap entre itens `10px` (`.notification-list { gap: 10px }`) vs. Venture `notificationPanelGap: 20px` — a lista é visivelmente mais densa (compacta) que o padrão do kit. Isso pode ser intencional (mais itens visíveis por scroll), mas é uma divergência mensurável a registrar.
- `.severity` usa `border-radius: var(--radius-full)` (pill) — mesma observação da seção 3.4 sobre badges.

**Estado atual — popover do sino (`Topbar.tsx`):** já coberto na seção 3.6 (largura 420px vs. 499px Venture, padding 14px vs. 24px Venture) — é a versão compacta da mesma lista, reaproveitando `NotificationList.tsx` integralmente, então toda divergência de item listada acima também se aplica aqui.

**Critérios de rejeição:**
- [ ] Se a decisão for aproximar do Venture, aumentar gap entre notificações de 10px para ~16-20px e padding do item de 12px para ~16px — mas medir primeiro quantos itens cabem "above the fold" no popover (420×520px atual) antes de expandir, para não forçar scroll excessivo num componente que hoje já é compacto por design.
- [ ] `.severity` badge → avaliar radius 4px em vez de pill, por consistência com 3.4 (impacto visual pequeno, é um badge de uma palavra).
- [ ] Popover do sino: se for alinhar à largura Venture (499px), confirmar que cabe em viewports de 1024px sem forçar scroll horizontal do restante do header.

---

## 5. Estados — cobertura atual vs. exigida pelo kit

O `.md` (§16, checklist de implementação) exige: *focus-visible, error, success, loading, disabled*.

| Estado | Cobertura no CSS/componentes | Nota |
|---|---|---|
| `:focus-visible` | Global (linha 410-417), aplicado a button/input/select/textarea/a | **fiel** |
| `disabled` | Global (`button:disabled`), `.button.loading` desabilita interação | **fiel** |
| `loading` | `.button.loading` com spinner | **fiel**, aliás mais completo que o que os JSON documentam (kit só mostra o estado visual, não a mecânica) |
| `error` (campo) | Não encontrado um padrão dedicado (`.field-error`/similar) nas 6 páginas auditadas — erros de formulário aparecem como `.alert.danger-alert` de página inteira, não como erro inline por campo | **lacuna** — Venture documenta erro inline por campo (`property1error`, borda + helper text vermelho) e nenhuma das 6 páginas usa esse padrão; toda validação de formulário nas páginas auditadas é "erro solto no topo da seção", não "campo com borda vermelha + texto de erro abaixo dele" |
| `success` (campo) | Idem — não encontrado | **lacuna**, mesma observação |
| `hover`/`active` | Cobertos via `:hover:not(:disabled)` nos botões/nav-items/dropdown items | **fiel** |

Este é um achado transversal às 6 páginas: nenhuma delas implementa erro/sucesso **por campo** — todas usam alerta de seção (`role="alert"`). Isso é aceitável como decisão de produto (menos código, mais simples), mas é uma divergência real e sistemática frente ao padrão de Text Field documentado (`text field.json`, variantes `property1error`/`property1success` com tamanho e cor próprios).

---

## 6. Achados extras (fora da matriz principal, mas confirmados nesta auditoria)

1. **`.cell-primary-text` é uma classe CSS órfã** — usada em `ClientesPage.tsx` e `OportunidadesPage.tsx`, sem nenhuma regra em `src/styles.css`. Confirmado por grep no arquivo inteiro (zero ocorrências fora dos dois `.tsx`). Não é fidelidade Venture, é um bug de implementação incompleta.
2. **Badge de status inconsistente em Caixa Auvo** (`STATUS_BADGE_CLASS`) — 4 de 6 status usam badge "soft" tintado, 2 usam a classe utilitária `warning` (só cor de texto). Ver §4.3.
3. **`icons.json` não é fonte de ícones** — conteúdo real é uma página de app (notas), não a biblioteca Phosphor. Ver §1.1. Não afeta nenhuma decisão já tomada (Phosphor vs. lucide), só corrige o que se pode extrair desse arquivo especificamente (nada).
4. **`cards.json` contradiz a premissa "cards não têm radius numérico documentado"** — tem, e é 4px. Ver §1.2 e §3.3. Este é o achado com maior potencial de mudança de escopo: se a correção de radius de card for aplicada, afeta praticamente toda superfície elevada do produto (`.panel` e todos os seus derivados), não só as 6 páginas desta auditoria.
5. **`.admin-grid` reaproveitado em Relatórios sem responsividade própria** — força empilhamento vertical de 3 tabelas mesmo em desktop largo. Ver §4.4.

---

## 7. Layout alvo — desktop / mobile (referência para implementação futura)

Não é objetivo desta auditoria prescrever CSS novo, mas registrar, por página, o que muda por breakpoint hoje (já implementado) vs. o que o kit sugere, para orientar o plano da seção 8.

| Página | Desktop hoje | Mobile hoje (`≤767px`) | Gap vs. Venture |
|---|---|---|---|
| Próximas Ações | `DataTable` full-width, `.segmented-control` de filtros no topo | `.table-wrap.mobile-cards` converte linhas em cards empilhados com `data-label` | Conversão para "cards" só acontece no mobile — no desktop seria a estrutura nativa do Venture (linhas-cartão) já em vigor; hoje o desktop usa grade e o mobile "finge" cartões via CSS attr — inversão de prioridade |
| Clientes | Idem + formulário `.compact-form` acima da tabela | Idem `.mobile-cards` + `.filter-grid`/`.summary-card dl` colapsam para 1 coluna | Mesmo gap de tabela |
| Caixa Auvo | `.auvo-inbox-list` já é lista de cards (gap 12px) em ambos breakpoints — não depende de conversão responsiva | Sem mudança estrutural, só reflow de `.auvo-inbox-action-bar` (`flex-wrap`) | Menor gap entre páginas — já é "card" nativamente |
| Relatórios | `.reports-metrics-grid` (`auto-fit, minmax(160px,1fr)`) + `.admin-grid` (1 coluna sempre) | `.filter-grid` colapsa para 2 colunas em tablet, 1 em mobile | Falta variante desktop-wide para as 3 tabelas, ver §4.4 |
| Administração | `.admin-grid` 1 coluna (usado só para os headers/forms, não para múltiplas tabelas simultâneas como Relatórios) + `Tabs` | `.admin-grid` já é 1 coluna em todos os breakpoints (não há mudança) | Sem gap relevante |
| Notificações | `.notifications-page` full width, `.notification-list` 1 coluna | `header` do painel colapsa para 1 coluna (`.notification-popover header`/`.notifications-page header`) | Sem gap estrutural, só densidade (§4.6) |

---

## 8. Plano de implementação (priorizado)

**P0 — bugs reais (não são "fidelidade", são erros de implementação):**
1. Adicionar `.cell-primary-text` a `src/styles.css` (peso/cor de destaque) ou remover a classe órfã de `ClientesPage.tsx`/`OportunidadesPage.tsx`. — Achado §6.1
2. Corrigir badge de status "em_analise"/"aguardando_dados" em `AuvoInboxPanel.tsx` para usar tonalidade soft dedicada em vez da classe `warning` genérica. — Achado §4.3/§6.2
3. `.admin-grid` em `RelatoriosPage.tsx`/`ReportsPanel.tsx`: dar uma variante de largura maior em desktop (ou classe própria) para as 3 tabelas correrem lado a lado. — Achado §4.4/§6.5

**P1 — decisão de escopo a tomar antes de mexer em CSS (afeta o produto inteiro, não só as 6 páginas):**
4. Decidir se `--radius-md` (8px) usado em cards/painéis migra para 4-5px conforme `cards.json`/`table.json` (achado §1.2/§3.3). Se sim, é uma mudança de token único (`--radius-md` → redefinir, ou introduzir `--radius-card: 4px` e reatribuir cada classe) que cascateia para dezenas de seletores — fazer como tarefa dedicada, com screenshot antes/depois de pelo menos 3 páginas representativas (uma com tabela, uma com cards de lista, um modal).
5. Decidir se o tier de altura `medium` (37px) do Venture é introduzido como `--control-height-compact` para botões de linha de tabela (Concluir/Reagendar/Cancelar, Abrir/Arquivar), mantendo 40px para botões de formulário/página. — Achado §2.1

**P2 — estrutural, maior esforço, maior risco de regressão visual (fazer com protótipo isolado antes de tocar produção):**
6. Próximas Ações: avaliar migrar de `DataTable` genérico para a anatomia Task List (checkbox inline, due date com ícone, avatar de responsável, overflow menu) — é o gap mais explicitamente documentado (mapeamento "ADOTAR", não "ADAPTAR"). — Achado §4.1
7. Tabela genérica (`DataTable`/`<table>`): avaliar migração de grade clássica para padrão "linha-cartão" (radius, gap entre linhas, sem border-bottom pesado) — afeta Próximas Ações, Clientes, Administração (3 tabelas) e as 3 tabelas de Relatórios. — Achado §3.2

**P3 — polimento, baixo risco, pode ser feito a qualquer momento:**
8. Badge: avaliar migrar de pill (`radius-full`) para radius 4px conforme Venture — afeta `Badge.tsx`, `.severity`, badges soft/alerta em todas as páginas.
9. Erro/sucesso por campo em formulários (Clientes "Novo cliente", Caixa Auvo formulário de ação, Administração formulários inline) — hoje só existe alerta de seção; considerar padrão inline por campo alinhado a `text field.json` (`property1error`/`property1success`). — Achado §5

**Regra de saída para qualquer item deste plano:** nenhum item é considerado concluído sem (a) screenshot antes/depois em light e dark, (b) screenshot em pelo menos um breakpoint mobile de referência (360×800 ou 390×844) e (c) confirmação de que texto operacional permanece ≥14px e controles permanecem em 32/37/40/48.
