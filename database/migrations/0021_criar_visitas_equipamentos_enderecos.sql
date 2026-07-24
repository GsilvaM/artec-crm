-- Entidades estruturais para a operacao real da Artec:
-- enderecos, equipamentos e visitas tecnicas. Mudanca aditiva; nenhum dado
-- legado em texto livre e convertido automaticamente nesta migration.

CREATE TABLE IF NOT EXISTS crm.enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES crm.clientes(id),
  label TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'service',
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  reference TEXT,
  access_notes TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_by UUID,
  archived_at TIMESTAMPTZ,
  CONSTRAINT enderecos_kind_check CHECK (kind IN ('service', 'billing', 'pickup', 'installation', 'other'))
);

CREATE INDEX IF NOT EXISTS enderecos_customer_archived_idx
  ON crm.enderecos (customer_id, archived_at, updated_at DESC);

CREATE INDEX IF NOT EXISTS enderecos_kind_idx
  ON crm.enderecos (kind);

CREATE TABLE IF NOT EXISTS crm.equipamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES crm.clientes(id),
  opportunity_id UUID REFERENCES crm.oportunidades(id),
  address_id UUID REFERENCES crm.enderecos(id),
  type TEXT NOT NULL DEFAULT 'other',
  brand TEXT,
  model TEXT,
  btus INTEGER,
  voltage TEXT,
  environment TEXT,
  serial_number TEXT,
  installed_at DATE,
  warranty_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_by UUID,
  archived_at TIMESTAMPTZ,
  CONSTRAINT equipamentos_type_check CHECK (type IN ('split_hi_wall', 'cassette', 'window_ac', 'floor_ceiling', 'multi_split', 'other')),
  CONSTRAINT equipamentos_btus_positive_check CHECK (btus IS NULL OR btus > 0)
);

CREATE INDEX IF NOT EXISTS equipamentos_customer_archived_idx
  ON crm.equipamentos (customer_id, archived_at, updated_at DESC);

CREATE INDEX IF NOT EXISTS equipamentos_opportunity_idx
  ON crm.equipamentos (opportunity_id);

CREATE INDEX IF NOT EXISTS equipamentos_address_idx
  ON crm.equipamentos (address_id);

CREATE TABLE IF NOT EXISTS crm.visitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES crm.clientes(id),
  opportunity_id UUID REFERENCES crm.oportunidades(id),
  address_id UUID REFERENCES crm.enderecos(id),
  scheduled_start_at TIMESTAMPTZ NOT NULL,
  scheduled_end_at TIMESTAMPTZ,
  technician_user_id UUID,
  status TEXT NOT NULL DEFAULT 'awaiting_confirmation',
  objective TEXT NOT NULL,
  access_notes TEXT,
  confirmation_notes TEXT,
  result TEXT,
  next_steps TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_by UUID,
  archived_at TIMESTAMPTZ,
  CONSTRAINT visitas_status_check CHECK (status IN ('draft', 'awaiting_confirmation', 'confirmed', 'completed', 'cancelled', 'no_show')),
  CONSTRAINT visitas_end_after_start_check CHECK (scheduled_end_at IS NULL OR scheduled_end_at >= scheduled_start_at),
  CONSTRAINT visitas_completed_result_check CHECK (status <> 'completed' OR result IS NOT NULL),
  CONSTRAINT visitas_cancelled_notes_check CHECK (status <> 'cancelled' OR confirmation_notes IS NOT NULL OR result IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS visitas_customer_status_start_idx
  ON crm.visitas (customer_id, status, scheduled_start_at);

CREATE INDEX IF NOT EXISTS visitas_opportunity_idx
  ON crm.visitas (opportunity_id);

CREATE INDEX IF NOT EXISTS visitas_address_idx
  ON crm.visitas (address_id);

CREATE INDEX IF NOT EXISTS visitas_status_start_idx
  ON crm.visitas (status, scheduled_start_at);

CREATE TABLE IF NOT EXISTS crm.visitas_equipamentos (
  visit_id UUID NOT NULL REFERENCES crm.visitas(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES crm.equipamentos(id),
  notes TEXT,
  PRIMARY KEY (visit_id, equipment_id)
);

CREATE INDEX IF NOT EXISTS visitas_equipamentos_equipment_idx
  ON crm.visitas_equipamentos (equipment_id);
