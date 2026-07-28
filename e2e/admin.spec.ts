import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test("gestor sees the administration panel reconstructed from the design reference", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await page.getByRole("link", { name: /Administra[cç][aã]o/i }).click();
  await page.waitForURL(/\/configuracoes\/administracao$/);

  const admin = page.locator("section.admin-panel");
  await expect(admin).toBeVisible();
  await expect(page.getByRole("heading", { name: "Administração", level: 1 })).toBeVisible();

  const stagesTab = admin.getByRole("tab", { name: "Etapas do funil" });
  const lossReasonsTab = admin.getByRole("tab", { name: "Motivos de perda" });
  const usersTab = admin.getByRole("tab", { name: "Usuários e permissões" });
  const integrationsTab = admin.getByRole("tab", { name: "Integrações" });

  await expect(stagesTab).toHaveAttribute("aria-selected", "true");
  await expect(admin.getByText("Etapas do funil comercial")).toBeVisible();
  await expect(admin.getByRole("button", { name: "Nova etapa" })).toBeVisible();

  await lossReasonsTab.click();
  await expect(lossReasonsTab).toHaveAttribute("aria-selected", "true");
  await expect(admin.getByRole("columnheader", { name: "Status" })).toBeVisible();

  await usersTab.click();
  await expect(usersTab).toHaveAttribute("aria-selected", "true");
  await expect(admin.getByRole("columnheader", { name: "Papel" })).toBeVisible();

  await integrationsTab.click();
  await expect(integrationsTab).toHaveAttribute("aria-selected", "true");
  await expect(admin.getByText("Integração Auvo")).toBeVisible();
});
