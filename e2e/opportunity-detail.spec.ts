import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("opens an opportunity detail page from the list and sees its summary and timeline", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: "Oportunidades" }).click();
  await page.waitForURL(/\/oportunidades$/);
  await expect(page.getByLabel("Board operacional de oportunidades")).toBeVisible();

  const firstCard = page.locator("#oportunidades-section .opportunity-card").first();
  const title = await firstCard.locator(".opportunity-card-title").innerText();
  await firstCard.getByRole("link", { name: "Abrir oportunidade" }).click();
  await page.waitForURL(/\/oportunidades\/[0-9a-f-]+$/);

  await expect(page.getByRole("heading", { level: 1 })).toContainText(title.trim());
  await expect(page.getByLabel("Estrutura tecnica da oportunidade")).toBeVisible();
  await expect(page.getByText("Linha do tempo")).toBeVisible();
});

for (const viewport of [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "desktop-1366", width: 1366, height: 768 },
]) {
  test(`Oportunidades board stays inside the viewport on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await loginAsHomologationGestor(page);
    await page.goto("/oportunidades");
    await page.getByLabel("Board operacional de oportunidades").waitFor();

    const overflow = await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth - window.innerWidth,
      vertical: document.documentElement.scrollHeight - window.innerHeight,
    }));

    expect(overflow.horizontal, `${viewport.name} nao deve ter overflow horizontal`).toBeLessThanOrEqual(1);
    expect(overflow.vertical, `${viewport.name} nao deve ter scroll global`).toBeLessThanOrEqual(1);
  });
}

test("creates address, equipment and visit from the opportunity technical block", async ({ page }) => {
  test.setTimeout(60_000);
  const suffix = Date.now().toString(36);
  const customerName = `E2E Cliente Opp ${suffix}`;
  const opportunityTitle = `E2E Visita Opp ${suffix}`;
  let customerId: string | null = null;
  let opportunityId: string | null = null;

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
    const meResponse = await page.request.get("/api/me", { headers: authHeaders });
    expect(meResponse.ok()).toBeTruthy();
    const currentUserId = (await meResponse.json()).id as string;

    const customerResponse = await page.request.post("/api/customers", {
      headers: authHeaders,
      data: { tipoPessoa: "fisica", nome: customerName, telefone: "11966660000" },
    });
    expect(customerResponse.ok()).toBeTruthy();
    customerId = (await customerResponse.json()).customer.id;

    const opportunityResponse = await page.request.post("/api/opportunities", {
      headers: authHeaders,
      data: {
        clienteId: customerId,
        titulo: opportunityTitle,
        tipoDemanda: "instalacao",
        responsavelId: currentUserId,
        situacao: "em andamento",
        proximaAcao: "Confirmar visita",
        proximaAcaoEm: "2026-08-01T10:00:00.000Z",
      },
    });
    expect(opportunityResponse.ok()).toBeTruthy();
    opportunityId = (await opportunityResponse.json()).opportunity.id;

    await page.goto(`/oportunidades/${opportunityId}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(opportunityTitle);

    const structure = page.getByLabel("Estrutura tecnica da oportunidade");
    const addresses = structure.getByLabel("Enderecos do cliente na oportunidade");
    await addresses.getByLabel("Nome").fill(`Local ${suffix}`);
    await addresses.getByLabel("Rua").fill("Rua Oportunidade");
    await addresses.getByLabel("Numero").fill("456");
    await addresses.getByRole("button", { name: /Endereco/ }).click();
    await expect(addresses.getByText(`Local ${suffix}`)).toBeVisible({ timeout: 15_000 });

    const equipment = structure.getByLabel("Equipamentos da oportunidade");
    await equipment.getByLabel("Marca").fill("Gree");
    await equipment.getByLabel("Modelo").fill(`Opp ${suffix}`);
    await equipment.getByLabel("BTUs").fill("18000");
    await equipment.getByLabel("Endereco").selectOption({ label: `Local ${suffix}` });
    await equipment.getByRole("button", { name: /Equipamento/ }).click();
    await expect(equipment.getByText(`Gree Opp ${suffix}`)).toBeVisible({ timeout: 15_000 });

    const visits = structure.getByLabel("Visitas da oportunidade");
    await visits.getByLabel("Objetivo").fill(`Visita comercial ${suffix}`);
    await visits.getByLabel("Inicio").fill("2026-08-03T11:00");
    await visits.getByLabel("Endereco").selectOption({ label: `Local ${suffix}` });
    await visits.getByRole("button", { name: /Visita/ }).click();
    await expect(visits.getByText(`Visita comercial ${suffix}`)).toBeVisible({ timeout: 15_000 });
  } finally {
    if (opportunityId) await page.request.post(`/api/opportunities/${opportunityId}/archive`, { headers: authHeaders, timeout: 5_000 }).catch(() => undefined);
    if (customerId) await page.request.post(`/api/customers/${customerId}/archive`, { headers: authHeaders, timeout: 5_000 }).catch(() => undefined);
  }
});
