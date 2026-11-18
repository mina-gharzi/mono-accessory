import { afterEach, describe, expect, it, vi } from "vitest";
import {
  containsPlaceholderWord,
  isPlaceholderAdminPassword,
} from "@/server/env";

const VALID_SECRET = "9f3a7c1b8e2d4f6a0b5c9d1e3f7a2b4c";

const validProductionEnv = {
  NODE_ENV: "production",
  AUTH_SECRET: VALID_SECRET,
  NEXT_PUBLIC_SITE_URL: "https://shop.example.com",
  DATABASE_URL: "postgresql://user:pass@db:5432/shop?sslmode=disable",
  PAYMENT_PROVIDER: "gateway",
};

/**
 * Load a fresh copy of the module so the warn-once flag does not leak between
 * tests, and apply the production environment the module reads at call time.
 */
async function loadEnvModule(env: Record<string, string | undefined>) {
  vi.resetModules();

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      vi.stubEnv(key, undefined as unknown as string);
    } else {
      vi.stubEnv(key, value);
    }
  }

  return import("@/server/env");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("containsPlaceholderWord", () => {
  it.each([
    "generate-a-secret-value-123456789",
    "please-change-this-secret-123456",
    "EXAMPLE-secret-value-1234567890",
    "secret-of-the-store-1234567890",
    "your-secret-value-123456789012",
    "random-secret-1234567890123456",
  ])("rejects the placeholder word in %s", (value) => {
    expect(containsPlaceholderWord(value)).toBe(true);
  });

  it("accepts a generated secret", () => {
    expect(containsPlaceholderWord(VALID_SECRET)).toBe(false);
  });
});

describe("isPlaceholderAdminPassword", () => {
  it.each([
    "password123",
    "Change-Me-Please",
    "your-password-123",
    "example-admin-pass",
    "secret-of-mono-1234",
  ])("rejects the placeholder password %s", (value) => {
    expect(isPlaceholderAdminPassword(value)).toBe(true);
  });

  it("accepts a real password", () => {
    expect(isPlaceholderAdminPassword("Mina-8472-strong")).toBe(false);
  });
});

describe("assertProductionEnvironment", () => {
  it("does nothing outside production", async () => {
    const env = await loadEnvModule({
      NODE_ENV: "test",
      AUTH_SECRET: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      DATABASE_URL: undefined,
    });

    expect(() => env.assertProductionEnvironment()).not.toThrow();
  });

  it("accepts a complete production environment", async () => {
    const env = await loadEnvModule(validProductionEnv);

    expect(() => env.assertProductionEnvironment()).not.toThrow();
  });

  it("rejects the example AUTH_SECRET", async () => {
    const env = await loadEnvModule({
      ...validProductionEnv,
      AUTH_SECRET: "generate-a-random-secret-of-at-least-32-characters",
    });

    expect(() => env.assertProductionEnvironment()).toThrow(/AUTH_SECRET/);
  });

  it("rejects an AUTH_SECRET that still contains a template word", async () => {
    const env = await loadEnvModule({
      ...validProductionEnv,
      AUTH_SECRET: "change-this-to-a-real-secret-value-123456",
    });

    expect(() => env.assertProductionEnvironment()).toThrow(/AUTH_SECRET/);
  });

  it("rejects a short AUTH_SECRET", async () => {
    const env = await loadEnvModule({
      ...validProductionEnv,
      AUTH_SECRET: "too-short",
    });

    expect(() => env.assertProductionEnvironment()).toThrow(/AUTH_SECRET/);
  });

  it("rejects a placeholder ADMIN_PASSWORD when it is present", async () => {
    const env = await loadEnvModule({
      ...validProductionEnv,
      ADMIN_PASSWORD: "change-me-please",
    });

    expect(() => env.assertProductionEnvironment()).toThrow(/ADMIN_PASSWORD/);
  });

  it("accepts a strong ADMIN_PASSWORD", async () => {
    const env = await loadEnvModule({
      ...validProductionEnv,
      ADMIN_PASSWORD: "Mina-8472-strong",
    });

    expect(() => env.assertProductionEnvironment()).not.toThrow();
  });

  it("rejects a non-HTTPS site URL", async () => {
    const env = await loadEnvModule({
      ...validProductionEnv,
      NEXT_PUBLIC_SITE_URL: "http://shop.example.com",
    });

    expect(() => env.assertProductionEnvironment()).toThrow(
      /NEXT_PUBLIC_SITE_URL/
    );
  });

  it("warns once about mock payments", async () => {
    const env = await loadEnvModule({
      ...validProductionEnv,
      PAYMENT_PROVIDER: "mock",
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    env.assertProductionEnvironment();
    env.assertProductionEnvironment();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/PAYMENT_PROVIDER/);
  });
});
