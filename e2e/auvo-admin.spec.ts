import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("gestor sees the Auvo technical integration panel reconstructed from the design reference", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: /Integra[cç][aã]o Auvo/i }).click();
  await page.waitForURL(/\/configuracoes\/integracoes\/auvo$/);

  await expect(page.getByRole("heading", { name: "Integração Auvo", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Integração Auvo" })).toBeVisible();
  await expect(page.getByLabel("Status técnico Auvo")).toBeVisible();
  await expect(page.getByText("Fila recente")).toBeVisible();
  await expect(page.getByText("Endpoint do webhook")).toBeVisible();
  await expect(page.getByText("Alertas de integração")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `Integracao Auvo nao deve ter overflow horizontal`).toBeLessThanOrEqual(1);
});
