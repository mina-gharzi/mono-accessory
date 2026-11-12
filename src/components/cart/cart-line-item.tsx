"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { AlertCircle, Trash2 } from "lucide-react";
import { removeCartItem, updateCartQuantity } from "@/app/cart/actions";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { Button } from "@/components/ui/button";
import { formatNumber, formatPrice } from "@/lib/format";
import type { Cart, CartLine } from "@/server/cart";
import { cn } from "@/lib/utils";

type CartLineItemProps = {
  line: CartLine;
  onCartChange?: (cart: Cart) => void;
  compact?: boolean;
  className?: string;
};

function statusMessage(line: CartLine): string | null {
  switch (line.status) {
    case "lowStock":
      return `تنها ${formatNumber(line.availableQuantity)} عدد از این گزینه موجود است. تعداد سبد شما ${formatNumber(line.quantity)} عدد است.`;
    case "outOfStock":
      return "این گزینه فعلاً ناموجود است.";
    case "unavailable":
      return "این محصول دیگر در دسترس نیست.";
    default:
      return null;
  }
}

export function CartLineItem({
  line,
  onCartChange,
  compact = false,
  className,
}: CartLineItemProps) {
  const [isRemoving, startRemove] = useTransition();
  const [isAdjusting, startAdjust] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const message = statusMessage(line);
  const productHref = `/product/${line.productSlug}`;

  function remove() {
    if (isRemoving) return;
    setRemoveError(null);

    startRemove(async () => {
      const result = await removeCartItem(line.id);

      if (!result.ok) {
        setRemoveError(result.message);
        return;
      }

      onCartChange?.(result.cart);
    });
  }

  function adjust() {
    if (isAdjusting) return;
    setAdjustError(null);

    startAdjust(async () => {
      const result = await updateCartQuantity(line.id, line.availableQuantity);

      if (!result.ok) {
        setAdjustError(result.message);
        return;
      }

      onCartChange?.(result.cart);
    });
  }

  return (
    <div
      className={cn(
        "flex gap-3 py-4 sm:gap-4",
        !compact && "border-b border-border py-5 last:border-b-0",
        className
      )}
    >
      <Link
        href={productHref}
        aria-label={`مشاهدهٔ ${line.productName}`}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-md bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          compact ? "size-20" : "size-24 sm:size-28"
        )}
      >
        <ProductImagePlaceholder iconClassName="size-5" />
        {line.image && !imageFailed ? (
          <Image
            src={line.image.url}
            alt={line.image.alt}
            fill
            sizes={compact ? "80px" : "112px"}
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={productHref}
              className="line-clamp-2 text-sm font-medium text-foreground transition-colors hover:text-primary motion-reduce:transition-none"
            >
              {line.productName}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {line.variant.color}
              {line.variant.model ? ` · ${line.variant.model}` : ""}
            </p>
            <p className="text-[11px] text-muted-foreground" dir="ltr">
              {line.variant.sku}
            </p>
          </div>

          <p
            className={cn(
              "shrink-0 text-sm font-bold text-primary",
              compact && "text-xs"
            )}
          >
            {formatPrice(line.lineTotal)}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          قیمت واحد: {formatPrice(line.unitPrice)}
        </p>

        {message ? (
          <p
            className="flex items-start gap-1.5 text-xs leading-5 text-destructive"
            role="status"
          >
            <AlertCircle
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            {message}
          </p>
        ) : null}

        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          {line.status === "ok" ? (
            <QuantityStepper
              itemId={line.id}
              quantity={line.quantity}
              max={line.stock}
              onCartChange={onCartChange}
            />
          ) : line.status === "lowStock" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isAdjusting}
              onClick={adjust}
              className="h-9"
            >
              {isAdjusting
                ? "در حال به‌روزرسانی..."
                : `کاهش به ${formatNumber(line.availableQuantity)} عدد`}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              تعداد: {formatNumber(line.quantity)}
            </span>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isRemoving}
            onClick={remove}
            className="h-9 gap-1.5 px-2 text-muted-foreground hover:text-destructive"
            aria-label={`حذف ${line.productName} از سبد خرید`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            <span className={compact ? "sr-only" : ""}>حذف</span>
          </Button>
        </div>

        {removeError ? (
          <p role="alert" className="text-xs leading-5 text-destructive">
            {removeError}
          </p>
        ) : null}

        {adjustError ? (
          <p role="alert" className="text-xs leading-5 text-destructive">
            {adjustError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
