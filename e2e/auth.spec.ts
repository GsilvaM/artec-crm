import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor, requireE2eCredentials } from "./support/auth";

test("logs in with real homologation credentials and reaches the authenticated shell", async ({ page }) => {
  await loginAsHomologationGestor(page);
  await expect(page.getByRole("heading", { name: "Central Comercial", level: 1 })).toBeVisible();
});

test("rejects an incorrect password without crashing the app", async ({ page }) => {
  const { email } = requireE2eCredentials();
  await page.goto("/");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("senha-incorreta-e2e-nao-existe");
  await page.getByRole("button", { name: /Entrar no CRM/i }).click();
  await expect(page.getByText("Erro ao entrar")).toBeVisible({ timeout: 15_000 });
});
