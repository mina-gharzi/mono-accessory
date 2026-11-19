import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-redirect";
import { passwordSchema } from "@/server/auth/password";

describe("passwordSchema", () => {
  it("accepts a password with a letter and a digit", () => {
    expect(passwordSchema.safeParse("secret12").success).toBe(true);
  });

  it("accepts exactly 72 characters", () => {
    expect(passwordSchema.safeParse(`${"a".repeat(71)}1`).success).toBe(true);
  });

  it("rejects short passwords", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false);
  });

  it("rejects passwords without a digit", () => {
    expect(passwordSchema.safeParse("abcdefgh").success).toBe(false);
  });

  it("rejects passwords without a letter", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
  });

  it("rejects passwords longer than 72 characters", () => {
    expect(passwordSchema.safeParse(`${"a".repeat(72)}1`).success).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("keeps same-site paths and their query string", () => {
    expect(safeNextPath("/shop")).toBe("/shop");
    expect(safeNextPath("/shop?page=2&sort=price-asc")).toBe(
      "/shop?page=2&sort=price-asc"
    );
    expect(safeNextPath("/account/orders/MN-260101-00001")).toBe(
      "/account/orders/MN-260101-00001"
    );
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeNextPath("//evil.com")).toBe("/shop");
    expect(safeNextPath("https://evil.com")).toBe("/shop");
    expect(safeNextPath("http://evil.com/shop")).toBe("/shop");
    expect(safeNextPath("/\\evil.com")).toBe("/shop");
  });

  it("rejects empty values", () => {
    expect(safeNextPath("")).toBe("/shop");
    expect(safeNextPath(null)).toBe("/shop");
    expect(safeNextPath(undefined)).toBe("/shop");
  });

  it("rejects the auth pages", () => {
    expect(safeNextPath("/login")).toBe("/shop");
    expect(safeNextPath("/login?next=/shop")).toBe("/shop");
    expect(safeNextPath("/register")).toBe("/shop");
  });

  it("uses a custom fallback", () => {
    expect(safeNextPath("//evil.com", "/cart")).toBe("/cart");
  });
});
