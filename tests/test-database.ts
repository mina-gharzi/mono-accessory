const TEST_MARKER = /test/i;

function readDatabaseName(url: URL): string {
  return url.pathname.replace(/^\//, "");
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
 * test URL is missing, equals the development URL, or does not look disposable.
 */
export function assertTestDatabase(
  env: Record<string, string | undefined>
): string {
  const testUrl = assertTestDatabaseUrl(env.TEST_DATABASE_URL);

  if (env.DATABASE_URL?.trim() === testUrl) {
    throw new Error(
      "Refusing to run: TEST_DATABASE_URL must not equal DATABASE_URL."
    );
  }

  return testUrl;
}
