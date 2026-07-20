REVOKE ALL ON SCHEMA crm_internal FROM PUBLIC;
REVOKE ALL ON SCHEMA crm_internal FROM anon;
REVOKE ALL ON SCHEMA crm_internal FROM authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA crm_internal FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA crm_internal FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA crm_internal FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA crm_internal FROM authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA crm_internal FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA crm_internal FROM authenticated;

GRANT USAGE ON SCHEMA crm TO authenticated;

CREATE OR REPLACE FUNCTION crm.is_active_member()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = crm, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM crm.user_memberships membership
    WHERE membership.user_id = auth.uid()
      AND membership.is_active
  );
$$;

CREATE OR REPLACE FUNCTION crm.current_member_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = crm, pg_temp
AS $$
  SELECT membership.role
  FROM crm.user_memberships membership
  WHERE membership.user_id = auth.uid()
    AND membership.is_active
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION crm.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = crm, pg_temp
AS $$
  SELECT crm.current_member_role() = required_role;
$$;

REVOKE ALL ON FUNCTION crm.is_active_member() FROM PUBLIC;
REVOKE ALL ON FUNCTION crm.current_member_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION crm.has_role(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION crm.is_active_member() TO authenticated;
GRANT EXECUTE ON FUNCTION crm.current_member_role() TO authenticated;
GRANT EXECUTE ON FUNCTION crm.has_role(TEXT) TO authenticated;

DROP POLICY IF EXISTS user_memberships_select_self_or_gestor ON crm.user_memberships;
DROP POLICY IF EXISTS user_memberships_write_gestor ON crm.user_memberships;

CREATE POLICY user_memberships_select_self_or_gestor
  ON crm.user_memberships
  FOR SELECT
  USING (user_id = auth.uid() OR crm.has_role('gestor'));

CREATE POLICY user_memberships_write_gestor
  ON crm.user_memberships
  FOR ALL
  USING (crm.has_role('gestor'))
  WITH CHECK (crm.has_role('gestor'));

DROP POLICY IF EXISTS clientes_select_active_members ON crm.clientes;
DROP POLICY IF EXISTS clientes_insert_active_members ON crm.clientes;
DROP POLICY IF EXISTS clientes_update_active_members ON crm.clientes;

CREATE POLICY clientes_select_active_members
  ON crm.clientes
  FOR SELECT
  USING (crm.is_active_member());

CREATE POLICY clientes_insert_active_members
  ON crm.clientes
  FOR INSERT
  WITH CHECK (created_by = auth.uid() AND crm.is_active_member());

CREATE POLICY clientes_update_active_members
  ON crm.clientes
  FOR UPDATE
  USING (archived_at IS NULL AND crm.is_active_member())
  WITH CHECK (crm.is_active_member());

DROP POLICY IF EXISTS etapas_funil_select_members ON crm.etapas_funil;
DROP POLICY IF EXISTS motivos_perda_select_members ON crm.motivos_perda;
DROP POLICY IF EXISTS oportunidades_select_by_role ON crm.oportunidades;
DROP POLICY IF EXISTS oportunidades_write_by_role ON crm.oportunidades;
DROP POLICY IF EXISTS atividades_select_members ON crm.atividades;
DROP POLICY IF EXISTS atividades_insert_members ON crm.atividades;
DROP POLICY IF EXISTS audit_log_select_gestor ON crm.audit_log;

CREATE POLICY etapas_funil_select_members ON crm.etapas_funil FOR SELECT USING (crm.is_active_member());
CREATE POLICY motivos_perda_select_members ON crm.motivos_perda FOR SELECT USING (crm.is_active_member());

CREATE POLICY oportunidades_select_by_role ON crm.oportunidades FOR SELECT USING (
  crm.current_member_role() IN ('gestor', 'atendimento') OR responsavel_id = auth.uid()
);

CREATE POLICY oportunidades_write_by_role ON crm.oportunidades FOR ALL USING (
  crm.current_member_role() IN ('gestor', 'atendimento') OR responsavel_id = auth.uid()
) WITH CHECK (
  crm.current_member_role() IN ('gestor', 'atendimento') OR responsavel_id = auth.uid()
);

CREATE POLICY atividades_select_members ON crm.atividades FOR SELECT USING (crm.is_active_member());
CREATE POLICY atividades_insert_members ON crm.atividades FOR INSERT WITH CHECK (author_user_id = auth.uid() AND crm.is_active_member());
CREATE POLICY audit_log_select_gestor ON crm.audit_log FOR SELECT USING (crm.has_role('gestor'));

GRANT SELECT ON crm.user_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON crm.clientes TO authenticated;
GRANT SELECT ON crm.etapas_funil TO authenticated;
GRANT SELECT ON crm.motivos_perda TO authenticated;
GRANT SELECT, INSERT, UPDATE ON crm.oportunidades TO authenticated;
GRANT SELECT, INSERT ON crm.atividades TO authenticated;
GRANT SELECT ON crm.audit_log TO authenticated;
GRANT SELECT, UPDATE ON crm.notificacoes TO authenticated;
