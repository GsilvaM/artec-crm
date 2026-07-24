import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("gestor sees the Proximas Acoes operational board with filters", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: /Pr.ximas a..es/ }).click();
  await page.waitForURL(/\/proximas-acoes$/);
  await expect(page.getByRole("heading", { name: "Proximas acoes", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Board operacional de proximas acoes")).toBeVisible();

  const summary = page.getByLabel("Resumo das proximas acoes");
  await expect(summary.getByRole("button", { name: /Vencidas/i })).toHaveAttribute("aria-pressed", "true");
  await expect(summary.getByRole("button", { name: /Hoje/i })).toBeVisible();
  await expect(summary.getByRole("button", { name: /Concluidas/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vencidas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Proximas", exact: true })).toBeVisible();

  await expect(page.getByLabel("Responsavel")).toBeVisible();
  await expect(page.getByLabel("Categoria")).toBeVisible();
  await expect(page.getByLabel("Prioridade")).toBeVisible();

  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/next-actions") && response.url().includes("category=support")),
    page.getByLabel("Categoria").selectOption("support"),
  ]);
  await expect(page.getByLabel("Categoria")).toHaveValue("support");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `Proximas Acoes nao deve ter overflow horizontal (scrollWidth - innerWidth = ${overflow})`).toBeLessThanOrEqual(1);
});

for (const viewport of [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "desktop-1366", width: 1366, height: 768 },
]) {
  test(`Proximas Acoes board stays inside the viewport on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await loginAsHomologationGestor(page);
    await page.goto("/proximas-acoes");
    await page.getByLabel("Board operacional de proximas acoes").waitFor();

    const overflow = await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth - window.innerWidth,
      vertical: document.documentElement.scrollHeight - window.innerHeight,
    }));

    expect(overflow.horizontal, `${viewport.name} nao deve ter overflow horizontal`).toBeLessThanOrEqual(1);
    expect(overflow.vertical, `${viewport.name} nao deve ter scroll global`).toBeLessThanOrEqual(1);
  });
}
