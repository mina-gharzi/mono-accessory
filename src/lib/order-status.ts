import type { OrderStatus, PaymentStatus } from "@/generated/prisma/client";

export const ORDER_STATUS_VALUES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const satisfies readonly OrderStatus[];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUS_VALUES as readonly string[]).includes(value);
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت شده",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل شده",
  CANCELLED: "لغو شده",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت شده",
  FAILED: "ناموفق",
  REFUNDED: "بازگشت وجه",
};

export const ORDER_STATUS_STEPS = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const satisfies readonly OrderStatus[];
