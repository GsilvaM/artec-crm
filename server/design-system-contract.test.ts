import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

function readProjectFile(pathFromRoot: string): string {
  return readFileSync(new URL(`../${pathFromRoot}`, import.meta.url), "utf8");
}

describe("Artec visual contract", () => {
  test("keeps the operational Artec dashboard tokens aligned with the reference screens", () => {
    const css = readProjectFile("src/styles.css");

    expect(css).toContain("--brand: oklch(0.42 0.15 265);");
    expect(css).toContain("--brand-hover: oklch(0.36 0.16 265);");
    expect(css).toContain("grid-template-columns: 236px minmax(0, 1fr);");
    expect(css).toContain("background: #294da7;");
    expect(css).toContain("background: #f5f7fb;");
    expect(css).toContain("border-radius: 8px;");

    expect(css).not.toContain("gradient orb");
    expect(css).not.toContain("--action-primary-base: var(--venture-blue");
  });

  test("documents the active product and design direction", () => {
    const designSystem = readProjectFile("docs/DESIGN-SYSTEM.md");
    const productSpec = readProjectFile("docs/PRODUCT-SPEC.md");

    expect(designSystem).toContain("dashboard operacional com sidebar azul");
    expect(designSystem).toContain("Mobile deve esconder sidebar");
    expect(designSystem).toContain("Metric cards com pill colorido acima do numero.");
    expect(productSpec).toContain("Garantia, suporte e pos-venda pertencem ao historico do cliente");
    expect(productSpec).toContain("Nada deve ser classificado silenciosamente.");
  });

  test("keeps homologation gates explicit for real-user validation", () => {
    const runbook = readProjectFile("docs/HOMOLOGATION-RUNBOOK.md");

    expect(runbook).toContain("Para E2E, definir `EMAIL_LOGIN` e `SENHA`.");
    expect(runbook).toContain("ausencia de overflow horizontal em desktop e mobile");
    expect(runbook).toContain("npm run typecheck");
    expect(runbook).toContain("npm run build:frontend");
  });
});
