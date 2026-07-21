import type { Page } from "@playwright/test";

export function requireE2eCredentials(): { email: string; password: string } {
  const email = process.env.EMAIL_LOGIN;
  const password = process.env.SENHA;
  if (!email || !password) {
    throw new Error("Defina EMAIL_LOGIN e SENHA (usuario real de homologacao) para rodar os testes E2E.");
  }
  return { email, password };
}

export async function loginAsHomologationGestor(page: Page): Promise<void> {
  const { email, password } = requireE2eCredentials();
  await page.goto("/");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: /Entrar no CRM/i }).click();
  await page.waitForSelector("text=Funil comercial", { timeout: 20_000 });
}
