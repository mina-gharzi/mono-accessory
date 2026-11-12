"use client";

import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PurchaseActionsProps = {
  productName: string;
  quantity: number;
  disabled: boolean;
  wishlisted?: boolean;
  showWishlist?: boolean;
  // TODO(phase 8): connect this to the server cart action.
  onAddToCart?: (quantity: number) => void;
  // TODO(phase 10): connect this to the server wishlist action.
  onToggleWishlist?: () => void;
  className?: string;
};

export function PurchaseActions({
  productName,
  quantity,
  disabled,
  wishlisted = false,
  showWishlist = true,
  onAddToCart,
  onToggleWishlist,
  className,
}: PurchaseActionsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        size="lg"
        disabled={disabled}
        onClick={() => onAddToCart?.(quantity)}
        className="h-11 flex-1 sm:h-12"
        aria-label={
          disabled
            ? `${productName} ناموجود است`
            : `افزودن ${productName} به سبد خرید`
        }
      >
        <ShoppingBag className="size-4" aria-hidden="true" />
        {disabled ? "ناموجود" : "افزودن به سبد خرید"}
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
  );
}
