import "dotenv/config";
import { spawnSync } from "node:child_process";
import { assertTestDatabaseUrl } from "../test-database";

// The web server is started with DATABASE_URL already pointing at the test
// database, so validate that URL itself before migrating and seeding it.
const databaseUrl = assertTestDatabaseUrl(process.env.DATABASE_URL);

// Neon's pooled endpoint must not run migrations: Prisma takes a session-level
// advisory lock, and a pooler can hand that locked connection to the app,
// where it blocks every later migration. The direct host is the pooled host
// without the "-pooler" marker.
function toDirectUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hostname = parsed.hostname.replace("-pooler.", ".");

  return parsed.toString();
}

const migrationUrl = assertTestDatabaseUrl(toDirectUrl(databaseUrl));

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: migrationUrl },
    shell: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npx", ["prisma", "migrate", "deploy"]);
run("npx", ["prisma", "db", "seed"]);
