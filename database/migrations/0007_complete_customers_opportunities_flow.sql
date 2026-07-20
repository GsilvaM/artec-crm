CREATE OR REPLACE FUNCTION crm.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = crm, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clientes_set_updated_at ON crm.clientes;
CREATE TRIGGER clientes_set_updated_at
  BEFORE UPDATE ON crm.clientes
  FOR EACH ROW
  EXECUTE FUNCTION crm.set_updated_at();

ALTER TABLE crm.oportunidades
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS quantidade_parcelas INTEGER,
  ADD COLUMN IF NOT EXISTS previsao_execucao DATE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD CONSTRAINT oportunidades_aprovacao_comercial_obrigatoria CHECK (
    status <> 'ganha'
    OR (
      valor_aprovado IS NOT NULL
      AND valor_aprovado > 0
      AND nullif(trim(forma_pagamento), '') IS NOT NULL
      AND quantidade_parcelas IS NOT NULL
      AND quantidade_parcelas > 0
      AND previsao_execucao IS NOT NULL
    )
  );

DROP TRIGGER IF EXISTS oportunidades_set_updated_at ON crm.oportunidades;
CREATE TRIGGER oportunidades_set_updated_at
  BEFORE UPDATE ON crm.oportunidades
  FOR EACH ROW
  EXECUTE FUNCTION crm.set_updated_at();

CREATE OR REPLACE FUNCTION crm.write_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = crm, pg_temp
AS $$
DECLARE
  changed_by UUID;
BEGIN
  changed_by := COALESCE(
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.updated_by
      ELSE COALESCE(NEW.updated_by, NEW.created_by)
    END,
    auth.uid()
  );

  INSERT INTO crm.audit_log (table_name, record_id, action, user_id, before_values, after_values)
  VALUES (
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    lower(TG_OP),
    changed_by,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS clientes_audit_log ON crm.clientes;
CREATE TRIGGER clientes_audit_log
  AFTER INSERT OR UPDATE ON crm.clientes
  FOR EACH ROW
  EXECUTE FUNCTION crm.write_audit_log();

DROP TRIGGER IF EXISTS oportunidades_audit_log ON crm.oportunidades;
CREATE TRIGGER oportunidades_audit_log
  AFTER INSERT OR UPDATE ON crm.oportunidades
  FOR EACH ROW
  EXECUTE FUNCTION crm.write_audit_log();

INSERT INTO crm.etapas_funil (nome, ordem, is_terminal)
VALUES
  ('Novo lead', 1, false),
  ('Em atendimento', 2, false),
  ('Visita ou avaliacao', 3, false),
  ('Orcamento em elaboracao', 4, false),
  ('Orcamento enviado', 5, false),
  ('Negociacao', 6, false),
  ('Aprovado', 7, true),
  ('Concluido', 8, true),
  ('Perdido', 9, true)
ON CONFLICT (nome) DO UPDATE
SET ordem = EXCLUDED.ordem,
    is_terminal = EXCLUDED.is_terminal;

INSERT INTO crm.motivos_perda (nome)
VALUES
  ('preco'),
  ('sem retorno'),
  ('fechou com concorrente'),
  ('adiou a demanda'),
  ('problema resolvido'),
  ('fora da area atendida'),
  ('sem perfil'),
  ('inviabilidade tecnica'),
  ('outro')
ON CONFLICT (nome) DO NOTHING;
