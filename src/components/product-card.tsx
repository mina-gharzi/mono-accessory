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
      className={cn("group relative flex flex-col gap-3", className)}
    >
      <Link
        href={`/product/${product.slug}`}
        aria-label={`مشاهدهٔ ${product.name}`}
        className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />

      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-secondary/60">
        <ProductImagePlaceholder />

        {product.image && !imageFailed ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
            onError={() => setImageFailed(true)}
          />
        ) : null}

        {!product.inStock ? (
          <span className="absolute start-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground">
            ناموجود
          </span>
        ) : null}

        {discount ? (
          <span className="absolute end-3 top-3 rounded-full bg-primary px-2 py-1 text-[11px] font-bold text-primary-foreground">
            {percentFormatter.format(discount)}٪
          </span>
        ) : null}

        <WishlistButton
          productId={product.id}
          productName={product.name}
          className="absolute bottom-3 end-3 z-20 size-9 rounded-full bg-background/90 text-foreground shadow-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          iconClassName="size-4"
        />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="line-clamp-1 text-sm font-medium text-foreground">
          {product.name}
        </h3>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-bold text-primary">
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
