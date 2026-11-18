"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { Expand } from "lucide-react";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const ProductLightbox = dynamic(
  () => import("./product-lightbox").then((mod) => mod.ProductLightbox),
  { ssr: false }
);

export type ProductGalleryImage = {
  url: string;
  alt: string;
};

type ProductGalleryProps = {
  images: ProductGalleryImage[];
  productName: string;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const mainImageRef = useRef<HTMLImageElement>(null);

  const total = images.length;
  const activeImage = images[activeIndex] ?? null;
  const activeFailed = activeImage ? Boolean(failed[activeImage.url]) : true;

  function markFailed(url: string) {
    setFailed((current) => ({ ...current, [url]: true }));
  }

  function selectImage(index: number) {
    setActiveIndex(index);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse") return;

    const image = mainImageRef.current;

    if (!image) return;

    const rect = event.currentTarget.getBoundingClientRect();

    image.style.transformOrigin = `${((event.clientX - rect.left) / rect.width) * 100}% ${((event.clientY - rect.top) / rect.height) * 100}%`;
  }

  function resetPointerOrigin() {
    if (mainImageRef.current) {
      mainImageRef.current.style.transformOrigin = "50% 50%";
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row">
        {total > 1 ? (
          <div
            role="group"
            aria-label="تصاویر محصول"
            className="order-2 flex gap-3 overflow-x-auto pb-1 md:order-1 md:w-20 md:shrink-0 md:flex-col md:overflow-visible md:pb-0"
          >
            {images.map((image, index) => {
              const selected = index === activeIndex;

              return (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  aria-label={`نمایش تصویر ${formatNumber(index + 1)} از ${formatNumber(total)}`}
                  aria-pressed={selected}
                  onClick={() => selectImage(index)}
                  className={cn(
                    "relative size-16 shrink-0 overflow-hidden rounded-md border bg-secondary/60 transition-colors md:size-20",
                    selected
                      ? "border-primary"
                      : "border-border hover:border-primary/50",
                    focusRing
                  )}
                >
                  {failed[image.url] ? (
                    <ProductImagePlaceholder iconClassName="size-4" />
                  ) : (
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                      onError={() => markFailed(image.url)}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="order-1 min-w-0 flex-1 md:order-2">
          {activeImage && !activeFailed ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              onPointerMove={handlePointerMove}
              onPointerLeave={resetPointerOrigin}
              aria-label={`بزرگ‌نمایی تصویر ${productName}`}
              className={cn(
                "group relative block aspect-4/5 w-full cursor-zoom-in overflow-hidden rounded-lg bg-secondary/60",
                focusRing
              )}
            >
              <Image
                ref={mainImageRef}
                src={activeImage.url}
                alt={activeImage.alt}
                fill
                preload
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-150"
                onError={() => markFailed(activeImage.url)}
              />
              <span className="pointer-events-none absolute bottom-3 inset-e-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-[11px] font-medium text-foreground">
                <Expand className="size-3.5" aria-hidden="true" />
                بزرگ‌نمایی
              </span>
            </button>
          ) : (
            <div className="relative aspect-4/5 w-full overflow-hidden rounded-lg bg-secondary/60">
              <ProductImagePlaceholder iconClassName="size-14" />
            </div>
          )}
        </div>
      </div>

      {lightboxOpen ? (
        <ProductLightbox
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          images={images}
          productName={productName}
          activeIndex={activeIndex}
          onActiveIndexChange={selectImage}
          failed={failed}
          onImageError={markFailed}
        />
      ) : null}
    </>
  );
}
