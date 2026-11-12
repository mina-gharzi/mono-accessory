import { z } from "zod";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toEnglishDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(digit);

    if (persianIndex !== -1) {
      return String(persianIndex);
    }

    return String(ARABIC_DIGITS.indexOf(digit));
  });
}

/**
 * Accepts 09xxxxxxxxx, +989xxxxxxxxx, 00989xxxxxxxxx and 9xxxxxxxxx,
 * including Persian/Arabic digits, spaces and dashes.
 */
export function normalizeMobile(value: string): string | null {
  const digits = toEnglishDigits(value).replace(/[\s-]/g, "");

  if (/^09\d{9}$/.test(digits)) {
    return digits;
  }

  if (/^\+989\d{9}$/.test(digits)) {
    return `0${digits.slice(3)}`;
  }

  if (/^00989\d{9}$/.test(digits)) {
    return `0${digits.slice(4)}`;
  }

  if (/^9\d{9}$/.test(digits)) {
    return `0${digits}`;
  }

  return null;
}

export const mobileSchema = z
  .string()
  .trim()
  .min(1, "شماره موبایل را وارد کنید.")
  .transform((value, ctx) => {
    const normalized = normalizeMobile(value);

    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message: "شماره موبایل معتبر نیست.",
      });

      return z.NEVER;
    }

    return normalized;
  });
