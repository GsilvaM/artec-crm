# Venture CRM Dashboard UI Kit — análise pixel a pixel

**Fonte analisada:** `Venture - CRM Dashboard UI kit (Community).pdf`  
**Data da análise:** 2026-07-23  
**Formato da análise:** geometria vetorial nativa do PDF + inspeção visual das 15 páginas.

> Esta especificação foi produzida a partir das coordenadas, preenchimentos vetoriais, textos e imagens do PDF. Na renderização nativa usada nesta análise, as dimensões do bitmap coincidem com as dimensões da página do PDF; portanto, as coordenadas abaixo podem ser tratadas como pixels de referência em 72 dpi. Em outros DPIs, escale proporcionalmente.

> Limitação importante: a página de ícones mostra 894 glifos, mas não inclui o nome textual de cada ícone. O documento permite catalogar categorias, estilo e quantidade; os nomes individuais devem ser obtidos no pacote Phosphor Icons 1.3.1 ou no Figma/MCP.

## 1. Metodologia

- Leitura estrutural de 15 páginas.
- Renderização nativa sem OCR.
- Extração de blocos de texto com bounding boxes.
- Extração de desenhos vetoriais, dimensões e cores de preenchimento.
- Comparação entre HEX declarado nos cartões e a cor realmente renderizada.
- Inspeção visual de hierarquia, anatomia de componentes, estados e padrões.
- Identificação de elementos do Figma que não pertencem ao produto, como contornos violetas de seleção.

## 2. Mapa do documento

| Página | Conteúdo | Dimensão nativa | Blocos de texto | Vetores | Imagens |
|---:|---|---:|---:|---:|---:|
| 1 | Phosphor Icons 1.3.1 | 3392 × 2653 px | 14 | 3152 | 1 |
| 2 | Global Colors | 1570 × 5288 px | 81 | 521 | 0 |
| 3 | Semantic Colors | 1570 × 11571 px | 124 | 714 | 0 |
| 4 | Typography | 1570 × 4606 px | 84 | 120 | 0 |
| 5 | Button | 1570 × 2054 px | 79 | 550 | 0 |
| 6 | Input Elements | 1570 × 2922 px | 61 | 186 | 0 |
| 7 | Selector | 1570 × 3590 px | 73 | 250 | 4 |
| 8 | Small Components | 1570 × 5210 px | 47 | 550 | 25 |
| 9 | Navigation | 1570 × 1824 px | 40 | 248 | 0 |
| 10 | Header | 1570 × 917 px | 6 | 74 | 1 |
| 11 | Cards | 1570 × 1478 px | 43 | 160 | 8 |
| 12 | Table | 1570 × 2036 px | 34 | 311 | 9 |
| 13 | Modals | 1570 × 3856 px | 48 | 334 | 11 |
| 14 | Dashboard | 1570 × 1117 px | 12 | 121 | 0 |
| 15 | Others | 1570 × 1522 px | 7 | 27 | 0 |

## 3. Estrutura visual compartilhada

As páginas 2 a 15 usam um template visual comum:

| Elemento | Coordenada / dimensão | Observação |
|---|---:|---|
| Largura da página | 1570 px | Página 1 é exceção: 3392 px |
| Hero superior | 1570 × 614 px | Fundo `#F9F9F9` / branco, com hexágonos decorativos |
| Logo Venture | x≈76, y≈79 | Marca no canto superior esquerdo |
| Palavra “Venture” | x≈136.5, y≈80.8 | Identificação do kit |
| Rótulo da página | y≈88, alinhado à direita | Ex.: “Button”, “Navigation” |
| Título principal | x=76, y≈210.6 | Caixa visual de cerca de 96 px de altura |
| Descrição | x=76, y≈363.2 | Corpo grande em cinza |
| Margem de títulos | 76 px | Usada no hero |
| Margem dos boards | 56 px | Usada nas áreas de componentes |
| Início típico do conteúdo | y≈610–704 | Varia por página |
| Guia violeta tracejada | `#9747FF` | É contorno de seleção do Figma, não UI do produto |

### 3.1 Padrão de fundo

- Superfície clara, praticamente branca.
- Hexágonos grandes apenas como textura, com contraste muito baixo.
- A textura não deve competir com título ou conteúdo.
- No CRM final, esse recurso deve ser usado com moderação; ele funciona melhor em páginas de documentação/marketing do que em telas operacionais.

## 4. Sistema de cores global — valor renderizado

Os valores abaixo foram extraídos diretamente dos preenchimentos vetoriais dos swatches. Eles representam a cor efetivamente desenhada no PDF.

### 4.1 Neutral

| Nível | HEX renderizado | RGB | HEX declarado no documento | Situação |
|---:|---|---|---|---|
| 100 | `#000000` | `0, 0, 0` | `#0000 (rótulo truncado; intenção provável #000000)` | **diverge** |
| 90 | `#4B4B4B` | `75, 75, 75` | `#36383B` | **diverge** |
| 80 | `#717171` | `113, 113, 113` | `#6D7076` | **diverge** |
| 70 | `#AFAFAF` | `175, 175, 175` | `#A3A7B0` | **diverge** |
| 60 | `#D8D8D8` | `216, 216, 216` | `#D9DFEB` | **diverge** |
| 50 | `#E4E4E4` | `228, 228, 228` | `#E1E5EF` | **diverge** |
| 40 | `#E8E8E8` | `232, 232, 232` | `#E8ECF3` | **diverge** |
| 30 | `#F2F2F2` | `242, 242, 242` | `#F0F2F7` | **diverge** |
| 20 | `#F9F9F9` | `249, 249, 249` | `#F7F9FB` | **diverge** |
| 10 | `#FDFDFD` | `253, 253, 253` | `#FCFCFE` | **diverge** |
| 0 | `#FFFFFF` | `255, 255, 255` | `#0000 (rótulo incorreto/truncado; swatch é branco)` | **diverge** |

### 4.2 Red

| Nível | HEX renderizado | RGB | HEX declarado no documento | Situação |
|---:|---|---|---|---|
| 100 | `#230F0F` | `35, 15, 15` | `#230F0F` | **coincide** |
| 90 | `#461E1E` | `70, 30, 30` | `#461E1E` | **coincide** |
| 80 | `#692D2D` | `105, 45, 45` | `#6D7076` | **diverge** |
| 70 | `#8C3C3C` | `140, 60, 60` | `#8C3C3C` | **coincide** |
| 60 | `#AF4B4B` | `175, 75, 75` | `#D9DFEB` | **diverge** |
| 50 | `#BF6F6F` | `191, 111, 111` | `#BF6F6F` | **coincide** |
| 40 | `#CF9393` | `207, 147, 147` | `#CF9393` | **coincide** |
| 30 | `#DFB7B7` | `223, 183, 183` | `#DFB7B7` | **coincide** |
| 20 | `#EFDBDB` | `239, 219, 219` | `#EFDBDB` | **coincide** |
| 10 | `#F7EDED` | `247, 237, 237` | `#F7EDED` | **coincide** |

### 4.3 Orange

| Nível | HEX renderizado | RGB | HEX declarado no documento | Situação |
|---:|---|---|---|---|
| 100 | `#2A1C0C` | `42, 28, 12` | `#2A1C0C` | **coincide** |
| 90 | `#543918` | `84, 57, 24` | `#543918` | **coincide** |
| 80 | `#7E5525` | `126, 85, 37` | `#7E5525` | **coincide** |
| 70 | `#A87231` | `168, 114, 49` | `#A87231` | **coincide** |
| 60 | `#D28E3D` | `210, 142, 61` | `#D28E3D` | **coincide** |
| 50 | `#DBA564` | `219, 165, 100` | `#DBA564` | **coincide** |
| 40 | `#E4BB8B` | `228, 187, 139` | `#E4BB8B` | **coincide** |
| 30 | `#EDD2B1` | `237, 210, 177` | `#EDD2B1` | **coincide** |
| 20 | `#F6E8D8` | `246, 232, 216` | `#F6E8D8` | **coincide** |
| 10 | `#FBF4EC` | `251, 244, 236` | `#FBF4EC` | **coincide** |

### 4.4 Lime

| Nível | HEX renderizado | RGB | HEX declarado no documento | Situação |
|---:|---|---|---|---|
| 100 | `#232206` | `35, 34, 6` | `#232206` | **coincide** |
| 90 | `#47440C` | `71, 68, 12` | `#47440C` | **coincide** |
| 80 | `#6A6711` | `106, 103, 17` | `#6A6711` | **coincide** |
| 70 | `#8E8917` | `142, 137, 23` | `#8E8917` | **coincide** |
| 60 | `#B1AB1D` | `177, 171, 29` | `#B1AB1D` | **coincide** |
| 50 | `#C1BC4A` | `193, 188, 74` | `#C1BC4A` | **coincide** |
| 40 | `#D0CD77` | `208, 205, 119` | `#D0CD77` | **coincide** |
| 30 | `#E0DDA5` | `224, 221, 165` | `#E0DDA5` | **coincide** |
| 20 | `#EFEED2` | `239, 238, 210` | `#EFEED2` | **coincide** |
| 10 | `#F7F7E8` | `247, 247, 232` | `#F7F7E8` | **coincide** |

### 4.5 Purple

| Nível | HEX renderizado | RGB | HEX declarado no documento | Situação |
|---:|---|---|---|---|
| 100 | `#1E0F23` | `30, 15, 35` | `#1E0F23` | **coincide** |
| 90 | `#3C1E46` | `60, 30, 70` | `#3C1E46` | **coincide** |
| 80 | `#592D69` | `89, 45, 105` | `#592D69` | **coincide** |
| 70 | `#773C8C` | `119, 60, 140` | `#773C8C` | **coincide** |
| 60 | `#954BAF` | `149, 75, 175` | `#954BAF` | **coincide** |
| 50 | `#AA6FBF` | `170, 111, 191` | `#AA6FBF` | **coincide** |
| 40 | `#BF93CF` | `191, 147, 207` | `#BF93CF` | **coincide** |
| 30 | `#D5B7DF` | `213, 183, 223` | `#D5B7DF` | **coincide** |
| 20 | `#EADBEF` | `234, 219, 239` | `#EADBEF` | **coincide** |
| 10 | `#F4EDF7` | `244, 237, 247` | `#F4EDF7` | **coincide** |

### 4.6 Green

| Nível | HEX renderizado | RGB | HEX declarado no documento | Situação |
|---:|---|---|---|---|
| 100 | `#122015` | `18, 32, 21` | `#122015` | **coincide** |
| 90 | `#233F29` | `35, 63, 41` | `#233F29` | **coincide** |
| 80 | `#355F3E` | `53, 95, 62` | `#233F29` | **diverge** |
| 70 | `#467E52` | `70, 126, 82` | `#467E52` | **coincide** |
| 60 | `#589E67` | `88, 158, 103` | `#589E67` | **coincide** |
| 50 | `#79B185` | `121, 177, 133` | `#79B185` | **coincide** |
| 40 | `#9BC5A4` | `155, 197, 164` | `#9BC5A4` | **coincide** |
| 30 | `#BCD8C2` | `188, 216, 194` | `#BCD8C2` | **coincide** |
| 20 | `#DEECE1` | `222, 236, 225` | `#DEECE1` | **coincide** |
| 10 | `#EEF5F0` | `238, 245, 240` | `#EEF5F0` | **coincide** |

### 4.7 Irish

| Nível | HEX renderizado | RGB | HEX declarado no documento | Situação |
|---:|---|---|---|---|
| 100 | `#121320` | `18, 19, 32` | `#121320` | **coincide** |
| 90 | `#23263F` | `35, 38, 63` | `#23263F` | **coincide** |
| 80 | `#35395F` | `53, 57, 95` | `#35395F` | **coincide** |
| 70 | `#464C7E` | `70, 76, 126` | `#464C7E` | **coincide** |
| 60 | `#585F9E` | `88, 95, 158` | `#585F9E` | **coincide** |
| 50 | `#797FB1` | `121, 127, 177` | `#797FB1` | **coincide** |
| 40 | `#9B9FC5` | `155, 159, 197` | `#9B9FC5` | **coincide** |
| 30 | `#BCBFD8` | `188, 191, 216` | `#BCBFD8` | **coincide** |
| 20 | `#DEDFEC` | `222, 223, 236` | `#DEDFEC` | **coincide** |
| 10 | `#EEEFF5` | `238, 239, 245` | `#EEEFF5` | **coincide** |

### 4.8 Divergências críticas de cor

- O PDF não é internamente consistente: vários HEX escritos não correspondem ao preenchimento renderizado.
- `Neutral 90`: texto `#36383B`, preenchimento real `#4B4B4B`.
- `Neutral 80`: texto `#6D7076`, preenchimento real `#717171`.
- `Neutral 70`: texto `#A3A7B0`, preenchimento real `#AFAFAF`.
- `Neutral 60`: texto `#D9DFEB`, preenchimento real `#D8D8D8`.
- `Red 80`: texto incorreto `#6D7076`, preenchimento real `#692D2D`.
- `Red 60`: texto incorreto `#D9DFEB`, preenchimento real `#AF4B4B`.
- `Green 80`: texto repete `#233F29`, preenchimento real `#355F3E`.
- Para implementação com fidelidade visual, use a coluna **HEX renderizado**; para fidelidade nominal ao arquivo Figma, confirme as Variables pelo MCP.

## 5. Sistema semântico de cores

O documento estabelece explicitamente que cores globais não devem ser usadas diretamente nos componentes.

### 5.1 Content

| Tema | Token | Origem global | Uso |
|---|---|---|---|
| Dark | `content.primary` | Neutral 100 | Texto/ícone principal |
| Dark | `content.secondary` | Neutral 80 | Texto secundário |
| Dark | `content.tertiary` | Neutral 70 | Metadados |
| Dark | `content.disabled` | Neutral 60 | Conteúdo desabilitado |
| Dark | `content.informative` | Blue 60 | Informativo |
| Dark | `content.positive` | Green 60 | Positivo |
| Dark | `content.error` | Red 60 | Erro |
| Light | `content.primary` | Neutral 0 | Conteúdo principal sobre fundo escuro |
| Light | `content.secondary` | Neutral 20 | Conteúdo secundário sobre fundo escuro |
| Light | `content.tertiary` | Neutral 30 | Metadados sobre fundo escuro |
| Light | `content.disabled` | Neutral 60 | Conteúdo desabilitado |
| Light | `content.informative` | Blue 60 | Informativo |
| Light | `content.positive` | Green 60 | Positivo |
| Light | `content.error` | Red 60 | Erro |

### 5.2 Border

| Token | Origem | Observação |
|---|---|---|
| `border.primary` | Neutral 40 | Borda padrão clara |
| `border.secondary` | Neutral 60 | Borda mais forte |
| `border.tertiary` | Neutral 100 | Borda de alto contraste |
| `border.informative` | Blue 30 | Borda informativa |
| `border.positive` | Green 30 | Borda positiva |
| `border.error` | Red 30 | Borda de erro |
| `border.warning` | Blue 30 no texto | O swatch visual é pêssego; provável Orange 30. Inconsistência a confirmar. |

### 5.3 Background

| Token | Origem |
|---|---|
| `background.primary` | Neutral 0 |
| `background.secondary` | Neutral 20 |
| `background.tertiary` | Neutral 30 |
| `background.blue` | Blue 10 |
| `background.green` | Green 10 |
| `background.red` | Red 10 |
| `background.orange` | Orange 10 |
| `background.purple` | Purple 10 |
| `background.yellow` | Yellow 10 |

### 5.4 Action

| Família | Base | Hover | Active | Selected | Disabled | Extra |
|---|---|---|---|---|---|---|
| Primary | Neutral 90 | Neutral 80 | Neutral 100 | Neutral 90 | Neutral 20 | — |
| Secondary | Neutral 0 | Neutral 40 | Neutral 50 | Neutral 30 | Neutral 20 | Base 2: Neutral 30 |
| Outline | Neutral 50 | Neutral 60 | Neutral 70 | Neutral 70 | Neutral 30 | — |
| Destructive | Red 50 | Red 60 | Red 70 | Red 60 | Red 20 | — |

### 5.5 Interaction

| Família | Base | Hover | Active | Selected | Disabled |
|---|---|---|---|---|---|
| Primary | Neutral 90 | Neutral 80 | Neutral 100 | Neutral 90 | Neutral 20 |
| Secondary | Neutral 0 | Neutral 30 | Neutral 50 | Neutral 30 | Neutral 20 |
| Outline | Neutral 60 | Neutral 70 | Neutral 80 | Neutral 70 | Neutral 40 |
| Red | Red 60 | Red 70 | Red 80 | Red 70 | Red 20 |
| Green | Green 60 | Green 70 | Green 80 | Green 70 | Green 20 |
| Blue | Blue 60 | Blue 70 | Blue 80 | Blue 70 | Blue 20 |
| Yellow | Yellow 60 | Yellow 70 | Yellow 80 | Yellow 70 | Yellow 20 |
| Purple | Purple 60 | Purple 70 | Purple 80 | Purple 70 | Purple 20 |
| Orange | Orange 60 | Orange 70 | Orange 80 | Orange 70 | Orange 20 |

### 5.6 Lacunas semânticas

- A página de cores globais não apresenta uma família chamada **Blue**; o kit usa **Irish**, visualmente azul/índigo. É provável que `Irish` seja a fonte real dos tokens Blue.
- A página de cores globais usa **Lime**, enquanto a semântica usa **Yellow**. É provável que `Lime` alimente Yellow.
- Não faça aliases permanentes sem confirmar as Figma Variables.

## 6. Tipografia

### 6.1 Família

- Família declarada: **Inter**.
- Pesos documentados: Regular, Medium e SemiBold.
- Os objetos de texto do PDF foram convertidos em Type 3, então o nome da fonte não está preservado nos metadados do PDF; a especificação visual da página 4 é a fonte de verdade.

### 6.2 Escala completa

| Token sugerido | Nome no kit | Tamanho | Peso | Uso recomendado |
|---|---|---:|---|---|
| `heading-1` | Heading / Heading 1 | 48px | Medium | Hero, documentação; não usar como padrão em CRM |
| `heading-2` | Heading / Heading 2 | 32px | Medium | Título principal de tela desktop |
| `heading-3` | Heading / Heading 3 | 28px | Medium | Título de página |
| `heading-4` | Heading / Heading 4 | 24px | Medium | Seção principal |
| `heading-5` | Heading / Heading 5 | 20px | Medium | Card/section heading |
| `body-xl-semibold` | Body / Extra Large | 20px | SemiBold | Destaques |
| `body-xl-medium` | Body / Extra Large | 20px | Medium | Destaques leves |
| `body-xl-regular` | Body / Extra Large | 20px | Regular | Introduções |
| `body-lg-semibold` | Body / Large | 18px | SemiBold | Subtítulos |
| `body-lg-medium` | Body / Large | 18px | Medium | Subtítulos |
| `body-lg-regular` | Body / Large | 18px | Regular | Corpo confortável |
| `body-md-semibold` | Body / Medium | 16px | SemiBold | Itens prioritários |
| `body-md-medium` | Body / Medium | 16px | Medium | Labels importantes |
| `body-md-regular` | Body / Medium | 16px | Regular | Corpo principal |
| `body-sm-semibold` | Body / Small | 14px | SemiBold | Tabela/card |
| `body-sm-medium` | Body / Small | 14px | Medium | Controles |
| `body-sm-regular` | Body / Small | 14px | Regular | Corpo operacional |
| `body-xs-semibold` | Body / Extra Small | 12px | SemiBold | Badge/meta |
| `body-xs-medium` | Body / Extra Small | 12px | Medium | Label pequeno |
| `body-xs-regular` | Body / Extra Small | 12px | Regular | Metadado |

