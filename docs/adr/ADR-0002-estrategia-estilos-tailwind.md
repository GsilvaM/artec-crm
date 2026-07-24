# ADR-0002 - Estrategia de estilos e avaliacao de Tailwind

**Data**: 2026-07-24

## Status

Proposta aceita para proximo ciclo frontend. Nao implementar Tailwind sem piloto validado.

## Contexto

O frontend cresceu sobre um arquivo global `src/styles.css` com mais de 3000 linhas. Esse arquivo concentra tokens, layout, componentes, estados, responsividade, ajustes de paginas especificas e correcoes historicas. A centralizacao ajudou no inicio, mas agora aumenta o custo de mudancas porque:

- seletores globais podem afetar telas distantes;
- agents de frontend precisam editar regioes grandes do mesmo arquivo;
- componentes novos misturam semantica de produto com classes globais pontuais;
- a revisao visual fica mais lenta, especialmente em dark mode e mobile.

Tailwind pode reduzir CSS customizado por tela e acelerar composicao, mas uma migracao total imediata criaria risco alto: churn em muitos arquivos, regressao visual e perda de consistencia com os tokens Venture ja mapeados em CSS variables.

## Decisao

Adotar uma estrategia em duas fases:

1. **Curto prazo**: manter `src/styles.css` como camada legacy e continuar mudancas pontuais usando classes existentes.
2. **Piloto controlado**: avaliar Tailwind em uma unica superficie de baixo acoplamento, preferencialmente `ProximasAcoesPage` ou um componente novo isolado, usando os tokens CSS atuais como fonte de verdade.

Tailwind so deve virar padrao se o piloto provar:

- reducao real de CSS global novo;
- manutencao de consistencia visual com Venture;
- build/typecheck sem complexidade adicional relevante;
- legibilidade melhor para componentes;
- ausencia de regressao mobile/dark mode.

## Diretrizes para o piloto

- Nao reescrever o app inteiro.
- Nao remover tokens CSS existentes.
- Nao misturar Tailwind com estilos inline arbitrarios sem criterio.
- Preferir classes semanticas/componentes quando o comportamento for compartilhado em varias telas.
- Manter componentes de UI reutilizaveis (`Button`, `Badge`, `Tabs`, `DataTable`) como ponto de convergencia.
- Documentar antes/depois: linhas CSS removidas, arquivos tocados, screenshots ou verificacao visual e comandos rodados.

## Consequencias

Positivas:

- cria um caminho para reduzir o arquivo global sem ruptura;
- permite que agents de frontend trabalhem com escopo menor;
- preserva a base visual ja validada enquanto testa alternativa.

Negativas:

- durante o piloto, havera duas formas de estilizar componentes;
- exige disciplina para nao transformar Tailwind em migracao silenciosa;
- pode aumentar o bundle/config se nao houver ganho claro.

## Gate de aprovacao

Antes de migrar qualquer segunda tela para Tailwind:

- `npm.cmd run typecheck` deve passar;
- `npm.cmd run build` deve passar;
- a tela piloto deve ser revisada em mobile e desktop;
- a documentacao de progresso deve registrar o resultado do piloto;
- uma decisao posterior deve confirmar se Tailwind vira padrao, fica restrito ou e descartado.
