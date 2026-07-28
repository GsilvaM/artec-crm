import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

// WCAG 2.1 A/AA automated audit. Deliberately checks only the rule categories
// that automation can verify reliably; manual review still covers keyboard
// traps, focus order, and meaningful reading order (tracked in docs/ACCESSIBILITY-AUDIT.md).
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function authHeaders(page: Page): Promise<Record<string, string>> {
  const token = await page.evaluate(() => {
    const raw = window.localStorage.getItem("artec-crm.auth");
    if (!raw) return null;
    try {
      return (JSON.parse(raw) as { access_token?: string }).access_token ?? null;
    } catch {
      return null;
    }
  });
  expect(token).toBeTruthy();
  return { authorization: `Bearer ${token}`, "x-crm-include-test-fixtures": "true" };
}

async function createAccessibilityFixture(page: Page): Promise<{ customerId: string; opportunityId: string }> {
  const headers = await authHeaders(page);
  const suffix = Date.now().toString(36);
  const meResponse = await page.request.get("/api/me", { headers });
  expect(meResponse.ok()).toBeTruthy();
  const currentUserId = (await meResponse.json()).id as string;

  const customerResponse = await page.request.post("/api/customers", {
    headers,
    data: { tipoPessoa: "fisica", nome: `E2E A11y Cliente ${suffix}`, telefone: "11955550000" },
  });
  expect(customerResponse.ok()).toBeTruthy();
  const customerId = (await customerResponse.json()).customer.id as string;

  const opportunityResponse = await page.request.post("/api/opportunities", {
    headers,
    data: {
      clienteId: customerId,
      titulo: `E2E A11y Oportunidade ${suffix}`,
      tipoDemanda: "instalacao",
      responsavelId: currentUserId,
      situacao: "em andamento",
      proximaAcao: "Validar acessibilidade",
      proximaAcaoEm: "2026-08-01T10:00:00.000Z",
    },
  });
  expect(opportunityResponse.ok()).toBeTruthy();
  return { customerId, opportunityId: (await opportunityResponse.json()).opportunity.id as string };
}

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
    await page.locator("#clientes-section").waitFor();
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("proximas acoes page has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("link", { name: /Pr[oó]ximas A[cç][oõ]es/i }).click();
    await page.waitForURL(/\/proximas-acoes$/);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("opportunities list has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("link", { name: "Oportunidades" }).click();
    await page.waitForURL(/\/oportunidades$/);
    await page.locator("#oportunidades-section").waitFor();
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("opportunity detail page has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    const headers = await authHeaders(page);
    const fixture = await createAccessibilityFixture(page);
    try {
      await page.goto(`/oportunidades/${fixture.opportunityId}`);
      await page.waitForURL(/\/oportunidades\/[0-9a-f-]+$/);
      await page.waitForSelector("text=Linha do tempo");
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    } finally {
      await page.request.post(`/api/opportunities/${fixture.opportunityId}/archive`, { headers }).catch(() => undefined);
      await page.request.post(`/api/customers/${fixture.customerId}/archive`, { headers }).catch(() => undefined);
    }
  });

  test("customer detail page has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    const headers = await authHeaders(page);
    const fixture = await createAccessibilityFixture(page);
    try {
      await page.goto(`/clientes/${fixture.customerId}`);
      await page.waitForURL(/\/clientes\/[0-9a-f-]+$/);
      await page.getByRole("tablist").waitFor();
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    } finally {
      await page.request.post(`/api/opportunities/${fixture.opportunityId}/archive`, { headers }).catch(() => undefined);
      await page.request.post(`/api/customers/${fixture.customerId}/archive`, { headers }).catch(() => undefined);
    }
  });

  test("notificacoes page has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("link", { name: /Notifica[cç][oõ]es/i }).click();
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
    await page.getByRole("link", { name: /Relat[oó]rios/i }).click();
    await page.waitForURL(/\/relatorios$/);
    await page.waitForSelector("text=Funil por etapa");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("administracao page has no automatically detectable violations", async ({ page }) => {
    await loginAsHomologationGestor(page);
    await page.getByRole("link", { name: /Administra[cç][aã]o/i }).click();
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
    await page.getByRole("link", { name: /Integra[cç][aã]o Auvo/i }).click();
    await page.waitForURL(/\/configuracoes\/integracoes\/auvo$/);
    await page.waitForSelector("section.auvo-admin-design");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});

// Achado real da auditoria desta sessao: os testes acima nunca definem colorScheme,
// entao so validam o modo claro — "0 violacoes" nunca provou nada sobre o escuro.
// Cobertura de dark mode adicionada aqui apenas para a Central Comercial (escopo desta
// execucao); as demais paginas continuam sem essa cobertura e ficam como pendencia.
test.describe("WCAG automated audit — dark mode (Central Comercial)", () => {
  test.use({ colorScheme: "dark" });

  test("Central Comercial has no automatically detectable violations in dark mode", async ({ page }) => {
    await loginAsHomologationGestor(page);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