### 6.3 Observações geométricas

- O título das páginas de documentação ocupa uma caixa de aproximadamente 96 px de altura.
- A escala de 48 px é adequada ao hero, não à operação diária.
- O CRM deve trabalhar principalmente entre 14 e 32 px.
- Textos de 10–11 px presentes no frontend atual não pertencem à escala documentada.
- O documento não declara line-height formal; valores devem ser confirmados no Figma. Pela renderização, headings usam aproximadamente 1.0–1.2 e corpos 1.4–1.6.

## 7. Sistema de ícones

- Biblioteca: **Phosphor Icons 1.3.1**.
- Estilo exibido: **Light**.
- Quantidade declarada: **894 ícones**.
- Autores declarados: Tobias Fried e Helena Zhang.
- URL declarada: `phosphoricons.com`.

### 7.1 Categorias visíveis

- Arrows
- Communications
- Health & Wellness
- Office & Editing
- System & Devices
- Maps & Travel
- Design
- Math & Finance
- People
- Brands
- Time
- Development
- Security & Warnings
- Media
- Weather & Nature
- Commerce
- Education
- Games

### 7.2 Regras de implementação

- Use uma única família de ícones.
- Para aderência máxima ao kit, use `@phosphor-icons/react` em peso `light` ou `regular` conforme legibilidade.
- Imports devem ser nomeados e tree-shaken.
- Ícone sozinho exige `aria-label` ou tooltip.
- Ações principais não devem ser somente ícones.
- Tamanhos operacionais recomendados: 16, 20 e 24 px; 32+ apenas para empty states/ilustrações.
- Os nomes individuais dos 894 ícones não podem ser extraídos do PDF porque não estão rotulados.

## 8. Métricas de forma e espaçamento

### 8.1 Bordas e raios

- Botões e inputs possuem raio vetorial medido de **4 px**.
- Bordas dos inputs e botões outline têm **1 px**.
- Cards usam borda muito leve, normalmente `Neutral 50` / `#E4E4E4` renderizado.
- Contornos violetas `#9747FF` são seleção do Figma, nunca devem entrar no produto.

### 8.2 Escala de dimensões recorrentes

| Categoria | Dimensões medidas |
|---|---|
| Botão textual | 190×48, 175×40, 152×37, 128×32 |
| Botão apenas ícone | 48×48, 40×40, 36×36, 32×32 |
| Text field | 450×41; envelope de borda 452×43 |
| Search field | 362×43 |
| Textarea | 450×124; envelope 452×126 |
| Select / Date field | 450×41; envelope 452×43 |
| Linha de menu | 360×33 |
| Checkbox | 20×20; interior ~18×18 |
| Radio | 22×22; interior ~10×10 |
| Toggle | 48×24; envelope 50×26; thumb 16×16 |
| Badge compacto | 69×25 ou 49×25 |
| Badge confortável | 75×33 ou 59×33 |
| Linha de tabela comum | ~1088×56 |
| Sidebar expandida do exemplo | 248 px úteis; board 378 px incluindo rail |
| Sidebar recolhida | 64 px |
| Item de menu | 216×36 |
| Top header | 1192×72 |
| Toolbar inferior | 1192×69 |
| Sort button | 99×38 |
| Filter button | 83×38 |
| Primary header CTA | 133×37 |

## 9. Catálogo de componentes

### 9.1 Button

- Variantes: primary, secondary, outline, ghost/text, destructive.
- Tamanhos: 48, 40, 37 e 32 px de altura.
- Estados: base, hover, active/selected e disabled.
- Conteúdo: leading icon, label, trailing icon; versão icon-only.
- Raio: 4 px.
- Disabled usa neutral claro e contraste reduzido.

### 9.2 Icon Button

- Dimensões quadradas: 48, 40, 36 e 32 px.
- Variantes filled, secondary, outline e disabled.
- Ícone centralizado; área de toque mínima recomendada 40–44 px em mobile.

### 9.3 Text Field

- 450×41 px; borda total 452×43 px.
- Anatomia: label, prefixo opcional, ícone, valor/placeholder, contador, helper text.
- Estados: default, hover, focus/typing, disabled, error e success.
- Erro e sucesso alteram borda e helper text.

### 9.4 Search Bar

- 362×43 px.
- Leading search icon.
- Atalho de teclado no lado direito.
- Estados default, hover, focus e typing.

### 9.5 Text Area

- 450×124 px; envelope 452×126.
- Label superior, contador 0/50, helper text.
- Estados default, hover, focus, filled e disabled.

### 9.6 Select

- 450×41 px; borda 452×43.
- Chevron à direita.
- Estados default, hover, open, selected e disabled.
- Dropdown com 8 opções no exemplo.

### 9.7 Date Picker

- Mesma estrutura dimensional do Select.
- Leading calendar icon.
- Estado open com menu/lista no exemplo; o calendário visual completo não aparece.

### 9.8 Menu / Option

- Linha comum ~360×33 px.
- Variantes: texto, checkbox, radio, avatar, avatar+subtexto, ícone, flag, disabled.
- Hover usa superfície neutral clara.

### 9.9 Checkbox

- 20×20 px.
- Estados: unchecked, indeterminate, checked, disabled.
- Versões claras e escuras.

### 9.10 Radio Button

- 22×22 px; ponto interno ~10×10.
- Estados: unselected, selected e disabled.

### 9.11 Tag

- Pill compacta com texto e ícone de remover.
- Variantes filled e outline.
- Uso: classificação interativa, não status permanente.

### 9.12 Toggle

- 48×24 px; thumb 16×16.
- Estados on/off e disabled.

### 9.13 Pagination

- Setas anterior/próximo, páginas 1–5, elipse e 10.
- Página ativa com fundo preto e texto branco.
- Estados disabled nas extremidades.

### 9.14 Badge

- Tons: green, blue, yellow/lime, purple, red, orange e neutral.
- Variantes: dot+label, label, dot/label compacto.
- Alturas 25 e 33 px.
- Uso: status informativo, nunca ação.

### 9.15 Label

- Sistema de marcadores coloridos e ícones geométricos.
- Serve para categoria/tag visual.

### 9.16 Country Flag

- Bandeiras em grade.
- Uso como atributo, não como decoração.

### 9.17 Logo

- Logos de serviços e marcas.
- Alguns em cores, outros wordmarks neutralizados.

### 9.18 Avatar

- Escala visual ampla: aproximadamente 64, 48, 40, 32, 24, 20, 16 e 12 px.
- Pode incluir status dot em verde, vermelho, laranja, roxo, azul, preto ou cinza.
- Estado placeholder neutral.

### 9.19 Tabs

- Tabs com ícone+texto.
- Segmented tabs de duas ou três opções.
- View switcher: List, Kanban, Table, Grid.
- Ativo por underline ou fundo escuro.

### 9.20 Menu Item

- Linha de 216×36 px.
- Ícone à esquerda, label e caret opcional.
- Suporte a grupos e itens aninhados.

### 9.21 Sidebar

- Brand no topo, grupos de navegação, separadores, footer/workspace switcher.
- Expandida e compacta.
- Rail compacto ~64 px.
- Item ativo usa superfície Neutral 30.

### 9.22 Top Header

- Primeira linha: search + help + perfil.
- Segunda linha: título, view tabs, sort, filter e CTA.
- Separação por regras horizontais finas.

### 9.23 Cards

- Tipos: app/product, install, customer/contact, meeting/task, info, metric e timeline.
- Larguras recorrentes: 277 px e 360 px.
- Borda leve, fundo branco, radius pequeno.
- Anatomia: header, meta, body, actions, footer e overflow.

### 9.24 Table

- Headers em superfície clara.
- Ordenação por chevron.
- Linhas com avatar, texto, badge e ações.
- Variantes de contatos, empresas, tarefas, campanhas e pagamentos.
- Pagamentos são conteúdo fictício do template; não aplicar ao CRM Artec.

### 9.25 Task List

- Checkbox, título, due date, labels, membros e overflow.
- Concluído aparece com menor contraste.

### 9.26 Task Modal

- Área externa do exemplo: 836×937 px.
- Layout de duas colunas.
- Checklist, due date, labels, attachment, comment e activity feed.
- Fechar no canto superior direito.

### 9.27 Notifications Panel

- Painel ~499×857 px.
- Tabs All/Tasks/Archived.
- Mark all as read, filtros e configurações.
- Cards de notificação com ações contextuais.
- CTA inferior de largura total.

### 9.28 Overlay

- Superfície cinza translúcida demonstrada.
- Deve bloquear scroll, capturar foco e fechar por Escape quando modal.

### 9.29 Dashboard Charts

- Sparkline de barras.
- Progress bars horizontais.
- Donut de 64%.
- Heatmap semanal.
- Paleta monocromática com densidade por tons.

## 10. Anatomia de páginas

### 10.1 Página 1 — Phosphor Icons 1.3.1

- Canvas: **3392×2653 px**.
- Board horizontal com 3392×2653 px.
- 18 categorias de ícones distribuídas em colunas.
- Não há labels individuais dos glifos.
- A densidade é de biblioteca, não de tela de produto.

### 10.2 Página 2 — Global Colors

- Canvas: **1570×5288 px**.
- Página extremamente alta para acomodar 71 swatches.
- Grid de 5 colunas; cada swatch colorido mede cerca de 275.6×177 px.
- Cada cartão adiciona uma área inferior de texto; altura total aproximada 254 px.
- Seções separadas por ~101 px entre o final da grade e o próximo heading.

### 10.3 Página 3 — Semantic Colors

- Canvas: **1570×11571 px**.
- Grid semântico de 4 colunas.
- Swatches grandes com aproximadamente 349.5×177 px e card total ~349.5×254 px.
- Agrupamentos: Content, Border, Background, Action e Interaction.
- A página expõe a lógica de alias global→semântico.

### 10.4 Página 4 — Typography

- Canvas: **1570×4606 px**.
- Demonstrações tipográficas em linhas horizontais.
- Coluna esquerda contém nome/peso/tamanho; coluna direita mostra specimen.
- Divisores horizontais entre amostras.
- Texto de specimen alinhado à direita.

### 10.5 Página 5 — Button

- Canvas: **1570×2054 px**.
- Matriz de tamanhos nas colunas e estados nas linhas.
- Primary, secondary, outline, ghost, destructive e text.
- Icon buttons e grupos empilhados no lado direito.
- Board delimitado por guia violeta.

### 10.6 Página 6 — Input Elements

- Canvas: **1570×2922 px**.
- Text fields em grid de duas colunas.
- Search e Text Area aparecem como seções independentes.
- Estados de erro e sucesso são demonstrados com helper text colorido.

### 10.7 Página 7 — Selector

- Canvas: **1570×3590 px**.
- Documentação em layout texto à esquerda / componente à direita.
- Select e Date Picker em boards de 450 px de largura.
- Menu/Option mostra múltiplas anatomias de item.

### 10.8 Página 8 — Small Components

- Canvas: **1570×5210 px**.
- Página mais longa de componentes atômicos.
- Descrições à esquerda e espécimes à direita.
- Avatar ocupa a maior área vertical.
- Tabs e view switchers ficam no final.

### 10.9 Página 9 — Navigation

- Canvas: **1570×1824 px**.
- Exemplo de menu isolado, sidebar expandida/compacta e settings navigation.
- Sidebar principal: 248 px úteis; rail 64 px.
- Footer de workspace fixado ao rodapé.

### 10.10 Página 10 — Header

- Canvas: **1570×917 px**.
- Duas barras horizontais.
- Top row: search, help e perfil.
- Bottom row: título, modos de visualização, sort, filter e CTA.
- A composição é adequada como referência direta para AppShell do CRM.

### 10.11 Página 11 — Cards

- Canvas: **1570×1478 px**.
- Coleção heterogênea de cards.
- Grid irregular para demonstrar flexibilidade.
- Cards usam pouco arredondamento, borda fina e sombra mínima.

### 10.12 Página 12 — Table

- Canvas: **1570×2036 px**.
- Headers e rows são apresentados separadamente.
- Largura de linha principal ~1088 px e altura 56 px.
- A tabela evita grades pesadas; usa separadores e superfície.

### 10.13 Página 13 — Modals

- Canvas: **1570×3856 px**.
- Task modal grande, notification drawer e overlay.
- Modal principal 836×937 px.
- Notification panel 499×857 px.
- Exemplifica atividade, ações inline e footer fixo.

### 10.14 Página 14 — Dashboard

- Canvas: **1570×1117 px**.
- Quatro visualizações monocromáticas.
- Donut de 162×162 px.
- Heatmap em células de 18×18 px.
- Uso de escala neutral para intensidade.

### 10.15 Página 15 — Others

- Canvas: **1570×1522 px**.
- Elementos de marca e navegação editorial.
- Logo preto, heading grande e banner preto arredondado.
- Não é componente operacional do CRM.

## 11. Textos e microcopy do documento

### 11.1 Textos recorrentes

- Descrição recorrente: “Global colors shouldn’t be used directly...”
- Placeholder recorrente em botões: “Placeholder”.
- Input label: “Input Label”.
- Placeholder de campos: “Enter your title here”.
- Helper text: “We will notify the customer and issue a full refund”.
- Counter: “0/50”.
- Search: “Search”.
- Select: “Label”, “Value”, “Option”.
- Date picker: “Select Date Range”.
- Tabs: “List”, “Kanban”, “Table”, “Grid”.
- Header actions: “Sort By”, “Filter”, “Add Contact”.
- Notification actions: “Mark All as Read”, “Reply”, “Decline”, “Accept”, “See all notifications”.

### 11.2 Regra para o Artec CRM

- Todo texto fictício do kit deve ser substituído por microcopy operacional em português.
- “Merchant” aparece nas descrições do kit; não faz sentido para a Artec.
- “Payment”, “Revenue” e outros elementos financeiros são exemplos do template e não devem ser incorporados ao CRM.
- Labels de ações precisam ser específicas: “Criar oportunidade”, “Agendar próxima ação”, “Reagendar”, “Registrar garantia”.

## 12. Variáveis CSS propostas

O bloco abaixo traduz a estrutura visual do PDF. Os aliases Blue/Yellow permanecem marcados para confirmação no Figma.

```css
:root {
  --global-neutral-100: #000000;
  --global-neutral-90: #4B4B4B;
  --global-neutral-80: #717171;
  --global-neutral-70: #AFAFAF;
  --global-neutral-60: #D8D8D8;
  --global-neutral-50: #E4E4E4;
  --global-neutral-40: #E8E8E8;
  --global-neutral-30: #F2F2F2;
  --global-neutral-20: #F9F9F9;
  --global-neutral-10: #FDFDFD;
  --global-neutral-0: #FFFFFF;
  --global-red-100: #230F0F;
  --global-red-90: #461E1E;
  --global-red-80: #692D2D;
  --global-red-70: #8C3C3C;
  --global-red-60: #AF4B4B;
  --global-red-50: #BF6F6F;
  --global-red-40: #CF9393;
  --global-red-30: #DFB7B7;
  --global-red-20: #EFDBDB;
  --global-red-10: #F7EDED;
  --global-orange-100: #2A1C0C;
  --global-orange-90: #543918;
  --global-orange-80: #7E5525;
  --global-orange-70: #A87231;
  --global-orange-60: #D28E3D;
  --global-orange-50: #DBA564;
  --global-orange-40: #E4BB8B;
  --global-orange-30: #EDD2B1;
  --global-orange-20: #F6E8D8;
  --global-orange-10: #FBF4EC;
  --global-lime-100: #232206;
  --global-lime-90: #47440C;
  --global-lime-80: #6A6711;
  --global-lime-70: #8E8917;
  --global-lime-60: #B1AB1D;
  --global-lime-50: #C1BC4A;
  --global-lime-40: #D0CD77;
  --global-lime-30: #E0DDA5;
  --global-lime-20: #EFEED2;
  --global-lime-10: #F7F7E8;
  --global-purple-100: #1E0F23;
  --global-purple-90: #3C1E46;
  --global-purple-80: #592D69;
  --global-purple-70: #773C8C;
  --global-purple-60: #954BAF;
  --global-purple-50: #AA6FBF;
  --global-purple-40: #BF93CF;
  --global-purple-30: #D5B7DF;
  --global-purple-20: #EADBEF;
  --global-purple-10: #F4EDF7;
  --global-green-100: #122015;
  --global-green-90: #233F29;
  --global-green-80: #355F3E;
  --global-green-70: #467E52;
  --global-green-60: #589E67;
  --global-green-50: #79B185;
  --global-green-40: #9BC5A4;
  --global-green-30: #BCD8C2;
  --global-green-20: #DEECE1;
  --global-green-10: #EEF5F0;
  --global-irish-100: #121320;
  --global-irish-90: #23263F;
  --global-irish-80: #35395F;
  --global-irish-70: #464C7E;
  --global-irish-60: #585F9E;
  --global-irish-50: #797FB1;
  --global-irish-40: #9B9FC5;
  --global-irish-30: #BCBFD8;
  --global-irish-20: #DEDFEC;
  --global-irish-10: #EEEFF5;

  /* aliases semânticos */
  --content-primary: var(--global-neutral-100);
  --content-secondary: var(--global-neutral-80);
  --content-tertiary: var(--global-neutral-70);
  --content-disabled: var(--global-neutral-60);
  --content-positive: var(--global-green-60);
  --content-error: var(--global-red-60);
  --content-informative: var(--global-irish-60); /* confirmar Blue = Irish */

  --border-primary: var(--global-neutral-40);
  --border-secondary: var(--global-neutral-60);
  --border-tertiary: var(--global-neutral-100);
  --border-positive: var(--global-green-30);
  --border-error: var(--global-red-30);
  --border-warning: var(--global-orange-30); /* texto do PDF diz Blue 30; visual indica warning */

  --background-primary: var(--global-neutral-0);
  --background-secondary: var(--global-neutral-20);
  --background-tertiary: var(--global-neutral-30);
  --background-positive: var(--global-green-10);
  --background-error: var(--global-red-10);
  --background-warning: var(--global-orange-10);
  --background-purple: var(--global-purple-10);
  --background-informative: var(--global-irish-10);

  --action-primary-base: var(--global-neutral-90);
  --action-primary-hover: var(--global-neutral-80);
  --action-primary-active: var(--global-neutral-100);
  --action-primary-selected: var(--global-neutral-90);
  --action-primary-disabled: var(--global-neutral-20);

  --action-secondary-base: var(--global-neutral-0);
  --action-secondary-hover: var(--global-neutral-40);
  --action-secondary-active: var(--global-neutral-50);
  --action-secondary-selected: var(--global-neutral-30);
  --action-secondary-disabled: var(--global-neutral-20);

  --action-destructive-base: var(--global-red-50);
  --action-destructive-hover: var(--global-red-60);
  --action-destructive-active: var(--global-red-70);
  --action-destructive-selected: var(--global-red-60);
  --action-destructive-disabled: var(--global-red-20);

  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-size-12: 12px;
  --font-size-14: 14px;
  --font-size-16: 16px;
  --font-size-18: 18px;
  --font-size-20: 20px;
  --font-size-24: 24px;
  --font-size-28: 28px;
  --font-size-32: 32px;
  --font-size-48: 48px;

  --radius-component: 4px;
  --border-width: 1px;
  --control-height-lg: 48px;
  --control-height-md: 40px;
  --control-height-sm: 37px;
  --control-height-xs: 32px;
}
```

