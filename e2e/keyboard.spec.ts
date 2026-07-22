import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

test.describe("Navegacao por teclado e gerenciamento de foco", () => {
  test("sidebar links sao alcancaveis e ativaveis via teclado", async ({ page }) => {
    await loginAsHomologationGestor(page);
    const clientesLink = page.getByRole("link", { name: "Clientes" });
    await clientesLink.focus();
    await expect(clientesLink).toBeFocused();
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/clientes$/);
  });

  test("painel de notificacoes recebe foco ao abrir e devolve foco ao fechar com Escape", async ({ page }) => {
    await loginAsHomologationGestor(page);
    const bellButton = page.getByRole("button", { name: "Abrir notificacoes" });
    await bellButton.click();
    await expect(bellButton).toHaveAttribute("aria-expanded", "true");

    const panel = page.getByRole("dialog", { name: "Notificacoes recentes" });
    await expect(panel).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(panel).not.toBeVisible();
    await expect(bellButton).toBeFocused();
  });
});
