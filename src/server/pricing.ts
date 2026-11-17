import { z } from "zod";
import { prisma } from "@/server/db";

export const DEFAULT_SHIPPING_COST = 60_000;
export const DEFAULT_FREE_SHIPPING_THRESHOLD = 1_500_000;

export type ShippingSettings = {
  shippingCost: number;
  freeShippingThreshold: number;
};

export type CalculateTotalsInput = {
  subtotal: number;
  discountAmount?: number;
  shippingCost: number;
  freeShippingThreshold: number;
};

export type CartTotals = {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  amountToFreeShipping: number;
};

function safeAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export function calculateTotals({
  subtotal,
  discountAmount = 0,
  shippingCost,
  freeShippingThreshold,
}: CalculateTotalsInput): CartTotals {
  const safeSubtotal = safeAmount(subtotal);
  const safeDiscount = Math.min(safeAmount(discountAmount), safeSubtotal);
  const discountedSubtotal = safeSubtotal - safeDiscount;
  const safeShippingCost = safeAmount(shippingCost);
  const safeThreshold = safeAmount(freeShippingThreshold);
  const shipping =
    discountedSubtotal === 0 || discountedSubtotal >= safeThreshold
      ? 0
      : safeShippingCost;

  return {
    subtotal: safeSubtotal,
    discountAmount: safeDiscount,
    shippingCost: shipping,
    total: discountedSubtotal + shipping,
    amountToFreeShipping: Math.max(0, safeThreshold - discountedSubtotal),
  };
}

const settingAmountSchema = z.coerce.number().int().nonnegative();

function parseSettingAmount(
  value: string | undefined,
  fallback: number
): number {
  const parsed = settingAmountSchema.safeParse(value);

  return parsed.success ? parsed.data : fallback;
}

export function resolveShippingSettings(
  rows: { key: string; value: string }[]
): ShippingSettings {
  const values = new Map(rows.map((row) => [row.key, row.value]));

  return {
    shippingCost: parseSettingAmount(
      values.get("shippingCost"),
      DEFAULT_SHIPPING_COST
    ),
    freeShippingThreshold: parseSettingAmount(
      values.get("freeShippingThreshold"),
      DEFAULT_FREE_SHIPPING_THRESHOLD
    ),
  };
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["shippingCost", "freeShippingThreshold"] } },
    select: { key: true, value: true },
  });

  return resolveShippingSettings(rows);
}
