"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cancelOrder } from "@/app/account/orders/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function OrderCancelDialog({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;

    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
    }
  }

  function handleCancel() {
    if (isPending) return;

    setError(null);

    startTransition(async () => {
      const result = await cancelOrder(orderId, orderNumber);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
        >
          لغو سفارش
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>لغو سفارش</DialogTitle>
          <DialogDescription>
            آیا از لغو این سفارش مطمئن هستید؟ با لغو، موجودی کالاها آزاد می‌شود
            و این کار قابل بازگشت نیست.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive"
          >
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              بستن
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancel}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <Loader2
                  className="size-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                در حال لغو...
              </>
            ) : (
              "لغو سفارش"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
