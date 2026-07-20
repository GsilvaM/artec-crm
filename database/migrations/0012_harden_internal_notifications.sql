ALTER TABLE crm.notificacoes
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'unread',
  ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'attention',
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES crm.clientes(id),
  ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES crm.oportunidades(id),
  ADD COLUMN IF NOT EXISTS next_action_id UUID REFERENCES crm.next_actions(id),
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE crm.notificacoes
SET
  status = CASE
    WHEN resolved_at IS NOT NULL THEN 'resolved'
    WHEN archived_at IS NOT NULL THEN 'archived'
    WHEN read_at IS NOT NULL THEN 'read'
    ELSE 'unread'
  END,
  severity = CASE priority
    WHEN 'alta' THEN 'urgent'
    WHEN 'media' THEN 'attention'
    ELSE 'info'
  END;

ALTER TABLE crm.notificacoes
  DROP CONSTRAINT IF EXISTS notificacoes_priority_check,
  DROP CONSTRAINT IF EXISTS notificacoes_status_check,
  DROP CONSTRAINT IF EXISTS notificacoes_severity_check,
  DROP CONSTRAINT IF EXISTS notificacoes_user_id_dedupe_key_key;

ALTER TABLE crm.notificacoes
  ADD CONSTRAINT notificacoes_priority_check CHECK (priority IN ('alta', 'media', 'informativa')),
  ADD CONSTRAINT notificacoes_status_check CHECK (status IN ('unread', 'read', 'archived', 'resolved')),
  ADD CONSTRAINT notificacoes_severity_check CHECK (severity IN ('info', 'attention', 'urgent'));

CREATE INDEX IF NOT EXISTS notificacoes_user_status_idx
  ON crm.notificacoes (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS notificacoes_user_snooze_idx
  ON crm.notificacoes (user_id, snoozed_until);

CREATE INDEX IF NOT EXISTS notificacoes_created_at_idx
  ON crm.notificacoes (created_at DESC);

CREATE INDEX IF NOT EXISTS notificacoes_entity_idx
  ON crm.notificacoes (entity_type, entity_id);

CREATE UNIQUE INDEX IF NOT EXISTS notificacoes_open_dedupe_idx
  ON crm.notificacoes (user_id, dedupe_key)
  WHERE status IN ('unread', 'read') AND archived_at IS NULL AND resolved_at IS NULL;