## 13. APIs de componentes recomendadas

```ts
type ControlSize = 'lg' | 'md' | 'sm' | 'xs';
type ControlState = 'default' | 'hover' | 'active' | 'selected' | 'disabled' | 'loading';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'text';

type BadgeTone = 'neutral' | 'informative' | 'positive' | 'warning' | 'error' | 'purple';

type FieldStatus = 'default' | 'error' | 'success';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ControlSize;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

interface FieldProps {
  label: string;
  description?: string;
  error?: string;
  success?: string;
  counter?: { current: number; max: number };
  leadingElement?: React.ReactNode;
  trailingElement?: React.ReactNode;
}

interface MenuOption {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  avatarUrl?: string;
  flag?: string;
  disabled?: boolean;
}
```

## 14. Mapeamento recomendado para o Artec CRM

| Venture | Artec CRM | Decisão |
|---|---|---|
| Sidebar + rail | AppShell / Sidebar | ADAPTAR; usar módulos reais e identidade Artec |
| Top Header | Topbar + busca global + filtros | ADOTAR estrutura |
| List/Kanban/Table/Grid tabs | Clientes, Oportunidades e Funil | ADAPTAR conforme modos reais |
| Cards | Central Comercial, OpportunityCard, NextActionCard | ADOTAR anatomia |
| Table | Clientes, Oportunidades, Administração | ADAPTAR e manter paginação real |
| Task List | Próximas Ações | ADOTAR |
| Task Modal | Ficha rápida / drawer | ADAPTAR sem checklist fictício |
| Notifications | Sino e página de notificações | ADOTAR densidade e hierarquia |
| Dashboard charts | Relatórios comerciais | ADAPTAR apenas métricas reais |
| Payments/Revenue | Financeiro | DESCARTAR; fora do escopo |
| Phosphor Icons | Ícones do produto | ADOTAR ou migrar de forma única |
| Venture logo | Artec | DESCARTAR; substituir pela marca Artec |

## 15. Problemas e inconsistências do documento

- HEX escrito e preenchimento vetorial divergem em vários swatches.
- Neutral 100 e Neutral 0 aparecem como `#0000`, valor truncado/ambíguo.
- Red 80 e Red 60 reutilizam códigos de Neutral no texto.
- Green 80 repete o código de Green 90.
- A semântica usa Blue e Yellow, mas a paleta global mostra Irish e Lime.
- Border.Warning é descrito como Blue 30, embora o swatch visual seja pêssego/laranja.
- A descrição da página Typography fala de semantic color, texto copiado da página de cores.
- A página Input Elements é rotulada “Color Scheme” no canto superior direito.
- O kit não documenta explicitamente line-height, spacing scale, elevation tokens ou breakpoints.
- Os contornos violetas são artefatos de edição do Figma e não deveriam aparecer em documentação final exportada.
- Alguns exemplos são orientados a e-commerce/merchant, não CRM comercial.

## 16. Checklist de implementação fiel

- [ ] Confirmar todas as Figma Variables pelo MCP.
- [ ] Escolher uma fonte de verdade para cores: variable nominal ou swatch renderizado.
- [ ] Criar global tokens e semantic aliases separados.
- [ ] Não usar HEX direto em componente.
- [ ] Aplicar Inter nos pesos documentados.
- [ ] Padronizar raio 4 px nos controles.
- [ ] Implementar os quatro tamanhos de botão.
- [ ] Implementar estados de focus-visible, error, success, loading e disabled.
- [ ] Usar Phosphor de forma consistente ou documentar a permanência de Lucide.
- [ ] Remover guias `#9747FF` da UI.
- [ ] Validar light e dark mode.
- [ ] Validar contraste WCAG 2.2.
- [ ] Criar screenshots antes/depois.
- [ ] Não importar dados ou módulos financeiros fictícios.

## Apêndice A — inventário completo de textos e coordenadas

As coordenadas usam o canvas nativo de cada página. `x`, `y`, `w` e `h` estão em pixels/unidades do PDF.

### A.1 Página 1 — Phosphor Icons 1.3.1

| x | y | w | h | Texto |
|---:|---:|---:|---:|---|
| 72.0 | 82.0 | 327.1 | 132.6 | Phosphor Icons 1.3.1 \| Light \| Arr \| ows |
| 729.6 | 119.6 | 1596.0 | 40.0 | Communications \| Health & Wellness \| Office & Editing |
| 2774.0 | 84.8 | 560.2 | 24.0 | 894 icons made by Tobias Fried and Helena Zhang |
| 2702.4 | 117.8 | 617.5 | 41.8 | More ways to use at phosphoricons.com \| System & Devices |
| 1387.2 | 282.1 | 251.4 | 40.0 | Maps & Travel |
| 729.6 | 647.6 | 71.2 | 95.0 | Des \| ign |
| 1387.2 | 931.9 | 281.5 | 40.0 | Math & Finance |
| 2044.8 | 891.3 | 71.0 | 95.0 | Peo \| ple |
| 72.0 | 1216.2 | 2720.7 | 121.2 | Bra \| nds \| Time |
| 729.6 | 1581.7 | 1685.1 | 40.0 | Development \| Security & Warnings |
| 1387.2 | 1662.9 | 112.2 | 40.0 | Media |
| 72.0 | 1703.5 | 2956.8 | 80.6 | Weather & Nature \| Commerce |
| 729.6 | 1947.2 | 187.2 | 40.0 | Education |
| 729.6 | 2312.7 | 107.5 | 95.0 | Game \| s |

### A.2 Página 2 — Global Colors

| x | y | w | h | Texto |
|---:|---:|---:|---:|---|
| 136.5 | 80.8 | 1357.3 | 30.3 | Venture \| Global Colors |
| 76.0 | 210.6 | 615.4 | 96.0 | Global Colors |
| 76.0 | 363.2 | 1416.8 | 167.0 | Global colors shouldn”t be used directly. Instead, they”re the source for our semantic colors. We don” \| t use global colors directly because when switching from Light to Dark, or from Brand  \| A to Brand B, a semantic color stays usable while you have to re-apply a matching global  \| color. |
| 56.0 | 655.0 | 92.8 | 20.0 | NEUTRAL |
| 72.0 | 896.0 | 110.4 | 40.4 | Neutral 100 \| #0000 |
| 367.6 | 896.0 | 100.8 | 40.4 | Neutral 90 \| #36383B |
| 663.2 | 896.0 | 100.7 | 40.4 | Neutral 80 \| #6D7076 |
| 958.8 | 896.0 | 99.3 | 40.4 | Neutral 70 \| #A3A7B0 |
| 1254.4 | 896.0 | 100.8 | 40.4 | Neutral 60 \| #D9DFEB |
| 72.0 | 1174.0 | 100.5 | 40.4 | Neutral 50 \| #E1E5EF |
| 367.6 | 1174.0 | 101.1 | 40.4 | Neutral 40 \| #E8ECF3 |
| 663.2 | 1174.0 | 100.9 | 40.4 | Neutral 30 \| #F0F2F7 |
| 958.8 | 1174.0 | 100.3 | 40.4 | Neutral 20 \| #F7F9FB |
| 1254.4 | 1174.0 | 97.5 | 40.4 | Neutral 10 \| #FCFCFE |
| 72.0 | 1452.0 | 88.1 | 40.4 | Neutral 0 \| #0000 |
| 56.0 | 1553.0 | 39.3 | 20.0 | RED |
| 72.0 | 1794.0 | 77.5 | 40.4 | Red 100 \| #230F0F |
| 367.6 | 1794.0 | 67.9 | 40.4 | Red 90 \| #461E1E |
| 663.2 | 1794.0 | 67.8 | 40.4 | Red 80 \| #6D7076 |
| 958.8 | 1794.0 | 66.4 | 40.4 | Red 70 \| #8C3C3C |
| 1254.4 | 1794.0 | 67.9 | 40.4 | Red 60 \| #D9DFEB |
| 72.0 | 2072.0 | 67.6 | 40.4 | Red 50 \| #BF6F6F |
| 367.6 | 2072.0 | 68.2 | 40.4 | Red 40 \| #CF9393 |
| 663.2 | 2072.0 | 68.0 | 40.4 | Red 30 \| #DFB7B7 |
| 958.8 | 2072.0 | 67.4 | 40.4 | Red 20 \| #EFDBDB |
| 1254.4 | 2072.0 | 64.6 | 40.4 | Red 10 \| #F7EDED |
| 56.0 | 2173.0 | 84.1 | 20.0 | ORANGE |
| 72.0 | 2414.0 | 110.9 | 40.4 | Orange 100 \| #2A1C0C |
| 367.6 | 2414.0 | 101.2 | 40.4 | Orange 90 \| #543918 |
| 663.2 | 2414.0 | 101.1 | 40.4 | Orange 80 \| #7E5525 |
| 958.8 | 2414.0 | 99.8 | 40.4 | Orange 70 \| #A87231 |
| 1254.4 | 2414.0 | 101.2 | 40.4 | Orange 60 \| #D28E3D |
| 72.0 | 2692.0 | 100.9 | 40.4 | Orange 50 \| #DBA564 |
| 367.6 | 2692.0 | 101.6 | 40.4 | Orange 40 \| #E4BB8B |
| 663.2 | 2692.0 | 101.4 | 40.4 | Orange 30 \| #EDD2B1 |
| 958.8 | 2692.0 | 100.8 | 40.4 | Orange 20 \| #F6E8D8 |
| 1254.4 | 2692.0 | 98.0 | 40.4 | Orange 10 \| #FBF4EC |
| 56.0 | 2793.0 | 134.4 | 20.0 | LIME YELLOW |
| 72.0 | 3034.0 | 86.2 | 40.4 | Lime 100 \| #232206 |
| 367.6 | 3034.0 | 76.5 | 40.4 | Lime 90 \| #47440C |
| 663.2 | 3034.0 | 76.4 | 40.4 | Lime 80 \| #6A6711 |
| 958.8 | 3034.0 | 75.1 | 40.4 | Lime 70 \| #8E8917 |
| 1254.4 | 3034.0 | 76.5 | 40.4 | Lime 60 \| #B1AB1D |
| 72.0 | 3312.0 | 76.2 | 40.4 | Lime 50 \| #C1BC4A |
| 367.6 | 3312.0 | 76.9 | 40.4 | Lime 40 \| #D0CD77 |
| 663.2 | 3312.0 | 76.7 | 40.4 | Lime 30 \| #E0DDA5 |
| 958.8 | 3312.0 | 76.1 | 40.4 | Lime 20 \| #EFEED2 |
| 1254.4 | 3312.0 | 73.3 | 40.4 | Lime 10 \| #F7F7E8 |
| 56.0 | 3413.0 | 76.5 | 20.0 | PURPLE |
| 72.0 | 3654.0 | 101.9 | 40.4 | Purple 100 \| #1E0F23 |
| 367.6 | 3654.0 | 92.3 | 40.4 | Purple 90 \| #3C1E46 |
| 663.2 | 3654.0 | 92.2 | 40.4 | Purple 80 \| #592D69 |
| 958.8 | 3654.0 | 90.8 | 40.4 | Purple 70 \| #773C8C |
| 1254.4 | 3654.0 | 92.3 | 40.4 | Purple 60 \| #954BAF |
| 72.0 | 3932.0 | 92.0 | 40.4 | Purple 50 \| #AA6FBF |
| 367.6 | 3932.0 | 92.6 | 40.4 | Purple 40 \| #BF93CF |
| 663.2 | 3932.0 | 92.4 | 40.4 | Purple 30 \| #D5B7DF |
| 958.8 | 3932.0 | 91.8 | 40.4 | Purple 20 \| #EADBEF |
| 1254.4 | 3932.0 | 89.0 | 40.4 | Purple 10 \| #F4EDF7 |
| 56.0 | 4033.0 | 66.8 | 20.0 | GREEN |
| 72.0 | 4274.0 | 98.2 | 40.4 | Green 100 \| #122015 |
| 367.6 | 4274.0 | 88.5 | 40.4 | Green 90 \| #233F29 |
| 663.2 | 4274.0 | 88.5 | 40.4 | Green 80 \| #233F29 |
| 958.8 | 4274.0 | 87.1 | 40.4 | Green 70 \| #467E52 |
| 1254.4 | 4274.0 | 88.5 | 40.4 | Green 60 \| #589E67 |
| 72.0 | 4552.0 | 88.2 | 40.4 | Green 50 \| #79B185 |
| 367.6 | 4552.0 | 88.9 | 40.4 | Green 40 \| #9BC5A4 |
| 663.2 | 4552.0 | 88.7 | 40.4 | Green 30 \| #BCD8C2 |
| 958.8 | 4552.0 | 88.1 | 40.4 | Green 20 \| #DEECE1 |
| 1254.4 | 4552.0 | 85.3 | 40.4 | Green 10 \| #EEF5F0 |
| 56.0 | 4653.0 | 51.3 | 20.0 | IRISH |
| 72.0 | 4894.0 | 81.3 | 40.4 | Irish 100 \| #121320 |
| 367.6 | 4894.0 | 71.6 | 40.4 | Irish 90 \| #23263F |
| 663.2 | 4894.0 | 71.5 | 40.4 | Irish 80 \| #35395F |
| 958.8 | 4894.0 | 70.2 | 40.4 | Irish 70 \| #464C7E |
| 1254.4 | 4894.0 | 71.6 | 40.4 | Irish 60 \| #585F9E |
| 72.0 | 5172.0 | 71.3 | 40.4 | Irish 50 \| #797FB1 |
| 367.6 | 5172.0 | 72.0 | 40.4 | Irish 40 \| #9B9FC5 |
| 663.2 | 5172.0 | 71.8 | 40.4 | Irish 30 \| #BCBFD8 |
| 958.8 | 5172.0 | 71.2 | 40.4 | Irish 20 \| #DEDFEC |
| 1254.4 | 5172.0 | 68.4 | 40.4 | Irish 10 \| #EEEFF5 |

### A.3 Página 3 — Semantic Colors

