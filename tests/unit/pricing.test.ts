import { describe, expect, it } from "vitest";
import {
  calculateTotals,
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_COST,
  resolveShippingSettings,
} from "@/server/pricing";

const settings = {
  shippingCost: DEFAULT_SHIPPING_COST,
  freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD,
};

describe("calculateTotals", () => {
  it("adds shipping below the free-shipping threshold", () => {
    expect(calculateTotals({ subtotal: 1_000_000, ...settings })).toEqual({
      subtotal: 1_000_000,
      shippingCost: 60_000,
      total: 1_060_000,
      amountToFreeShipping: 500_000,
    });
  });

  it("drops shipping exactly at the threshold", () => {
    expect(
      calculateTotals({
        subtotal: DEFAULT_FREE_SHIPPING_THRESHOLD,
        ...settings,
      })
    ).toEqual({
      subtotal: 1_500_000,
      shippingCost: 0,
      total: 1_500_000,
      amountToFreeShipping: 0,
    });
  });

  it("drops shipping above the threshold", () => {
    expect(calculateTotals({ subtotal: 2_000_000, ...settings })).toEqual({
      subtotal: 2_000_000,
      shippingCost: 0,
      total: 2_000_000,
      amountToFreeShipping: 0,
    });
  });

  it("never charges shipping for an empty cart", () => {
    expect(calculateTotals({ subtotal: 0, ...settings })).toEqual({
      subtotal: 0,
      shippingCost: 0,
      total: 0,
      amountToFreeShipping: DEFAULT_FREE_SHIPPING_THRESHOLD,
    });
  });

  it("clamps negative and fractional amounts", () => {
    expect(
      calculateTotals({
        subtotal: -500.7,
        shippingCost: -1,
        freeShippingThreshold: 1000,
      })
    ).toEqual({
      subtotal: 0,
      shippingCost: 0,
      total: 0,
      amountToFreeShipping: 1000,
    });
  });

  it("returns zero amountToFreeShipping once the threshold is passed", () => {
    expect(
      calculateTotals({ subtotal: 1_200_000, ...settings }).amountToFreeShipping
    ).toBe(300_000);
    expect(
      calculateTotals({ subtotal: 1_600_000, ...settings }).amountToFreeShipping
    ).toBe(0);
  });
});

describe("resolveShippingSettings", () => {
  it("uses the stored values", () => {
    expect(
      resolveShippingSettings([
        { key: "shippingCost", value: "45000" },
        { key: "freeShippingThreshold", value: "900000" },
      ])
    ).toEqual({ shippingCost: 45_000, freeShippingThreshold: 900_000 });
  });

  it("falls back to defaults for missing or invalid values", () => {
    expect(
      resolveShippingSettings([
        { key: "shippingCost", value: "not-a-number" },
        { key: "freeShippingThreshold", value: "-10" },
      ])
    ).toEqual({
      shippingCost: DEFAULT_SHIPPING_COST,
      freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD,
    });
  });
});
