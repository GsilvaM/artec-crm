CREATE TABLE crm.etapas_funil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ordem),
  UNIQUE (nome)
);

CREATE TABLE crm.motivos_perda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE crm.oportunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES crm.clientes(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo_demanda TEXT NOT NULL,
  origem TEXT,
  responsavel_id UUID NOT NULL REFERENCES auth.users(id),
  etapa_id UUID NOT NULL REFERENCES crm.etapas_funil(id),
  situacao TEXT NOT NULL,
  valor_estimado INTEGER,
  valor_orcamento INTEGER,
  valor_aprovado INTEGER,
  proxima_acao TEXT,
  proxima_acao_em TIMESTAMPTZ,
  data_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_orcamento TIMESTAMPTZ,
  data_aprovacao TIMESTAMPTZ,
  data_perda TIMESTAMPTZ,
  motivo_perda_id UUID REFERENCES crm.motivos_perda(id),
  status TEXT NOT NULL CHECK (status IN ('rascunho', 'ativa', 'ganha', 'perdida', 'arquivada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT oportunidade_ativa_exige_proxima_acao CHECK (
    status <> 'ativa'
    OR (
      responsavel_id IS NOT NULL
      AND nullif(trim(proxima_acao), '') IS NOT NULL
      AND proxima_acao_em IS NOT NULL
    )
  )
);

CREATE INDEX oportunidades_cliente_idx ON crm.oportunidades (cliente_id);
CREATE INDEX oportunidades_responsavel_status_idx ON crm.oportunidades (responsavel_id, status);
CREATE INDEX oportunidades_proxima_acao_idx ON crm.oportunidades (proxima_acao_em) WHERE status = 'ativa';

CREATE TABLE crm.atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES crm.clientes(id),
  oportunidade_id UUID REFERENCES crm.oportunidades(id),
  author_user_id UUID NOT NULL REFERENCES auth.users(id),
  tipo TEXT NOT NULL,
  corpo TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE crm.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  before_values JSONB,
  after_values JSONB,
  action_origin TEXT NOT NULL DEFAULT 'app',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE crm.etapas_funil ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.motivos_perda ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY etapas_funil_select_members ON crm.etapas_funil FOR SELECT USING (
  EXISTS (SELECT 1 FROM crm.user_memberships membership WHERE membership.user_id = auth.uid() AND membership.is_active)
);

CREATE POLICY motivos_perda_select_members ON crm.motivos_perda FOR SELECT USING (
  EXISTS (SELECT 1 FROM crm.user_memberships membership WHERE membership.user_id = auth.uid() AND membership.is_active)
);

CREATE POLICY oportunidades_select_by_role ON crm.oportunidades FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM crm.user_memberships membership
    WHERE membership.user_id = auth.uid()
      AND membership.is_active
      AND (membership.role IN ('gestor', 'atendimento') OR responsavel_id = auth.uid())
  )
);

CREATE POLICY oportunidades_write_by_role ON crm.oportunidades FOR ALL USING (
  EXISTS (
    SELECT 1 FROM crm.user_memberships membership
    WHERE membership.user_id = auth.uid()
      AND membership.is_active
      AND (membership.role IN ('gestor', 'atendimento') OR responsavel_id = auth.uid())
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM crm.user_memberships membership
    WHERE membership.user_id = auth.uid()
      AND membership.is_active
      AND (membership.role IN ('gestor', 'atendimento') OR responsavel_id = auth.uid())
  )
);

CREATE POLICY atividades_select_members ON crm.atividades FOR SELECT USING (
  EXISTS (SELECT 1 FROM crm.user_memberships membership WHERE membership.user_id = auth.uid() AND membership.is_active)
);

CREATE POLICY atividades_insert_members ON crm.atividades FOR INSERT WITH CHECK (
  author_user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM crm.user_memberships membership WHERE membership.user_id = auth.uid() AND membership.is_active)
);

CREATE POLICY audit_log_select_gestor ON crm.audit_log FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM crm.user_memberships membership
    WHERE membership.user_id = auth.uid()
      AND membership.role = 'gestor'
      AND membership.is_active
  )
);
