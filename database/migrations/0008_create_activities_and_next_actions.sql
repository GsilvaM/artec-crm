ALTER TABLE crm.atividades
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
  ADD CONSTRAINT atividades_tipo_check CHECK (
    tipo IN (
      'note',
      'message',
      'call',
      'visit',
      'meeting',
      'follow_up',
      'quote_sent',
      'stage_change',
      'owner_change',
      'approval',
      'loss',
      'warranty',
      'support',
      'after_sales',
      'system'
    )
  ),
  ADD CONSTRAINT atividades_cliente_ou_oportunidade_check CHECK (
    cliente_id IS NOT NULL OR oportunidade_id IS NOT NULL
  );

ALTER TABLE crm.atividades
  RENAME COLUMN author_user_id TO created_by;

DROP TRIGGER IF EXISTS atividades_set_updated_at ON crm.atividades;
CREATE TRIGGER atividades_set_updated_at
  BEFORE UPDATE ON crm.atividades
  FOR EACH ROW
  EXECUTE FUNCTION crm.set_updated_at();

DROP TRIGGER IF EXISTS atividades_audit_log ON crm.atividades;
CREATE TRIGGER atividades_audit_log
  AFTER INSERT OR UPDATE ON crm.atividades
  FOR EACH ROW
  EXECUTE FUNCTION crm.write_audit_log();

CREATE TABLE crm.next_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES crm.clientes(id),
  opportunity_id UUID REFERENCES crm.oportunidades(id),
  responsible_user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  completion_result TEXT,
  postponed_from TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,
  CONSTRAINT next_actions_completed_fields_check CHECK (
    status <> 'completed'
    OR (completed_at IS NOT NULL AND completed_by IS NOT NULL AND nullif(trim(completion_result), '') IS NOT NULL)
  ),
  CONSTRAINT next_actions_cancelled_fields_check CHECK (
    status <> 'cancelled'
    OR (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL AND nullif(trim(cancellation_reason), '') IS NOT NULL)
  )
);

CREATE INDEX next_actions_responsible_status_due_idx ON crm.next_actions (responsible_user_id, status, due_at);
CREATE INDEX next_actions_customer_idx ON crm.next_actions (customer_id);
CREATE INDEX next_actions_opportunity_idx ON crm.next_actions (opportunity_id);
CREATE INDEX next_actions_due_pending_idx ON crm.next_actions (due_at) WHERE status = 'pending';

ALTER TABLE crm.oportunidades
  ADD COLUMN IF NOT EXISTS current_next_action_id UUID REFERENCES crm.next_actions(id);

INSERT INTO crm.next_actions (
  customer_id,
  opportunity_id,
  responsible_user_id,
  title,
  due_at,
  priority,
  status,
  created_by,
  updated_by,
  created_at,
  updated_at
)
SELECT
  oportunidade.cliente_id,
  oportunidade.id,
  oportunidade.responsavel_id,
  oportunidade.proxima_acao,
  oportunidade.proxima_acao_em,
  'normal',
  'pending',
  oportunidade.created_by,
  COALESCE(oportunidade.updated_by, oportunidade.created_by),
  oportunidade.created_at,
  oportunidade.updated_at
FROM crm.oportunidades oportunidade
WHERE oportunidade.status = 'ativa'
  AND oportunidade.current_next_action_id IS NULL
  AND nullif(trim(oportunidade.proxima_acao), '') IS NOT NULL
  AND oportunidade.proxima_acao_em IS NOT NULL;

UPDATE crm.oportunidades oportunidade
SET current_next_action_id = action.id
FROM crm.next_actions action
WHERE action.opportunity_id = oportunidade.id
  AND action.status = 'pending'
  AND oportunidade.current_next_action_id IS NULL;

DROP TRIGGER IF EXISTS next_actions_set_updated_at ON crm.next_actions;
CREATE TRIGGER next_actions_set_updated_at
  BEFORE UPDATE ON crm.next_actions
  FOR EACH ROW
  EXECUTE FUNCTION crm.set_updated_at();

DROP TRIGGER IF EXISTS next_actions_audit_log ON crm.next_actions;
CREATE TRIGGER next_actions_audit_log
  AFTER INSERT OR UPDATE ON crm.next_actions
  FOR EACH ROW
  EXECUTE FUNCTION crm.write_audit_log();

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
  )
  THEN
    RAISE EXCEPTION 'Informe um responsavel ativo no CRM.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS next_actions_responsible_active ON crm.next_actions;
