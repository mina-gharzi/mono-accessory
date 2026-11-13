"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toggleWishlistAction } from "@/app/wishlist/actions";
import { useWishlist } from "@/components/wishlist/wishlist-provider";
import { cn } from "@/lib/utils";

type WishlistButtonProps = {
  productId: string;
  productName: string;
  className?: string;
  iconClassName?: string;
};

export function WishlistButton({
  productId,
  productName,
  className,
  iconClassName,
}: WishlistButtonProps) {
  const { ids, ready, setWishlisted } = useWishlist();
  const baseWishlisted = ids.has(productId);
  const [optimisticWishlisted, setOptimisticWishlisted] =
    useOptimistic(baseWishlisted);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    if (!ready || isPending) return;

    const nextWishlisted = !baseWishlisted;
    setError(null);

    startTransition(async () => {
      setOptimisticWishlisted(nextWishlisted);

      const nextPath = `${window.location.pathname}${window.location.search}`;
      const result = await toggleWishlistAction(productId, nextPath);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setWishlisted(productId, result.wishlisted);
    });
  }

  const label = !ready
    ? "در حال بارگذاری علاقه‌مندی‌ها"
    : optimisticWishlisted
      ? `حذف ${productName} از علاقه‌مندی‌ها`
      : `افزودن ${productName} به علاقه‌مندی‌ها`;

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-pressed={optimisticWishlisted}
        aria-busy={!ready || isPending}
        disabled={!ready || isPending}
        onClick={handleToggle}
        className={cn(
          "inline-flex items-center justify-center transition-colors disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none",
          className
        )}
      >
        {isPending ? (
          <Loader2
            className={cn(
              "animate-spin motion-reduce:animate-none",
              iconClassName
            )}
            aria-hidden="true"
          />
        ) : (
          <Heart
            className={cn(
              iconClassName,
              optimisticWishlisted && "fill-primary text-primary"
            )}
            aria-hidden="true"
          />
        )}
      </button>

      {error ? (
        <span role="alert" aria-live="polite" className="sr-only">
          {error}
        </span>
      ) : null}
    </>
  );
}
