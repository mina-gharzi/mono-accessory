"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useId,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { ChevronRight, X } from "lucide-react";
import {
  applyDiscountAction,
  type DiscountPreviewState,
} from "@/app/checkout/actions";
import { FreeShippingHint } from "@/components/cart/free-shipping-hint";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber, formatPrice } from "@/lib/format";
import type { CartLine } from "@/server/cart";

type AppliedDiscount = Extract<DiscountPreviewState, { ok: true }>;

type CheckoutSummaryProps = {
  lines: CartLine[];
  subtotal: number;
  shippingCost: number;
  total: number;
  amountToFreeShipping: number;
};

export function CheckoutSummary({
  lines,
  subtotal: baseSubtotal,
  shippingCost: baseShippingCost,
  total: baseTotal,
  amountToFreeShipping: baseAmountToFreeShipping,
}: CheckoutSummaryProps) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<AppliedDiscount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputId = useId();
  const errorId = useId();

  const subtotal = applied?.subtotal ?? baseSubtotal;
  const discountAmount = applied?.discountAmount ?? 0;
  const shippingCost = applied?.shippingCost ?? baseShippingCost;
  const total = applied?.total ?? baseTotal;
  const amountToFreeShipping =
    applied?.amountToFreeShipping ?? baseAmountToFreeShipping;

  function handleApply() {
    const value = code.trim();

    if (!value) {
      setApplied(null);
      setError("کد تخفیف را وارد کنید.");
      return;
    }

    const formData = new FormData();
    formData.set("code", value);

    startTransition(async () => {
      const result = await applyDiscountAction(formData);

      if (result.ok) {
        setApplied(result);
        setCode(result.code);
        setError(null);
      } else {
        setApplied(null);
        setError(result.message);
      }
    });
  }

  // The summary lives inside the shipping form, so Enter must apply the code
  // instead of implicitly submitting the order.
  function handleCodeKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleApply();
    }
  }

  function handleRemove() {
    setApplied(null);
    setCode("");
    setError(null);
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-border border-t-2 border-t-primary bg-card p-5 shadow-sm sm:p-6">
      <h2 className="font-heading text-lg font-bold text-dark">خلاصه سفارش</h2>

      <ul className="flex flex-col gap-3">
        {lines.map((line) => (
          <li key={line.id} className="flex gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-secondary/60">
              <ProductImagePlaceholder iconClassName="size-4" />
              {line.image ? (
                <Image
                  src={line.image.url}
                  alt={line.image.alt}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="line-clamp-2 text-xs font-medium text-foreground">
                  {line.productName}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {line.variant.color}
                  {line.variant.model ? ` · ${line.variant.model}` : ""}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatNumber(line.quantity)} عدد
                </p>
              </div>
              <p className="shrink-0 text-xs font-bold text-primary">
                {formatPrice(line.lineTotal)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        {applied ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-primary/20 bg-secondary px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-dark">
                کد تخفیف اعمال شد
              </p>
              <p
                className="truncate text-sm font-bold text-primary"
                dir="ltr"
              >
                {applied.code}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={pending}
            >
              <X className="size-4" aria-hidden="true" />
              حذف
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor={inputId}>کد تخفیف</Label>
            <div className="flex gap-2">
              <Input
                id={inputId}
                type="text"
                dir="ltr"
                autoComplete="off"
                placeholder="DISCOUNT"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={handleCodeKeyDown}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                disabled={pending}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleApply}
                disabled={pending}
              >
                {pending ? "در حال بررسی..." : "اعمال"}
              </Button>
            </div>
          </div>
        )}

        <div aria-live="polite" aria-atomic="true">
          {error ? (
            <p
              id={errorId}
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-6 text-destructive"
            >
              {error}
            </p>
          ) : null}
        </div>

        <input type="hidden" name="discountCode" value={applied?.code ?? ""} />
      </div>

      <FreeShippingHint
        subtotal={subtotal}
        amountToFreeShipping={amountToFreeShipping}
      />

      <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">جمع کالاها</dt>
          <dd className="font-medium text-foreground">
            {formatPrice(subtotal)}
          </dd>
        </div>
        {discountAmount > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">
              تخفیف
              {applied ? (
                <span className="ms-1 text-[11px]" dir="ltr">
                  ({applied.code})
                </span>
              ) : null}
            </dt>
            <dd className="font-medium text-primary">
              {formatPrice(discountAmount)}
            </dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">هزینه ارسال</dt>
          <dd className="font-medium text-foreground">
            {shippingCost === 0 ? "رایگان" : formatPrice(shippingCost)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <dt className="font-bold text-dark">مبلغ کل</dt>
          <dd className="font-bold text-primary">{formatPrice(total)}</dd>
        </div>
      </dl>

      <Button asChild variant="ghost">
        <Link href="/cart">
          <ChevronRight className="size-4" aria-hidden="true" />
          بازگشت به سبد خرید
        </Link>
      </Button>
    </div>
  );
}
