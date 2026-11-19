import "dotenv/config";
import os from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { assertTestDatabase } from "./tests/test-database";

// Refuse to start E2E unless TEST_DATABASE_URL is a disposable database.
const testDatabaseUrl = assertTestDatabase(process.env);

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

// Uploads must not land in the development uploads directory. Playwright
// evaluates this file in more than one process, so the path is fixed instead
// of random: every process must agree on the directory the server writes to.
// globalTeardown removes it afterwards.
const uploadDir = path.join(os.tmpdir(), "mono-accessory-e2e-uploads");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  metadata: { uploadDir },
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // The project builds with `output: "standalone"`, so `next start` warns and
    // does not serve the build correctly; use the standalone launcher instead.
    command:
      "npm run test:e2e:db && npm run build && npm run start:standalone",
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
      UPLOAD_DIR: uploadDir,
    },
  },
});
