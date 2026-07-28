CREATE TABLE IF NOT EXISTS crm.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  urgent_enabled BOOLEAN NOT NULL DEFAULT true,
  attention_enabled BOOLEAN NOT NULL DEFAULT true,
  integration_enabled BOOLEAN NOT NULL DEFAULT true,
  daily_digest_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE crm.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_preferences_select_own ON crm.notification_preferences;
CREATE POLICY notification_preferences_select_own ON crm.notification_preferences
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_upsert_own ON crm.notification_preferences;
CREATE POLICY notification_preferences_upsert_own ON crm.notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_update_own ON crm.notification_preferences;
CREATE POLICY notification_preferences_update_own ON crm.notification_preferences
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
