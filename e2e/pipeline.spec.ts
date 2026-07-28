import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("gestor sees the pipeline as an operational kanban with persisted move controls", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: "Funil" }).click();
  await page.waitForURL(/\/pipeline$/);

  await expect(page.getByLabel("Board operacional do funil")).toBeVisible();
  await expect(page.getByLabel("Funil comercial por etapa")).toBeVisible();
  expect(await page.locator(".pipeline-column").count()).toBeGreaterThan(1);
  await expect(page.locator(".pipeline-card-move select").first()).toBeVisible();
});

for (const viewport of [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "desktop-1366", width: 1366, height: 768 },
]) {
  test(`Pipeline board stays inside the viewport on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await loginAsHomologationGestor(page);
    await page.goto("/pipeline");
    await page.getByLabel("Board operacional do funil").waitFor();
    await page.getByLabel("Funil comercial por etapa").waitFor();

    const overflow = await page.evaluate(() => {
      const board = document.querySelector(".pipeline-board");
      const boardRight = board?.getBoundingClientRect().right ?? window.innerWidth;
      return {
        page: document.body.getBoundingClientRect().right - window.innerWidth,
        boardRight: boardRight - window.innerWidth,
      };
    });

    expect(overflow.page, `${viewport.name} nao deve ter overflow horizontal fora de containers internos`).toBeLessThanOrEqual(1);
    expect(overflow.boardRight, `${viewport.name} board deve ficar enquadrado no viewport`).toBeLessThanOrEqual(1);
  });
}
