import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("opens an opportunity detail page from the list and sees its summary and timeline", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: "Oportunidades" }).click();
  await page.waitForURL(/\/oportunidades$/);

  const firstRow = page.locator("#oportunidades-section table tbody tr").first();
  const title = await firstRow.locator("td").first().innerText();
  await firstRow.getByRole("link", { name: "Abrir" }).click();
  await page.waitForURL(/\/oportunidades\/[0-9a-f-]+$/);

  await expect(page.getByRole("heading", { level: 1 })).toContainText(title.trim());
  await expect(page.getByText("Linha do tempo")).toBeVisible();
});
