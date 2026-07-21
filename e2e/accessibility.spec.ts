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
});
