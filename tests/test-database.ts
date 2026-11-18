const TEST_MARKER = /test/i;
const DEFAULT_PORT = "5432";

function readDatabaseName(url: URL): string {
  return url.pathname.replace(/^\//, "");
}

function databaseIdentity(url: URL): string {
  return `${url.hostname}:${url.port || DEFAULT_PORT}/${readDatabaseName(url)}`;
}

function isSameDatabase(a: URL, b: URL): boolean {
  return databaseIdentity(a) === databaseIdentity(b);
}

/**
 * Host and database name only, never credentials. Used in logs and error
 * messages.
 */
export function describeDatabaseUrl(value: string): string {
  const parsed = new URL(value);

  return `"${readDatabaseName(parsed)}" on "${parsed.hostname}"`;
}

/**
 * Refuses to run against anything that does not look like a disposable
 * database: the URL must be set and its host or database name must contain
 * "test". Shared by the integration tests and the E2E runner.
 */
export function assertTestDatabaseUrl(value: string | undefined): string {
  const url = value?.trim();

  if (!url) {
    throw new Error("TEST_DATABASE_URL must be set to a disposable test database.");
  }

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("TEST_DATABASE_URL is not a valid PostgreSQL URL.");
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("TEST_DATABASE_URL must use the postgresql:// protocol.");
  }

  const databaseName = readDatabaseName(parsed);

  if (!TEST_MARKER.test(databaseName) && !TEST_MARKER.test(parsed.hostname)) {
    throw new Error(
      `Refusing to run: TEST_DATABASE_URL points at "${databaseName}" on "${parsed.hostname}", which does not contain "test".`
    );
  }

  return url;
}

/**
 * Full guard for processes that still know both URLs. Refuses to run when the
 * test URL is missing, does not look disposable, or targets the same database
 * as the development DATABASE_URL or DIRECT_DATABASE_URL.
 */
export function assertTestDatabase(
  env: Record<string, string | undefined>
): string {
  const testUrl = assertTestDatabaseUrl(env.TEST_DATABASE_URL);
  const testTarget = new URL(testUrl);

  const developmentUrls = {
    DATABASE_URL: env.DATABASE_URL,
    DIRECT_DATABASE_URL: env.DIRECT_DATABASE_URL,
  };

  for (const [name, value] of Object.entries(developmentUrls)) {
    const developmentUrl = value?.trim();

    if (!developmentUrl) continue;

    let developmentTarget: URL;

    try {
      developmentTarget = new URL(developmentUrl);
    } catch {
      continue;
    }

    if (isSameDatabase(developmentTarget, testTarget)) {
      throw new Error(
        `Refusing to run: the test database ${describeDatabaseUrl(testUrl)} is the development ${name}.`
      );
    }
  }

  return testUrl;
}
