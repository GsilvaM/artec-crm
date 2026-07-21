-- Indices identificados por analise de plano de consulta (EXPLAIN ANALYZE) nas
-- queries mais pesadas dos relatorios comerciais e do centro comercial.
-- Ver docs/QUERY-PERFORMANCE.md para o detalhe da analise e o antes/depois.

CREATE INDEX IF NOT EXISTS oportunidades_created_at_idx
  ON crm.oportunidades (created_at);

CREATE INDEX IF NOT EXISTS oportunidades_archived_status_updated_idx
  ON crm.oportunidades (archived_at, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS clientes_archived_created_idx
  ON crm.clientes (archived_at, created_at);

CREATE INDEX IF NOT EXISTS next_actions_category_status_completed_idx
  ON crm.next_actions (category, status, completed_at);
