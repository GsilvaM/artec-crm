import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("gestor sees the Notificacoes list reconstructed from the design reference", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: /Notifica/ }).click();
  await page.waitForURL(/\/notificacoes$/);

  await expect(page.getByRole("heading", { name: /Notifica[cç][oõ]es/i, level: 1 })).toBeVisible();
  await expect(page.getByLabel("Notificações internas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Marcar todas como lidas" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Preferências" })).toBeVisible();

  const tabs = page.getByLabel("Filtrar notificações");
  await expect(tabs.getByRole("button", { name: "Todas" })).toHaveClass(/active/);
  await expect(tabs.getByRole("button", { name: "Não lidas" })).toBeVisible();
  await expect(tabs.getByRole("button", { name: "Urgentes" })).toBeVisible();
  await expect(tabs.getByRole("button", { name: "Integração" })).toBeVisible();

  await expect(page.getByLabel("Hoje")).toBeVisible();
  await expect(page.getByLabel("Esta semana")).toBeVisible();

  await tabs.getByRole("button", { name: "Urgentes" }).click();
  await expect(tabs.getByRole("button", { name: "Urgentes" })).toHaveClass(/active/);

  const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(pageOverflow, `Notificacoes nao deve ter overflow horizontal no desktop (scrollWidth - innerWidth = ${pageOverflow})`).toBeLessThanOrEqual(1);
});

for (const viewport of [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "desktop-1366", width: 1366, height: 768 },
]) {
  test(`Notificacoes list stays inside the viewport on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await loginAsHomologationGestor(page);
    await page.goto("/notificacoes");
    await page.getByLabel("Notificações internas").waitFor();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${viewport.name} nao deve ter overflow horizontal`).toBeLessThanOrEqual(1);
  });
}
