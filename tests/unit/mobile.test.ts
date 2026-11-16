import { describe, expect, it } from "vitest";
import {
  mobileSchema,
  normalizeMobile,
  toEnglishDigits,
} from "@/server/auth/mobile";

describe("normalizeMobile", () => {
  it("accepts a plain 09 number", () => {
    expect(normalizeMobile("09123456789")).toBe("09123456789");
  });

  it("converts Persian digits", () => {
    expect(normalizeMobile("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
  });

  it("converts Arabic digits", () => {
    expect(normalizeMobile("٠٩١٢٣٤٥٦٧٨٩")).toBe("09123456789");
  });

  it("accepts the +98 prefix", () => {
    expect(normalizeMobile("+989123456789")).toBe("09123456789");
  });

  it("accepts the 0098 prefix", () => {
    expect(normalizeMobile("00989123456789")).toBe("09123456789");
  });

  it("accepts the bare 9 prefix", () => {
    expect(normalizeMobile("9123456789")).toBe("09123456789");
  });

  it("ignores spaces and dashes", () => {
    expect(normalizeMobile(" +98 912-345 6789 ")).toBe("09123456789");
    expect(normalizeMobile("۰۹۱۲-۳۴۵ ۶۷۸۹")).toBe("09123456789");
  });

  it("rejects invalid numbers", () => {
    expect(normalizeMobile("")).toBeNull();
    expect(normalizeMobile("08123456789")).toBeNull();
    expect(normalizeMobile("0912345678")).toBeNull();
    expect(normalizeMobile("091234567890")).toBeNull();
    expect(normalizeMobile("not-a-phone")).toBeNull();
  });

  it("keeps toEnglishDigits reversible for mixed text", () => {
    expect(toEnglishDigits("کد ۱۲۳ و ٤٥٦")).toBe("کد 123 و 456");
  });
});

describe("mobileSchema", () => {
  it("trims and normalizes a valid mobile", () => {
    const parsed = mobileSchema.safeParse(" ۰۹۱۲۳۴۵۶۷۸۹ ");

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toBe("09123456789");
  });

  it("returns an issue for an invalid mobile", () => {
    expect(mobileSchema.safeParse("123").success).toBe(false);
  });
});
