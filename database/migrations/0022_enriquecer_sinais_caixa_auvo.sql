ALTER TABLE crm_internal.auvo_inbox_items
  ADD COLUMN IF NOT EXISTS origin TEXT,
  ADD COLUMN IF NOT EXISTS utm_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_fields_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS classification TEXT,
  ADD COLUMN IF NOT EXISTS department_id TEXT,
  ADD COLUMN IF NOT EXISTS department_name TEXT,
  ADD COLUMN IF NOT EXISTS agent_id TEXT,
  ADD COLUMN IF NOT EXISTS agent_name TEXT,
  ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS session_ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_user_interaction_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_agent_message_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_message_text TEXT,
  ADD COLUMN IF NOT EXISTS unread_count INTEGER,
  ADD COLUMN IF NOT EXISTS wait_reply BOOLEAN,
  ADD COLUMN IF NOT EXISTS window_status TEXT,
  ADD COLUMN IF NOT EXISTS derived_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS parsed_signals_json JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS auvo_inbox_items_origin_idx
  ON crm_internal.auvo_inbox_items (origin)
  WHERE origin IS NOT NULL;

CREATE INDEX IF NOT EXISTS auvo_inbox_items_department_idx
  ON crm_internal.auvo_inbox_items (department_id)
  WHERE department_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS crm_internal.auvo_contact_signals (
  auvo_contact_id TEXT PRIMARY KEY,
  contact_name TEXT,
  phone_normalized TEXT,
  email TEXT,
  origin TEXT,
  utm_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_fields_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  classification TEXT,
  department_id TEXT,
  department_name TEXT,
  agent_id TEXT,
  agent_name TEXT,
  channel_type TEXT,
  session_started_at TIMESTAMPTZ,
  session_ended_at TIMESTAMPTZ,
  first_user_interaction_at TIMESTAMPTZ,
  first_agent_message_at TIMESTAMPTZ,
  last_interaction_at TIMESTAMPTZ,
  last_message_text TEXT,
  unread_count INTEGER,
  wait_reply BOOLEAN,
  window_status TEXT,
  derived_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  parsed_signals_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_event_id UUID REFERENCES crm_internal.auvo_webhook_events(id),
  last_event_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auvo_contact_signals_phone_idx
  ON crm_internal.auvo_contact_signals (phone_normalized)
  WHERE phone_normalized IS NOT NULL;

CREATE INDEX IF NOT EXISTS auvo_contact_signals_origin_idx
  ON crm_internal.auvo_contact_signals (origin)
  WHERE origin IS NOT NULL;

CREATE INDEX IF NOT EXISTS auvo_contact_signals_department_idx
  ON crm_internal.auvo_contact_signals (department_id)
  WHERE department_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS auvo_contact_signals_last_event_received_idx
  ON crm_internal.auvo_contact_signals (last_event_received_at DESC);

DROP TRIGGER IF EXISTS auvo_contact_signals_set_updated_at ON crm_internal.auvo_contact_signals;
CREATE TRIGGER auvo_contact_signals_set_updated_at
  BEFORE UPDATE ON crm_internal.auvo_contact_signals
  FOR EACH ROW
  EXECUTE FUNCTION crm.set_updated_at();
