# Artec CRM — Análise de plano de consulta (relatórios)

Atualizado em: 2026-07-21

## 1. Objetivo e método

Rodamos `EXPLAIN (ANALYZE, BUFFERS)` diretamente contra o banco Postgres real (Supabase, via `CRM_DATABASE_URL`) para as consultas que sustentam `GET /api/reports/commercial` (`getCommercialReport`) e `GET /api/commercial-center` (`getCommercialCenter`) — as duas rotas de agregação/relatório mais pesadas do backend, já que combinam filtros de intervalo de datas com contagens e agrupamentos sobre `oportunidades`, `clientes` e `next_actions`.

## 2. Estado antes da análise

Com o volume de dados real de homologação (dezenas de registros por tabela), todas as consultas já rodavam em menos de 0.3ms e o planejador optava corretamente por `Seq Scan` em vez de índice — comportamento esperado e correto do Postgres quando uma tabela é pequena o suficiente para caber em poucas páginas (o custo de um index scan, com o I/O adicional de ida-e-volta ao índice, supera o de simplesmente varrer a tabela inteira).

Isso significa que **hoje não há problema de performance perceptível**. O objetivo desta análise não foi "consertar lentidão" (não existe, ainda), e sim identificar quais predicados usados pelos relatórios não tinham nenhum índice que os sustente, para que a consulta não degrade silenciosamente conforme o volume de oportunidades/clientes crescer — sem precisar de uma nova rodada de diagnóstico sob pressão de produção lenta.

## 3. Lacunas encontradas

Cruzando os predicados reais das duas queries (`server/crm/prisma-repository.ts`, `getCommercialReport` e `getCommercialCenter`) com os índices existentes em `prisma/schema.prisma`/`database/migrations/`, encontramos 4 predicados sem cobertura de índice dedicado:

| Query | Predicado sem índice | Índice adicionado |
| --- | --- | --- |
| `getCommercialReport`: oportunidades no período | `oportunidades.created_at BETWEEN $from AND $to` | `oportunidades_created_at_idx (created_at)` |
| `getCommercialCenter`: oportunidades ativas ordenadas por atualização | `oportunidades.archived_at IS NULL AND status = 'ativa' ORDER BY updated_at DESC` | `oportunidades_archived_status_updated_idx (archived_at, status, updated_at DESC)` |
| Ambos relatórios: novos clientes no período | `clientes.archived_at IS NULL AND created_at BETWEEN $from AND $to` | `clientes_archived_created_idx (archived_at, created_at)` |
| `getCommercialReport`: follow-ups concluídos no período | `next_actions.category = 'commercial' AND status = 'completed' AND completed_at BETWEEN $from AND $to` | `next_actions_category_status_completed_idx (category, status, completed_at)` |

Aplicados em `database/migrations/0016_criar_indices_relatorios.sql` e espelhados em `prisma/schema.prisma` para manter o schema como documentação viva (o projeto usa migrations SQL próprias, não Prisma Migrate — ver `CLAUDE-ARTEC-CRM.md`).

## 4. Confirmação de que os índices funcionam

Como o volume atual é pequeno demais para o planejador preferir índice por conta própria, a confirmação foi feita forçando `SET enable_seqscan = off` na sessão de diagnóstico (nunca em produção) e checando se o Postgres consegue de fato usar cada índice novo com `Index Cond` (não apenas `Filter` pós-scan, que indicaria índice mal desenhado para o predicado):

- `oportunidades_created_at_idx`: **usado com `Index Cond` exato** no filtro de período do relatório comercial.
- `clientes_archived_created_idx`: **usado como `Index Only Scan`** (nem precisa acessar a tabela) na contagem de novos clientes.
- `oportunidades_archived_status_updated_idx` e `next_actions_category_status_completed_idx`: o planejador, mesmo com `enable_seqscan = off`, preferiu reaproveitar índices parciais/compostos pré-existentes (`oportunidades_proxima_acao_idx`, que já é parcial para `status = 'ativa'`, e `next_actions_category_status_due_idx`, cujo prefixo `category, status` já filtra o essencial nesse volume). Isso **não é um defeito** — é a escolha correta do planejador quando `category+status` sozinhos já reduzem a poucas linhas. Os dois índices novos continuam corretos e ficam disponíveis para quando o volume crescer ao ponto de o terceiro predicado (`updated_at`/`completed_at`) importar para a seletividade — que é exatamente o cenário que esses dois relatórios vão viver conforme a base de oportunidades/atendimentos cresce.

## 5. Acompanhamento futuro

Não há automação de "detectar quando um índice passa a ser necessário" — a prática recomendada é reexecutar esta mesma análise (`EXPLAIN ANALYZE` com `enable_seqscan = off` para confirmar usabilidade, e sem isso para ver o comportamento real) quando o volume de oportunidades ultrapassar a casa das milhares de registros, ou se o tempo de resposta de `/api/reports/commercial`/`/api/commercial-center` for percebido como lento em uso real.
