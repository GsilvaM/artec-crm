# Artec CRM - Design System

## Direcao Visual

O CRM deve ser profissional, denso e agradavel para uso prolongado. A referencia visual atual e um dashboard operacional com sidebar azul, topbar branca, cards discretos, informacao escaneavel e poucos elementos decorativos.

Nao criar landing page dentro do app. A primeira tela autenticada deve ser operacional.

## Layout

- Sidebar desktop fixa com largura aproximada de 235px.
- Topbar branca com busca global, nova oportunidade, notificacoes e usuario.
- Conteudo em fundo claro `#f5f7fb`.
- Paineis brancos com borda clara e raio pequeno.
- Central Comercial em desktop deve priorizar duas colunas: conteudo principal e coluna lateral.
- Mobile deve esconder sidebar, preservar topbar compacta e empilhar metricas em duas colunas.

## Cores

- Marca principal: azul Artec/Venture, atualmente `#294da7`.
- Azul forte para hover: `#1f4096`.
- Fundo: `#f5f7fb`.
- Superficie: branco.
- Texto primario: azul escuro quase preto.
- Texto secundario: cinza azulado.

Tons semanticos:

- Critico: vermelho para vencido ou erro.
- Aviso: amarelo/laranja para prioridade, orcamento e pendencia.
- Positivo: verde para aprovado, concluido ou baixo risco.
- Informativo: azul/ciano para Auvo, sinais e dados neutros.
- Descoberta: roxo para visitas ou destaque leve.
- Atencao: turquesa para sem proxima acao.

## Componentes

Componentes ativos ficam em `src/components/ui`.

Base atual:

- `Button`
- `Badge`
- `Avatar`
- `Drawer`
- `Tabs`
- `Card`
- componentes Radix/shadcn restaurados como dialog, select, popover, tooltip, sheet, table, calendar, chart e outros.

Regras:

- Usar `Button` para comandos comuns.
- Usar icones `lucide-react` em botoes de ferramenta.
- Usar `Drawer` para filtros e edicao rapida.
- Usar `Tabs` para alternar filas ou secoes de painel.
- Usar badges/pills para status e contagens.
- Evitar menus escondidos para acoes frequentes.

## Central Comercial

Padroes:

- Metric cards com pill colorido acima do numero.
- Barra compacta de filas: Vencidas, Hoje, Visitas, Retornos, Sem acao, Caixa Auvo.
- Paineis com titulo, descricao e acao secundaria.
- Linhas de trabalho com icone, titulo, contexto, prazo, avatar e CTA.
- Resumo comercial em cards pequenos com icones e tons.

## Proximas Acoes

Padroes:

- Board operacional sem scroll horizontal.
- Raias de Vencidas, Hoje, Proximas, Concluidas e Canceladas.
- Filtros visiveis por responsavel, categoria e prioridade.
- Acoes frequentes visiveis: concluir, reagendar, cancelar.

## Linguagem Visual

Evitar:

- cards gigantes;
- gradientes decorativos;
- paleta monocromatica;
- textos explicando como usar a interface;
- formularios longos na primeira interacao;
- excesso de modais.

Preferir:

- densidade organizada;
- foco visivel;
- botoes claros;
- texto curto;
- estados vazios uteis;
- feedback imediato;
- mobile funcional, nao apenas responsivo.
