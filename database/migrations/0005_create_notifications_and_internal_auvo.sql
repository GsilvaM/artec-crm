CREATE TABLE crm.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('alta', 'media', 'informativa')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  action_url TEXT,
  dedupe_key TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);

CREATE TABLE crm_internal.auvo_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_event_id TEXT,
  event_type TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('received', 'processing', 'processed', 'ignored', 'failed', 'dead_letter')),
  sanitized_headers_json JSONB NOT NULL,
  raw_payload_json JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE crm_internal.auvo_inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_service_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('novo', 'em_analise', 'aguardando_dados', 'processado', 'descartado', 'erro_integracao')),
  suggested_customer_id UUID REFERENCES crm.clientes(id),
  title TEXT NOT NULL,
  contact_name TEXT,
  phone_normalized TEXT,
  last_event_id UUID REFERENCES crm_internal.auvo_webhook_events(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE crm_internal.auvo_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES crm_internal.auvo_webhook_events(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'done', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE crm_internal.integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error')),
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE crm.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY notificacoes_select_own ON crm.notificacoes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notificacoes_update_own ON crm.notificacoes FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
