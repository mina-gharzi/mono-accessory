"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type {
  OrderStatus,
  PaymentStatus,
} from "@/generated/prisma/client";
import { InlineMessage } from "@/components/admin/inline-message";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { changeOrderStatusAction } from "@/app/admin/orders/actions";

type OrderStatusActionsProps = {
  orderId: string;
  paymentStatus: PaymentStatus;
  allowedStatuses: readonly OrderStatus[];
};

type Feedback = {
  tone: "success" | "error";
  message: string;
};

export function OrderStatusActions({
  orderId,
  paymentStatus,
  allowedStatuses,
}: OrderStatusActionsProps) {
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const nextStatuses = allowedStatuses.filter(
    (status) => status !== "CANCELLED"
  );
  const canCancel = allowedStatuses.includes("CANCELLED");

  async function applyStatus(nextStatus: OrderStatus) {
    if (pendingStatus) return;

    setPendingStatus(nextStatus);
    setFeedback(null);

    try {
      const result = await changeOrderStatusAction(orderId, nextStatus);

      if (result.ok) {
        setFeedback({
          tone: "success",
          message: `وضعیت سفارش به «${ORDER_STATUS_LABELS[nextStatus]}» تغییر کرد.`,
        });
      } else {
        setFeedback({ tone: "error", message: result.message });
      }
    } catch {
      setFeedback({
        tone: "error",
        message: "تغییر وضعیت سفارش ناموفق بود. لطفاً دوباره تلاش کنید.",
      });
    } finally {
      setPendingStatus(null);
    }
  }

  const cancelDescription =
    paymentStatus === "PAID"
      ? "با لغو این سفارش، موجودی همهٔ اقلام به انبار بازمی‌گردد و مبلغ پرداخت‌شده به‌عنوان بازگشت وجه ثبت می‌شود. این کار قابل بازگشت نیست."
      : "با لغو این سفارش، موجودی همهٔ اقلام به انبار بازمی‌گردد. این کار قابل بازگشت نیست.";

  return (
    <div className="flex flex-col gap-3">
      {allowedStatuses.length === 0 ? (
        <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm leading-6 text-muted-foreground">
          این سفارش در وضعیت نهایی است و تغییر وضعیت دیگری ندارد.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {nextStatuses.map((status) => {
            const pending = pendingStatus === status;

            return (
              <Button
                key={status}
                type="button"
                onClick={() => applyStatus(status)}
                disabled={pendingStatus !== null}
                aria-busy={pending}
              >
                {pending ? (
                  <Loader2
                    className="size-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : null}
                تغییر به {ORDER_STATUS_LABELS[status]}
              </Button>
            );
          })}

          {canCancel ? (
            <ConfirmDialog
              title="لغو سفارش"
              description={cancelDescription}
              confirmLabel="لغو سفارش"
              onConfirm={async () => {
                const result = await changeOrderStatusAction(
                  orderId,
                  "CANCELLED"
                );

                if (result.ok) {
                  setFeedback({
                    tone: "success",
                    message:
                      paymentStatus === "PAID"
                        ? "سفارش لغو شد، موجودی اقلام به انبار بازگشت و بازگشت وجه ثبت شد."
                        : "سفارش لغو شد و موجودی اقلام به انبار بازگشت.",
                  });
                }

                return result;
              }}
              trigger={
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pendingStatus !== null}
                >
                  لغو سفارش
                </Button>
              }
            />
          ) : null}
        </div>
      )}

      <InlineMessage
        tone={feedback?.tone ?? "success"}
        message={feedback?.message ?? null}
      />
    </div>
  );
}
