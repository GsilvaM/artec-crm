import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

// WCAG 2.1 A/AA automated audit. Deliberately checks only the rule categories
// that automation can verify reliably; manual review still covers keyboard
// traps, focus order, and meaningful reading order (tracked in docs/ACCESSIBILITY-AUDIT.md).
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.describe("WCAG automated audit", () => {
  test("login screen has no automatically detectable violations", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=E-mail");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("main authenticated screen (Central Comercial) has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("clientes list has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("link", { name: "Clientes" }).click();
    await page.waitForURL(/\/clientes$/);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("proximas acoes page has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("link", { name: "Próximas ações" }).click();
    await page.waitForURL(/\/proximas-acoes$/);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("opportunity detail page has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("link", { name: "Oportunidades" }).click();
    await page.waitForURL(/\/oportunidades$/);
    await page.locator("#oportunidades-section table tbody tr").first().getByRole("link", { name: "Abrir" }).click();
    await page.waitForURL(/\/oportunidades\/[0-9a-f-]+$/);
    await page.waitForSelector("text=Linha do tempo");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("customer detail page has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("link", { name: "Clientes" }).click();
    await page.waitForURL(/\/clientes$/);
    await page.locator("#clientes-section table tbody tr").first().getByRole("link", { name: "Abrir" }).click();
    await page.waitForURL(/\/clientes\/[0-9a-f-]+$/);
    await page.waitForSelector("text=Linha do tempo comercial");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("notificacoes page has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("link", { name: "Notificações" }).click();
    await page.waitForURL(/\/notificacoes$/);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("pipeline board has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("link", { name: "Funil" }).click();
    await page.waitForURL(/\/pipeline$/);
    await page.waitForSelector(".pipeline-board");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("relatorios page has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("link", { name: "Relatórios" }).click();
    await page.waitForURL(/\/relatorios$/);
    await page.waitForSelector("text=Oportunidades por etapa");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("administracao page has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("link", { name: "Administração" }).click();
    await page.waitForURL(/\/configuracoes\/administracao$/);
    await page.waitForSelector("section.admin-panel");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("caixa auvo page has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("link", { name: "Caixa Auvo" }).click();
    await page.waitForURL(/\/caixa-auvo$/);
    await page.waitForSelector("section.auvo-inbox-panel");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("integracao auvo page has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("link", { name: "Integração Auvo" }).click();
    await page.waitForURL(/\/configuracoes\/integracoes\/auvo$/);
    await page.waitForSelector("section.auvo-admin");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
