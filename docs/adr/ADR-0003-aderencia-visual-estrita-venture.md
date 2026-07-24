# ADR-0003 - Aderencia visual estrita ao Venture

**Data**: 2026-07-24

## Status

Aceita.

## Contexto

A refatoracao visual vinha usando o Venture CRM Dashboard UI Kit como inspiracao e fonte de tokens, mas ainda havia uma excecao estrutural no CSS: o `primary` do CRM usava azul para manter uma interface mais colorida. Essa excecao criava margem para os agents justificarem divergencias esteticas contra o kit.

O objetivo agora e remover essa ambiguidade. O Venture deixa de ser apenas inspiracao e passa a ser referencia visual estrita.

## Decisao

1. `src/styles.css` passa a usar `Action/Primary` neutro/monocromatico, alinhado ao Venture.
2. Azul, verde, laranja, vermelho, amarelo e roxo ficam reservados a semantica: status, alerta, prioridade, tag, categoria, feedback ou dado.
3. Preferencia por uma aplicacao mais colorida nao e justificativa valida para divergencia visual.
4. Dark mode deve preservar neutralidade, contraste e semantica, sem virar uma paleta alternativa.
5. Agents visuais devem rejeitar divergencias sem evidencia objetiva.

## Excecoes Permitidas

- Contraste e acessibilidade.
- Ausencia objetiva do componente no Venture.
- Dado operacional real da Artec que precise de codificacao semantica.
- Limite tecnico temporario documentado, como a permanencia de `lucide-react` ate uma frente propria de migracao para Phosphor.

## Consequencias

- Proximas refatoracoes frontend devem reduzir uso decorativo de cor.
- Screenshots devem ser avaliados contra Venture, nao contra gosto subjetivo.
- Componentes existentes que usam cor como identidade visual devem ser tratados como divida visual.
- O design system pode evoluir sem Tailwind imediato, desde que mantenha os tokens Venture como fonte normativa.
