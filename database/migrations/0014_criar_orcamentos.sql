CREATE TABLE crm.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id UUID NOT NULL REFERENCES crm.oportunidades(id),
  versao INTEGER NOT NULL,
  valor INTEGER NOT NULL CHECK (valor > 0),
  resumo TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'revisado', 'aprovado', 'recusado', 'expirado')),
  enviado_em TIMESTAMPTZ,
  respondido_em TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT orcamentos_oportunidade_versao_unique UNIQUE (oportunidade_id, versao),
  CONSTRAINT orcamentos_enviado_fields_check CHECK (
    status = 'rascunho' OR enviado_em IS NOT NULL
  ),
  CONSTRAINT orcamentos_respondido_fields_check CHECK (
    status NOT IN ('aprovado', 'recusado', 'expirado') OR respondido_em IS NOT NULL
  )
);

CREATE INDEX orcamentos_oportunidade_idx ON crm.orcamentos (oportunidade_id, versao DESC);

DROP TRIGGER IF EXISTS orcamentos_set_updated_at ON crm.orcamentos;
CREATE TRIGGER orcamentos_set_updated_at
  BEFORE UPDATE ON crm.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION crm.set_updated_at();

DROP TRIGGER IF EXISTS orcamentos_audit_log ON crm.orcamentos;
CREATE TRIGGER orcamentos_audit_log
  AFTER INSERT OR UPDATE ON crm.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION crm.write_audit_log();

ALTER TABLE crm.orcamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY orcamentos_select_by_role ON crm.orcamentos FOR SELECT USING (
  crm.current_member_role() IN ('gestor', 'atendimento')
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM crm.oportunidades oportunidade
    WHERE oportunidade.id = crm.orcamentos.oportunidade_id
      AND oportunidade.responsavel_id = auth.uid()
  )
);

CREATE POLICY orcamentos_write_by_role ON crm.orcamentos FOR ALL USING (
  crm.current_member_role() IN ('gestor', 'atendimento')
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM crm.oportunidades oportunidade
    WHERE oportunidade.id = crm.orcamentos.oportunidade_id
      AND oportunidade.responsavel_id = auth.uid()
  )
) WITH CHECK (
  crm.current_member_role() IN ('gestor', 'atendimento')
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM crm.oportunidades oportunidade
    WHERE oportunidade.id = crm.orcamentos.oportunidade_id
      AND oportunidade.responsavel_id = auth.uid()
  )
);

GRANT SELECT, INSERT, UPDATE ON crm.orcamentos TO authenticated;
