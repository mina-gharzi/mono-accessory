import { describe, expect, it } from "vitest";
import { assertTestDatabase } from "../test-database";

const DEV_DATABASE_URL =
  "postgresql://dev-user:secret@dev-pooler.example.com/neondb?sslmode=require";
const DEV_DIRECT_DATABASE_URL =
  "postgresql://dev-user:secret@dev.example.com/mono_test?sslmode=require";

describe("test database guard", () => {
  it("rejects a test URL that points at the development DIRECT_DATABASE_URL", () => {
    expect(() =>
      assertTestDatabase({
        TEST_DATABASE_URL: DEV_DIRECT_DATABASE_URL,
        DATABASE_URL: DEV_DATABASE_URL,
        DIRECT_DATABASE_URL: DEV_DIRECT_DATABASE_URL,
      })
    ).toThrow(/development DIRECT_DATABASE_URL/);
  });
});