| x | y | w | h | Texto |
|---:|---:|---:|---:|---|
| 136.5 | 80.8 | 1357.4 | 30.3 | Venture \| Semantic Colors |
| 76.0 | 210.6 | 752.2 | 96.0 | Semantic Colors |
| 76.0 | 363.2 | 1188.9 | 122.0 | A semantic color name specifies the purpose of a basic color in a design  \| system. For instance, “foreground.primary” \|  indicates the primary color used for  \| the foreground. |
| 56.0 | 610.0 | 97.9 | 20.0 | CONTENT |
| 56.0 | 646.6 | 228.2 | 16.0 | used for Typography or Icons |
| 56.0 | 698.6 | 43.4 | 16.0 | DARK |
| 72.0 | 923.0 | 76.2 | 40.4 | Primary \| Neutral 100 |
| 441.5 | 923.0 | 103.1 | 40.4 | Secondary \| Neutral 80 |
| 811.0 | 923.0 | 74.6 | 40.4 | Tertiary \| Neutral 70 |
| 1180.5 | 923.0 | 70.7 | 40.4 | Disable \| Neutral 60 |
| 72.0 | 1185.0 | 108.1 | 40.4 | Informative \| Blue 60 |
| 441.5 | 1185.0 | 75.4 | 40.4 | Positive \| Green 60 |
| 811.0 | 1185.0 | 47.1 | 40.4 | Error \| Red 60 |
| 56.0 | 1274.6 | 48.2 | 16.0 | LIGHT |
| 72.0 | 1499.0 | 73.8 | 40.4 | Primary \| Neutral 0 |
| 441.5 | 1499.0 | 103.1 | 40.4 | Secondary \| Neutral 20 |
| 811.0 | 1499.0 | 74.6 | 40.4 | Tertiary \| Neutral 30 |
| 1180.5 | 1499.0 | 70.7 | 40.4 | Disable \| Neutral 60 |
| 72.0 | 1761.0 | 108.1 | 40.4 | Informative \| Blue 60 |
| 441.5 | 1761.0 | 75.4 | 40.4 | Positive \| Green 60 |
| 811.0 | 1761.0 | 47.1 | 40.4 | Error \| Red 60 |
| 56.0 | 1862.0 | 80.7 | 20.0 | BORDER |
| 56.0 | 1898.6 | 177.1 | 16.0 | used for static borders |
| 72.0 | 2139.0 | 73.8 | 40.4 | Primary \| Neutral 40 |
| 441.5 | 2139.0 | 103.1 | 40.4 | Secondary \| Neutral 60 |
| 811.0 | 2139.0 | 76.2 | 40.4 | Tertiary \| Neutral 100 |
| 1180.5 | 2139.0 | 108.1 | 40.4 | Informative \| Blue 30 |
| 72.0 | 2417.0 | 75.4 | 40.4 | Positive \| Green 30 |
| 441.5 | 2417.0 | 47.3 | 40.4 | Error \| Red 30 |
| 811.0 | 2417.0 | 78.7 | 40.4 | Warning \| Blue 30 |
| 56.0 | 2518.0 | 140.9 | 20.0 | BACKGROUND |
| 56.0 | 2554.6 | 220.2 | 16.0 | Used for static backgrounds |
| 72.0 | 2795.0 | 73.8 | 40.4 | Primary \| Neutral 0 |
| 441.5 | 2795.0 | 103.1 | 40.4 | Secondary \| Neutral 20 |
| 811.0 | 2795.0 | 74.6 | 40.4 | Tertiary \| Neutral 30 |
| 1180.5 | 2795.0 | 47.9 | 40.4 | Blue \| Blue 10 |
| 72.0 | 3073.0 | 59.0 | 40.4 | Green \| Green 10 |
| 441.5 | 3073.0 | 44.9 | 40.4 | Red \| Red 10 |
| 811.0 | 3073.0 | 70.3 | 40.4 | Orange \| Orange 10 |
| 1180.5 | 3073.0 | 61.4 | 40.4 | Purple \| Purple 10 |
| 72.0 | 3351.0 | 61.8 | 40.4 | Yellow \| Yellow 10 |
| 56.0 | 3452.0 | 76.7 | 20.0 | ACTION |
| 56.0 | 3488.6 | 327.3 | 16.0 | used for action components and elements |
| 56.0 | 3540.6 | 71.9 | 16.0 | PRIMARY |
| 72.0 | 3781.0 | 69.8 | 40.4 | Base \| Neutral 90 |
| 441.5 | 3781.0 | 69.6 | 40.4 | Hover \| Neutral 80 |
| 811.0 | 3781.0 | 76.2 | 40.4 | Active \| Neutral 100 |
| 1180.5 | 3781.0 | 84.2 | 40.4 | Selected \| Neutral 90 |
| 72.0 | 4059.0 | 83.2 | 40.4 | Disabled \| Neutral 20 |
| 56.0 | 4148.6 | 100.0 | 16.0 | SECONDARY |
| 72.0 | 4389.0 | 61.0 | 40.4 | Base \| Neutral 0 |
| 441.5 | 4389.0 | 69.9 | 40.4 | Base 2 \| Neutral 30 |
| 811.0 | 4389.0 | 70.0 | 40.4 | Hover \| Neutral 40 |
| 1180.5 | 4389.0 | 69.5 | 40.4 | Active \| Neutral 50 |
| 72.0 | 4667.0 | 84.2 | 40.4 | Selected \| Neutral 30 |
| 441.5 | 4667.0 | 83.2 | 40.4 | Disabled \| Neutral 20 |
| 56.0 | 4756.6 | 70.5 | 16.0 | OUTLINE |
| 72.0 | 4997.0 | 69.5 | 40.4 | Base \| Neutral 50 |
| 441.5 | 4997.0 | 69.7 | 40.4 | Hover \| Neutral 60 |
| 811.0 | 4997.0 | 68.7 | 40.4 | Active \| Neutral 70 |
| 1180.5 | 4997.0 | 84.2 | 40.4 | Selecred \| Neutral 70 |
| 72.0 | 5275.0 | 83.2 | 40.4 | Disabled \| Neutral 30 |
| 56.0 | 5364.6 | 112.7 | 16.0 | DESTRUCTIVE |
| 72.0 | 5605.0 | 46.9 | 40.4 | Base \| Red 50 |
| 441.5 | 5605.0 | 56.9 | 40.4 | Hover \| Red 60 |
| 811.0 | 5605.0 | 60.2 | 40.4 | Active \| Red 70 |
| 1180.5 | 5605.0 | 84.2 | 40.4 | Selected \| Red 60 |
| 72.0 | 5883.0 | 83.2 | 40.4 | Disabled \| Red 20 |
| 56.0 | 5984.0 | 134.9 | 20.0 | INTERACTION |
| 56.0 | 6020.6 | 440.4 | 16.0 | used for interaction components (e.g. form components) |
| 56.0 | 6072.6 | 71.9 | 16.0 | PRIMARY |
| 72.0 | 6313.0 | 69.8 | 40.4 | Base \| Neutral 90 |
| 441.5 | 6313.0 | 69.6 | 40.4 | Hover \| Neutral 80 |
| 811.0 | 6313.0 | 76.2 | 40.4 | Active \| Neutral 100 |
| 1180.5 | 6313.0 | 84.2 | 40.4 | Selected \| Neutral 90 |
| 72.0 | 6591.0 | 83.2 | 40.4 | Disabled \| Neutral 20 |
| 56.0 | 6680.6 | 100.0 | 16.0 | SECONDARY |
| 72.0 | 6921.0 | 61.0 | 40.4 | Base \| Neutral 0 |
| 441.5 | 6921.0 | 69.9 | 40.4 | Hover \| Neutral 30 |
| 811.0 | 6921.0 | 69.5 | 40.4 | Active \| Neutral 50 |
| 1180.5 | 6921.0 | 84.2 | 40.4 | Selected \| Neutral 30 |
| 72.0 | 7199.0 | 83.2 | 40.4 | Disabled \| Neutral 20 |
| 56.0 | 7288.6 | 70.5 | 16.0 | OUTLINE |
| 72.0 | 7529.0 | 69.7 | 40.4 | Base \| Neutral 60 |
| 441.5 | 7529.0 | 68.7 | 40.4 | Hover \| Neutral 70 |
| 811.0 | 7529.0 | 69.6 | 40.4 | Active \| Neutral 80 |
| 1180.5 | 7529.0 | 84.2 | 40.4 | Selecred \| Neutral 70 |
| 72.0 | 7807.0 | 83.2 | 40.4 | Disabled \| Neutral 40 |
| 56.0 | 7896.6 | 31.8 | 16.0 | RED |
| 72.0 | 8137.0 | 47.1 | 40.4 | Base \| Red 60 |
| 441.5 | 8137.0 | 56.9 | 40.4 | Hover \| Red 70 |
| 811.0 | 8137.0 | 60.2 | 40.4 | Active \| Red 80 |
| 1180.5 | 8137.0 | 84.2 | 40.4 | Selected \| Red 70 |
| 72.0 | 8415.0 | 83.2 | 40.4 | Disabled \| Red 20 |
| 56.0 | 8504.6 | 54.2 | 16.0 | GREEN |
| 72.0 | 8745.0 | 61.3 | 40.4 | Base \| Green 60 |
| 441.5 | 8745.0 | 60.3 | 40.4 | Hover \| Green 70 |
| 811.0 | 8745.0 | 61.2 | 40.4 | Active \| Green 80 |
| 1180.5 | 8745.0 | 84.2 | 40.4 | Selected \| Green 70 |
| 72.0 | 9023.0 | 83.2 | 40.4 | Disabled \| Green 20 |
| 56.0 | 9112.6 | 41.5 | 16.0 | BLUE |
| 72.0 | 9353.0 | 50.1 | 40.4 | Base \| Blue 60 |
| 441.5 | 9353.0 | 56.9 | 40.4 | Hover \| Blue 70 |
| 811.0 | 9353.0 | 60.2 | 40.4 | Active \| Blue 80 |
| 1180.5 | 9353.0 | 84.2 | 40.4 | Selected \| Blue 70 |
| 72.0 | 9631.0 | 83.2 | 40.4 | Disabled \| Blue 20 |
| 56.0 | 9720.6 | 66.5 | 16.0 | YELLOW |
| 72.0 | 9961.0 | 63.9 | 40.4 | Base \| Yellow 60 |
| 441.5 | 9961.0 | 63.0 | 40.4 | Hover \| Yellow 70 |
| 811.0 | 9961.0 | 63.8 | 40.4 | Active \| Yellow 80 |
| 1180.5 | 9961.0 | 84.2 | 40.4 | Selected \| Yellow 70 |
| 72.0 | 10239.0 | 83.2 | 40.4 | Disabled \| Yellow 20 |
| 56.0 | 10328.6 | 62.1 | 16.0 | PURPLE |
| 72.0 | 10569.0 | 63.6 | 40.4 | Base \| Purple 60 |
| 441.5 | 10569.0 | 62.7 | 40.4 | Hover \| Purple 70 |
| 811.0 | 10569.0 | 63.5 | 40.4 | Active \| Purple 80 |
| 1180.5 | 10569.0 | 84.2 | 40.4 | Selected \| Purple 70 |
| 72.0 | 10847.0 | 83.2 | 40.4 | Disabled \| Purple 20 |
| 56.0 | 10936.6 | 68.1 | 16.0 | ORANGE |
| 72.0 | 11177.0 | 70.0 | 40.4 | Base \| Orange 60 |
| 441.5 | 11177.0 | 69.1 | 40.4 | Hover \| Orange 70 |
| 811.0 | 11177.0 | 69.9 | 40.4 | Active \| Orange 80 |
| 1180.5 | 11177.0 | 84.2 | 40.4 | Selected \| Orange 70 |
| 72.0 | 11455.0 | 83.2 | 40.4 | Disabled \| Orange 20 |

### A.4 Página 4 — Typography

| x | y | w | h | Texto |
|---:|---:|---:|---:|---|
| 136.5 | 80.8 | 1357.4 | 30.3 | Venture \| Typography |
| 76.0 | 210.6 | 547.4 | 96.0 | Typography |
| 76.0 | 363.2 | 1188.9 | 122.0 | A semantic color name specifies the purpose of a basic color in a design  \| system. For instance, “foreground.primary” \|  indicates the primary color used for  \| the foreground. |
| 56.0 | 612.0 | 179.6 | 40.0 | HEADING |
| 56.0 | 698.8 | 270.7 | 28.0 | Heading / Heading 1 |
| 56.0 | 747.8 | 125.3 | 18.0 | Inter - Medium |
| 56.0 | 727.3 | 1456.8 | 77.3 | 48 px font size \| The quick brown fox jumps over the lazy dog |
| 56.0 | 880.8 | 274.7 | 28.0 | Heading / Heading 2 |
| 56.0 | 929.8 | 125.3 | 18.0 | Inter - Medium |
| 56.0 | 970.6 | 111.3 | 16.0 | 32 px font size |
| 830.5 | 918.7 | 682.7 | 32.0 | The quick brown fox jumps over the lazy dog |
| 56.0 | 1062.8 | 275.5 | 28.0 | Heading / Heading 3 |
| 56.0 | 1111.8 | 125.3 | 18.0 | Inter - Medium |
| 56.0 | 1152.6 | 111.0 | 16.0 | 28 px font size |
| 916.0 | 1102.3 | 597.4 | 28.0 | The quick brown fox jumps over the lazy dog |
| 56.0 | 1244.8 | 275.9 | 28.0 | Heading / Heading 4 |
| 56.0 | 1293.8 | 125.3 | 18.0 | Inter - Medium |
| 56.0 | 1334.6 | 111.2 | 16.0 | 24 px font size |
| 1001.4 | 1286.4 | 512.0 | 24.0 | The quick brown fox jumps over the lazy dog |
| 56.0 | 1426.8 | 275.0 | 28.0 | Heading / Heading 5 |
| 56.0 | 1475.8 | 125.3 | 18.0 | Inter - Medium |
| 56.0 | 1516.6 | 111.1 | 16.0 | 20 px font size |
| 1086.8 | 1470.5 | 426.7 | 20.0 | The quick brown fox jumps over the lazy dog |
| 56.0 | 1610.0 | 110.4 | 40.0 | BODY |
| 56.0 | 1696.8 | 247.2 | 28.0 | Body / Extra Large |
| 56.0 | 1745.8 | 137.0 | 18.0 | Inter - SemiBold |
| 56.0 | 1786.6 | 111.1 | 16.0 | 20 px font size |
| 949.4 | 1712.5 | 569.1 | 76.0 | There are many variations of passages of Lorem Ipsum  \| available, but the majority have suffered alteration in some  \| form which don't look even slightly believable. |
| 56.0 | 1889.8 | 247.2 | 28.0 | Body / Extra Large |
| 56.0 | 1938.8 | 125.3 | 18.0 | Inter - Medium |
| 56.0 | 1979.6 | 111.1 | 16.0 | 20 px font size |
| 955.4 | 1905.5 | 563.8 | 76.0 | There are many variations of passages of Lorem Ipsum  \| available, but the majority have suffered alteration in some  \| form which don't look even slightly believable. |
| 56.0 | 2082.8 | 247.2 | 28.0 | Body / Extra Large |
| 56.0 | 2131.8 | 121.7 | 18.0 | Inter - Regular |
| 56.0 | 2172.6 | 111.1 | 16.0 | 20 px font size |
| 961.8 | 2098.5 | 557.8 | 76.0 | There are many variations of passages of Lorem Ipsum  \| available, but the majority have suffered alteration in some  \| form which don't look even slightly believable. |
| 56.0 | 2275.8 | 170.1 | 28.0 | Body / Large |
| 56.0 | 2324.8 | 137.0 | 18.0 | Inter - SemiBold |
| 56.0 | 2365.6 | 108.7 | 16.0 | 18 px font size |
| 941.8 | 2293.8 | 576.1 | 72.0 | There are many variations of passages of Lorem Ipsum available,  \| but the majority have suffered alteration in some form which don't  \| look even slightly believable. |
| 56.0 | 2468.8 | 170.1 | 28.0 | Body / Large |
| 56.0 | 2517.8 | 125.3 | 18.0 | Inter - Medium |
| 56.0 | 2558.6 | 108.7 | 16.0 | 18 px font size |
| 947.7 | 2486.8 | 571.0 | 72.0 | There are many variations of passages of Lorem Ipsum available,  \| but the majority have suffered alteration in some form which don't  \| look even slightly believable. |
| 56.0 | 2661.8 | 170.1 | 28.0 | Body / Large |
| 56.0 | 2710.8 | 121.7 | 18.0 | Inter - Regular |
| 56.0 | 2751.6 | 108.7 | 16.0 | 18 px font size |
| 953.8 | 2679.8 | 565.3 | 72.0 | There are many variations of passages of Lorem Ipsum available,  \| but the majority have suffered alteration in some form which don't  \| look even slightly believable. |
| 56.0 | 2854.8 | 202.7 | 28.0 | Body / Medium |
| 56.0 | 2903.8 | 137.0 | 18.0 | Inter - SemiBold |
| 56.0 | 2944.6 | 108.9 | 16.0 | 16 px font size |
| 956.0 | 2877.1 | 561.4 | 64.0 | There are many variations of passages of Lorem Ipsum available, but the  \| majority have suffered alteration in some form which don't look even  \| slightly believable. |
| 56.0 | 3047.8 | 202.7 | 28.0 | Body / Medium |
| 56.0 | 3096.8 | 125.3 | 18.0 | Inter - Medium |
| 56.0 | 3137.6 | 108.9 | 16.0 | 16 px font size |
| 961.1 | 3070.1 | 557.0 | 64.0 | There are many variations of passages of Lorem Ipsum available, but the  \| majority have suffered alteration in some form which don't look even  \| slightly believable. |
| 56.0 | 3240.8 | 202.7 | 28.0 | Body / Medium |
| 56.0 | 3289.8 | 121.7 | 18.0 | Inter - Regular |
| 56.0 | 3330.6 | 108.9 | 16.0 | 16 px font size |
| 939.6 | 3263.1 | 578.8 | 64.0 | There are many variations of passages of Lorem Ipsum available, but the  \| majority have suffered alteration in some form which don't look even slightly  \| believable. |
| 56.0 | 3433.8 | 167.6 | 28.0 | Body / Small |
| 56.0 | 3482.8 | 137.0 | 18.0 | Inter - SemiBold |
| 56.0 | 3523.6 | 109.2 | 16.0 | 14 px font size |
| 967.0 | 3470.9 | 549.9 | 35.0 | There are many variations of passages of Lorem Ipsum available, but the majority  \| have suffered alteration in some form which don't look even slightly believable. |
| 56.0 | 3626.8 | 167.6 | 28.0 | Body / Small |
| 56.0 | 3675.8 | 125.3 | 18.0 | Inter - Medium |
| 56.0 | 3716.6 | 109.2 | 16.0 | 14 px font size |
| 972.3 | 3663.9 | 545.3 | 35.0 | There are many variations of passages of Lorem Ipsum available, but the majority  \| have suffered alteration in some form which don't look even slightly believable. |
| 56.0 | 3819.8 | 167.6 | 28.0 | Body / Small |
| 56.0 | 3868.8 | 121.7 | 18.0 | Inter - Regular |
| 56.0 | 3909.6 | 109.2 | 16.0 | 14 px font size |
| 1284.3 | 3856.9 | 293.0 | 35.0 | There are many variations of passages of Lo \| suffered alteration in some for |
| 56.0 | 4012.8 | 244.9 | 28.0 | Body / Extra Small |
| 56.0 | 4061.8 | 137.0 | 18.0 | Inter - SemiBold |
| 56.0 | 4102.6 | 108.6 | 16.0 | 12 px font size |
| 1304.4 | 4052.7 | 274.5 | 29.0 | There are many variations of passages of Lore \| alteration in som |
| 56.0 | 4205.8 | 244.9 | 28.0 | Body / Extra Small |
| 56.0 | 4254.8 | 125.3 | 18.0 | Inter - Medium |
| 56.0 | 4295.6 | 108.6 | 16.0 | 12 px font size |
| 1309.7 | 4245.7 | 264.8 | 29.0 | There are many variations of passages of Lore \| alteration in so |
| 56.0 | 4398.8 | 244.9 | 28.0 | Body / Extra Small |
| 56.0 | 4447.8 | 121.7 | 18.0 | Inter - Regular |
| 56.0 | 4488.6 | 108.6 | 16.0 | 12 px font size |
| 1315.3 | 4438.7 | 259.3 | 29.0 | There are many variations of passages of Lor \| alteration in so |

### A.5 Página 5 — Button

