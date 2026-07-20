ALTER TABLE crm.next_actions
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'commercial',
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE crm.next_actions
  DROP CONSTRAINT IF EXISTS next_actions_category_check,
  ADD CONSTRAINT next_actions_category_check CHECK (
    category IN ('commercial', 'warranty', 'support', 'after_sales')
  );

CREATE INDEX IF NOT EXISTS next_actions_category_status_due_idx
  ON crm.next_actions (category, status, due_at);

UPDATE crm.atividades atividade
SET cliente_id = oportunidade.cliente_id
FROM crm.oportunidades oportunidade
WHERE atividade.oportunidade_id = oportunidade.id
  AND atividade.cliente_id IS NULL;

ALTER TABLE crm.atividades
  ALTER COLUMN cliente_id SET NOT NULL;

CREATE OR REPLACE FUNCTION crm.ensure_activity_customer_opportunity_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = crm, pg_temp
AS $$
BEGIN
  IF NEW.oportunidade_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM crm.oportunidades oportunidade
      WHERE oportunidade.id = NEW.oportunidade_id
        AND oportunidade.cliente_id = NEW.cliente_id
    )
  THEN
    RAISE EXCEPTION 'A oportunidade informada nao pertence ao cliente.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS atividades_customer_opportunity_match ON crm.atividades;
CREATE TRIGGER atividades_customer_opportunity_match
  BEFORE INSERT OR UPDATE OF cliente_id, oportunidade_id ON crm.atividades
  FOR EACH ROW
  EXECUTE FUNCTION crm.ensure_activity_customer_opportunity_match();

CREATE OR REPLACE FUNCTION crm.ensure_next_action_customer_opportunity_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = crm, pg_temp
AS $$
BEGIN
  IF NEW.opportunity_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM crm.oportunidades oportunidade
      WHERE oportunidade.id = NEW.opportunity_id
        AND oportunidade.cliente_id = NEW.customer_id
    )
  THEN
    RAISE EXCEPTION 'A oportunidade informada nao pertence ao cliente.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS next_actions_customer_opportunity_match ON crm.next_actions;
CREATE TRIGGER next_actions_customer_opportunity_match
  BEFORE INSERT OR UPDATE OF customer_id, opportunity_id ON crm.next_actions
  FOR EACH ROW
  EXECUTE FUNCTION crm.ensure_next_action_customer_opportunity_match();
