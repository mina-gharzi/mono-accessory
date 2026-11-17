import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  prisma: {},
}));

vi.mock("@/server/products", () => ({
  toEnglishDigits: (value: string) =>
    value
      .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
      .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660)),
}));

import { reviewSubmissionSchema } from "@/server/reviews";

function parse(input: unknown) {
  return reviewSubmissionSchema.safeParse(input);
}

describe("reviewSubmissionSchema", () => {
  it("accepts an integer rating and trims the comment", () => {
    const result = parse({
      rating: 4,
      comment: "  کیفیت خیلی خوب بود  ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.rating).toBe(4);
      expect(result.data.comment).toBe("کیفیت خیلی خوب بود");
    }
  });

  it("accepts a numeric string and Persian digits for the rating", () => {
    expect(
      parse({ rating: "5", comment: "خیلی خوب و خوش‌ساخته" }).success
    ).toBe(true);
    expect(
      parse({ rating: "۴", comment: "خیلی خوب و خوش‌ساخته" }).success
    ).toBe(true);
  });

  it.each([0, 6, 2.5, "abc", null, undefined])(
    "rejects an invalid rating: %s",
    (rating) => {
      expect(
        parse({ rating, comment: "خیلی خوب و خوش‌ساخته" }).success
      ).toBe(false);
    }
  );

  it("rejects a comment shorter than 10 characters after trimming", () => {
    expect(parse({ rating: 5, comment: "   خوب بود  " }).success).toBe(false);
  });

  it("rejects a comment longer than 1000 characters", () => {
    expect(parse({ rating: 5, comment: "ا".repeat(1001) }).success).toBe(false);
  });

  it("requires a comment", () => {
    expect(parse({ rating: 5 }).success).toBe(false);
  });
});
