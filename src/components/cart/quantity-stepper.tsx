"use client";

import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { updateCartQuantity } from "@/app/cart/actions";
import { CART_MAX_QUANTITY } from "@/lib/cart";
import { formatNumber } from "@/lib/format";
import type { Cart } from "@/server/cart";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  itemId: string;
  quantity: number;
  max: number;
  disabled?: boolean;
  onCartChange?: (cart: Cart) => void;
  className?: string;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function QuantityStepper({
  itemId,
  quantity,
  max,
  disabled = false,
  onCartChange,
  className,
}: QuantityStepperProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    value: number;
    from: number;
  } | null>(null);

  const limit = Math.max(1, Math.min(max, CART_MAX_QUANTITY));
  const displayedQuantity =
    pending && pending.from === quantity ? pending.value : quantity;
  const blocked = disabled || isPending;

  function change(next: number) {
    if (blocked || next === displayedQuantity) return;
    if (next < 1 || next > limit) return;

    setError(null);
    setPending({ value: next, from: quantity });

    startTransition(async () => {
      const result = await updateCartQuantity(itemId, next);

      if (!result.ok) {
        setError(result.message);
        setPending(null);
        return;
      }

      onCartChange?.(result.cart);
    });
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        role="group"
        aria-label="تعداد"
        aria-busy={isPending}
        className="inline-flex h-10 w-fit items-center rounded-md border border-border bg-background"
      >
        <button
          type="button"
          aria-label="کاهش تعداد"
          disabled={blocked || displayedQuantity <= 1}
          onClick={() => change(displayedQuantity - 1)}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-s-md text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none",
            focusRing
          )}
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>

        <span
          aria-live="polite"
          className="min-w-10 text-center text-sm font-bold tabular-nums text-foreground"
        >
          {formatNumber(displayedQuantity)}
        </span>

        <button
          type="button"
          aria-label="افزایش تعداد"
          disabled={blocked || displayedQuantity >= limit}
          onClick={() => change(displayedQuantity + 1)}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-e-md text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none",
            focusRing
          )}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
