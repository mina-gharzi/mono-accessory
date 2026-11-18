"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { cn } from "@/lib/utils";

type ProductCardImageProps = {
  image: { url: string; alt: string } | null;
  inStock: boolean;
};

/**
 * Client-only wrapper so the card itself stays a server component. Only the
 * image needs state, to swap in the placeholder when a file fails to load.
 */
export function ProductCardImage({ image, inStock }: ProductCardImageProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <>
      <ProductImagePlaceholder />

      {image && !imageFailed ? (
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
          className={cn(
            "object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.05]",
            !inStock && "opacity-60 saturate-50"
          )}
          onError={() => setImageFailed(true)}
        />
      ) : null}
    </>
  );
}
