import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("gestor sees the Auvo inbox split-view with queue, status filters and decision panel", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: "Caixa Auvo" }).click();
  await page.waitForURL(/\/caixa-auvo$/);

  const inbox = page.locator("section.auvo-inbox-panel");
  await expect(inbox).toBeVisible();
  await expect(inbox.getByRole("button", { name: "Novo" })).toBeVisible();
  await expect(inbox.getByRole("button", { name: "Processado" })).toBeVisible();
  await expect(inbox.getByRole("button", { name: "Descartado" })).toBeVisible();

  await expect(page.locator(".auvo-queue-column")).toBeVisible();
  await expect(page.locator(".auvo-decision-column")).toBeVisible();

  const pageOverflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  expect(pageOverflow, `Caixa Auvo nao deve depender de scroll global no desktop (scrollHeight - innerHeight = ${pageOverflow})`).toBeLessThanOrEqual(1);
});

test("selecting a queue item shows its details and resolution actions in the decision panel", async ({ page }) => {
  await loginAsHomologationGestor(page);
  const inboxResponse = page.waitForResponse((res) => res.url().includes("/api/auvo-inbox") && res.status() === 200);
  await page.getByRole("link", { name: "Caixa Auvo" }).click();
  await page.waitForURL(/\/caixa-auvo$/);
  await inboxResponse;

  const queueItems = page.locator(".auvo-queue-item");
  const count = await queueItems.count();
  test.skip(count === 0, "Nenhum item na fila novo para selecionar nesta homologacao.");

  await expect(page.getByText("Selecione um atendimento")).toBeVisible();

  await queueItems.first().click();
  await expect(queueItems.first()).toHaveAttribute("aria-current", "true");

  const decisionPanel = page.locator(".auvo-decision-panel");
  await expect(decisionPanel).toBeVisible();
  await expect(decisionPanel.getByLabel("Match Cliente-Auvo")).toBeVisible();
  await expect(decisionPanel.getByLabel("Checklist de triagem assistida")).toBeVisible();
  await expect(decisionPanel.getByLabel("Resumo dos sinais Auvo")).toBeVisible();
  await expect(decisionPanel.getByRole("button", { name: "Criar oportunidade" })).toBeVisible();
  await expect(decisionPanel.getByRole("button", { name: "Vincular a oportunidade existente" })).toBeVisible();
  await expect(decisionPanel.getByRole("button", { name: "Cadastrar somente cliente" })).toBeVisible();
  await expect(decisionPanel.getByRole("button", { name: "Marcar não comercial" })).toBeVisible();
  await expect(decisionPanel.getByRole("button", { name: "Marcar duplicado" })).toBeVisible();
});

for (const viewport of [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "desktop-1366", width: 1366, height: 768 },
]) {
  test(`Caixa Auvo split-view stays inside the viewport on ${viewport.name}`, async ({ page }) => {
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

test("mobile split-view starts on the queue and switches to the decision panel on selection", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAsHomologationGestor(page);
  const inboxResponse = page.waitForResponse((res) => res.url().includes("/api/auvo-inbox") && res.status() === 200);
  await page.goto("/caixa-auvo");

  const splitView = page.locator(".auvo-split-view");
  await expect(splitView).toHaveAttribute("data-mobile-view", "queue");
  await expect(page.locator(".auvo-queue-column")).toBeVisible();
  await expect(page.locator(".auvo-decision-column")).toBeHidden();
  await inboxResponse;

  const queueItems = page.locator(".auvo-queue-item");
  const count = await queueItems.count();
  test.skip(count === 0, "Nenhum item na fila novo para selecionar nesta homologacao.");

  await queueItems.first().click();
  await expect(splitView).toHaveAttribute("data-mobile-view", "detail");
  await expect(page.locator(".auvo-queue-column")).toBeHidden();
  await expect(page.locator(".auvo-decision-column")).toBeVisible();

  await page.getByRole("button", { name: "Voltar para a fila" }).click();
  await expect(splitView).toHaveAttribute("data-mobile-view", "queue");
  await expect(page.locator(".auvo-queue-column")).toBeVisible();
});
