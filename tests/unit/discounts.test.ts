import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/server/auth/session", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  prisma: {
    discount: { findUnique },
  },
}));

import {
  calculateDiscount,
  normalizeCode,
  validateDiscountForSubtotal,
} from "@/server/discounts";

function discountRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "discount-1",
    code: "SUMMER20",
    type: "PERCENT",
    value: 20,
    minOrder: 0,
    maxDiscountAmount: null,
    usageLimit: null,
    usedCount: 0,
    expiresAt: null,
    isActive: true,
    ...overrides,
  };
}

beforeEach(() => {
  findUnique.mockReset();
});

describe("normalizeCode", () => {
  it("trims, uppercases and converts Persian and Arabic digits", () => {
    expect(normalizeCode("  summer۲۰  ")).toBe("SUMMER20");
    expect(normalizeCode(" کد١٢ ")).toBe("کد12");
  });
});

describe("calculateDiscount", () => {
  it("floors percent discounts", () => {
    expect(
      calculateDiscount(
        { type: "PERCENT", value: 15, maxDiscountAmount: null },
        1_234_567
      )
    ).toEqual({ ok: true, amount: 185_185 });
  });

  it("caps percent discounts with maxDiscountAmount", () => {
    expect(
      calculateDiscount(
        { type: "PERCENT", value: 20, maxDiscountAmount: 50_000 },
        1_000_000
      )
    ).toEqual({ ok: true, amount: 50_000 });
  });

  it("never exceeds the subtotal", () => {
    expect(
      calculateDiscount(
        { type: "PERCENT", value: 90, maxDiscountAmount: null },
        100_000
      )
    ).toEqual({ ok: true, amount: 90_000 });
    expect(
      calculateDiscount(
        { type: "FIXED", value: 200_000, maxDiscountAmount: null },
        100_000
      )
    ).toEqual({ ok: true, amount: 100_000 });
  });

  it("rejects invalid percent and fixed values", () => {
    expect(
      calculateDiscount(
        { type: "PERCENT", value: 0, maxDiscountAmount: null },
        100_000
      ).ok
    ).toBe(false);
    expect(
      calculateDiscount(
        { type: "PERCENT", value: 91, maxDiscountAmount: null },
        100_000
      ).ok
    ).toBe(false);
    expect(
      calculateDiscount(
        { type: "FIXED", value: 0, maxDiscountAmount: null },
        100_000
      ).ok
    ).toBe(false);
  });
});

describe("validateDiscountForSubtotal", () => {
  it("normalizes the code before lookup and returns the amount", async () => {
    findUnique.mockResolvedValue(discountRow());

    const result = await validateDiscountForSubtotal(" summer۲۰ ", 500_000);

    expect(findUnique).toHaveBeenCalledWith({
      where: { code: "SUMMER20" },
      select: expect.any(Object),
    });
    expect(result).toEqual({
      ok: true,
      discount: {
        id: "discount-1",
        code: "SUMMER20",
        type: "PERCENT",
        value: 20,
        maxDiscountAmount: null,
        usageLimit: null,
        usedCount: 0,
        amount: 100_000,
      },
    });
  });

  it("reports a missing code", async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      validateDiscountForSubtotal("NOPE", 500_000)
    ).resolves.toEqual({
      ok: false,
      message: "کد تخفیف پیدا نشد.",
    });
  });

  it("reports inactive and expired codes", async () => {
    findUnique.mockResolvedValue(discountRow({ isActive: false }));
    await expect(
      validateDiscountForSubtotal("SUMMER20", 500_000)
    ).resolves.toEqual({ ok: false, message: "این کد تخفیف غیرفعال است." });

    findUnique.mockResolvedValue(
      discountRow({ expiresAt: new Date("2020-01-01T00:00:00Z") })
    );
    await expect(
      validateDiscountForSubtotal("SUMMER20", 500_000)
    ).resolves.toEqual({ ok: false, message: "این کد تخفیف منقضی شده است." });
  });

  it("reports the missing amount for the minimum order", async () => {
    findUnique.mockResolvedValue(discountRow({ minOrder: 800_000 }));

    const result = await validateDiscountForSubtotal("SUMMER20", 500_000);

    expect(result.ok).toBe(false);

    if (result.ok) return;

    expect(result.message).toContain("۸۰۰٬۰۰۰");
    expect(result.message).toContain("۳۰۰٬۰۰۰");
  });

  it("reports an exhausted usage limit", async () => {
    findUnique.mockResolvedValue(
      discountRow({ usageLimit: 2, usedCount: 2 })
    );

    await expect(
      validateDiscountForSubtotal("SUMMER20", 500_000)
    ).resolves.toEqual({
      ok: false,
      message: "ظرفیت استفاده از این کد تخفیف تکمیل شده است.",
    });
  });
});
