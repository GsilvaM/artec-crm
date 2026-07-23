-- Fecha o vocabulario de tipo_demanda nas categorias reais da Artec (ver
-- CONTEXTO-ROTINA-ATENDIMENTO-ARTEC-CRM.md secao 6.1-6.5 e 6.7 — garantia/suporte/pos-venda,
-- secao 6.6, fica fora: por regra do negocio esses casos viram atividade do cliente, nunca
-- oportunidade) e adiciona em banco a invariante "perdido exige motivo", ate agora garantida
-- somente na aplicacao (server/crm/prisma-repository.ts loseOpportunity). Backfill de dados
-- feito antes, na migration 0018, em transacao separada.

ALTER TABLE crm.oportunidades
  DROP CONSTRAINT IF EXISTS oportunidades_tipo_demanda_check;

ALTER TABLE crm.oportunidades
  ADD CONSTRAINT oportunidades_tipo_demanda_check
  CHECK (tipo_demanda IN (
    'instalacao',
    'manutencao_corretiva',
    'higienizacao',
    'acj',
    'remocao_reinstalacao',
    'corporativo_b2b_pmoc'
  ));

ALTER TABLE crm.oportunidades
  DROP CONSTRAINT IF EXISTS oportunidades_perdida_exige_motivo_check;

ALTER TABLE crm.oportunidades
  ADD CONSTRAINT oportunidades_perdida_exige_motivo_check
  CHECK (status <> 'perdida' OR motivo_perda_id IS NOT NULL);
