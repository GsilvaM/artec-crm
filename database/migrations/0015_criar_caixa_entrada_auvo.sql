ALTER TABLE crm_internal.auvo_inbox_items
  ADD COLUMN IF NOT EXISTS auvo_contact_id TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS channel_type TEXT,
  ADD COLUMN IF NOT EXISTS resolution TEXT,
  ADD COLUMN IF NOT EXISTS resolved_opportunity_id UUID REFERENCES crm.oportunidades(id),
  ADD COLUMN IF NOT EXISTS resolved_customer_id UUID REFERENCES crm.clientes(id),
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discard_reason TEXT,
  ADD CONSTRAINT auvo_inbox_items_resolution_check CHECK (
    resolution IS NULL OR resolution IN (
      'opportunity_created',
      'linked_existing_opportunity',
      'warranty_registered',
      'support_registered',
      'after_sales_registered',
      'customer_only',
      'not_commercial',
      'duplicate'
    )
  ),
  ADD CONSTRAINT auvo_inbox_items_processed_fields_check CHECK (
    status <> 'processado' OR (resolution IS NOT NULL AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL)
  ),
  ADD CONSTRAINT auvo_inbox_items_discarded_fields_check CHECK (
    status <> 'descartado' OR (resolution IN ('not_commercial', 'duplicate') AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS auvo_inbox_items_auvo_contact_id_idx ON crm_internal.auvo_inbox_items (auvo_contact_id);
CREATE INDEX IF NOT EXISTS auvo_inbox_items_phone_normalized_idx ON crm_internal.auvo_inbox_items (phone_normalized);
CREATE INDEX IF NOT EXISTS auvo_inbox_items_status_idx ON crm_internal.auvo_inbox_items (status, created_at);

DROP TRIGGER IF EXISTS auvo_inbox_items_set_updated_at ON crm_internal.auvo_inbox_items;
CREATE TRIGGER auvo_inbox_items_set_updated_at
  BEFORE UPDATE ON crm_internal.auvo_inbox_items
  FOR EACH ROW
  EXECUTE FUNCTION crm.set_updated_at();
