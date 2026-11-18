import "dotenv/config";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { assertTestDatabase, describeDatabaseUrl } from "../test-database";

// .env holds the development connection strings. Playwright starts this script
// with DATABASE_URL already pointing at the test database, so the file is read
// directly to know which URLs must never be used.
function readEnvFile(): Record<string, string> {
  try {
    return parse(readFileSync(".env"));
  } catch {
    return {};
  }
}

const fileEnv = readEnvFile();

// Neon's pooled endpoint must not run migrations: Prisma takes a session-level
// advisory lock, and a pooler can hand that locked connection to the app,
// where it blocks every later migration. The direct host is the pooled host
// without the "-pooler" marker.
function toDirectUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hostname = parsed.hostname.replace("-pooler.", ".");

  return parsed.toString();
}

function guardEffectiveUrl(url: string | undefined): string {
  return assertTestDatabase({
    ...fileEnv,
    TEST_DATABASE_URL: url,
  });
}

const testDatabaseUrl = guardEffectiveUrl(
  process.env.TEST_DATABASE_URL ?? fileEnv.TEST_DATABASE_URL
);
const directTestUrl = guardEffectiveUrl(toDirectUrl(testDatabaseUrl));

// Both variables are set explicitly for every child: prisma.config.ts prefers
// DIRECT_DATABASE_URL, so leaving the development value from .env in place
// would migrate or seed the wrong database.
const prismaEnv: NodeJS.ProcessEnv = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
  DIRECT_DATABASE_URL: directTestUrl,
};

function run(
  label: string,
  command: string,
  args: string[],
  targetUrl: string
): void {
  // Playwright forwards stderr from the web server by default, so the target
  // stays visible in `npm run test:e2e` output.
  console.error(`[e2e] ${label}: ${describeDatabaseUrl(targetUrl)}`);

  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: prismaEnv,
    shell: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(
  "prisma migrate deploy",
  "npx",
  ["prisma", "migrate", "deploy"],
  directTestUrl
);
run("prisma db seed", "npx", ["prisma", "db", "seed"], testDatabaseUrl);
