# Decisões — Reconstrução Artec CRM

Registro de decisões tomadas quando havia conflito entre fontes ou ambiguidade, conforme seções 3.2/3.3/6 do prompt mestre v2. Ordem cronológica.

## D001 — Precedência de tokens: JSON novos de `docs/` vs. `ANALISE-PIXEL-A-PIXEL-VENTURE-DESIGN-SYSTEM.md`

**Data**: 2026-07-23 (Gate 0)

**Conflito**: o prompt determina que tokens formais em `docs/` têm precedência #1, acima do documento pixel-a-pixel (#3). Os 13 arquivos JSON adicionados em `docs/` (extrações automáticas do PDF Venture) não são uniformes em qualidade.

**Evidência**:
- `docs/global colors.json`, `docs/color tokens.json`, `docs/typography.json`: os nomes de propriedade foram derivados do texto de descrição da página do PDF pela ferramenta de extração, não do nome semântico real da variável Figma. Contradições internas comprovadas: a chave `"1a1a1a"` aponta para o valor `"#afafaf"` (cores diferentes); a chave `"48PxFontSize"` aponta para `"16px"` (números diferentes). Nenhuma das 71 cores da escala Neutral/Red/Orange/Lime/Purple/Green/Irish (0-100) documentada no PDF aparece nesses arquivos — só cores incidentais de fundo/decoração da própria página.
- `docs/buttons styles.json`, `docs/table.json`, `docs/selector.json`, `docs/small components.json`, `docs/modals.json`, `docs/navigation.json`, `docs/navigation header.json`, `docs/cards.json`, `docs/text field.json`, `docs/icons.json`: usam a sintaxe nativa de propriedades de variante do Figma (ex. `"size:medium/hierarchy:primary/state:default/icon-only:false/...": "152px x 37px"`) — nomenclatura estruturada e consistente, e os valores batem com as medições independentes do `ANALISE-PIXEL-A-PIXEL-VENTURE-DESIGN-SYSTEM.md` (ex.: checkbox 20×20px confere nos dois).

**Decisão**: tratar os dois grupos de arquivos separadamente quanto à precedência:
- Para **dimensões e variantes de componente** (botão, input, select, card, modal, tabela, navegação, ícones): os JSON de `docs/` prevalecem, conforme a regra geral — são mais granulares e específicos que o MD.
- Para **cor e tipografia**: mantém-se `docs/ANALISE-PIXEL-A-PIXEL-VENTURE-DESIGN-SYSTEM.md` como fonte, porque os JSON equivalentes não contêm a escala de cor real e têm associações chave→valor comprovadamente quebradas. Isso é uma exceção documentada à ordem de precedência padrão, justificada por qualidade de dado, não por preferência.

**Impacto**: nenhum valor de cor ou tipografia já aplicado em `src/styles.css` nesta sessão precisa ser revertido — a paleta Venture (`--venture-*`) já vem do MD. Dimensões de componente (radius de controle, altura de botão) devem ser conferidas contra os novos JSON no Gate 4 e ajustadas se divergirem.

**Responsável**: agente principal (Claude), sem consulta ao usuário, conforme autorização de "não fazer perguntas — o que precisar saber está no prompt".

**Correção (Gate 1, auditoria de design)**: a suposição inicial de que "cards/painéis não têm radius numérico especificado" estava errada. Verifiquei diretamente `docs/cards.json` — especifica 4px em quase todas as variantes de card (`cardsContactRadius`, `cardsTaskCardRadius`, `cardsIntegrationsCardRadius`, `cardsCompaniesGridRadius`, `cardContentRadius`, `badgeRadius`), com exceção de `contentRadius` (8px, área interna específica) e radii circulares de avatar/foto (24px, não comparável). Isso significa que `--radius-md` (8px), hoje usado em praticamente todo `.panel`/card do produto, diverge do kit — correção pendente no Gate 4, junto com o restante da auditoria de design.

---

## D002 — Commit local não pushado

**Data**: 2026-07-23 (Gate 0)

**Achado**: existe um commit local (`43f412d "refatoração no layout e backend"`) contendo todo o trabalho de Gates 2-4 anteriores a este reinício. Foi feito pelo usuário diretamente (fora do controle deste agente) e não está sincronizado com `origin`.

**Decisão**: não commitar, não pushar, não alterar esse commit. Aguardar autorização explícita do usuário para qualquer ação de commit/push, conforme proibição textual do prompt mestre v2 (seção 2 e 19), que tem precedência sobre pedidos anteriores na conversa.