| x | y | w | h | Texto |
|---:|---:|---:|---:|---|
| 136.5 | 80.8 | 1357.4 | 30.3 | Venture \| Button |
| 76.0 | 210.6 | 305.6 | 96.0 | Button |
| 76.0 | 363.2 | 1416.8 | 167.0 | Global colors shouldn”t be used directly. Instead, they”re the source for our semantic colors. We don” \| t use global colors directly because when switching from Light to Dark, or from Brand  \| A to Brand B, a semantic color stays usable while you have to re-apply a matching global  \| color. |
| 140.0 | 709.8 | 101.8 | 18.0 | Placeholder |
| 140.0 | 773.8 | 101.8 | 18.0 | Placeholder |
| 140.0 | 837.8 | 101.8 | 18.0 | Placeholder |
| 356.0 | 705.6 | 90.5 | 16.0 | Placeholder |
| 356.0 | 769.6 | 90.5 | 16.0 | Placeholder |
| 356.0 | 833.6 | 90.5 | 16.0 | Placeholder |
| 549.0 | 705.4 | 79.2 | 14.0 | Placeholder |
| 549.0 | 769.4 | 79.2 | 14.0 | Placeholder |
| 549.0 | 833.4 | 79.2 | 14.0 | Placeholder |
| 719.0 | 704.2 | 67.9 | 12.0 | Placeholder |
| 719.0 | 768.2 | 67.9 | 12.0 | Placeholder |
| 719.0 | 832.2 | 67.9 | 12.0 | Placeholder |
| 1264.0 | 709.8 | 101.8 | 18.0 | Placeholder |
| 1262.0 | 770.6 | 90.5 | 16.0 | Placeholder |
| 1256.0 | 825.4 | 79.2 | 14.0 | Placeholder |
| 1250.0 | 876.2 | 67.9 | 12.0 | Placeholder |
| 140.0 | 925.8 | 101.8 | 18.0 | Placeholder |
| 140.0 | 989.8 | 101.8 | 18.0 | Placeholder |
| 140.0 | 1053.8 | 101.8 | 18.0 | Placeholder |
| 356.0 | 921.6 | 90.5 | 16.0 | Placeholder |
| 356.0 | 985.6 | 90.5 | 16.0 | Placeholder |
| 356.0 | 1049.6 | 90.5 | 16.0 | Placeholder |
| 549.0 | 921.4 | 79.2 | 14.0 | Placeholder |
| 549.0 | 985.4 | 79.2 | 14.0 | Placeholder |
| 549.0 | 1049.4 | 79.2 | 14.0 | Placeholder |
| 719.0 | 920.2 | 67.9 | 12.0 | Placeholder |
| 719.0 | 984.2 | 67.9 | 12.0 | Placeholder |
| 719.0 | 1048.2 | 67.9 | 12.0 | Placeholder |
| 140.0 | 1141.8 | 101.8 | 18.0 | Placeholder |
| 140.0 | 1205.8 | 101.8 | 18.0 | Placeholder |
| 140.0 | 1269.8 | 101.8 | 18.0 | Placeholder |
| 356.0 | 1137.6 | 90.5 | 16.0 | Placeholder |
| 356.0 | 1201.6 | 90.5 | 16.0 | Placeholder |
| 356.0 | 1265.6 | 90.5 | 16.0 | Placeholder |
| 549.0 | 1137.4 | 79.2 | 14.0 | Placeholder |
| 549.0 | 1201.4 | 79.2 | 14.0 | Placeholder |
| 549.0 | 1265.4 | 79.2 | 14.0 | Placeholder |
| 719.0 | 1136.2 | 67.9 | 12.0 | Placeholder |
| 719.0 | 1200.2 | 67.9 | 12.0 | Placeholder |
| 719.0 | 1264.2 | 67.9 | 12.0 | Placeholder |
| 140.0 | 1357.8 | 101.8 | 18.0 | Placeholder |
| 140.0 | 1421.8 | 101.8 | 18.0 | Placeholder |
| 140.0 | 1485.8 | 101.8 | 18.0 | Placeholder |
| 356.0 | 1353.6 | 90.5 | 16.0 | Placeholder |
| 356.0 | 1417.6 | 90.5 | 16.0 | Placeholder |
| 356.0 | 1481.6 | 90.5 | 16.0 | Placeholder |
| 549.0 | 1353.4 | 79.2 | 14.0 | Placeholder |
| 549.0 | 1417.4 | 79.2 | 14.0 | Placeholder |
| 549.0 | 1481.4 | 79.2 | 14.0 | Placeholder |
| 719.0 | 1352.2 | 67.9 | 12.0 | Placeholder |
| 719.0 | 1416.2 | 67.9 | 12.0 | Placeholder |
| 719.0 | 1480.2 | 67.9 | 12.0 | Placeholder |
| 142.0 | 1573.8 | 101.8 | 18.0 | Placeholder |
| 142.0 | 1637.8 | 101.8 | 18.0 | Placeholder |
| 142.0 | 1701.8 | 101.8 | 18.0 | Placeholder |
| 358.0 | 1569.6 | 90.5 | 16.0 | Placeholder |
| 358.0 | 1633.6 | 90.5 | 16.0 | Placeholder |
| 358.0 | 1697.6 | 90.5 | 16.0 | Placeholder |
| 549.0 | 1569.4 | 79.2 | 14.0 | Placeholder |
| 549.0 | 1633.4 | 79.2 | 14.0 | Placeholder |
| 549.0 | 1697.4 | 79.2 | 14.0 | Placeholder |
| 715.0 | 1568.2 | 67.9 | 12.0 | Placeholder |
| 715.0 | 1632.2 | 67.9 | 12.0 | Placeholder |
| 715.0 | 1696.2 | 67.9 | 12.0 | Placeholder |
| 114.0 | 1789.8 | 101.8 | 18.0 | Placeholder |
| 114.0 | 1853.8 | 101.8 | 18.0 | Placeholder |
| 114.0 | 1917.8 | 101.8 | 18.0 | Placeholder |
| 332.0 | 1785.6 | 90.5 | 16.0 | Placeholder |
| 332.0 | 1849.6 | 90.5 | 16.0 | Placeholder |
| 332.0 | 1913.6 | 90.5 | 16.0 | Placeholder |
| 477.0 | 1785.4 | 79.2 | 14.0 | Placeholder |
| 477.0 | 1849.4 | 79.2 | 14.0 | Placeholder |
| 477.0 | 1913.4 | 79.2 | 14.0 | Placeholder |
| 605.0 | 1784.2 | 67.9 | 12.0 | Placeholder |
| 605.0 | 1848.2 | 67.9 | 12.0 | Placeholder |
| 605.0 | 1912.2 | 67.9 | 12.0 | Placeholder |

### A.6 Página 6 — Input Elements

| x | y | w | h | Texto |
|---:|---:|---:|---:|---|
| 136.5 | 80.8 | 1357.4 | 30.3 | Venture \| Color Scheme |
| 76.0 | 210.6 | 682.9 | 96.0 | Input Elements |
| 76.0 | 363.2 | 1416.8 | 167.0 | Global colors shouldn”t be used directly. Instead, they”re the source for our semantic colors. We don” \| t use global colors directly because when switching from Light to Dark, or from Brand  \| A to Brand B, a semantic color stays usable while you have to re-apply a matching global  \| color. |
| 56.0 | 655.8 | 144.5 | 28.0 | Text Fields |
| 96.0 | 762.4 | 73.4 | 14.0 | Input Label |
| 108.0 | 801.4 | 243.5 | 14.0 | +1 \| Enter your title here |
| 96.0 | 839.2 | 281.8 | 12.0 | We will notify the customer and issue a full refund |
| 507.4 | 802.2 | 26.6 | 12.0 | 0/50 |
| 677.0 | 762.4 | 73.4 | 14.0 | Input Label |
| 689.0 | 801.4 | 243.5 | 14.0 | +1 \| Enter your title here |
| 677.0 | 839.2 | 281.8 | 12.0 | We will notify the customer and issue a full refund |
| 1088.4 | 802.2 | 26.6 | 12.0 | 0/50 |
| 96.0 | 914.4 | 73.4 | 14.0 | Input Label |
| 108.0 | 953.4 | 426.0 | 14.0 | +1 \| Enter your title here \| 0/50 |
| 96.0 | 991.2 | 281.8 | 12.0 | We will notify the customer and issue a full refund |
| 96.0 | 1055.4 | 73.4 | 14.0 | Input Label |
| 108.0 | 1094.4 | 426.0 | 14.0 | +1 \| Enter your title here \| 0/50 |
| 96.0 | 1132.2 | 281.8 | 12.0 | We will notify the customer and issue a full refund |
| 677.0 | 914.4 | 73.4 | 14.0 | Input Label |
| 689.0 | 953.4 | 426.0 | 14.0 | +1 \| Enter your title here \| 0/50 |
| 677.0 | 991.2 | 281.8 | 12.0 | We will notify the customer and issue a full refund |
| 677.0 | 1055.4 | 73.4 | 14.0 | Input Label |
| 689.0 | 1094.4 | 426.0 | 14.0 | +1 \| Enter your title here \| 0/50 |
| 677.0 | 1132.2 | 281.8 | 12.0 | We will notify the customer and issue a full refund |
| 96.0 | 1207.4 | 73.4 | 14.0 | Input Label |
| 108.0 | 1246.4 | 243.5 | 14.0 | +1 \| Enter your title here |
| 96.0 | 1284.2 | 281.8 | 12.0 | We will notify the customer and issue a full refund |
| 507.4 | 1247.2 | 26.6 | 12.0 | 0/50 |
| 56.0 | 1393.8 | 145.7 | 28.0 | Search Bar |
| 56.0 | 1441.8 | 658.1 | 99.0 | Global colors shouldn”t be used directly. Instead, they”re the source for our  \| semantic colors. We don” \| t use global colors directly because when switching  \| from Light to Dark, or from Brand A to Brand B, a semantic color stays usable  \| while you have to re-apply a matching global color. |
| 1158.0 | 1441.4 | 46.0 | 14.0 | Search |
| 1158.0 | 1506.4 | 46.0 | 14.0 | Search |
| 1158.0 | 1571.4 | 46.0 | 14.0 | Search |
| 1159.0 | 1636.4 | 46.0 | 14.0 | Search |
| 1447.0 | 1440.1 | 9.4 | 16.0 | F |
| 1447.0 | 1505.1 | 9.4 | 16.0 | F |
| 1447.0 | 1570.1 | 9.4 | 16.0 | F |
| 1447.0 | 1635.1 | 9.4 | 16.0 | F |
| 56.0 | 1741.8 | 127.4 | 28.0 | Text Area |
| 56.0 | 1789.8 | 658.1 | 99.0 | Global colors shouldn”t be used directly. Instead, they”re the source for our  \| semantic colors. We don” \| t use global colors directly because when switching  \| from Light to Dark, or from Brand A to Brand B, a semantic color stays usable  \| while you have to re-apply a matching global color. |
| 1024.0 | 1783.4 | 73.4 | 14.0 | Input Label |
| 1036.0 | 1822.4 | 130.5 | 14.0 | Enter your title here |
| 1439.4 | 1912.2 | 26.6 | 12.0 | 0/50 |
| 1024.0 | 1943.2 | 281.8 | 12.0 | We will notify the customer and issue a full refund |
| 1024.0 | 1985.4 | 73.4 | 14.0 | Input Label |
| 1036.0 | 2024.4 | 130.5 | 14.0 | Enter your title here |
| 1439.4 | 2114.2 | 26.6 | 12.0 | 0/50 |
| 1024.0 | 2145.2 | 281.8 | 12.0 | We will notify the customer and issue a full refund |
| 1024.0 | 2187.4 | 73.4 | 14.0 | Input Label |
| 1036.0 | 2227.4 | 130.5 | 14.0 | Enter your title here |
| 1439.4 | 2316.2 | 26.6 | 12.0 | 0/50 |
| 1024.0 | 2347.2 | 281.8 | 12.0 | We will notify the customer and issue a full refund |
| 1024.0 | 2389.4 | 73.4 | 14.0 | Input Label |
| 1036.0 | 2428.4 | 130.5 | 14.0 | Enter your title here |
| 1439.4 | 2518.2 | 26.6 | 12.0 | 0/50 |
| 1024.0 | 2549.2 | 281.8 | 12.0 | We will notify the customer and issue a full refund |
| 1024.0 | 2591.4 | 73.4 | 14.0 | Input Label |
| 1036.0 | 2630.4 | 130.5 | 14.0 | Enter your title here |
| 1439.4 | 2720.2 | 26.6 | 12.0 | 0/50 |
| 1024.0 | 2751.2 | 281.8 | 12.0 | We will notify the customer and issue a full refund |
| 750.5 | 2848.9 | 15.7 | 14.0 | +1 |

### A.7 Página 7 — Selector

| x | y | w | h | Texto |
|---:|---:|---:|---:|---|
| 136.5 | 80.8 | 1357.4 | 30.3 | Venture \| Selector |
| 76.0 | 210.6 | 382.4 | 96.0 | Selector |
| 76.0 | 363.2 | 1416.8 | 167.0 | Global colors shouldn”t be used directly. Instead, they”re the source for our semantic colors. We don” \| t use global colors directly because when switching from Light to Dark, or from Brand  \| A to Brand B, a semantic color stays usable while you have to re-apply a matching global  \| color. |
| 56.0 | 655.8 | 84.1 | 28.0 | Select |
| 56.0 | 703.8 | 689.6 | 45.0 | Select allows users to make a single selection or multiple selections from a list of  \| options. |
| 1024.0 | 697.4 | 35.9 | 14.0 | Label |
| 1036.0 | 736.4 | 36.2 | 14.0 | Value |
| 1024.0 | 789.4 | 35.9 | 14.0 | Label |
| 1036.0 | 828.4 | 36.2 | 14.0 | Value |
| 1024.0 | 881.4 | 35.9 | 14.0 | Label |
| 1036.0 | 920.4 | 130.5 | 14.0 | Enter your title here |
| 1036.0 | 965.4 | 44.1 | 14.0 | Option |
| 1036.0 | 998.4 | 44.1 | 14.0 | Option |
| 1036.0 | 1031.4 | 44.1 | 14.0 | Option |
| 1036.0 | 1064.4 | 44.1 | 14.0 | Option |
| 1036.0 | 1097.4 | 44.1 | 14.0 | Option |
| 1036.0 | 1130.4 | 44.1 | 14.0 | Option |
| 1036.0 | 1163.4 | 44.1 | 14.0 | Option |
| 1036.0 | 1196.4 | 44.1 | 14.0 | Option |
| 1024.0 | 1239.4 | 35.9 | 14.0 | Label |
| 1036.0 | 1278.4 | 36.2 | 14.0 | Value |
| 1024.0 | 1332.4 | 35.9 | 14.0 | Label |
| 1036.0 | 1371.4 | 36.2 | 14.0 | Value |
| 56.0 | 1501.8 | 153.0 | 28.0 | Date Picker |
| 56.0 | 1543.4 | 1041.4 | 24.4 | A date picker allows the user to select a particular date. \| Input Label |
| 1068.0 | 1582.4 | 122.1 | 14.0 | Select Date Range |
| 1024.0 | 1627.4 | 73.4 | 14.0 | Input Label |
| 1068.0 | 1666.4 | 122.1 | 14.0 | Select Date Range |
| 1024.0 | 1711.4 | 73.4 | 14.0 | Input Label |
| 1068.0 | 1750.4 | 130.5 | 14.0 | Enter your title here |
| 1036.0 | 1795.4 | 44.1 | 14.0 | Option |
| 1036.0 | 1828.4 | 44.1 | 14.0 | Option |
| 1036.0 | 1861.4 | 44.1 | 14.0 | Option |
| 1036.0 | 1894.4 | 44.1 | 14.0 | Option |
| 1036.0 | 1927.4 | 44.1 | 14.0 | Option |
| 1036.0 | 1960.4 | 44.1 | 14.0 | Option |
| 1036.0 | 1993.4 | 44.1 | 14.0 | Option |
| 1036.0 | 2026.4 | 44.1 | 14.0 | Option |
| 1024.0 | 2059.4 | 73.4 | 14.0 | Input Label |
| 1068.0 | 2098.4 | 122.1 | 14.0 | Select Date Range |
| 1024.0 | 2143.4 | 73.4 | 14.0 | Input Label |
| 1068.0 | 2182.4 | 122.1 | 14.0 | Select Date Range |
| 56.0 | 2281.8 | 189.6 | 28.0 | Menu / Option |
| 56.0 | 2329.8 | 689.6 | 45.0 | Select allows users to make a single selection or multiple selections from a list of  \| options. |
| 1166.0 | 2289.4 | 44.1 | 14.0 | Option |
| 1166.0 | 2322.4 | 44.1 | 14.0 | Option |
| 1166.0 | 2355.4 | 44.1 | 14.0 | Option |
| 1166.0 | 2388.4 | 44.1 | 14.0 | Option |
| 1166.0 | 2421.4 | 44.1 | 14.0 | Option |
| 1166.0 | 2454.4 | 44.1 | 14.0 | Option |
| 1166.0 | 2487.4 | 44.1 | 14.0 | Option |
| 1166.0 | 2520.4 | 44.1 | 14.0 | Option |
| 790.0 | 2599.4 | 44.1 | 14.0 | Option |
| 818.0 | 2655.4 | 44.1 | 14.0 | Option |
| 818.0 | 2711.4 | 44.1 | 14.0 | Option |
| 822.0 | 2768.9 | 44.1 | 14.0 | Option |
| 1166.0 | 2600.4 | 44.1 | 14.0 | Option |
| 1194.0 | 2656.4 | 44.1 | 14.0 | Option |
| 1194.0 | 2712.4 | 44.1 | 14.0 | Option |
| 1198.0 | 2769.9 | 44.1 | 14.0 | Option |
| 842.0 | 2829.4 | 44.1 | 29.8 | Option \| Option |
| 1218.0 | 2830.4 | 44.1 | 29.8 | Option \| Option |
| 818.0 | 2903.4 | 420.1 | 17.0 | Option \| Option |
| 842.0 | 2961.4 | 44.1 | 29.8 | Option \| Option |
| 1218.0 | 2964.4 | 44.1 | 29.8 | Option \| Option |
| 826.0 | 3035.4 | 420.1 | 23.0 | Option \| Option |
| 790.0 | 3115.4 | 44.1 | 14.0 | Option |
| 818.0 | 3171.4 | 44.1 | 14.0 | Option |
| 818.0 | 3231.4 | 44.1 | 14.0 | Option |
| 822.0 | 3290.9 | 44.1 | 14.0 | Option |
| 842.0 | 3351.4 | 44.1 | 29.8 | Option \| Option |
| 818.0 | 3427.4 | 44.1 | 14.0 | Option |
| 750.5 | 3516.9 | 15.7 | 14.0 | +1 |

### A.8 Página 8 — Small Components

| x | y | w | h | Texto |
|---:|---:|---:|---:|---|
| 136.5 | 80.8 | 1357.4 | 30.3 | Venture \| Small Components |
| 76.0 | 210.6 | 861.4 | 96.0 | Small Components |
| 76.0 | 363.2 | 1416.8 | 167.0 | Global colors shouldn”t be used directly. Instead, they”re the source for our semantic colors. We don” \| t use global colors directly because when switching from Light to Dark, or from Brand  \| A to Brand B, a semantic color stays usable while you have to re-apply a matching global  \| color. |
| 56.0 | 655.8 | 165.3 | 28.0 | Checkboxes |
| 56.0 | 703.8 | 676.0 | 45.0 | The Checkbox is an input control to select one or more options. The option can  \| be true, false, or indeterminate. |
| 56.0 | 855.8 | 171.8 | 28.0 | Radio Button |
| 56.0 | 903.8 | 622.5 | 18.0 | The Radio Button is an input control to select a single option from the list. |
| 56.0 | 1025.8 | 64.3 | 28.0 | Tags |
| 56.0 | 1073.8 | 683.7 | 45.0 | Tags represent a set of interactive, merchant-supplied keywords that help label,  \| organize, and categorize objects. |
| 1269.0 | 1050.2 | 70.6 | 12.0 | Tag Content |
| 1269.0 | 1087.2 | 70.6 | 12.0 | Tag Content |
| 1287.0 | 1124.2 | 70.6 | 12.0 | Tag Content |
| 1287.0 | 1161.2 | 70.6 | 12.0 | Tag Content |
| 56.0 | 1241.8 | 90.8 | 28.0 | Toggle |
| 56.0 | 1289.8 | 600.0 | 18.0 | A toggle is used to view or switch between enabled or disabled states. |
| 56.0 | 1409.8 | 141.5 | 28.0 | Pagination |
| 56.0 | 1457.8 | 695.5 | 45.0 | Use pagination to let merchants move through an ordered collection of items that  \| has been split into pages. |
| 56.0 | 1549.8 | 85.5 | 28.0 | Badge |
| 56.0 | 1597.8 | 670.0 | 45.0 | Badges are used to inform merchants of the status of an object or of an action  \| that”s been taken. |
| 1218.0 | 1577.2 | 267.7 | 14.2 | Badge \| Badge \| Badge \| Badge |
| 1218.0 | 1633.2 | 267.7 | 14.2 | Badge \| Badge \| Badge \| Badge |
| 1218.0 | 1689.2 | 267.7 | 14.2 | Badge \| Badge \| Badge \| Badge |
| 1218.0 | 1745.2 | 267.7 | 14.2 | Badge \| Badge \| Badge \| Badge |
| 1218.0 | 1801.2 | 267.7 | 14.2 | Badge \| Badge \| Badge \| Badge |
| 1218.0 | 1857.2 | 267.7 | 14.2 | Badge \| Badge \| Badge \| Badge |
| 1218.0 | 1913.2 | 267.7 | 14.2 | Badge \| Badge \| Badge \| Badge |
| 1252.5 | 1418.2 | 207.4 | 12.0 | 1 \| 2 \| 3 \| 4 \| 5 \| ... \| 10 |
| 56.0 | 1997.8 | 72.6 | 28.0 | Label |
| 56.0 | 2045.8 | 670.0 | 45.0 | Badges are used to inform merchants of the status of an object or of an action  \| that”s been taken. |
| 56.0 | 2197.8 | 172.1 | 28.0 | Country Flag |
| 56.0 | 2245.8 | 670.0 | 45.0 | Badges are used to inform merchants of the status of an object or of an action  \| that”s been taken. |
| 56.0 | 2523.8 | 66.8 | 28.0 | Logo |
| 56.0 | 2571.8 | 670.0 | 45.0 | Badges are used to inform merchants of the status of an object or of an action  \| that”s been taken. |
| 56.0 | 3083.8 | 86.1 | 28.0 | Avatar |
| 56.0 | 3131.8 | 688.6 | 45.0 | Avatars are used to show a thumbnail representation of an individual or business  \| in the interface. |
| 56.0 | 4385.8 | 64.5 | 28.0 | Tabs |
| 56.0 | 4433.8 | 672.1 | 45.0 | Tabs are used to organize content by grouping similar information on the same  \| page. |
| 1073.0 | 4413.4 | 151.6 | 14.0 | Title \| Title |
| 1071.0 | 4529.6 | 155.8 | 16.0 | Menu \| Menu |
| 1053.0 | 4635.9 | 321.1 | 14.0 | List \| Kanban \| Table \| Grid |
| 1051.0 | 4719.6 | 248.8 | 16.0 | Menu \| Menu \| Menu |
| 56.0 | 4790.8 | 64.5 | 28.0 | Tabs |
| 56.0 | 4838.8 | 672.1 | 45.0 | Tabs are used to organize content by grouping similar information on the same  \| page. |
| 1073.0 | 4818.4 | 151.6 | 14.0 | Title \| Title |
| 1071.0 | 4934.6 | 155.8 | 16.0 | Menu \| Menu |
| 1053.0 | 5040.9 | 321.1 | 14.0 | List \| Kanban \| Table \| Grid |
| 1051.0 | 5124.6 | 248.8 | 16.0 | Menu \| Menu \| Menu |

