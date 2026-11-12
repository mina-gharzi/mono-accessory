"use client";

import { useEffect, useId, useState } from "react";
import { CheckCircle2, Minus, Plus, XCircle } from "lucide-react";
import { PurchaseActions } from "@/components/product/purchase-actions";
import { formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export type VariantOption = {
  id: string;
  color: string;
  model: string | null;
  sku: string;
  stock: number;
};

type VariantPurchasePanelProps = {
  productName: string;
  variants: VariantOption[];
  initialSku: string | null;
  price: number;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values));
}

function firstAvailable(variants: VariantOption[]): VariantOption | null {
  return variants.find((variant) => variant.stock > 0) ?? variants[0] ?? null;
}

export function VariantPurchasePanel({
  productName,
  variants,
  initialSku,
  price,
}: VariantPurchasePanelProps) {
  const [selectedSku, setSelectedSku] = useState(
    () =>
      variants.find((variant) => variant.sku === initialSku)?.sku ??
      firstAvailable(variants)?.sku ??
      ""
  );
  const [quantity, setQuantity] = useState(1);
  const colorLabelId = useId();
  const modelLabelId = useId();
  const quantityLabelId = useId();

  const colors = uniqueValues(variants.map((variant) => variant.color));
  const models = uniqueValues(
    variants.flatMap((variant) => (variant.model ? [variant.model] : []))
  );

  const selectedVariant =
    variants.find((variant) => variant.sku === selectedSku) ?? null;
  const stock = selectedVariant?.stock ?? 0;
  const outOfStock = !selectedVariant || stock <= 0;
  const maxQuantity = Math.max(1, stock);

  useEffect(() => {
    if (!selectedSku) return;

    const url = new URL(window.location.href);

    if (url.searchParams.get("variant") === selectedSku) return;

    url.searchParams.set("variant", selectedSku);
    window.history.replaceState(window.history.state, "", url);
  }, [selectedSku]);

  function isColorAvailable(color: string): boolean {
    return variants.some(
      (variant) => variant.color === color && variant.stock > 0
    );
  }

  function isModelAvailable(model: string): boolean {
    return variants.some(
      (variant) => variant.model === model && variant.stock > 0
    );
  }

  function pickForColor(color: string): VariantOption | null {
    const sameColor = variants.filter((variant) => variant.color === color);
    const sameModel = sameColor.filter(
      (variant) => variant.model === selectedVariant?.model
    );

    return (
      sameModel.find((variant) => variant.stock > 0) ??
      sameModel[0] ??
      sameColor.find((variant) => variant.stock > 0) ??
      sameColor[0] ??
      null
    );
  }

  function pickForModel(model: string): VariantOption | null {
    const sameModel = variants.filter((variant) => variant.model === model);
    const sameColor = sameModel.filter(
      (variant) => variant.color === selectedVariant?.color
    );

    return (
      sameColor.find((variant) => variant.stock > 0) ??
      sameColor[0] ??
      sameModel.find((variant) => variant.stock > 0) ??
      sameModel[0] ??
      null
    );
  }

  function selectVariant(variant: VariantOption | null) {
    if (!variant) return;
    setSelectedSku(variant.sku);
    setQuantity((current) => Math.min(current, Math.max(1, variant.stock)));
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {colors.length > 0 || models.length > 0 ? (
          <div className="flex flex-col gap-5">
            {colors.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                <p
                  id={colorLabelId}
                  className="text-sm font-medium text-foreground"
                >
                  رنگ
                  {selectedVariant ? (
                    <span className="ms-2 font-normal text-muted-foreground">
                      {selectedVariant.color}
                    </span>
                  ) : null}
                </p>

                <div
                  role="group"
                  aria-labelledby={colorLabelId}
                  className="flex flex-wrap gap-2"
                >
                  {colors.map((color) => {
                    const available = isColorAvailable(color);
                    const active = selectedVariant?.color === color;

                    return (
                      <button
                        key={color}
                        type="button"
                        aria-pressed={active}
                        disabled={!available}
                        onClick={() => selectVariant(pickForColor(color))}
                        className={cn(
                          "inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:border-primary/50",
                          !available &&
                            "cursor-not-allowed border-dashed text-muted-foreground line-through opacity-60 hover:border-border",
                          focusRing
                        )}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {models.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                <p
                  id={modelLabelId}
                  className="text-sm font-medium text-foreground"
                >
                  مدل
                  {selectedVariant?.model ? (
                    <span className="ms-2 font-normal text-muted-foreground">
                      {selectedVariant.model}
                    </span>
                  ) : null}
                </p>

                <div
                  role="group"
                  aria-labelledby={modelLabelId}
                  className="flex flex-wrap gap-2"
                >
                  {models.map((model) => {
                    const available = isModelAvailable(model);
                    const active = selectedVariant?.model === model;

                    return (
                      <button
                        key={model}
                        type="button"
                        aria-pressed={active}
                        disabled={!available}
                        onClick={() => selectVariant(pickForModel(model))}
                        className={cn(
                          "inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:border-primary/50",
                          !available &&
                            "cursor-not-allowed border-dashed text-muted-foreground line-through opacity-60 hover:border-border",
                          focusRing
                        )}
                      >
                        {model}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          <p
            aria-live="polite"
            className={cn(
              "flex items-center gap-2 text-sm",
              outOfStock
                ? "text-destructive"
                : stock <= 3
                  ? "text-primary"
                  : "text-foreground"
            )}
          >
            {outOfStock ? (
              <XCircle className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            )}
            {!selectedVariant
              ? "این محصول فعلاً ناموجود است"
              : outOfStock
                ? "این گزینه فعلاً ناموجود است"
                : stock <= 3
                  ? `فقط ${formatNumber(stock)} عدد در انبار باقی مانده است`
                  : "موجود در انبار"}
          </p>

          <div className="flex flex-col gap-2">
            <span
              id={quantityLabelId}
              className="text-sm font-medium text-foreground"
            >
              تعداد
            </span>

            <div
              role="group"
              aria-labelledby={quantityLabelId}
              className="inline-flex h-11 w-fit items-center rounded-md border border-border bg-background"
            >
              <button
                type="button"
                aria-label="کاهش تعداد"
                disabled={outOfStock || quantity <= 1}
                onClick={() =>
                  setQuantity((current) => Math.max(1, current - 1))
                }
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-s-md text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
                  focusRing
                )}
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>

              <span
                aria-live="polite"
                className="min-w-10 text-center text-sm font-bold text-foreground"
              >
                {formatNumber(quantity)}
              </span>

              <button
                type="button"
                aria-label="افزایش تعداد"
                disabled={outOfStock || quantity >= maxQuantity}
                onClick={() =>
                  setQuantity((current) =>
                    Math.min(maxQuantity, current + 1)
                  )
                }
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-e-md text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
                  focusRing
                )}
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <PurchaseActions
            productName={productName}
            quantity={quantity}
            disabled={outOfStock}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4">
          <div className="flex shrink-0 flex-col">
            <span className="text-[11px] text-muted-foreground">قیمت</span>
            <span className="text-sm font-bold text-primary">
              {formatPrice(price)}
            </span>
          </div>

          <PurchaseActions
            productName={productName}
            quantity={quantity}
            disabled={outOfStock}
            showWishlist={false}
            className="min-w-0 flex-1"
          />
        </div>
      </div>
    </>
  );
}
