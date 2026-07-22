import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("gestor sees the Auvo inbox panel with status filters", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: "Caixa Auvo" }).click();
  await page.waitForURL(/\/caixa-auvo$/);
  const inbox = page.locator("section.auvo-inbox-panel");
  await expect(inbox).toBeVisible();
  await expect(inbox.getByRole("button", { name: "Novo" })).toBeVisible();
  await expect(inbox.getByRole("button", { name: "Processado" })).toBeVisible();
  await expect(inbox.getByRole("button", { name: "Descartado" })).toBeVisible();
});
