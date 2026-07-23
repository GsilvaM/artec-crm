import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

let customerName: string | undefined;
let opportunityTitle: string | undefined;

test.afterEach(async ({ page }) => {
  // Isola a fixture criada pelo teste do restante do banco: is_test_fixture ja a esconde das
  // vistas operacionais, mas sem arquivar ela continua crescendo o banco a cada execucao (achado
  // real da auditoria de qualidade de dados desta sessao). A app anexa o Bearer token via JS a
  // partir da sessao Supabase persistida em localStorage (storageKey "artec-crm.auth") — page.request
  // nao replica isso automaticamente (so compartilha cookies com o browser context), entao o token
  // precisa ser lido explicitamente para as chamadas de limpeza serem autenticadas.
  if (!customerName) return;
  try {
    const token = await page.evaluate(() => {
      const raw = window.localStorage.getItem("artec-crm.auth");
      if (!raw) return null;
      try {
        return (JSON.parse(raw) as { access_token?: string }).access_token ?? null;
      } catch {
        return null;
      }
    });
    if (!token) return;
    const authHeaders = { authorization: `Bearer ${token}`, "x-crm-include-test-fixtures": "true" };

    if (opportunityTitle) {
      const opportunitiesResponse = await page.request.get(`/api/opportunities?search=${encodeURIComponent(opportunityTitle)}`, {
        headers: authHeaders,
      });
      if (opportunitiesResponse.ok()) {
        const body = await opportunitiesResponse.json();
        const opportunity = body.opportunities?.find((o: { titulo: string }) => o.titulo === opportunityTitle);
        if (opportunity) await page.request.post(`/api/opportunities/${opportunity.id}/archive`, { headers: authHeaders });
      }
    }
    const response = await page.request.get(`/api/customers?search=${encodeURIComponent(customerName)}`, { headers: authHeaders });
    if (response.ok()) {
      const body = await response.json();
      const customer = body.customers?.find((c: { nome: string }) => c.nome === customerName);
      if (customer) await page.request.post(`/api/customers/${customer.id}/archive`, { headers: authHeaders });
    }
  } finally {
    customerName = undefined;
    opportunityTitle = undefined;
  }
});

test("creates a customer, creates an opportunity for it, and sees it on the pipeline board", async ({ page }) => {
  const suffix = Date.now().toString(36);
  customerName = `E2E Cliente ${suffix}`;
  opportunityTitle = `E2E Oportunidade ${suffix}`;

  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: "Clientes" }).click();
  await page.waitForURL(/\/clientes$/);

  await page.getByRole("heading", { name: "Novo cliente" }).scrollIntoViewIfNeeded();
  const customerForm = page.locator("form", { has: page.getByRole("heading", { name: "Novo cliente" }) });
  await customerForm.getByLabel("Nome").fill(customerName);
  await customerForm.getByLabel("Telefone").fill("11999990000");
  await customerForm.getByRole("button", { name: /Salvar cliente/i }).click();
  const customersTable = page.locator("table", { has: page.getByRole("columnheader", { name: "Telefone" }) });
  await expect(customersTable.getByText(customerName)).toBeVisible({ timeout: 15_000 });

  await page.getByRole("link", { name: "Oportunidades" }).click();
  await page.waitForURL(/\/oportunidades$/);

  const opportunityForm = page.locator("form", { has: page.getByRole("heading", { name: "Nova oportunidade" }) });
  await opportunityForm.getByLabel("Cliente").selectOption({ label: customerName });
  await opportunityForm.getByLabel("Título").fill(opportunityTitle);
  await opportunityForm.getByLabel("Tipo de demanda").selectOption("instalacao");
  await opportunityForm.getByLabel("Situação").fill("em andamento");
  await opportunityForm.getByLabel("Próxima ação", { exact: true }).fill("Ligar para o cliente");
  await opportunityForm.getByLabel("Data da próxima ação").fill("2026-08-01T10:00");
  await opportunityForm.getByRole("button", { name: /Salvar oportunidade/i }).click();
  await expect(page.locator("#oportunidades-section").getByText(opportunityTitle)).toBeVisible({ timeout: 15_000 });

  await page.getByRole("link", { name: "Funil" }).click();
  await page.waitForURL(/\/pipeline$/);
  await expect(page.locator(".pipeline-board")).toContainText(opportunityTitle, { timeout: 15_000 });
});
