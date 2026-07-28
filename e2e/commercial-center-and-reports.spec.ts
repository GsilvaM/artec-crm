import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test.describe("Central Comercial", () => {
  test("shows the redesigned commercial center with metrics, priority queue tabs and summary", async ({ page }) => {
    await loginAsHomologationGestor(page);

    await expect(page.getByRole("heading", { name: "Central Comercial", level: 1 })).toBeVisible();
    await expect(page.locator(".commercial-metrics-strip")).toBeVisible();

    const center = page.locator("section.commercial-center");
    await expect(center).toBeVisible();
    await expect(center.getByRole("heading", { name: "Prioridade agora" })).toBeVisible();
    await expect(center.getByRole("tab", { name: /Vencidas/ })).toBeVisible();
    await expect(center.getByRole("tab", { name: /Hoje/ })).toBeVisible();
    await expect(center.getByRole("heading", { name: "Agenda e visitas" })).toBeVisible();
    await expect(center.getByRole("heading", { name: "Resumo comercial" })).toBeVisible();
  });

  test("metric card click switches the priority queue tab and scrolls to it", async ({ page }) => {
    await loginAsHomologationGestor(page);
    const todayMetric = page.getByRole("button", { name: /Hoje/ }).first();
    await todayMetric.click();
    const todayTab = page.getByRole("tab", { name: /Hoje/ });
    await expect(todayTab).toHaveAttribute("aria-selected", "true");
  });

  test("filter drawer applies a stage filter and shows a removable chip", async ({ page }) => {
    await loginAsHomologationGestor(page);
    const toolbar = page.locator("section.commercial-filter-toolbar");
    await expect(toolbar).toBeVisible();

    await toolbar.getByRole("button", { name: /^Filtros/ }).click();
    const drawer = page.getByRole("dialog", { name: "Mais filtros" });
    await expect(drawer).toBeVisible();

    const stageSelect = drawer.getByLabel("Etapa");
    const options = await stageSelect.locator("option").all();
    const secondOption = await options[1]?.getAttribute("value");
    if (secondOption) {
      await stageSelect.selectOption(secondOption);
      await drawer.getByRole("button", { name: "Aplicar filtros" }).click();
      await expect(drawer).not.toBeVisible();
      const chips = page.locator(".active-filter-chips li");
      await expect(chips).toHaveCount(1);
      await chips.first().getByRole("button").click();
      await expect(chips).toHaveCount(0);
    }
  });

  test("Filtros button opens a drawer with the less common filters and applies them", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("button", { name: /^Filtros/ }).click();
    const drawer = page.getByRole("dialog", { name: "Mais filtros" });
    await expect(drawer).toBeVisible();
    await drawer.getByLabel(/Situ/).fill("aguardando cliente");
    await drawer.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(drawer).not.toBeVisible();
    await expect(page.locator(".active-filter-chips").getByText(/aguardando cliente/)).toBeVisible();
  });

  test("clearing filters from the drawer removes all chips", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("button", { name: /^Filtros/ }).click();
    const drawer = page.getByRole("dialog", { name: "Mais filtros" });
    await drawer.getByLabel(/Situ/).fill("aguardando cliente");
    await drawer.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page.locator(".active-filter-chips li")).toHaveCount(1);

    await page.getByRole("button", { name: /^Filtros/ }).click();
    await page.getByRole("dialog", { name: "Mais filtros" }).getByRole("button", { name: "Limpar filtros" }).click();
    await expect(page.locator(".active-filter-chips")).toHaveCount(0);
  });
});

test("shows the commercial reports dashboard with operational sections", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: /Relat/ }).click();
  await page.waitForURL(/\/relatorios$/);
  await expect(page.locator("section.reports-design-panel")).toBeVisible();
  await expect(page.getByLabel("Indicadores principais")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Evolução mensal")).toBeVisible();
  await expect(page.getByText("Motivos de perda")).toBeVisible();
  await expect(page.getByText("Funil por etapa")).toBeVisible();
  await expect(page.getByText("Triagem Auvo")).toBeVisible();
});
