import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("shows the commercial center with its work blocks and summary", async ({ page }) => {
  await loginAsHomologationGestor(page);
  const center = page.locator("section.commercial-center");
  await expect(center).toBeVisible();
  await expect(center.getByText("Acoes vencidas")).toBeVisible();
  await expect(center.getByText("Resumo comercial")).toBeVisible();
});

test("shows the commercial reports dashboard with metrics and breakdown tables", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: "Funil" }).click();
  await page.waitForURL(/\/pipeline$/);
  const reports = page.locator("section.reports-panel");
  await expect(reports).toBeVisible();
  await expect(reports.getByText("Oportunidades por etapa")).toBeVisible({ timeout: 15_000 });
  await expect(reports.getByText("Conversao por origem")).toBeVisible();
});
