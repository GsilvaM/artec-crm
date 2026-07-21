import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("gestor sees the Proximas Acoes page with filter tabs", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: "Proximas acoes" }).click();
  await page.waitForURL(/\/proximas-acoes$/);
  await expect(page.getByRole("heading", { name: "Proximas acoes", level: 1 })).toBeVisible();
  const filters = page.locator(".segmented-control");
  await expect(filters.getByText("Vencidas")).toBeVisible();
  await expect(filters.getByText("Concluidas")).toBeVisible();
});
