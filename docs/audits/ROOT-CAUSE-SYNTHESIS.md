# Síntese de causas raiz — Gate 1

Reconciliação dos 5 relatórios (`PRODUCT-AUDIT.md`, `DESIGN-AUDIT.md`, `AUVO-AUDIT.md`, `DATA-QUALITY-AUDIT.md`, `QA-AUDIT.md`). Cada item classificado por evidência conforme os relatórios de origem; aqui priorizo por impacto e dependência, não repito o detalhe completo (ver o arquivo de origem para evidência linha a linha).

## Padrão sistêmico identificado (afeta 2 subsistemas independentes)

**Causa raiz**: nenhum mecanismo de agendamento existe no projeto. `reconcileAuvoWebhookEvents` (Auvo) e `reconcileNotifications` (Notificações) são scripts CLI únicos, sem cron, sem endpoint HTTP protegido, sem `vercel.json` `crons`. Ambos foram comprovados funcionando quando rodados manualmente, e ambos voltam a acumular atraso imediatamente depois (comprovado por banco: fila Auvo subiu de 0 para 36 pendentes de novo; notificações de atraso citadas na auditoria de produto como sintoma visual antigo ainda não resolvido na raiz).

**Correção**: um único padrão de fix resolve os dois — endpoint HTTP protegido por segredo + `vercel.json` `crons` apontando para ele, chamando ambos os reconciles em sequência.

## P0 — Integridade de dados (bloqueia confiança na operação)

1. **95,7% das próximas ações pendentes exibidas na Central Comercial são fixtures** (Data Quality, comprovado por banco). `crm.atividades`/`crm.next_actions` não têm `is_test_fixture` nem filtro algum — independe do header de teste. É o achado de maior impacto visível do dia a dia.
2. **Fixtures continuam crescendo**: 52/52 clientes e 42/42 oportunidades hoje (QA, comprovado por banco, reconfirmado independentemente), até 47/37 na migration 0017 — `e2e/customer-and-opportunity.spec.ts` sem teardown.
3. **Timezone incompleto**: `getCommercialCenter`'s `from`/`to` (filtros de período, alcançáveis pela UI) ainda usam `new Date(string)` cru em vez de `toDateOnly`/`toEndOfDateOnly` (QA, comprovado por código).
4. **Corrida em `receiveAuvoWebhookEvent`**: `findUnique` + `create` não atômico contra `dedupe_key` único — entrega duplicada concorrente pode lançar `P2002` não tratado em vez de retornar `duplicate:true` (QA, comprovado por código).

## P1 — Confiabilidade operacional

5. Worker Auvo sem scheduler (ver padrão sistêmico acima) — maior severidade do relatório Auvo.
6. Botão "Reprocessar" em `AuvoAdminPage.tsx` só reseta status, não reprocessa de fato (Auvo, comprovado por código).
7. `AuvoInboxItem` sem `is_test_fixture` — hoje inofensivo (0/168 vêm de evento sintético), mas sem proteção futura (Auvo + Data Quality).
8. 0% de match cliente↔contato Auvo porque `auvoContactId` nunca foi backfilled nos clientes existentes (Auvo, comprovado por banco — achado novo, fora do escopo original).
9. Corpo de notificação embute `.toISOString()` cru (Product, comprovado por código — sintoma visual antigo, causa raiz agora identificada).

## P2 — Acessibilidade (achado que invalida uma alegação anterior)

10. **Dark mode reprova WCAG de verdade**: os 12 audits axe-core do Gate 0 nunca setaram `colorScheme: dark` — só testaram light mode. Rodunder com dark mode real: violações `serious` de contraste (14-21 nós) em 4 páginas + `scrollable-region-focusable` no funil (QA, comprovado por teste real, screenshots em scratchpad não commitado). Isso corrige a alegação anterior desta sessão de "a11y validado" — só o modo claro foi validado.

## P3 — Modelo de produto incompleto (estrutural, maior esforço)

11. Sem entidade Visita, Equipamento ou Endereço — a rotina real da Artec (visita técnica consultiva, múltiplos equipamentos/endereços) não tem onde ser registrada estruturadamente (Product, comprovado por schema). Fora de escopo para correção imediata nesta rodada — registrar como pendência arquitetural para gate futuro dedicado, não para um fix pontual.
12. Cliente/Oportunidade não editáveis após criação; campos do backend (`documento`, `estado`, `observacoes`, `nomeFantasia`) somem no tipo frontend (Product, comprovado por código).
13. `origem` nunca coletado por formulário nenhum — condena relatório de conversão por origem (Product, comprovado por código).

## P4 — Design system (fidelidade, não correção funcional)

14. Radius de card/painel deveria ser 4px (não 8px) — `docs/cards.json` especifica numericamente, contrariando a suposição anterior (Design, comprovado por JSON + verificação direta nesta sessão).
15. Degrau de altura de controle 37px ausente; badges usam pill em vez de 4px; tabela usa grade pesada onde Venture usa linha-cartão; `--radius-md` usado em quase todo `.panel` diverge do kit (Design, comprovado por comparação código↔JSON).
16. Dois bugs de CSS: classe `.cell-primary-text` usada mas inexistente; badges de status inconsistentes em `AuvoInboxPanel.tsx` (Design, comprovado por grep).

## Ordem de execução escolhida

P0 → P1 → P2 (mínimo: corrigir o que os testes já provaram estar quebrado) → P4 (fidelidade rápida e de baixo risco) → P3 fica documentado como pendência para gate dedicado, não implementado nesta rodada (mudança de schema grande demais para decidir sozinho sem revisão de produto — registrar em `REFATORACAO-CRM-PROGRESSO.md` como bloqueio arquitetural, não ambiguidade a perguntar).
