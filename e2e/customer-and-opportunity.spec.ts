import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("creates a customer, creates an opportunity for it, and sees it on the pipeline board", async ({ page }) => {
  const suffix = Date.now().toString(36);
  const customerName = `E2E Cliente ${suffix}`;
  const opportunityTitle = `E2E Oportunidade ${suffix}`;

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
  await opportunityForm.getByLabel("Titulo").fill(opportunityTitle);
  await opportunityForm.getByLabel("Tipo de demanda").fill("instalacao");
  await opportunityForm.getByLabel("Situacao").fill("em andamento");
  await opportunityForm.getByLabel("Proxima acao", { exact: true }).fill("Ligar para o cliente");
  await opportunityForm.getByLabel("Data da proxima acao").fill("2026-08-01T10:00");
  await opportunityForm.getByRole("button", { name: /Salvar oportunidade/i }).click();
  await expect(page.locator("#oportunidades-section").getByText(opportunityTitle)).toBeVisible({ timeout: 15_000 });

  await page.getByRole("link", { name: "Funil" }).click();
  await page.waitForURL(/\/pipeline$/);
  await expect(page.locator("section.pipeline-section")).toContainText(opportunityTitle, { timeout: 15_000 });
});
