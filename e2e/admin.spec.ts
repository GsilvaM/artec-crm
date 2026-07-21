import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("gestor sees the administration panel with stages, loss reasons and users", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: "Integracao Auvo" }).click();
  await page.waitForURL(/\/configuracoes\/integracoes\/auvo$/);
  const admin = page.locator("section.admin-panel");
  await expect(admin).toBeVisible();
  await expect(admin.getByRole("heading", { name: "Etapas do funil" })).toBeVisible();
  await expect(admin.getByRole("heading", { name: "Motivos de perda", exact: true })).toBeVisible();
  await expect(admin.getByRole("heading", { name: "Usuarios e acesso ao CRM" })).toBeVisible();
});
