import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("gestor sees the Proximas Acoes queue reconstructed from the design reference", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: /Pr[oó]ximas A[cç][oõ]es/i }).click();
  await page.waitForURL(/\/proximas-acoes$/);

  await expect(page.getByRole("heading", { name: /Pr[oó]ximas A[cç][oõ]es/i, level: 1 })).toBeVisible();
  await expect(page.getByText("Sua fila comercial organizada por prazo.")).toBeVisible();
  await expect(page.getByLabel("Fila de próximas ações")).toBeVisible();

  const tabs = page.getByLabel("Filtrar próximas ações");
  await expect(tabs.getByRole("button", { name: /Minha fila/i })).toHaveClass(/active/);
  await expect(tabs.getByRole("button", { name: /Equipe/i })).toBeVisible();
  await expect(tabs.getByRole("button", { name: /Agenda/i })).toBeVisible();
  await expect(tabs.getByRole("button", { name: /Concluídas/i })).toBeVisible();

  await tabs.getByRole("button", { name: /Equipe/i }).click();
  await expect(page.getByLabel("Atrasadas")).toBeVisible();
  await expect(page.getByLabel("Hoje")).toBeVisible();
  await expect(page.getByLabel("Amanhã e esta semana")).toBeVisible();
  await expect(page.getByLabel("Sem data definida")).toBeVisible();

  await page.getByRole("button", { name: "Filtros" }).click();
  await expect(page.getByLabel("Categoria")).toBeVisible();
  await expect(page.getByLabel("Prioridade")).toBeVisible();
  await page.getByLabel("Categoria").selectOption("support");
  await expect(page.getByLabel("Categoria")).toHaveValue("support");

  await page.getByLabel("Categoria").selectOption("all");
  const completeButtons = page.getByRole("button", { name: "Concluir" });
  const completeCount = await completeButtons.count();
  test.skip(completeCount === 0, "Nenhuma próxima ação pendente para testar a operação de conclusão.");

  await completeButtons.first().click();
  await expect(page.getByLabel("Atalhos de resultado")).toBeVisible();
  await page.getByLabel("Atalhos de resultado").getByRole("button", { name: "Cliente respondeu" }).click();
  await expect(page.getByRole("textbox", { name: "Resultado" })).toHaveValue("Cliente respondeu");
  await page.getByRole("button", { name: "Cancelar" }).last().click();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `Proximas Acoes nao deve ter overflow horizontal (scrollWidth - innerWidth = ${overflow})`).toBeLessThanOrEqual(1);
});

for (const viewport of [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "desktop-1366", width: 1366, height: 768 },
]) {
  test(`Proximas Acoes queue stays inside the viewport on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await loginAsHomologationGestor(page);
    await page.goto("/proximas-acoes");
    await page.getByLabel("Fila de próximas ações").waitFor();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${viewport.name} nao deve ter overflow horizontal`).toBeLessThanOrEqual(1);
  });
}
