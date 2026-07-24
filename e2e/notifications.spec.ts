import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("gestor sees the Notificacoes operational board with status filters", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: /Notifica/ }).click();
  await page.waitForURL(/\/notificacoes$/);

  await expect(page.getByRole("heading", { name: "Notificacoes", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Resumo das notificacoes")).toBeVisible();
  await expect(page.getByLabel("Board operacional de notificacoes")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Resolver agora" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Acompanhar" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Historico" })).toBeVisible();

  const filters = page.locator(".notifications-page .filter-actions");
  await expect(filters.getByRole("button", { name: "Pendentes" })).toHaveAttribute("aria-pressed", "true");
  await expect(filters.getByRole("button", { name: "Lida" })).toBeVisible();
  await expect(filters.getByRole("button", { name: "Arquivada" })).toBeVisible();

  const pageOverflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  expect(pageOverflow, `Notificacoes nao deve depender de scroll global no desktop (scrollHeight - innerHeight = ${pageOverflow})`).toBeLessThanOrEqual(1);
  await expect(page.locator(".notifications-lane-scroll").first()).toBeVisible();
});

for (const viewport of [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "desktop-1366", width: 1366, height: 768 },
]) {
  test(`Notificacoes board stays inside the viewport on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await loginAsHomologationGestor(page);
    await page.goto("/notificacoes");
    await page.getByLabel("Board operacional de notificacoes").waitFor();

    const overflow = await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth - window.innerWidth,
      vertical: document.documentElement.scrollHeight - window.innerHeight,
    }));

    expect(overflow.horizontal, `${viewport.name} nao deve ter overflow horizontal`).toBeLessThanOrEqual(1);
    expect(overflow.vertical, `${viewport.name} nao deve ter scroll global`).toBeLessThanOrEqual(1);
  });
}
