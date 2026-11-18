import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { assertTestDatabase } from "./tests/test-database";

// Refuse to start E2E unless TEST_DATABASE_URL is a disposable database.
const testDatabaseUrl = assertTestDatabase(process.env);

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run test:e2e:db && npm run build && npm run start",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 600_000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      E2E_BASE_URL: baseURL,
      // Production startup requires an https site URL and Next.js inlines this
      // value at build time. The tests navigate with the http baseURL, so only
      // absolute metadata URLs see this origin.
      NEXT_PUBLIC_SITE_URL: "https://localhost:3000",
    },
  },
});
