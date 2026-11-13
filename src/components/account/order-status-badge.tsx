import type { OrderStatus } from "@/generated/prisma/client";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { cn } from "@/lib/utils";

const statusStyles: Record<OrderStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-900",
  PAID: "border-primary/30 bg-primary/5 text-primary",
  PROCESSING: "border-sky-200 bg-sky-50 text-sky-900",
  SHIPPED: "border-indigo-200 bg-indigo-50 text-indigo-900",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  CANCELLED: "border-destructive/30 bg-destructive/5 text-destructive",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
