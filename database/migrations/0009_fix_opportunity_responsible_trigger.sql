CREATE OR REPLACE FUNCTION crm.ensure_active_crm_responsible()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = crm, pg_temp
AS $$
DECLARE
  responsible_id UUID;
BEGIN
  responsible_id := CASE
    WHEN TG_TABLE_NAME = 'oportunidades' THEN NEW.responsavel_id
    ELSE NEW.responsible_user_id
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM crm.user_memberships membership
    WHERE membership.user_id = responsible_id
      AND membership.is_active
  ) THEN
    RAISE EXCEPTION 'Informe um responsavel ativo no CRM.';
  END IF;

  RETURN NEW;
END;
$$;
