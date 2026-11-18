"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
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
import type { ProductGalleryImage } from "./product-gallery";

type ProductLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: ProductGalleryImage[];
  productName: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  failed: Record<string, boolean>;
  onImageError: (url: string) => void;
};

/**
 * Full-screen gallery. Loaded on demand by ProductGallery so the dialog code
 * is not part of the initial product page bundle.
 */
export function ProductLightbox({
  open,
  onOpenChange,
  images,
  productName,
  activeIndex,
  onActiveIndexChange,
  failed,
  onImageError,
}: ProductLightboxProps) {
  const [zoomed, setZoomed] = useState(false);

  const total = images.length;
  const activeImage = images[activeIndex] ?? null;
  const activeFailed = activeImage ? Boolean(failed[activeImage.url]) : true;

  function selectIndex(index: number) {
    onActiveIndexChange(index);
    setZoomed(false);
  }

  function showPrevious() {
    if (total < 2) return;
    selectIndex((activeIndex - 1 + total) % total);
  }

  function showNext() {
    if (total < 2) return;
    selectIndex((activeIndex + 1) % total);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setZoomed(false);
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        onKeyDown={handleKeyDown}
        className="top-0 inset-s-0 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-dark p-0 text-primary-foreground motion-reduce:animate-none sm:max-w-none rtl:translate-x-0"
      >
        <DialogTitle className="sr-only">
          گالری تصاویر {productName}
        </DialogTitle>
        <DialogDescription className="sr-only">
          برای جابه‌جایی بین تصاویر از کلیدهای جهت استفاده کنید. برای بستن کلید
          Escape را بزنید.
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
              aria-label={zoomed ? "کوچک‌نمایی تصویر" : "بزرگ‌نمایی تصویر"}
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
                  onError={() => onImageError(activeImage.url)}
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
                className="absolute inset-s-3 top-1/2 -translate-y-1/2 bg-background/90 text-foreground hover:bg-background"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="icon-lg"
                aria-label="تصویر بعدی"
                onClick={showNext}
                className="absolute inset-e-3 top-1/2 -translate-y-1/2 bg-background/90 text-foreground hover:bg-background"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