### A.9 Página 9 — Navigation

| x | y | w | h | Texto |
|---:|---:|---:|---:|---|
| 136.5 | 80.8 | 1357.4 | 30.3 | Venture \| Navigation |
| 76.0 | 210.6 | 490.9 | 96.0 | Navigation |
| 76.0 | 363.2 | 1416.8 | 167.0 | Global colors shouldn”t be used directly. Instead, they”re the source for our semantic colors. We don” \| t use global colors directly because when switching from Light to Dark, or from Brand  \| A to Brand B, a semantic color stays usable while you have to re-apply a matching global  \| color. |
| 277.0 | 655.8 | 141.2 | 28.0 | Menu Item |
| 337.0 | 734.9 | 29.6 | 14.0 | Title |
| 337.0 | 782.9 | 29.6 | 14.0 | Title |
| 337.0 | 830.9 | 29.6 | 14.0 | Title |
| 345.0 | 870.9 | 29.6 | 14.0 | Title |
| 345.0 | 910.9 | 29.6 | 14.0 | Title |
| 345.0 | 950.9 | 29.6 | 14.0 | Title |
| 337.0 | 998.9 | 29.6 | 14.0 | Title |
| 345.0 | 1038.9 | 29.6 | 14.0 | Title |
| 345.0 | 1078.9 | 29.6 | 14.0 | Title |
| 345.0 | 1118.9 | 29.6 | 14.0 | Title |
| 637.0 | 655.8 | 103.1 | 28.0 | Sidebar |
| 681.0 | 1098.2 | 61.9 | 12.0 | DATABASE |
| 713.0 | 1132.9 | 61.6 | 14.0 | Analytics |
| 713.0 | 1172.9 | 60.7 | 14.0 | Contacts |
| 713.0 | 1212.9 | 75.2 | 14.0 | Companies |
| 713.0 | 826.9 | 73.0 | 14.0 | Dashboard |
| 713.0 | 866.9 | 85.0 | 14.0 | Notifications |
| 713.0 | 906.9 | 39.7 | 14.0 | Notes |
| 713.0 | 946.9 | 38.8 | 14.0 | Tasks |
| 713.0 | 986.9 | 43.2 | 14.0 | Emails |
| 713.0 | 1026.9 | 67.9 | 14.0 | Calendars |
| 725.0 | 749.0 | 74.9 | 20.0 | Venture |
| 1061.0 | 726.2 | 117.8 | 12.0 | GENERAL SETTINGS |
| 1101.0 | 767.9 | 38.2 | 14.0 | Apps |
| 1101.0 | 807.9 | 55.8 | 14.0 | Account |
| 1101.0 | 847.9 | 81.2 | 14.0 | Notification |
| 1101.0 | 887.9 | 128.5 | 14.0 | Language & Region |
| 1061.0 | 951.2 | 137.2 | 12.0 | WORKSPACE SETTINGS |
| 1101.0 | 992.9 | 52.0 | 14.0 | General |
| 1101.0 | 1032.9 | 63.0 | 14.0 | Members |
| 1101.0 | 1072.9 | 40.0 | 14.0 | Billing |
| 713.0 | 1288.9 | 80.3 | 14.0 | Integrations |
| 713.0 | 1332.9 | 55.6 | 14.0 | Settings |
| 337.0 | 1379.9 | 29.6 | 14.0 | Title |
| 337.0 | 1426.9 | 29.6 | 14.0 | Title |
| 682.5 | 1703.6 | 282.7 | 16.0 | M \| Marketing Team”s \| B |

### A.10 Página 10 — Header

| x | y | w | h | Texto |
|---:|---:|---:|---:|---|
| 136.5 | 80.8 | 1357.5 | 30.3 | Venture \| Header |
| 76.0 | 210.6 | 335.4 | 96.0 | Header |
| 76.0 | 363.2 | 1416.8 | 167.0 | Global colors shouldn”t be used directly. Instead, they”re the source for our semantic colors. We don” \| t use global colors directly because when switching from Light to Dark, or from Brand  \| A to Brand B, a semantic color stays usable while you have to re-apply a matching global  \| color. |
| 56.0 | 655.8 | 155.4 | 28.0 | Top Header |
| 132.0 | 731.6 | 1055.8 | 16.0 | Search \| F \| Help Center \| Brian F. |
| 88.0 | 813.4 | 1115.2 | 24.0 | Title \| List \| Kanban \| Table \| Grid \| Sort By \| Filter  \| Add Contact |

### A.11 Página 11 — Cards

| x | y | w | h | Texto |
|---:|---:|---:|---:|---|
| 136.5 | 80.8 | 1357.4 | 30.3 | Venture \| Cards |
| 76.0 | 210.6 | 271.5 | 96.0 | Cards |
| 76.0 | 363.2 | 1416.8 | 167.0 | Global colors shouldn”t be used directly. Instead, they”re the source for our semantic colors. We don” \| t use global colors directly because when switching from Light to Dark, or from Brand  \| A to Brand B, a semantic color stays usable while you have to re-apply a matching global  \| color. |
| 76.0 | 783.8 | 112.6 | 18.0 | Product Hunt |
| 76.0 | 814.4 | 78.9 | 14.0 | Web Design |
| 100.0 | 851.4 | 120.8 | 14.0 | New York City, NY |
| 55.0 | 915.4 | 137.6 | 14.0 | 5 \| Show \| Row |
| 56.0 | 655.8 | 221.1 | 28.0 | Card Collections |
| 268.3 | 730.2 | 36.1 | 12.0 | Active |
| 371.0 | 779.8 | 83.6 | 18.0 | Facebook |
| 371.0 | 810.4 | 219.1 | 56.0 | Lorem ipsum dolor sit amet,  \| consectetur adipiscing elit, thing  \| here described. |
| 569.3 | 727.8 | 257.2 | 18.0 | Install \| Robert Fox |
| 752.0 | 756.4 | 41.5 | 14.0 | Austin |
| 680.0 | 792.2 | 62.6 | 12.0 | Customers |
| 702.0 | 829.4 | 195.1 | 14.0 | georgia.young@example.com |
| 702.0 | 862.4 | 99.7 | 14.0 | (671) 555-0110 |
| 730.3 | 907.4 | 149.1 | 14.0 | Call \| Mail |
| 983.0 | 726.2 | 97.6 | 12.0 | Badge \| Badge |
| 977.0 | 760.6 | 172.9 | 16.0 | Product Team Meeting |
| 977.0 | 796.4 | 310.1 | 35.0 | This monthly progress agenda is following this  \| items: |
| 998.0 | 842.4 | 249.6 | 14.0 | Introduction to Newest Product Plan |
| 998.0 | 867.4 | 234.2 | 35.0 | Monthly Revenue updates for each  \| products |
| 1001.0 | 921.4 | 79.8 | 14.0 | Introduction |
| 1009.1 | 900.4 | 279.6 | 14.0 | Brian F. \| 5:20 PM |
| 1001.2 | 950.4 | 97.1 | 14.0 | Weekly Updates |
| 336.0 | 1237.2 | 152.6 | 12.0 | Badge \| Badge \| Badge |
| 330.0 | 1275.4 | 187.3 | 14.0 | Monthly Product Discussion |
| 354.0 | 1312.4 | 260.0 | 14.0 | Due Date 24 Jan 2023 \| 4/12 |
| 557.0 | 1350.9 | 56.0 | 14.0 | 8 \| 15 |
| 678.0 | 983.6 | 129.7 | 16.0 | What is Venture? |
| 678.0 | 1011.2 | 209.4 | 29.0 | Discover how Venture can transform  \| your workflow. |
| 698.0 | 1093.4 | 67.1 | 14.0 | May 2023 |
| 682.1 | 1129.6 | 115.0 | 16.0 | $220k \| Revenue |
| 977.0 | 1008.4 | 198.9 | 23.2 | Product Team MeetingS \| ummary and Weekly Goals |
| 977.0 | 1051.4 | 310.1 | 35.0 | This monthly progress agenda is following this  \| items: |
| 998.0 | 1097.4 | 249.6 | 14.0 | Introduction to Newest Product Plan |
| 998.0 | 1122.4 | 234.2 | 35.0 | Monthly Revenue updates for each  \| products |
| 1001.0 | 1176.4 | 79.8 | 14.0 | Introduction |
| 1001.2 | 1205.4 | 97.1 | 14.0 | Weekly Updates |
| 1233.3 | 1227.4 | 60.7 | 14.0 | 5:20 PMS |
| 1001.0 | 1263.4 | 174.9 | 14.0 | ummary and Weekly Goals |
| 983.0 | 979.4 | 97.6 | 14.0 | Badge \| Discussion \| Badge |
| 1001.4 | 1227.4 | 71.1 | 21.0 | Discussion \| Brian F. |

### A.12 Página 12 — Table

| x | y | w | h | Texto |
|---:|---:|---:|---:|---|
| 136.5 | 80.8 | 1357.5 | 30.3 | Venture \| Table |
| 76.0 | 210.6 | 250.1 | 96.0 | Table |
| 76.0 | 363.2 | 1416.8 | 167.0 | Global colors shouldn”t be used directly. Instead, they”re the source for our semantic colors. We don” \| t use global colors directly because when switching from Light to Dark, or from Brand  \| A to Brand B, a semantic color stays usable while you have to re-apply a matching global  \| color. |
| 56.0 | 655.8 | 65.7 | 28.0 | Base |
| 128.0 | 718.9 | 442.8 | 17.3 | Robert Fox \| Call \| Mail \| NAME |
| 56.0 | 798.8 | 111.6 | 28.0 | Heading |
| 84.0 | 878.4 | 1054.2 | 14.0 | Name \| Email \| Phone \| Category \| Location \| Gender \| Action |
| 84.0 | 963.4 | 762.4 | 14.0 | Companies Name \| Industry \| Location \| Status |
| 84.0 | 1048.4 | 994.8 | 14.0 | Task Name \| Due Date \| Label \| Status \| Member |
| 84.0 | 1133.4 | 980.6 | 14.0 | Title \| Status \| Open Rate \| Total Clicks \| Bounce rate \| Reply Rate |
| 112.0 | 1218.4 | 1028.2 | 14.0 | ID \| Date \| Client \| Company \| Payment \| Status \| Action |
| 56.0 | 1305.8 | 72.3 | 28.0 | Rows |
| 148.0 | 1389.4 | 360.6 | 14.0 | Robert Fox \| willie.jennings@example.com |
| 124.0 | 1457.9 | 278.9 | 14.0 | Product Hunt \| Web Design |
| 116.0 | 1526.4 | 287.6 | 35.0 | Create Monthly Revenue Recap for All Prod \| u \| ct Linear |
| 472.0 | 1526.4 | 81.1 | 14.0 | 15 Jan 2023 |
| 572.0 | 1389.4 | 200.6 | 14.0 | (671) 555-0110 \| Customers |
| 596.0 | 1457.9 | 268.1 | 14.0 | New York City, NY \| Active |
| 618.0 | 1526.7 | 203.6 | 12.0 | Internal \| Document \| Marketing |
| 872.0 | 1389.4 | 41.5 | 14.0 | Austin |
| 916.0 | 1527.2 | 36.1 | 12.0 | Active |
| 1004.0 | 1389.4 | 221.5 | 14.0 | Male \| Call \| Mail |
| 116.0 | 1595.9 | 239.7 | 35.0 | Start a blog to reach your creative p \| e \| ak |
| 116.0 | 1664.9 | 251.2 | 14.0 | 14295112 \| 16/08/2013 |
| 428.0 | 1596.2 | 60.9 | 12.0 | Scheduled |
| 444.0 | 1664.9 | 87.3 | 14.0 | Jenny Wilson |
| 541.0 | 1595.9 | 169.6 | 14.0 | 24% \| 24% |
| 644.0 | 1664.9 | 89.5 | 14.0 | Abstergo Ltd. |
| 844.0 | 1595.9 | 28.6 | 14.0 | 24% |
| 814.0 | 1664.9 | 221.7 | 14.0 | $2.120 \| PENDING |
| 1006.0 | 1595.9 | 28.6 | 14.0 | 24% |
| 56.0 | 1755.8 | 118.2 | 28.0 | Task List |
| 132.0 | 1844.9 | 855.3 | 14.0 | Monthly Product Discussion \| Due Date 24 Jan 2023 \| Internal \| Marketing \| Urgent |
| 132.0 | 1924.9 | 870.6 | 14.0 | Uploading New Items to Marketplace \| Due Date 09 Jan 2023 \| Report \| Document \| Marketing |

### A.13 Página 13 — Modals

| x | y | w | h | Texto |
|---:|---:|---:|---:|---|
| 136.5 | 80.8 | 1357.4 | 30.3 | Venture \| Modals |
| 76.0 | 210.6 | 333.7 | 96.0 | Modals |
| 76.0 | 363.2 | 1416.8 | 167.0 | Global colors shouldn”t be used directly. Instead, they”re the source for our semantic colors. We don” \| t use global colors directly because when switching from Light to Dark, or from Brand  \| A to Brand B, a semantic color stays usable while you have to re-apply a matching global  \| color. |
| 56.0 | 655.8 | 62.6 | 28.0 | Task |
| 96.0 | 745.8 | 240.6 | 18.0 | Monthly Product Discussion |
| 100.0 | 817.4 | 76.7 | 14.0 | Description |
| 100.0 | 846.4 | 544.3 | 35.0 | Monthly Product Discussion by Design and Marketing Teams with CEO to Plan our  \| future products sales and reports |
| 128.0 | 912.4 | 97.3 | 14.0 | Task Checklist |
| 128.0 | 953.4 | 172.9 | 14.0 | Prepare Design Document |
| 128.0 | 993.4 | 135.0 | 14.0 | Document Signature |
| 128.0 | 1033.4 | 207.8 | 14.0 | Pitch Deck Presentation Design |
| 130.0 | 1075.2 | 51.7 | 12.0 | Add Item |
| 128.0 | 1121.4 | 76.7 | 14.0 | Daily Sprint |
| 128.0 | 1162.4 | 172.9 | 14.0 | Prepare Design Document |
| 128.0 | 1202.4 | 135.0 | 14.0 | Document Signature |
| 130.0 | 1244.2 | 51.7 | 12.0 | Add Item |
| 708.0 | 817.4 | 55.5 | 14.0 | Member |
| 708.0 | 902.4 | 61.7 | 14.0 | Due Date |
| 752.0 | 941.4 | 83.4 | 14.0 | 24 Jan 2023 |
| 708.0 | 992.4 | 43.8 | 14.0 | Labels |
| 716.0 | 1027.4 | 142.3 | 14.0 | Internal \| Marketing |
| 708.0 | 1074.4 | 78.1 | 14.0 | Attachment |
| 328.0 | 1298.4 | 127.1 | 14.0 | Add New Checklist |
| 112.0 | 1363.4 | 128.9 | 14.0 | Add Your Comment |
| 100.0 | 1426.4 | 547.7 | 14.0 | Activity \| Hide Activity Details |
| 144.0 | 1471.4 | 448.9 | 14.0 | Frank Edward mentioned you in a comment in Design Team Reports |
| 156.0 | 1505.4 | 410.1 | 34.0 | @brianf have you update this design so we can use it on next  \| meeting? |
| 144.0 | 1561.2 | 157.3 | 12.0 | 3 hours ago \| Design Team |
| 144.0 | 1590.4 | 477.3 | 14.0 | James Wong Changed the due date of Monthly Team Meeting to Sep 12 |
| 144.0 | 1618.2 | 130.3 | 12.0 | Aug 24 \| Design Team |
| 56.0 | 1714.8 | 170.2 | 28.0 | Notifications |
| 80.0 | 1788.8 | 109.4 | 18.0 | Notifications |
| 124.0 | 1842.9 | 149.8 | 14.0 | All \| 12 \| Tasks |
| 92.0 | 1909.2 | 95.0 | 12.0 | Mark All as Read |
| 164.0 | 1971.4 | 306.1 | 35.0 | Frank Edward mentioned you in a comment in  \| Design Team Reports |
| 176.0 | 2033.4 | 288.9 | 35.0 | @brianf have you update this design so we  \| can use it on next meeting? |
| 176.0 | 2102.2 | 31.9 | 12.0 | Reply |
| 164.0 | 2139.2 | 157.3 | 12.0 | 3 hours ago \| Design Team |
| 164.0 | 2201.4 | 302.6 | 35.0 | Elsa Wright Asking for edit access in Monthly  \| Team Progress |
| 194.0 | 2262.2 | 137.8 | 12.0 | Decline \| Accept |
| 164.0 | 2299.2 | 163.9 | 12.0 | Yesterday \| Marketing Team |
| 140.0 | 2361.4 | 300.0 | 35.0 | James Wong mentioned you in a comment in  \| Monthly Team Meeting |
| 152.0 | 2423.4 | 276.1 | 14.0 | @brianf let”s we plan all this event by now |
| 152.0 | 2471.2 | 31.9 | 12.0 | Reply |
| 140.0 | 2508.2 | 130.3 | 12.0 | Aug 24 \| Design Team |
| 240.0 | 2570.4 | 130.8 | 14.0 | See all notifications |
| 334.0 | 1842.9 | 59.4 | 14.0 | Archived |
| 56.0 | 2661.8 | 117.2 | 28.0 | Overlays |

