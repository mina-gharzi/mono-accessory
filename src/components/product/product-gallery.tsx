"use client";

import Image from "next/image";
import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  const [zoomed, setZoomed] = useState(false);
  const mainImageRef = useRef<HTMLImageElement>(null);

  const total = images.length;
  const activeImage = images[activeIndex] ?? null;
  const activeFailed = activeImage ? Boolean(failed[activeImage.url]) : true;

  function markFailed(url: string) {
    setFailed((current) => ({ ...current, [url]: true }));
  }

  function selectImage(index: number) {
    setActiveIndex(index);
    setZoomed(false);
  }

  function showPrevious() {
    if (total < 2) return;
    setActiveIndex((index) => (index - 1 + total) % total);
    setZoomed(false);
  }

  function showNext() {
    if (total < 2) return;
    setActiveIndex((index) => (index + 1) % total);
    setZoomed(false);
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

  function handleLightboxKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showNext();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showPrevious();
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
                "group relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-lg bg-secondary/60",
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
              <span className="pointer-events-none absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-[11px] font-medium text-foreground">
                <Expand className="size-3.5" aria-hidden="true" />
                بزرگ‌نمایی
              </span>
            </button>
          ) : (
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-secondary/60">
              <ProductImagePlaceholder iconClassName="size-14" />
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={lightboxOpen}
        onOpenChange={(open) => {
          setLightboxOpen(open);
          if (!open) setZoomed(false);
        }}
      >
        <DialogContent
          showCloseButton={false}
          onKeyDown={handleLightboxKeyDown}
          className="top-0 start-0 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-dark p-0 text-primary-foreground motion-reduce:animate-none sm:max-w-none rtl:translate-x-0"
        >
          <DialogTitle className="sr-only">
            گالری تصاویر {productName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            برای جابه‌جایی بین تصاویر از کلیدهای جهت استفاده کنید. برای بستن
            کلید Escape را بزنید.
          </DialogDescription>

          <div className="flex items-center justify-between gap-2 border-b border-primary-foreground/15 p-3">
            <span className="text-xs text-primary-foreground/70">
              {formatNumber(activeIndex + 1)} / {formatNumber(total)}
            </span>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-pressed={zoomed}
                aria-label={
                  zoomed ? "کوچک‌نمایی تصویر" : "بزرگ‌نمایی تصویر"
                }
                onClick={() => setZoomed((value) => !value)}
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                {zoomed ? (
                  <ZoomOut className="size-4" aria-hidden="true" />
                ) : (
                  <ZoomIn className="size-4" aria-hidden="true" />
                )}
              </Button>

              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="بستن گالری"
                  className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </DialogClose>
            </div>
          </div>

          <div className="relative min-h-0 w-full flex-1">
            <div
              className={cn(
                "h-full w-full",
                zoomed ? "overflow-auto" : "overflow-hidden"
              )}
            >
              {activeImage && !activeFailed ? (
                <div
                  className={cn(
                    "relative h-full w-full",
                    zoomed && "h-[150%] w-[150%]"
                  )}
                >
                  <Image
                    src={activeImage.url}
                    alt={activeImage.alt}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    onError={() => markFailed(activeImage.url)}
                  />
                </div>
              ) : (
                <div className="relative h-full w-full">
                  <ProductImagePlaceholder iconClassName="size-16" />
                </div>
              )}
            </div>

            {total > 1 ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-lg"
                  aria-label="تصویر قبلی"
                  onClick={showPrevious}
                  className="absolute start-3 top-1/2 -translate-y-1/2 bg-background/90 text-foreground hover:bg-background"
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="icon-lg"
                  aria-label="تصویر بعدی"
                  onClick={showNext}
                  className="absolute end-3 top-1/2 -translate-y-1/2 bg-background/90 text-foreground hover:bg-background"
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </Button>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
