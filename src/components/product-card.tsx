"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ProductCardProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: { url: string; alt: string } | null;
  inStock: boolean;
};

const percentFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

type ProductCardProps = {
  product: ProductCardProduct;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-2 transition-all duration-300 motion-reduce:transition-none",
        "hover:border-primary/40 hover:shadow-lg hover:shadow-dark/5 motion-safe:hover:-translate-y-0.5",
        className
      )}
    >
      <Link
        href={`/product/${product.slug}`}
        aria-label={`مشاهدهٔ ${product.name}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />

      <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-secondary/60">
        <ProductImagePlaceholder />

        {product.image && !imageFailed ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className={cn(
              "object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.05]",
              !product.inStock && "opacity-60 saturate-50"
            )}
            onError={() => setImageFailed(true)}
          />
        ) : null}

        {discount ? (
          <span className="absolute inset-s-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
            {percentFormatter.format(discount)}٪
          </span>
        ) : null}

        {!product.inStock ? (
          <span className="absolute inset-x-2 bottom-2 rounded-full bg-background/90 py-1 text-center text-[11px] font-medium text-foreground backdrop-blur-sm">
            ناموجود
          </span>
        ) : null}

        <WishlistButton
          productId={product.id}
          productName={product.name}
          className="absolute inset-e-2 top-2 z-20 size-8 rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          iconClassName="size-4"
        />
      </div>

      <div className="flex flex-col gap-1 px-1.5 pb-1.5">
        <h3 className="line-clamp-1 text-sm font-medium text-foreground">
          {product.name}
        </h3>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-bold text-dark">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}