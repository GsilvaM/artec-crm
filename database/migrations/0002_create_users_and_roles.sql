CREATE TABLE crm.user_memberships (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('gestor', 'vendedor', 'atendimento')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX user_memberships_active_role_idx ON crm.user_memberships (is_active, role);

ALTER TABLE crm.user_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_memberships_select_self_or_gestor
  ON crm.user_memberships
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM crm.user_memberships membership
      WHERE membership.user_id = auth.uid()
        AND membership.role = 'gestor'
        AND membership.is_active
    )
  );

CREATE POLICY user_memberships_write_gestor
  ON crm.user_memberships
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM crm.user_memberships membership
      WHERE membership.user_id = auth.uid()
        AND membership.role = 'gestor'
        AND membership.is_active
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM crm.user_memberships membership
      WHERE membership.user_id = auth.uid()
        AND membership.role = 'gestor'
        AND membership.is_active
    )
  );
