/// <reference lib="dom" />
import { expect, test } from "@playwright/test";
import { loginAsHomologationGestor } from "./support/auth";

// Section 13 of the design refactor prompt requires validating layout at a
// minimum set of viewports and guaranteeing no accidental horizontal
// overflow (internal scrollable containers like .table-wrap are fine; the
// page itself must never grow wider than the viewport).
const VIEWPORTS = [
  { name: "mobile-360x800", width: 360, height: 800 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "tablet-1024x768", width: 1024, height: 768 },
  { name: "desktop-1366x768", width: 1366, height: 768 },
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "desktop-1920x1080", width: 1920, height: 1080 },
];

const PAGES = [
  { label: "Central Comercial", linkName: "Central Comercial", urlPattern: /\/central-comercial$/ },
  { label: "Funil", linkName: "Funil", urlPattern: /\/pipeline$/ },
  { label: "Clientes", linkName: "Clientes", urlPattern: /\/clientes$/ },
  { label: "Oportunidades", linkName: "Oportunidades", urlPattern: /\/oportunidades$/ },
  { label: "Próximas ações", linkName: "Próximas ações", urlPattern: /\/proximas-acoes$/ },
];

for (const viewport of VIEWPORTS) {
  test.describe(`Responsividade sem overflow horizontal acidental — ${viewport.name}`, () => {
    // Definido via test.use (viewport de contexto) em vez de
    // page.setViewportSize em runtime: setar o viewport so depois da
    // primeira navegacao nao sincroniza de forma confiavel com a avaliacao
    // inicial de @media/CSSOM no Chromium, o que fazia o botao do menu
    // mobile parecer "fora do viewport" de forma intermitente.
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    // Abaixo de 768px a sidebar vira drawer fechado por padrao (secao 13).
    // Decidido pela largura do viewport (conhecida e fixa por bloco via
    // test.use), nao por uma checagem de visibilidade em runtime — isVisible()
    // nao espera/reconsulta como toBeVisible(), e pode capturar um instante
    // transitorio da renderizacao e responder de forma inconsistente.
    const isMobileLayout = viewport.width <= 767;

    test("sem overflow horizontal", async ({ page }) => {
      await loginAsHomologationGestor(page);

      for (const target of PAGES) {
        if (isMobileLayout) {
          await page.getByRole("button", { name: "Abrir menu de navegação" }).click();
          await expect(page.getByRole("link", { name: target.linkName })).toBeVisible();
        }

        await page.getByRole("link", { name: target.linkName }).click();
        await page.waitForURL(target.urlPattern);
        await page.waitForLoadState("networkidle");

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${target.label} @ ${viewport.name} nao deve ter overflow horizontal (scrollWidth - innerWidth = ${overflow})`).toBeLessThanOrEqual(1);
      }
    });
  });
}