CREATE TRIGGER next_actions_responsible_active
  BEFORE INSERT OR UPDATE OF responsible_user_id ON crm.next_actions
  FOR EACH ROW
  EXECUTE FUNCTION crm.ensure_active_crm_responsible();

DROP TRIGGER IF EXISTS oportunidades_responsible_active ON crm.oportunidades;
CREATE TRIGGER oportunidades_responsible_active
  BEFORE INSERT OR UPDATE OF responsavel_id ON crm.oportunidades
  FOR EACH ROW
  EXECUTE FUNCTION crm.ensure_active_crm_responsible();

CREATE OR REPLACE FUNCTION crm.ensure_active_opportunity_current_next_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = crm, pg_temp
AS $$
DECLARE
  opportunity_row RECORD;
BEGIN
  SELECT *
  INTO opportunity_row
  FROM crm.oportunidades
  WHERE id = NEW.id;

  IF opportunity_row.status = 'ativa' AND opportunity_row.archived_at IS NULL THEN
    IF opportunity_row.current_next_action_id IS NULL THEN
      RAISE EXCEPTION 'Defina a proxima acao antes de concluir esta atividade.';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM crm.next_actions action
      WHERE action.id = opportunity_row.current_next_action_id
        AND action.status = 'pending'
        AND action.opportunity_id = opportunity_row.id
        AND action.customer_id = opportunity_row.cliente_id
        AND action.responsible_user_id = opportunity_row.responsavel_id
    )
    THEN
      RAISE EXCEPTION 'A proxima acao atual da oportunidade deve estar pendente e vinculada ao mesmo cliente e responsavel.';
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS oportunidades_current_next_action_integrity ON crm.oportunidades;
CREATE CONSTRAINT TRIGGER oportunidades_current_next_action_integrity
  AFTER INSERT OR UPDATE ON crm.oportunidades
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION crm.ensure_active_opportunity_current_next_action();

CREATE OR REPLACE FUNCTION crm.prevent_current_next_action_closure()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = crm, pg_temp
AS $$
BEGIN
  IF NEW.status <> 'pending'
    AND EXISTS (
      SELECT 1
      FROM crm.oportunidades oportunidade
      WHERE oportunidade.current_next_action_id = NEW.id
        AND oportunidade.status = 'ativa'
        AND oportunidade.archived_at IS NULL
    )
  THEN
    RAISE EXCEPTION 'Defina a proxima acao antes de concluir esta atividade.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS next_actions_prevent_current_closure ON crm.next_actions;
CREATE TRIGGER next_actions_prevent_current_closure
  BEFORE UPDATE OF status ON crm.next_actions
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status <> 'pending')
  EXECUTE FUNCTION crm.prevent_current_next_action_closure();

ALTER TABLE crm.next_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY next_actions_select_by_role ON crm.next_actions FOR SELECT USING (
  crm.current_member_role() IN ('gestor', 'atendimento')
  OR responsible_user_id = auth.uid()
);

CREATE POLICY next_actions_write_by_role ON crm.next_actions FOR ALL USING (
  crm.current_member_role() = 'gestor'
  OR responsible_user_id = auth.uid()
  OR crm.current_member_role() = 'atendimento'
) WITH CHECK (
  crm.current_member_role() = 'gestor'
  OR responsible_user_id = auth.uid()
  OR crm.current_member_role() = 'atendimento'
);

DROP POLICY IF EXISTS atividades_select_members ON crm.atividades;
DROP POLICY IF EXISTS atividades_insert_members ON crm.atividades;

CREATE POLICY atividades_select_by_role ON crm.atividades FOR SELECT USING (
  crm.current_member_role() IN ('gestor', 'atendimento')
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM crm.oportunidades oportunidade
    WHERE oportunidade.id = crm.atividades.oportunidade_id
      AND oportunidade.responsavel_id = auth.uid()
  )
);

CREATE POLICY atividades_write_by_role ON crm.atividades FOR ALL USING (
  crm.current_member_role() IN ('gestor', 'atendimento')
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM crm.oportunidades oportunidade
    WHERE oportunidade.id = crm.atividades.oportunidade_id
      AND oportunidade.responsavel_id = auth.uid()
  )
) WITH CHECK (
  crm.current_member_role() IN ('gestor', 'atendimento')
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM crm.oportunidades oportunidade
    WHERE oportunidade.id = crm.atividades.oportunidade_id
      AND oportunidade.responsavel_id = auth.uid()
  )
);

GRANT SELECT, INSERT, UPDATE ON crm.next_actions TO authenticated;
