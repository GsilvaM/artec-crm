-- Isola fixtures de teste E2E/homologacao das vistas operacionais sem apagar nenhum dado.
-- Ver docs/AUDITORIA-ESTADO-ATUAL-ARTEC-CRM.md secao 5 e auditoria de qualidade de dados desta sessao:
-- 36/47 clientes e 33/37 oportunidades no banco real sao fixtures criadas por e2e/customer-and-opportunity.spec.ts
-- (sempre com telefone 11999990000, sem teardown) ou por testes manuais de homologacao (nome contendo "Homolog").

ALTER TABLE crm.clientes
  ADD COLUMN IF NOT EXISTS is_test_fixture BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE crm.oportunidades
  ADD COLUMN IF NOT EXISTS is_test_fixture BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS clientes_is_test_fixture_idx
  ON crm.clientes (is_test_fixture);

CREATE INDEX IF NOT EXISTS oportunidades_is_test_fixture_idx
  ON crm.oportunidades (is_test_fixture);

-- Backfill: marca fixtures conhecidas ja existentes. Nao remove nenhuma linha; apenas as exclui
-- das consultas operacionais (listas, funil, central comercial, relatorios, busca).
UPDATE crm.clientes
SET is_test_fixture = true
WHERE is_test_fixture = false
  AND (
    nome ILIKE 'E2E %'
    OR nome ILIKE '%homolog%'
    OR telefone_normalizado = '5511999990000'
  );

UPDATE crm.oportunidades
SET is_test_fixture = true
WHERE is_test_fixture = false
  AND (
    titulo ILIKE 'E2E %'
    OR titulo ILIKE '%homolog%'
    OR cliente_id IN (SELECT id FROM crm.clientes WHERE is_test_fixture = true)
  );
