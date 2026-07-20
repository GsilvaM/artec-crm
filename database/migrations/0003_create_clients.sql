CREATE TABLE crm.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_pessoa TEXT NOT NULL CHECK (tipo_pessoa IN ('fisica', 'juridica')),
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  telefone TEXT,
  telefone_normalizado TEXT,
  email TEXT,
  documento TEXT,
  empresa TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  observacoes TEXT,
  auvo_contact_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  archived_at TIMESTAMPTZ
);

CREATE INDEX clientes_telefone_normalizado_idx ON crm.clientes (telefone_normalizado);
CREATE INDEX clientes_nome_idx ON crm.clientes USING gin (to_tsvector('portuguese', nome));

ALTER TABLE crm.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY clientes_select_active_members
  ON crm.clientes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM crm.user_memberships membership
      WHERE membership.user_id = auth.uid()
        AND membership.is_active
    )
  );

CREATE POLICY clientes_insert_active_members
  ON crm.clientes
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM crm.user_memberships membership
      WHERE membership.user_id = auth.uid()
        AND membership.is_active
    )
  );

CREATE POLICY clientes_update_active_members
  ON crm.clientes
  FOR UPDATE
  USING (
    archived_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM crm.user_memberships membership
      WHERE membership.user_id = auth.uid()
        AND membership.is_active
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM crm.user_memberships membership
      WHERE membership.user_id = auth.uid()
        AND membership.is_active
    )
  );
