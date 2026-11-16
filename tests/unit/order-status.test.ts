import { describe, expect, it } from "vitest";
import type { OrderStatus } from "@/generated/prisma/client";
import {
  getAllowedOrderStatuses,
  ORDER_STATUS_TRANSITIONS,
} from "@/lib/order-status";

const ALL_STATUSES = Object.keys(ORDER_STATUS_TRANSITIONS) as OrderStatus[];

function isAllowed(from: OrderStatus, to: OrderStatus): boolean {
  return getAllowedOrderStatuses(from).includes(to);
}

describe("order status transitions", () => {
  it("allows every declared move", () => {
    expect(isAllowed("PENDING", "CANCELLED")).toBe(true);
    expect(isAllowed("PAID", "PROCESSING")).toBe(true);
    expect(isAllowed("PAID", "CANCELLED")).toBe(true);
    expect(isAllowed("PROCESSING", "SHIPPED")).toBe(true);
    expect(isAllowed("PROCESSING", "CANCELLED")).toBe(true);
    expect(isAllowed("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("rejects skipping steps", () => {
    expect(isAllowed("PENDING", "PAID")).toBe(false);
    expect(isAllowed("PENDING", "PROCESSING")).toBe(false);
    expect(isAllowed("PAID", "SHIPPED")).toBe(false);
    expect(isAllowed("PAID", "DELIVERED")).toBe(false);
    expect(isAllowed("PROCESSING", "DELIVERED")).toBe(false);
    expect(isAllowed("SHIPPED", "PAID")).toBe(false);
  });

  it("rejects moving backwards", () => {
    expect(isAllowed("PAID", "PENDING")).toBe(false);
    expect(isAllowed("PROCESSING", "PAID")).toBe(false);
    expect(isAllowed("SHIPPED", "PROCESSING")).toBe(false);
    expect(isAllowed("DELIVERED", "SHIPPED")).toBe(false);
    expect(isAllowed("CANCELLED", "PENDING")).toBe(false);
  });

  it("rejects moving to the same status", () => {
    for (const status of ALL_STATUSES) {
      expect(isAllowed(status, status)).toBe(false);
    }
  });

  it("treats DELIVERED and CANCELLED as terminal", () => {
    expect(getAllowedOrderStatuses("DELIVERED")).toEqual([]);
    expect(getAllowedOrderStatuses("CANCELLED")).toEqual([]);
  });

  it("never allows leaving a terminal state", () => {
    for (const target of ALL_STATUSES) {
      expect(isAllowed("DELIVERED", target)).toBe(false);
      expect(isAllowed("CANCELLED", target)).toBe(false);
    }
  });
});
