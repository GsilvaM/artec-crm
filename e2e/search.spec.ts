import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("finds an existing customer via global search and opens its timeline", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByLabel("Buscar no CRM").fill("Homologacao");
  const dropdown = page.locator(".search-dropdown");
  await expect(dropdown).toBeVisible({ timeout: 15_000 });
  const firstResult = dropdown.locator(".search-dropdown-item").first();
  const label = await firstResult.locator("strong").textContent();
  await firstResult.click();
  await expect(dropdown).toHaveCount(0);
  await expect(page.locator(".drawer-header h2")).toContainText(label ?? "");
});
