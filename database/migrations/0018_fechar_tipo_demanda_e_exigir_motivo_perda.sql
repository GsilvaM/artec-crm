-- Backfill de dados antes de fechar o vocabulario de tipo_demanda (ver migration seguinte).
-- Em transacao separada da ALTER TABLE: um UPDATE em oportunidades dispara o trigger
-- crm.ensure_active_crm_responsible (migration 0010), e o Postgres nao permite ALTER TABLE
-- na mesma tabela enquanto essa transacao ainda tem eventos de trigger pendentes.

-- Unico valor fora do novo vocabulario encontrado em producao ate aqui.
UPDATE crm.oportunidades
SET tipo_demanda = 'manutencao_corretiva'
WHERE tipo_demanda = 'manutencao';
