import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

function readProjectFile(pathFromRoot: string): string {
  return readFileSync(new URL(`../${pathFromRoot}`, import.meta.url), "utf8");
}

describe("Venture visual contract", () => {
  test("keeps primary/action tokens neutral instead of decorative blue", () => {
    const css = readProjectFile("src/styles.css");

    expect(css).toContain("--action-primary-base: var(--venture-neutral-90);");
    expect(css).toContain("--action-primary-hover: var(--venture-neutral-100);");
    expect(css).toContain("--action-primary-active: var(--venture-neutral-100);");
    expect(css).toContain("--primary-container: var(--venture-neutral-30);");
    expect(css).toContain("--color-primary: var(--venture-neutral-20);");
    expect(css).toContain("--primary-container: var(--venture-neutral-80);");

    expect(css).not.toContain("primary do CRM usa a familia Blue");
    expect(css).not.toContain("interface \"colorida, mas profissional\"");
    expect(css).not.toContain("--action-primary-base: var(--venture-blue");
  });

  test("keeps agents aligned to strict Venture adherence", () => {
    const designAgent = readProjectFile(".claude/agents/artec-design-system-engineer.md");
    const frontendAgent = readProjectFile(".claude/agents/artec-frontend-agent.md");
    const pageAgent = readProjectFile(".claude/agents/artec-page-specialists.md");

    expect(designAgent).toContain("O visual do CRM deve seguir estritamente o Venture CRM Dashboard UI Kit.");
    expect(designAgent).toContain("Nao propor nem aceitar uma interface \"mais colorida\"");
    expect(frontendAgent).toContain("Toda mudanca visual deve respeitar estritamente o Venture CRM Dashboard UI Kit");
    expect(pageAgent).toContain("O Venture e a referencia visual estrita para todas as paginas");
  });

  test("keeps agents aligned to no-scroll intelligent board UX", () => {
    const productAgent = readProjectFile(".claude/agents/artec-crm-product-architect.md");
    const frontendAgent = readProjectFile(".claude/agents/artec-frontend-agent.md");
    const pageAgent = readProjectFile(".claude/agents/artec-page-specialists.md");
    const qaAgent = readProjectFile(".claude/agents/artec-qa-release-guardian.md");
    const adr = readProjectFile("docs/adr/ADR-0004-ux-sem-scroll-board-inteligente.md");

    expect(productAgent).toContain("CRM de board/kanban inteligente");
    expect(frontendAgent).toContain("Telas operacionais devem ser desenhadas como board/kanban inteligente sem scroll global como padrao.");
    expect(pageAgent).toContain("A experiencia alvo e sem scroll global nas telas operacionais.");
    expect(qaAgent).toContain("telas operacionais sem scroll global como padrao");
    expect(adr).toContain("Card so deve avancar por mudanca real persistida");
  });
});
