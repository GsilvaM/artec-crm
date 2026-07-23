import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

// A Administracao usa abas (Etapas/Motivos de perda/Usuarios) desde a
// migracao para o design system Venture — apenas o conteudo da aba ativa
// fica visivel por vez (nao mais 3 tabelas empilhadas simultaneamente).
test("gestor sees the administration panel with stages, loss reasons and users tabs", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: "Administração" }).click();
  await page.waitForURL(/\/configuracoes\/administracao$/);
  const admin = page.locator("section.admin-panel");
  await expect(admin).toBeVisible();

  const stagesTab = admin.getByRole("tab", { name: "Etapas" });
  const lossReasonsTab = admin.getByRole("tab", { name: "Motivos de perda" });
  const usersTab = admin.getByRole("tab", { name: "Usuários" });
  await expect(stagesTab).toHaveAttribute("aria-selected", "true");
  await expect(admin.getByRole("columnheader", { name: "Ordem" })).toBeVisible();

  await lossReasonsTab.click();
  await expect(lossReasonsTab).toHaveAttribute("aria-selected", "true");
  await expect(admin.getByRole("columnheader", { name: "Status" })).toBeVisible();

  await usersTab.click();
  await expect(usersTab).toHaveAttribute("aria-selected", "true");
  await expect(admin.getByRole("columnheader", { name: "Papel" })).toBeVisible();
});
