ALTER TABLE crm_internal.auvo_webhook_events
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'auvo',
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ignored_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS source_ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS content_length INTEGER,
  ADD COLUMN IF NOT EXISTS schema_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

ALTER TABLE crm_internal.auvo_webhook_events
  ALTER COLUMN event_type DROP NOT NULL;

ALTER TABLE crm_internal.auvo_webhook_events
  DROP CONSTRAINT IF EXISTS auvo_webhook_events_status_check;

ALTER TABLE crm_internal.auvo_webhook_events
  ADD CONSTRAINT auvo_webhook_events_status_check
  CHECK (status IN ('received', 'processing', 'processed', 'ignored', 'failed'));

ALTER TABLE crm_internal.auvo_webhook_events
  ADD CONSTRAINT auvo_webhook_events_provider_check
  CHECK (provider = 'auvo');

UPDATE crm_internal.auvo_webhook_events
SET
  created_at = COALESCE(created_at, received_at),
  updated_at = COALESCE(updated_at, processed_at, received_at),
  provider = 'auvo',
  attempt_count = COALESCE(attempt_count, 0),
  schema_version = COALESCE(schema_version, 1);

CREATE INDEX IF NOT EXISTS auvo_webhook_events_status_received_idx
  ON crm_internal.auvo_webhook_events (status, received_at DESC);

CREATE INDEX IF NOT EXISTS auvo_webhook_events_payload_hash_idx
  ON crm_internal.auvo_webhook_events (payload_hash);

CREATE INDEX IF NOT EXISTS auvo_webhook_events_external_event_idx
  ON crm_internal.auvo_webhook_events (external_event_id)
  WHERE external_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS auvo_webhook_events_received_idx
  ON crm_internal.auvo_webhook_events (received_at DESC);
