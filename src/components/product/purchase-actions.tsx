"use client";

import { useState, useTransition } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { addToCart } from "@/app/cart/actions";
import { useCartSheet } from "@/components/cart/cart-sheet";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PurchaseActionsProps = {
  productId: string;
  productName: string;
  variantId: string | null;
  quantity: number;
  disabled: boolean;
  showWishlist?: boolean;
  className?: string;
};

export function PurchaseActions({
  productId,
  productName,
  variantId,
  quantity,
  disabled,
  showWishlist = true,
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
          <WishlistButton
            productId={productId}
            productName={productName}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-lg" }),
              "size-11 shrink-0 sm:size-12"
            )}
            iconClassName="size-5"
          />
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