### A.14 Página 14 — Dashboard

| x | y | w | h | Texto |
|---:|---:|---:|---:|---|
| 136.5 | 80.8 | 1357.4 | 30.3 | Venture \| Dashboard |
| 76.0 | 210.6 | 500.3 | 96.0 | Dashboard |
| 76.0 | 363.2 | 1416.8 | 167.0 | Global colors shouldn”t be used directly. Instead, they”re the source for our semantic colors. We don” \| t use global colors directly because when switching from Light to Dark, or from Brand  \| A to Brand B, a semantic color stays usable while you have to re-apply a matching global  \| color. |
| 56.0 | 655.8 | 75.4 | 28.0 | Chart |
| 624.2 | 739.7 | 296.2 | 12.0 | Sun \| Mon \| Tue \| Wed \| Thu \| Fri \| Sat |
| 56.2 | 826.2 | 61.5 | 12.0 | Production |
| 56.2 | 859.6 | 56.7 | 12.0 | Marketing |
| 56.2 | 893.0 | 65.6 | 12.0 | Operational |
| 56.2 | 926.4 | 65.6 | 12.0 | Operational |
| 136.1 | 956.4 | 239.5 | 12.0 | 0 \| 10k \| 20k \| 30k \| 40k |
| 479.0 | 802.4 | 50.8 | 24.0 | 64% |
| 618.0 | 999.2 | 309.4 | 29.0 | Learn about how we  \| count workhours. \| Less \| More |

### A.15 Página 15 — Others

| x | y | w | h | Texto |
|---:|---:|---:|---:|---|
| 136.5 | 80.8 | 1357.4 | 30.3 | Venture \| Others |
| 76.0 | 210.6 | 312.8 | 96.0 | Others |
| 76.0 | 363.2 | 1416.8 | 167.0 | Global colors shouldn”t be used directly. Instead, they”re the source for our semantic colors. We don” \| t use global colors directly because when switching from Light to Dark, or from Brand  \| A to Brand B, a semantic color stays usable while you have to re-apply a matching global  \| color. |
| 56.0 | 655.8 | 309.8 | 28.0 | Design Title Navigation |
| 264.4 | 803.9 | 352.4 | 64.0 | Notes Page |
| 129.0 | 1086.4 | 273.3 | 64.0 | Notes V1 |
| 56.0 | 1297.8 | 194.2 | 28.0 | Branding Logo |

## Apêndice B — dimensões vetoriais recorrentes

Esta seção lista as dimensões de bounding boxes mais recorrentes em cada página. Formas minúsculas de glifos foram filtradas parcialmente, mas algumas ainda aparecem porque fazem parte da anatomia dos ícones.

### B.1 Página 1 — Phosphor Icons 1.3.1

| Dimensão | Ocorrências | Exemplo x/y | Fill | Stroke |
|---|---:|---|---|---|
| 9.4×7.4 | 62 | 416.5/205.4 | #000000 | — |
| 30.5×23.2 | 54 | 1475.2/157.4 | #000000 | — |
| 33.2×25.2 | 53 | 1884.9/156.4 | #000000 | — |
| 8.1×6.4 | 53 | 1001.8/321.8 | #000000 | — |
| 10.7×8.4 | 51 | 2233.5/197.0 | #000000 | — |
| 33.1×25.2 | 34 | 158.7/197.0 | #000000 | — |
| 12.1×9.4 | 29 | 240.3/284.7 | #000000 | — |
| 14.7×11.4 | 26 | 907.8/163.3 | #000000 | — |
| 10.9×8.6 | 26 | 416.4/205.3 | #000000 | — |
| 9.6×7.6 | 24 | 2802.2/165.2 | #000000 | — |
| 25.2×19.3 | 19 | 2138.1/198.0 | #000000 | — |
| 9.5×13.6 | 19 | 76.5/321.7 | #000000 | — |
| 13.4×10.4 | 19 | 75.2/406.0 | #000000 | — |
| 17.5×7.6 | 18 | 409.2/278.2 | #000000 | — |
| 27.9×25.2 | 17 | 738.1/156.4 | #000000 | — |
| 28.1×23.4 | 15 | 3120.5/197.9 | #000000 | — |
| 33.2×21.3 | 15 | 1062.9/1011.3 | #000000 | — |
| 31.8×24.2 | 11 | 1310.8/197.0 | #000000 | — |
| 12.2×5.6 | 11 | 2881.8/734.8 | #000000 | — |
| 33.2×19.3 | 10 | 1967.1/161.4 | #000000 | — |
| 31.3×23.8 | 10 | 2787.0/278.6 | #000000 | — |
| 22.6×25.3 | 10 | 404.0/562.5 | #000000 | — |
| 30.5×17.3 | 10 | 2050.6/1706.6 | #000000 | — |
| 33.1×19.3 | 9 | 2295.9/161.4 | #000000 | — |
| 33.1×21.3 | 9 | 2706.9/158.4 | #000000 | — |

### B.2 Página 2 — Global Colors

| Dimensão | Ocorrências | Exemplo x/y | Fill | Stroke |
|---|---:|---|---|---|
| 275.6×254.0 | 70 | 56.0/702.0 | #000000 | — |
| 277.6×178.0 | 70 | 55.0/701.0 | #FAFAFA | — |
| 275.6×177.0 | 70 | 56.0/702.0 | #000000 | — |
| 275.6×77.0 | 70 | 56.0/879.0 | #FFFFFF | — |
| 277.6×256.0 | 70 | 55.0/701.0 | #D9DFEB | — |
| 61.2×10.5 | 5 | 367.6/924.7 | #AFAFAF | — |
| 342.2×296.7 | 4 | 531.3/25.5 | #D8D8D8 | — |
| 61.3×10.5 | 3 | 1254.4/1202.7 | #AFAFAF | — |
| 59.7×10.5 | 3 | 367.6/4302.7 | #AFAFAF | — |
| 1570.0×614.0 | 2 | 0.0/0.0 | #000000 | — |
| 43.0×10.5 | 2 | 72.0/924.7 | #AFAFAF | — |
| 99.8×15.0 | 2 | 367.6/899.2 | #000000 | — |
| 59.5×10.5 | 2 | 663.2/924.7 | #AFAFAF | — |
| 62.6×10.5 | 2 | 1254.4/924.7 | #AFAFAF | — |
| 87.0×15.0 | 2 | 72.0/1455.3 | #000000 | — |
| 66.8×15.0 | 2 | 367.6/1797.2 | #000000 | — |
| 100.2×19.1 | 2 | 367.6/2417.2 | #000000 | — |
| 58.3×10.5 | 2 | 367.6/2442.7 | #AFAFAF | — |
| 56.9×10.5 | 2 | 958.8/2442.7 | #AFAFAF | — |
| 62.9×10.5 | 2 | 72.0/2720.7 | #AFAFAF | — |
| 61.1×10.5 | 2 | 1254.4/2720.7 | #AFAFAF | — |
| 59.8×10.5 | 2 | 72.0/3062.7 | #AFAFAF | — |
| 75.5×15.4 | 2 | 367.6/3036.9 | #000000 | — |
| 91.2×18.8 | 2 | 367.6/3657.2 | #000000 | — |
| 55.1×10.5 | 2 | 72.0/4302.7 | #AFAFAF | — |

### B.3 Página 3 — Semantic Colors

| Dimensão | Ocorrências | Exemplo x/y | Fill | Stroke |
|---|---:|---|---|---|
| 349.5×254.0 | 96 | 56.0/729.0 | #000000 | — |
| 351.5×178.0 | 96 | 55.0/728.0 | #FAFAFA | — |
| 349.5×177.0 | 96 | 56.0/729.0 | #000000 | — |
| 349.5×77.0 | 96 | 56.0/906.0 | #FFFFFF | — |
| 351.5×256.0 | 96 | 55.0/728.0 | #D9DFEB | — |
| 46.0×14.8 | 13 | 72.0/3784.5 | #000000 | — |
| 56.5×14.8 | 13 | 441.5/3784.5 | #000000 | — |
| 59.4×15.3 | 13 | 811.0/3783.9 | #000000 | — |
| 81.7×15.4 | 13 | 72.0/4061.9 | #000000 | — |
| 82.7×15.0 | 11 | 1180.5/3784.3 | #000000 | — |
| 68.9×10.5 | 9 | 1180.5/951.7 | #AFAFAF | — |
| 68.7×10.5 | 9 | 441.5/1527.7 | #AFAFAF | — |
| 69.1×10.5 | 7 | 811.0/1527.7 | #AFAFAF | — |
| 68.0×10.5 | 5 | 811.0/951.7 | #AFAFAF | — |
| 46.3×10.5 | 5 | 811.0/1213.7 | #AFAFAF | — |
| 60.2×10.5 | 5 | 72.0/1527.7 | #AFAFAF | — |
| 342.2×296.7 | 4 | 531.3/25.5 | #D8D8D8 | — |
| 73.3×19.2 | 4 | 72.0/925.9 | #000000 | — |
| 75.4×10.5 | 4 | 72.0/951.7 | #AFAFAF | — |
| 102.6×18.8 | 4 | 441.5/926.3 | #000000 | — |
| 68.8×10.5 | 4 | 441.5/951.7 | #AFAFAF | — |
| 74.1×19.2 | 4 | 811.0/925.9 | #000000 | — |
| 107.3×15.5 | 3 | 72.0/1187.8 | #000000 | — |
| 49.3×10.5 | 3 | 72.0/1213.7 | #AFAFAF | — |
| 74.6×15.3 | 3 | 441.5/1187.9 | #000000 | — |

### B.4 Página 4 — Typography

| Dimensão | Ocorrências | Exemplo x/y | Fill | Stroke |
|---|---:|---|---|---|
| 124.0×13.7 | 10 | 56.0/750.5 | #404040 | — |
| 110.4×15.5 | 5 | 56.0/1336.8 | #616161 | — |
| 135.5×13.7 | 5 | 56.0/1748.5 | #404040 | — |
| 121.3×17.0 | 5 | 56.0/2134.9 | #404040 | — |
| 342.2×296.7 | 4 | 531.3/25.5 | #D8D8D8 | — |
| 246.3×27.4 | 3 | 56.0/1700.7 | #1B1B1B | — |
| 169.0×27.4 | 3 | 56.0/2279.7 | #1B1B1B | — |
| 108.0×15.5 | 3 | 56.0/2367.8 | #616161 | — |
| 201.0×27.1 | 3 | 56.0/2858.7 | #1B1B1B | — |
| 108.1×15.5 | 3 | 56.0/2946.8 | #616161 | — |
| 165.8×27.0 | 3 | 56.0/3437.7 | #1B1B1B | — |
| 108.4×15.5 | 3 | 56.0/3525.8 | #616161 | — |
| 243.1×27.0 | 3 | 56.0/4016.7 | #1B1B1B | — |
| 107.8×15.5 | 3 | 56.0/4104.8 | #616161 | — |
| 1570.0×569.0 | 2 | 0.0/0.0 | #000000 | — |
| 1440.0×697.0 | 1 | 0.0/0.0 | #000000 | — |
| 558.0×663.6 | 1 | 740.5/362.9 | #D8D8D8 | — |
| 18.9×16.3 | 1 | 99.5/78.8 | #000000 | — |
| 30.5×36.4 | 1 | 76.0/78.8 | #000000 | — |
| 112.0×22.3 | 1 | 136.5/86.0 | #000000 | — |
| 134.2×22.6 | 1 | 1359.0/88.5 | #000929 | — |
| 545.1×90.5 | 1 | 76.0/227.2 | #000000 | — |
| 1180.2×121.3 | 1 | 76.0/367.6 | #6D7076 | — |
| 177.2×29.9 | 1 | 56.0/618.5 | #1B1B1B | — |
| 267.6×27.4 | 1 | 56.0/702.7 | #1B1B1B | — |

### B.5 Página 5 — Button

| Dimensão | Ocorrências | Exemplo x/y | Fill | Stroke |
|---|---:|---|---|---|
| 13.5×13.5 | 73 | 526.2/705.8 | #FFFFFF | — |
| 12.0×12.0 | 41 | 702.0/704.0 | #FFFFFF | — |
| 15.0×15.0 | 32 | 115.5/710.5 | #FFFFFF | — |
| 79.0×10.4 | 16 | 549.0/707.8 | #FFFFFF | — |
| 67.7×8.9 | 16 | 719.0/706.3 | #FFFFFF | — |
| 90.3×11.8 | 16 | 356.0/708.4 | #FFFFFF | — |
| 101.5×13.3 | 16 | 140.0/712.9 | #FFFFFF | — |
| 128.0×32.0 | 14 | 689.0/694.0 | #000000 | — |
| 152.0×37.0 | 13 | 513.0/694.0 | #000000 | — |
| 190.0×48.0 | 13 | 96.0/694.0 | #000000 | — |
| 175.0×40.0 | 9 | 314.0/694.0 | #000000 | — |
| 8.5×6.0 | 9 | 999.7/711.3 | #FFFFFF | — |
| 16.5×16.5 | 9 | 995.8/705.8 | #FFFFFF | — |
| 9.9×6.9 | 9 | 939.0/714.9 | #FFFFFF | — |
| 19.5×19.5 | 9 | 934.2/708.2 | #FFFFFF | — |
| 36.0×36.0 | 7 | 1048.0/694.0 | #000000 | — |
| 32.0×32.0 | 7 | 1108.0/694.0 | #000000 | — |
| 40.0×40.0 | 7 | 984.0/694.0 | #000000 | — |
| 48.0×48.0 | 7 | 920.0/694.0 | #000000 | — |
| 342.2×296.7 | 4 | 531.3/25.5 | #D8D8D8 | — |
| 130.0×34.0 | 4 | 1219.0/865.0 | #000000 | — |
| 175.0×42.0 | 4 | 1220.0/758.0 | #000000 | — |
| 38.0×38.0 | 3 | 1047.0/1125.0 | #000000 | — |
| 34.0×34.0 | 3 | 1107.0/1125.0 | #000000 | — |
| 146.0×39.0 | 3 | 516.0/1557.0 | #BF6F6F | — |

### B.6 Página 6 — Input Elements

| Dimensão | Ocorrências | Exemplo x/y | Fill | Stroke |
|---|---:|---|---|---|
| 72.4×13.0 | 12 | 96.0/764.8 | #000000 | — |
| 129.9×13.4 | 12 | 221.0/803.5 | #AFAFAF | — |
| 25.9×10.4 | 12 | 507.4/803.9 | #AFAFAF | — |
| 281.0×11.6 | 12 | 96.0/840.9 | #AFAFAF | — |
| 13.9×10.2 | 8 | 108.0/803.8 | #AFAFAF | — |
| 14.1×7.9 | 8 | 142.9/805.2 | #AFAFAF | — |
| 20.0×20.0 | 8 | 1414.0/1438.5 | #F2F2F2 | — |
| 450.0×41.0 | 7 | 96.0/788.0 | #FFFFFF | — |
| 452.0×43.0 | 7 | 95.0/787.0 | #AFAFAF | — |
| 14.3×14.3 | 6 | 190.9/800.4 | #AFAFAF | — |
| 14.6×14.6 | 5 | 771.7/800.2 | #D8D8D8 | — |
| 450.0×124.0 | 5 | 1024.0/1809.0 | #FFFFFF | — |
| 452.0×126.0 | 5 | 1023.0/1808.0 | #AFAFAF | — |
| 342.2×296.7 | 4 | 531.3/25.5 | #D8D8D8 | — |
| 362.0×43.0 | 4 | 1113.0/1427.0 | #AFAFAF | — |
| 45.0×10.5 | 4 | 1158.0/1443.7 | #AFAFAF | — |
| 8.5×11.6 | 4 | 1447.0/1442.9 | #717171 | — |
| 1570.0×614.0 | 2 | 0.0/0.0 | #000000 | — |
| 652.7×98.6 | 2 | 56.0/1444.3 | #6D7076 | — |
| 1440.0×697.0 | 1 | 0.0/0.0 | #000000 | — |
| 558.0×663.6 | 1 | 740.5/362.9 | #D8D8D8 | — |
| 18.9×16.3 | 1 | 99.5/78.8 | #000000 | — |
| 30.5×36.4 | 1 | 76.0/78.8 | #000000 | — |
| 112.0×22.3 | 1 | 136.5/86.0 | #000000 | — |
| 157.9×18.0 | 1 | 1334.8/88.3 | #000929 | — |

### B.7 Página 7 — Selector

| Dimensão | Ocorrências | Exemplo x/y | Fill | Stroke |
|---|---:|---|---|---|
| 43.1×13.4 | 46 | 1036.0/967.5 | #000000 | — |
| 360.0×33.0 | 30 | 1024.0/1786.0 | #FFFFFF | — |
| 450.0×41.0 | 10 | 1024.0/723.0 | #FFFFFF | — |
| 452.0×43.0 | 10 | 1023.0/722.0 | #AFAFAF | — |
| 450.0×33.0 | 8 | 1024.0/956.0 | #FFFFFF | — |
| 20.0×20.0 | 8 | 790.0/2652.5 | #000000 | — |
| 14.1×7.9 | 6 | 1444.9/740.2 | #000000 | — |
| 34.9×10.4 | 5 | 1024.0/699.8 | #000000 | — |
| 72.4×13.0 | 5 | 1024.0/1545.8 | #000000 | — |
| 15.2×15.2 | 5 | 1038.4/1581.9 | #717171 | — |
| 13.5×7.3 | 5 | 1445.2/1586.5 | #000000 | — |
| 360.0×52.0 | 5 | 778.0/2950.0 | #FFFFFF | — |
| 36.9×11.5 | 5 | 842.0/2981.0 | #AFAFAF | — |
| 342.2×296.7 | 4 | 531.3/25.5 | #D8D8D8 | — |
| 35.5×10.4 | 4 | 1036.0/738.8 | #AFAFAF | — |
| 121.4×13.3 | 4 | 1068.0/1584.7 | #AFAFAF | — |
| 10.5×21.0 | 4 | 790.0/3031.5 | #2E42A5 | — |
| 18.3×18.3 | 3 | 790.8/2653.3 | #FFFFFF | — |
| 16.2×16.2 | 3 | 791.9/2902.4 | #000000 | — |
| 22.0×22.0 | 3 | 789.0/2707.5 | #AFAFAF | — |
| 360.0×36.0 | 3 | 778.0/2758.0 | #FFFFFF | — |
| 1570.0×614.0 | 2 | 0.0/0.0 | #000000 | — |
| 684.8×44.4 | 2 | 56.0/706.3 | #6D7076 | — |
| 129.9×13.4 | 2 | 1036.0/922.5 | #AFAFAF | — |
| 450.0×270.0 | 2 | 1024.0/956.0 | #000000 | — |

### B.8 Página 8 — Small Components

