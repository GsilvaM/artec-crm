import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const svgSource = readFileSync(resolve(projectRoot, "public/icons/icon-source.svg"), "utf8");
const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgSource).toString("base64")}`;

const sizes = [512, 384, 192, 180, 152, 144, 32];

const browser = await chromium.launch();
for (const size of sizes) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><body style="margin:0"><img src="${svgDataUrl}" width="${size}" height="${size}" /></body></html>`);
  await page.waitForTimeout(50);
  const buffer = await page.screenshot({ omitBackground: false });
  writeFileSync(resolve(projectRoot, `public/icons/icon-${size}.png`), buffer);
  await page.close();
  console.log(`generated icon-${size}.png`);
}
await browser.close();
