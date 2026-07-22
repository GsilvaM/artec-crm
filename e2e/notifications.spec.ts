import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("gestor sees the Notificacoes page with status filters", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: "Notificações" }).click();
  await page.waitForURL(/\/notificacoes$/);
  await expect(page.getByRole("heading", { name: "Notificações", level: 1 })).toBeVisible();
  const filters = page.locator(".notifications-page .filter-actions");
  await expect(filters.getByText("Pendentes")).toBeVisible();
  await expect(filters.getByText("Arquivada")).toBeVisible();
});