| Dimensão | Ocorrências | Exemplo x/y | Fill | Stroke |
|---|---:|---|---|---|
| 8.0×8.0 | 22 | 1202.0/1635.5 | #4976F4 | — |
| 20.0×20.0 | 20 | 1374.0/674.0 | #000000 | — |
| 14.8×5.7 | 20 | 1047.6/4538.5 | #717171 | — |
| 22.0×22.0 | 14 | 1471.0/873.0 | #000000 | — |
| 36.1×11.3 | 14 | 1218.0/1635.3 | #4976F4 | — |
| 42.1×13.2 | 14 | 1368.0/1635.8 | #4976F4 | — |
| 18.0×18.0 | 14 | 1255.0/2597.0 | #E80B26 | — |
| 12.0×12.0 | 11 | 1175.0/2641.0 | #2EB67D | — |
| 10.0×10.0 | 10 | 1477.0/879.0 | #000000 | — |
| 16.0×16.0 | 10 | 1474.0/1296.0 | #FFFFFF | — |
| 28.0×28.0 | 10 | 1160.0/2736.0 | #0F287F | — |
| 41.7×11.8 | 10 | 1071.0/4532.4 | #717171 | — |
| 18.3×18.3 | 9 | 1374.8/674.8 | #FFFFFF | — |
| 14.0×14.0 | 9 | 1334.0/2622.7 | #D8D8D8 | — |
| 69.0×25.0 | 7 | 1194.0/1627.0 | #EDF2FE | — |
| 75.0×33.0 | 7 | 1344.0/1624.0 | #EDF2FE | — |
| 49.0×25.0 | 7 | 1279.0/1683.0 | #F7F7E8 | — |
| 59.0×33.0 | 7 | 1435.0/1680.0 | #F7F7E8 | — |
| 15.0×15.0 | 7 | 1190.0/3309.0 | #00875A | — |
| 19.0×19.0 | 7 | 1188.0/3307.0 | #FFFFFF | — |
| 16.1×16.1 | 6 | 1342.9/2118.0 | #4976F4 | — |
| 104.0×43.0 | 6 | 1028.5/4516.5 | #E4E4E4 | — |
| 342.2×296.7 | 4 | 531.3/25.5 | #D8D8D8 | — |
| 105.0×25.0 | 4 | 1261.0/1044.0 | #F2F2F2 | — |
| 70.2×11.4 | 4 | 1269.0/1052.2 | #000000 | — |

### B.9 Página 9 — Navigation

| Dimensão | Ocorrências | Exemplo x/y | Fill | Stroke |
|---|---:|---|---|---|
| 29.0×10.7 | 12 | 337.0/736.9 | #000000 | — |
| 14.0×16.5 | 8 | 308.6/733.8 | #000000 | — |
| 216.0×36.0 | 5 | 297.0/724.0 | #F2F2F2 | — |
| 342.2×296.7 | 4 | 531.3/25.5 | #D8D8D8 | — |
| 16.5×16.5 | 4 | 682.8/825.8 | #717171 | — |
| 16.5×12.8 | 4 | 682.8/987.6 | #717171 | — |
| 11.6×6.6 | 3 | 491.2/834.2 | #000000 | — |
| 15.2×15.2 | 3 | 683.4/906.4 | #717171 | — |
| 1570.0×614.0 | 2 | 0.0/0.0 | #000000 | — |
| 28.0×28.0 | 2 | 891.0/746.0 | #F2F2F2 | — |
| 14.7×9.2 | 2 | 683.6/829.4 | #717171 | — |
| 15.1×14.0 | 2 | 683.5/865.7 | #717171 | — |
| 14.0×15.9 | 2 | 684.0/946.4 | #717171 | — |
| 16.7×8.5 | 2 | 682.7/987.5 | #717171 | — |
| 16.5×14.0 | 2 | 682.8/1133.0 | #717171 | — |
| 15.4×10.4 | 2 | 682.7/1134.2 | #717171 | — |
| 9.0×9.0 | 2 | 686.5/1335.5 | #000000 | — |
| 17.3×17.3 | 2 | 682.4/1331.4 | #000000 | — |
| 32.0×32.0 | 2 | 673.0/1696.0 | #F2F2F2 | — |
| 16.6×16.6 | 2 | 1070.8/766.6 | #000000 | — |
| 16.7×16.7 | 2 | 1070.6/806.8 | #717171 | — |
| 1440.0×697.0 | 1 | 0.0/0.0 | #000000 | — |
| 558.0×663.6 | 1 | 740.5/362.9 | #D8D8D8 | — |
| 18.9×16.3 | 1 | 99.5/78.8 | #000000 | — |
| 30.5×36.4 | 1 | 76.0/78.8 | #000000 | — |

### B.10 Página 10 — Header

| Dimensão | Ocorrências | Exemplo x/y | Fill | Stroke |
|---|---:|---|---|---|
| 342.2×296.7 | 4 | 531.3/25.5 | #D8D8D8 | — |
| 20.0×20.0 | 2 | 388.0/730.0 | #F2F2F2 | — |
| 15.2×5.9 | 2 | 193.4/820.1 | #000000 | — |
| 1440.0×697.0 | 1 | 0.0/0.0 | #000000 | — |
| 558.0×663.6 | 1 | 740.5/362.9 | #D8D8D8 | — |
| 18.9×16.3 | 1 | 99.5/78.8 | #000000 | — |
| 30.5×36.4 | 1 | 76.0/78.8 | #000000 | — |
| 112.0×22.3 | 1 | 136.5/86.0 | #000000 | — |
| 82.5×17.8 | 1 | 1410.9/88.5 | #000929 | — |
| 333.6×71.0 | 1 | 76.0/227.2 | #000000 | — |
| 1406.3×159.7 | 1 | 76.0/367.6 | #6D7076 | — |
| 154.9×26.1 | 1 | 56.0/660.6 | #000000 | — |
| 1192.0×72.0 | 1 | 56.0/704.0 | #FFFFFF | — |
| 362.0×43.0 | 1 | 87.0/718.5 | #AFAFAF | — |
| 14.6×14.6 | 1 | 101.8/731.8 | #AFAFAF | — |
| 45.0×10.5 | 1 | 132.0/735.2 | #AFAFAF | — |
| 8.5×11.6 | 1 | 421.0/734.4 | #717171 | — |
| 16.5×16.5 | 1 | 942.8/731.8 | #717171 | — |
| 79.7×13.2 | 1 | 973.0/735.2 | #717171 | — |
| 48.8×10.8 | 1 | 1138.1/734.9 | #000000 | — |
| 11.6×6.6 | 1 | 1202.2/737.2 | #000000 | — |
| 1192.0×69.0 | 1 | 56.0/792.0 | #FFFFFF | — |
| 49.8×18.4 | 1 | 88.0/816.8 | #000000 | — |
| 23.6×10.7 | 1 | 219.0/821.4 | #000000 | — |
| 49.7×10.4 | 1 | 304.0/821.8 | #717171 | — |

### B.11 Página 11 — Cards

| Dimensão | Ocorrências | Exemplo x/y | Fill | Stroke |
|---|---:|---|---|---|
| 49.0×25.0 | 7 | 977.0/975.0 | #F7F7E8 | — |
| 36.1×11.3 | 7 | 983.0/983.3 | #B1AB1D | — |
| 360.0×230.0 | 6 | 953.0/959.0 | #000000 | — |
| 342.2×296.7 | 4 | 531.3/25.5 | #D8D8D8 | — |
| 28.0×28.0 | 4 | 328.0/1344.0 | #FFFFFF | — |
| 16.0×16.0 | 3 | 977.0/1175.5 | #FFFFFF | — |
| 1570.0×614.0 | 2 | 0.0/0.0 | #000000 | — |
| 277.3×185.0 | 2 | 56.0/704.0 | #FFFFFF | — |
| 277.3×182.0 | 2 | 355.0/704.0 | #FFFFFF | — |
| 277.3×249.0 | 2 | 654.0/704.0 | #FFFFFF | — |
| 20.0×20.0 | 2 | 704.0/754.0 | #FFFFFF | — |
| 114.7×37.0 | 2 | 674.0/896.0 | #FFFFFF | — |
| 115.7×38.0 | 2 | 673.5/895.5 | #000000 | — |
| 171.9×15.6 | 2 | 977.0/1017.9 | #000000 | — |
| 305.7×105.5 | 2 | 977.0/1053.3 | #717171 | — |
| 18.0×18.0 | 2 | 976.0/1174.5 | #AFAFAF | — |
| 78.8×10.7 | 2 | 1001.0/1178.5 | #717171 | — |
| 362.0×232.0 | 2 | 952.0/958.0 | #E4E4E4 | — |
| 360.0×52.0 | 2 | 953.0/882.0 | #FFFFFF | — |
| 360.0×53.0 | 2 | 953.0/881.0 | #E4E4E4 | — |
| 48.8×10.8 | 2 | 1009.1/902.4 | #000000 | — |
| 54.4×10.5 | 2 | 1233.3/902.7 | #717171 | — |
| 320.0×175.0 | 2 | 312.0/1213.0 | #FFFFFF | — |
| 277.3×99.0 | 2 | 654.0/960.0 | #FFFFFF | — |
| 172.0×99.0 | 2 | 654.0/1074.0 | #000000 | — |

### B.12 Página 12 — Table

| Dimensão | Ocorrências | Exemplo x/y | Fill | Stroke |
|---|---:|---|---|---|
| 32.0×32.0 | 9 | 1062.0/1517.5 | #FFFFFF | — |
| 20.0×20.0 | 7 | 84.0/1215.5 | #000000 | — |
| 18.3×18.3 | 7 | 84.8/1216.3 | #FFFFFF | — |
| 20.3×20.3 | 6 | 83.8/1215.3 | #AFAFAF | — |
| 342.2×296.7 | 4 | 531.3/25.5 | #D8D8D8 | — |
| 41.7×10.5 | 4 | 804.0/965.7 | #717171 | — |
| 8.0×8.0 | 4 | 812.0/1461.0 | #4976F4 | — |
| 27.4×10.5 | 4 | 541.0/1598.2 | #717171 | — |
| 1088.0×56.0 | 4 | 76.0/1824.0 | #FFFFFF | — |
| 70.0×26.0 | 3 | 758.0/1520.5 | #F7F7E8 | — |
| 56.8×11.7 | 3 | 764.0/1528.4 | #B1AB1D | — |
| 1570.0×614.0 | 2 | 0.0/0.0 | #000000 | — |
| 16.7×8.5 | 2 | 101.7/719.5 | #717171 | — |
| 16.5×12.8 | 2 | 101.8/719.6 | #717171 | — |
| 71.4×10.3 | 2 | 128.0/721.3 | #000000 | — |
| 64.0×33.0 | 2 | 288.0/714.0 | #FFFFFF | — |
| 65.0×34.0 | 2 | 287.5/713.5 | #000000 | — |
| 11.6×11.6 | 2 | 301.4/724.5 | #000000 | — |
| 20.8×9.0 | 2 | 318.0/726.2 | #000000 | — |
| 66.0×33.0 | 2 | 364.0/714.0 | #FFFFFF | — |
| 67.0×34.0 | 2 | 363.5/713.5 | #000000 | — |
| 11.5×10.7 | 2 | 377.2/724.7 | #000000 | — |
| 22.7×9.2 | 2 | 394.0/725.9 | #000000 | — |
| 55.8×10.7 | 2 | 844.0/880.5 | #717171 | — |
| 41.2×10.7 | 2 | 1096.0/880.5 | #717171 | — |

### B.13 Página 13 — Modals

| Dimensão | Ocorrências | Exemplo x/y | Fill | Stroke |
|---|---:|---|---|---|
| 20.0×20.0 | 16 | 864.0/744.0 | #000000 | — |
| 18.3×18.3 | 10 | 100.8/951.8 | #000000 | — |
| 40.0×40.0 | 8 | 706.0/841.0 | #000000 | — |
| 12.3×12.3 | 6 | 867.8/747.8 | #000000 | — |
| 72.4×11.6 | 6 | 228.0/1563.0 | #000000 | — |
| 16.0×16.0 | 5 | 100.0/911.0 | #000000 | — |
| 20.3×20.3 | 5 | 99.8/950.8 | #AFAFAF | — |
| 342.2×296.7 | 4 | 531.3/25.5 | #D8D8D8 | — |
| 11.6×6.6 | 4 | 102.2/915.2 | #000000 | — |
| 172.4×13.5 | 4 | 128.0/955.5 | #000000 | — |
| 134.4×13.5 | 4 | 128.0/995.5 | #000000 | — |
| 50.9×8.9 | 4 | 130.0/1077.3 | #000000 | — |
| 560.0×45.0 | 3 | 100.0/1348.0 | #000000 | — |
| 67.0×11.4 | 3 | 144.0/1563.2 | #000000 | — |
| 39.9×11.4 | 3 | 144.0/1620.2 | #000000 | — |
| 9.0×9.0 | 3 | 516.5/1911.0 | #717171 | — |
| 1570.0×614.0 | 2 | 0.0/0.0 | #000000 | — |
| 836.0×937.0 | 2 | 72.0/720.0 | #000000 | — |
| 837.0×938.0 | 2 | 71.5/719.5 | #000000 | — |
| 239.6×17.3 | 2 | 96.0/748.4 | #000000 | — |
| 75.8×13.5 | 2 | 100.0/819.4 | #000000 | — |
| 540.5×34.4 | 2 | 100.0/848.5 | #000000 | — |
| 10.0×5.0 | 2 | 103.0/916.0 | #000000 | — |
| 96.9×10.8 | 2 | 128.0/914.4 | #000000 | — |
| 206.9×13.5 | 2 | 128.0/1035.5 | #000000 | — |

### B.14 Página 14 — Dashboard

| Dimensão | Ocorrências | Exemplo x/y | Fill | Stroke |
|---|---:|---|---|---|
| 18.0×18.0 | 56 | 626.0/770.0 | #D8D8D8 | — |
| 342.2×296.7 | 4 | 531.3/25.5 | #D8D8D8 | — |
| 242.0×16.0 | 4 | 134.0/823.1 | #D8D8D8 | — |
| 13.0×13.0 | 4 | 806.0/1007.5 | #D8D8D8 | — |
| 64.7×11.5 | 2 | 56.2/894.8 | #000000 | — |
| 17.6×45.3 | 2 | 56.2/744.7 | #000000 | — |
| 17.6×27.9 | 2 | 82.9/762.1 | #717171 | — |
| 162.0×162.0 | 2 | 423.0/734.0 | #000000 | — |
| 1440.0×697.0 | 1 | 0.0/0.0 | #000000 | — |
| 558.0×663.6 | 1 | 740.5/362.9 | #D8D8D8 | — |
| 18.9×16.3 | 1 | 99.5/78.8 | #000000 | — |
| 30.5×36.4 | 1 | 76.0/78.8 | #000000 | — |
| 112.0×22.3 | 1 | 136.5/86.0 | #000000 | — |
| 121.6×17.8 | 1 | 1370.3/88.5 | #000929 | — |
| 493.1×71.0 | 1 | 76.0/227.2 | #000000 | — |
| 1406.3×159.7 | 1 | 76.0/367.6 | #6D7076 | — |
| 74.4×21.0 | 1 | 56.0/660.4 | #000000 | — |
| 60.6×9.1 | 1 | 56.2/828.0 | #000000 | — |
| 55.8×11.6 | 1 | 56.2/861.4 | #000000 | — |
| 63.5×16.0 | 1 | 134.0/823.0 | #000000 | — |
| 94.6×16.0 | 1 | 134.0/857.5 | #000000 | — |
| 140.2×16.0 | 1 | 134.0/891.5 | #000000 | — |
| 186.0×16.0 | 1 | 134.0/925.9 | #000000 | — |
| 20.0×9.0 | 1 | 180.2/958.4 | #000000 | — |
| 21.7×9.0 | 1 | 236.6/958.4 | #000000 | — |

### B.15 Página 15 — Others

| Dimensão | Ocorrências | Exemplo x/y | Fill | Stroke |
|---|---:|---|---|---|
| 342.2×296.7 | 4 | 531.3/25.5 | #D8D8D8 | — |
| 1570.0×614.0 | 2 | 0.0/0.0 | #000000 | — |
| 1440.0×172.0 | 2 | 65.0/1036.0 | #000000 | — |
| 1440.0×697.0 | 1 | 0.0/0.0 | #000000 | — |
| 558.0×663.6 | 1 | 740.5/362.9 | #D8D8D8 | — |
| 18.9×16.3 | 1 | 99.5/78.8 | #000000 | — |
| 30.5×36.4 | 1 | 76.0/78.8 | #000000 | — |
| 112.0×22.3 | 1 | 136.5/86.0 | #000000 | — |
| 75.7×18.0 | 1 | 1417.1/88.3 | #000929 | — |
| 308.7×71.8 | 1 | 76.0/226.2 | #000000 | — |
| 1406.3×159.7 | 1 | 76.0/367.6 | #6D7076 | — |
| 308.2×27.2 | 1 | 56.0/659.8 | #000000 | — |
| 265.6×47.2 | 1 | 129.0/1097.5 | #FFFFFF | — |
| 39.5×34.0 | 1 | 178.2/800.0 | #000000 | — |
| 63.9×76.0 | 1 | 129.0/800.0 | #000000 | — |
| 349.8×60.4 | 1 | 264.4/815.0 | #000000 | — |
| 193.0×27.2 | 1 | 56.0/1301.8 | #000000 | — |
| 49.9×43.0 | 1 | 130.1/1358.0 | #000000 | — |
| 80.8×96.3 | 1 | 68.0/1358.0 | #000000 | — |

## Apêndice C — nomes de tokens sugeridos

- `global.neutral.{0,10,20,30,40,50,60,70,80,90,100}`
- `global.red.{10..100}`
- `global.orange.{10..100}`
- `global.lime.{10..100}`
- `global.purple.{10..100}`
- `global.green.{10..100}`
- `global.irish.{10..100}`
- `content.primary`
- `content.secondary`
- `content.tertiary`
- `content.disabled`
- `content.informative`
- `content.positive`
- `content.error`
- `border.primary`
- `border.secondary`
- `border.tertiary`
- `border.informative`
- `border.positive`
- `border.warning`
- `border.error`
- `background.primary`
- `background.secondary`
- `background.tertiary`
- `background.informative`
- `background.positive`
- `background.warning`
- `background.error`
- `background.purple`
- `action.primary.{base,hover,active,selected,disabled}`
- `action.secondary.{base,hover,active,selected,disabled}`
- `action.outline.{base,hover,active,selected,disabled}`
- `action.destructive.{base,hover,active,selected,disabled}`
- `interaction.{primary,secondary,outline,red,green,blue,yellow,purple,orange}.{base,hover,active,selected,disabled}`
- `typography.heading.{1,2,3,4,5}`
- `typography.body.{xl,lg,md,sm,xs}.{regular,medium,semibold}`
- `control.height.{lg,md,sm,xs}`
- `control.radius`
- `control.border-width`
- `icon.size.{xs,sm,md,lg}`

## Conclusão

O Venture é um design system visualmente consistente em estrutura, mas o PDF possui erros nominais de cor e lacunas de documentação. A implementação correta deve usar os componentes e a lógica semântica do kit, confirmar as Variables no Figma e evitar copiar conteúdo fictício. Para fidelidade de pixels, os valores vetoriais renderizados e as dimensões medidas neste documento são a referência mais objetiva disponível no PDF.
