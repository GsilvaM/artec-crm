import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("opens a customer detail page from the list and sees related opportunities and timeline", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: "Clientes" }).click();
  await page.waitForURL(/\/clientes$/);

  const firstRow = page.locator("#clientes-section table tbody tr").first();
  const name = await firstRow.locator("td").first().innerText();
  await firstRow.getByRole("link", { name: "Abrir" }).click();
  await page.waitForURL(/\/clientes\/[0-9a-f-]+$/);

  await expect(page.getByRole("heading", { level: 1 })).toContainText(name.replace(/poss[ií]vel duplicidade/i, "").trim());
  await expect(page.getByText("Garantia, suporte e pós-venda")).toBeVisible();
  await expect(page.getByText("Linha do tempo comercial")).toBeVisible();
});
