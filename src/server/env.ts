const MIN_AUTH_SECRET_LENGTH = 32;
export const MIN_ADMIN_PASSWORD_LENGTH = 10;

const EXAMPLE_AUTH_SECRET =
  "generate-a-random-secret-of-at-least-32-characters";

// Substrings that mark an unedited template value. The production seed uses
// the same list so both checks reject the same placeholders.
const PLACEHOLDER_WORDS = [
  "change",
  "example",
  "generate",
  "random-secret",
  "secret-of",
  "your-",
] as const;

// Exact passwords that are documented placeholders.
export const PLACEHOLDER_ADMIN_PASSWORDS: ReadonlySet<string> = new Set([
  "admin",
  "admin123",
  "admin1234",
  "administrator",
  "at-least-10-characters-not-a-placeholder",
  "change-me",
  "change-me-please",
  "change_me",
  "changeme",
  "choose-a-strong-password",
  "password",
  "password123",
  "password1234",
  "placeholder",
  "replace-me",
  "replace-with-a-strong-password",
  "replace_me",
  "secret",
  "secret123",
  "your-password",
  "your_password",
]);

export function containsPlaceholderWord(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return PLACEHOLDER_WORDS.some((word) => normalized.includes(word));
}

export function isPlaceholderAdminPassword(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return (
    PLACEHOLDER_ADMIN_PASSWORDS.has(normalized) ||
    containsPlaceholderWord(normalized)
  );
}

let mockPaymentWarningLogged = false;

function fail(message: string): never {
  throw new Error(`Production configuration error: ${message}`);
}

function assertAuthSecret(): void {
  const secret = process.env.AUTH_SECRET?.trim();

  if (!secret || secret.length < MIN_AUTH_SECRET_LENGTH) {
    fail(
      `AUTH_SECRET must be set and at least ${MIN_AUTH_SECRET_LENGTH} characters long.`
    );
  }

  if (
    secret.toLowerCase() === EXAMPLE_AUTH_SECRET ||
    containsPlaceholderWord(secret)
  ) {
    fail(
      "AUTH_SECRET is still a placeholder. Generate a real secret with `openssl rand -base64 48`."
    );
  }
}

function assertAdminPassword(): void {
  const password = process.env.ADMIN_PASSWORD?.trim();

  // Only the production seed requires ADMIN_PASSWORD. When it is present in
  // the app environment, reject template values so they cannot be deployed.
  if (!password) return;

  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    fail(
      `ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters long.`
    );
  }

  if (isPlaceholderAdminPassword(password)) {
    fail("ADMIN_PASSWORD is an obvious placeholder. Choose a real password.");
  }
}

function assertSiteUrl(): void {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!value) {
    fail(
      "NEXT_PUBLIC_SITE_URL must be set to the public HTTPS origin at build time."
    );
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    fail("NEXT_PUBLIC_SITE_URL must be a valid absolute URL.");
  }

  if (url.protocol !== "https:") {
    fail("NEXT_PUBLIC_SITE_URL must use https in production.");
  }
}

function assertDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    fail("DATABASE_URL must be set.");
  }
}

function warnAboutMockPayments(): void {
  const provider = process.env.PAYMENT_PROVIDER?.trim().toLowerCase() || "mock";

  if (provider !== "mock" || mockPaymentWarningLogged) {
    return;
  }

  mockPaymentWarningLogged = true;
  console.warn(
    "[env] WARNING: PAYMENT_PROVIDER is \"mock\". Mock payments do not charge customers. " +
      "Replace the payment provider before accepting real orders."
  );
}

/**
 * Fail fast on missing production configuration. Called once from the Next.js
 * instrumentation hook, before the server starts handling requests. Skipped in
 * development and tests.
 */
export function assertProductionEnvironment(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  assertAuthSecret();
  assertAdminPassword();
  assertSiteUrl();
  assertDatabaseUrl();
  warnAboutMockPayments();
}
