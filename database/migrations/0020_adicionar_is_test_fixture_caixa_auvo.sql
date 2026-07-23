-- Mesmo padrao de isolamento ja aplicado a crm.clientes/crm.oportunidades (migration 0017),
-- agora para a Caixa Auvo. Hoje 0/168 itens vem de evento sintetico (raw_payload_json->>'homologation'),
-- mas sem a coluna nao ha protecao caso isso mude.
ALTER TABLE crm_internal.auvo_inbox_items
  ADD COLUMN IF NOT EXISTS is_test_fixture BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS auvo_inbox_items_is_test_fixture_idx
  ON crm_internal.auvo_inbox_items (is_test_fixture);

UPDATE crm_internal.auvo_inbox_items AS inbox
SET is_test_fixture = true
FROM crm_internal.auvo_webhook_events AS event
WHERE inbox.last_event_id = event.id
  AND event.raw_payload_json ->> 'homologation' = 'true'
  AND inbox.is_test_fixture = false;

