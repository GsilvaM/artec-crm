import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.CRM_E2E_BASE_URL ?? "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Os specs operam inteiramente sobre dados de fixture (ver migration 0017); sem este
    // header eles ficariam invisiveis nas mesmas vistas operacionais que um usuario real usa.
    extraHTTPHeaders: { "x-crm-include-test-fixtures": "true" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.CRM_E2E_BASE_URL
    ? undefined
    : [
        {
          command: "npm run dev:server",
          port: 4100,
          reuseExistingServer: true,
          timeout: 30_000,
        },
        {
          command: "npm run dev:frontend",
          port: 3100,
          reuseExistingServer: true,
          timeout: 30_000,
        },
      ],
});
