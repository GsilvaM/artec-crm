// Verificacao de instalabilidade PWA equivalente ao essencial do Lighthouse,
// sem adicionar Lighthouse como dependencia — reusa o Chromium do Playwright
// (ja instalado para E2E) contra o build de producao real.
//
// Uso: npm run build && npx vite preview --port 4173 (em outro terminal) && node scripts/check-pwa.mjs
import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(String(err)));

await page.goto("http://localhost:4173/");
await page.waitForTimeout(1500);

const manifestLink = await page.locator('link[rel="manifest"]').getAttribute("href");
const themeColor = await page.locator('meta[name="theme-color"]').getAttribute("content");
const appleTouchIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");

const swRegistered = await page.evaluate(async () => {
  if (!("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  return Boolean(registration);
});

console.log(JSON.stringify({ manifestLink, themeColor, appleTouchIcon, swRegistered, consoleErrors }, null, 2));

await browser.close();
