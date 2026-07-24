import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("opens a customer detail page from the list and sees related opportunities and timeline", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: "Clientes" }).click();
  await page.waitForURL(/\/clientes$/);
  await expect(page.getByLabel("Board operacional de clientes")).toBeVisible();

  const firstCard = page.locator("#clientes-section .customer-card").first();
  const name = await firstCard.locator(".customer-card-title").innerText();
  await firstCard.getByRole("link", { name: "Abrir cliente" }).click();
  await page.waitForURL(/\/clientes\/[0-9a-f-]+$/);

  await expect(page.getByRole("heading", { level: 1 })).toContainText(name.trim());

  await page.getByRole("tab", { name: "Garantia e suporte" }).click();
  await expect(page.getByLabel("Descrição")).toBeVisible();

  await page.getByRole("tab", { name: "Linha do tempo" }).click();
  await expect(page.getByRole("tabpanel")).toBeVisible();
});

for (const viewport of [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "desktop-1366", width: 1366, height: 768 },
]) {
  test(`Clientes board stays inside the viewport on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await loginAsHomologationGestor(page);
    await page.goto("/clientes");
    await page.getByLabel("Board operacional de clientes").waitFor();

    const overflow = await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth - window.innerWidth,
      vertical: document.documentElement.scrollHeight - window.innerHeight,
    }));

    expect(overflow.horizontal, `${viewport.name} nao deve ter overflow horizontal`).toBeLessThanOrEqual(1);
    expect(overflow.vertical, `${viewport.name} nao deve ter scroll global`).toBeLessThanOrEqual(1);
  });
}

test("creates address, equipment and visit from the customer structure tab and shows the visit in Central Comercial", async ({ page }) => {
  const suffix = Date.now().toString(36);
  const customerName = `E2E Estrutura ${suffix}`;
  let customerId: string | null = null;

  await loginAsHomologationGestor(page);
  const token = await page.evaluate(() => {
    const raw = window.localStorage.getItem("artec-crm.auth");
    if (!raw) return null;
    try {
      return (JSON.parse(raw) as { access_token?: string }).access_token ?? null;
    } catch {
      return null;
    }
  });
  expect(token).toBeTruthy();
  const authHeaders = { authorization: `Bearer ${token}` };

  try {
    const customerResponse = await page.request.post("/api/customers", {
      headers: authHeaders,
      data: { tipoPessoa: "fisica", nome: customerName, telefone: "11977770000" },
    });
    expect(customerResponse.ok()).toBeTruthy();
    customerId = (await customerResponse.json()).customer.id;

    await page.goto(`/clientes/${customerId}?aba=estrutura`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(customerName);
    await expect(page.getByRole("tab", { name: /Estrutura/ })).toHaveAttribute("aria-selected", "true");

    const addresses = page.getByLabel("Enderecos do cliente");
    await addresses.getByLabel("Nome").fill(`Endereco ${suffix}`);
    await addresses.getByLabel("Rua").fill("Rua E2E");
    await addresses.getByLabel("Numero").fill("123");
    await addresses.getByLabel("Cidade").fill("Sao Paulo");
    await addresses.getByRole("button", { name: /Endereco/ }).click();
    await expect(addresses.getByText(`Endereco ${suffix}`)).toBeVisible({ timeout: 15_000 });

    const equipment = page.getByLabel("Equipamentos do cliente");
    await equipment.getByLabel("Marca").fill("Daikin");
    await equipment.getByLabel("Modelo").fill(`E2E ${suffix}`);
    await equipment.getByLabel("BTUs").fill("12000");
    await equipment.getByLabel("Ambiente").fill("Sala");
    await equipment.getByLabel("Endereco").selectOption({ label: `Endereco ${suffix}` });
    await equipment.getByRole("button", { name: /Equipamento/ }).click();
    await expect(equipment.getByText(`Daikin E2E ${suffix}`)).toBeVisible({ timeout: 15_000 });

    const visits = page.getByLabel("Visitas do cliente");
    await visits.getByLabel("Objetivo").fill(`Vistoria E2E ${suffix}`);
    await visits.getByLabel("Inicio").fill("2026-08-02T10:00");
    await visits.getByLabel("Endereco").selectOption({ label: `Endereco ${suffix}` });
    await visits.getByRole("button", { name: /Visita/ }).click();
    await expect(visits.getByText(`Vistoria E2E ${suffix}`)).toBeVisible({ timeout: 15_000 });

    await page.getByRole("link", { name: "Central Comercial" }).click();
    await page.waitForURL(/\/central-comercial$/);
    await expect(page.getByLabel("Agenda e visitas").getByText(`Vistoria E2E ${suffix}`)).toBeVisible({ timeout: 15_000 });
  } finally {
    if (customerId) {
      await page.request.post(`/api/customers/${customerId}/archive`, { headers: authHeaders }).catch(() => undefined);
    }
  }
});
