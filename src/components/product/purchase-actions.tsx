"use client";

import { useState, useTransition } from "react";
import { Heart, Loader2, ShoppingBag } from "lucide-react";
import { addToCart } from "@/app/cart/actions";
import { useCartSheet } from "@/components/cart/cart-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PurchaseActionsProps = {
  productName: string;
  variantId: string | null;
  quantity: number;
  disabled: boolean;
  wishlisted?: boolean;
  showWishlist?: boolean;
  // TODO(phase 10): connect this to the server wishlist action.
  onToggleWishlist?: () => void;
  className?: string;
};

export function PurchaseActions({
  productName,
  variantId,
  quantity,
  disabled,
  wishlisted = false,
  showWishlist = true,
  onToggleWishlist,
  className,
}: PurchaseActionsProps) {
  const { openCart } = useCartSheet();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAddToCart() {
    if (!variantId || disabled || isPending) return;

    setError(null);
    const nextPath = `${window.location.pathname}${window.location.search}`;

    startTransition(async () => {
      const result = await addToCart(variantId, quantity, nextPath);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      openCart();
    });
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="lg"
          disabled={disabled || isPending}
          aria-busy={isPending}
          onClick={handleAddToCart}
          className="h-11 flex-1 sm:h-12"
          aria-label={
            disabled
              ? `${productName} ناموجود است`
              : `افزودن ${productName} به سبد خرید`
          }
        >
          {isPending ? (
            <Loader2
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <ShoppingBag className="size-4" aria-hidden="true" />
          )}
          {disabled
            ? "ناموجود"
            : isPending
              ? "در حال افزودن..."
              : "افزودن به سبد خرید"}
        </Button>

        {showWishlist ? (
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-pressed={wishlisted}
            aria-label={
              wishlisted
                ? `حذف ${productName} از علاقه‌مندی‌ها`
                : `افزودن ${productName} به علاقه‌مندی‌ها`
            }
            onClick={onToggleWishlist}
            className="size-11 shrink-0 sm:size-12"
          >
            <Heart
              className={cn("size-5", wishlisted && "fill-primary text-primary")}
              aria-hidden="true"
            />
          </Button>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          aria-live="polite"
          className="text-xs leading-5 text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
