import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("gestor sees the Auvo inbox reconstructed from the design reference", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: "Caixa Auvo" }).click();
  await page.waitForURL(/\/caixa-auvo$/);

  const inbox = page.locator("section.auvo-inbox-panel");
  await expect(inbox).toBeVisible();
  await expect(page.getByRole("heading", { name: "Caixa Auvo" })).toBeVisible();
  await expect(page.getByText("Eventos recebidos aguardando triagem humana")).toBeVisible();
  await expect(page.getByText(/Webhook/)).toBeVisible();
  await expect(inbox.getByRole("tab", { name: /Pendentes/ })).toBeVisible();
  await expect(inbox.getByRole("tab", { name: /SLA/ })).toBeVisible();
  await expect(inbox.getByRole("tab", { name: /Triadas/ })).toBeVisible();
  await expect(page.locator(".auvo-design-queue")).toBeVisible();
  await expect(page.locator(".auvo-design-detail")).toBeVisible();

  const pageOverflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  expect(pageOverflow, `Caixa Auvo nao deve depender de scroll global no desktop (scrollHeight - innerHeight = ${pageOverflow})`).toBeLessThanOrEqual(1);
});

test("selecting a queue item shows session, suggested customer and bottom actions", async ({ page }) => {
  await loginAsHomologationGestor(page);
  const inboxResponse = page.waitForResponse((res) => res.url().includes("/api/auvo-inbox") && res.status() === 200);
  await page.getByRole("link", { name: "Caixa Auvo" }).click();
  await page.waitForURL(/\/caixa-auvo$/);
  await inboxResponse;

  const queueItems = page.locator(".auvo-design-queue-item");
  const count = await queueItems.count();
  test.skip(count === 0, "Nenhum item na fila para selecionar nesta homologacao.");

  await queueItems.first().click();
  await expect(queueItems.first()).toHaveAttribute("aria-current", "true");

  const decisionPanel = page.locator(".auvo-design-card");
  await expect(decisionPanel).toBeVisible();
  await expect(decisionPanel.getByLabel("Sessão consolidada")).toBeVisible();
  await expect(decisionPanel.getByLabel("Cliente sugerido")).toBeVisible();
  await expect(decisionPanel.getByRole("button", { name: /Descartar/ })).toBeVisible();
  await expect(decisionPanel.getByRole("button", { name: "Criar novo cliente" })).toBeVisible();
  await expect(decisionPanel.getByRole("button", { name: "Vincular a cliente" })).toBeVisible();
  await expect(decisionPanel.getByRole("button", { name: "Abrir oportunidade" })).toBeVisible();
});

for (const viewport of [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "desktop-1366", width: 1366, height: 768 },
]) {
  test(`Caixa Auvo stays inside the viewport on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await loginAsHomologationGestor(page);
    await page.goto("/caixa-auvo");
    await page.getByLabel("Caixa de Entrada Auvo").waitFor();

    const overflow = await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth - window.innerWidth,
      vertical: document.documentElement.scrollHeight - window.innerHeight,
    }));

    expect(overflow.horizontal, `${viewport.name} nao deve ter overflow horizontal`).toBeLessThanOrEqual(1);
    expect(overflow.vertical, `${viewport.name} nao deve ter scroll global`).toBeLessThanOrEqual(1);
  });
}

test("mobile inbox starts on the queue and switches to the decision panel on selection", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAsHomologationGestor(page);
  const inboxResponse = page.waitForResponse((res) => res.url().includes("/api/auvo-inbox") && res.status() === 200);
  await page.goto("/caixa-auvo");
  await page.getByLabel("Caixa de Entrada Auvo").waitFor();

  const splitView = page.locator(".auvo-design-shell");
  await expect(splitView).toHaveAttribute("data-mobile-view", "queue");
  await expect(page.locator(".auvo-design-queue")).toBeVisible();
  await expect(page.locator(".auvo-design-detail")).toBeHidden();
  await inboxResponse;

  const queueItems = page.locator(".auvo-design-queue-item");
  const count = await queueItems.count();
  test.skip(count === 0, "Nenhum item na fila para selecionar nesta homologacao.");

  await queueItems.first().click();
  await expect(splitView).toHaveAttribute("data-mobile-view", "detail");
  await expect(page.locator(".auvo-design-queue")).toBeHidden();
  await expect(page.locator(".auvo-design-detail")).toBeVisible();

  await page.getByRole("button", { name: "Voltar" }).click();
  await expect(splitView).toHaveAttribute("data-mobile-view", "queue");
  await expect(page.locator(".auvo-design-queue")).toBeVisible();
});
