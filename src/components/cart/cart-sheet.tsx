"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ShoppingBag } from "lucide-react";
import { getCartAction } from "@/app/cart/actions";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { FreeShippingHint } from "@/components/cart/free-shipping-hint";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatNumber, formatPrice } from "@/lib/format";
import type { Cart } from "@/server/cart";

type CartSheetContextValue = {
  openCart: () => void;
};

const CartSheetContext = createContext<CartSheetContextValue | null>(null);

type CartSheetStatus = "idle" | "loading" | "ready" | "error";

type CartRequestResult =
  | { key: string; status: "ready"; cart: Cart }
  | { key: string; status: "error" };

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function useCartSheet(): CartSheetContextValue {
  const context = useContext(CartSheetContext);

  if (!context) {
    throw new Error("useCartSheet must be used within CartSheetProvider.");
  }

  return context;
}

export function CartSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const openCart = useCallback(() => {
    setRefreshKey((value) => value + 1);
    setOpen(true);
  }, []);
  const value = useMemo(() => ({ openCart }), [openCart]);

  return (
    <CartSheetContext.Provider value={value}>
      {children}
      <CartSheet
        open={open}
        onOpenChange={setOpen}
        refreshKey={refreshKey}
      />
    </CartSheetContext.Provider>
  );
}

function CartSheet({
  open,
  onOpenChange,
  refreshKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refreshKey: number;
}) {
  const router = useRouter();
  const [result, setResult] = useState<CartRequestResult | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const requestKey = `${refreshKey}:${retryKey}`;

  useEffect(() => {
    if (!open) return;

    let active = true;

    getCartAction()
      .then((nextCart) => {
        if (!active) return;
        setResult({ key: requestKey, status: "ready", cart: nextCart });
      })
      .catch((error: unknown) => {
        if (!active) return;

        if (isRedirectError(error)) {
          router.push("/login?next=%2Fcart");
          return;
        }

        setResult({ key: requestKey, status: "error" });
      });

    return () => {
      active = false;
    };
  }, [open, requestKey, router]);

  const current = result?.key === requestKey ? result : null;
  const status: CartSheetStatus = !open
    ? "idle"
    : current
      ? current.status
      : "loading";
  const cart = current?.status === "ready" ? current.cart : null;

  function handleCartChange(nextCart: Cart) {
    setResult({ key: requestKey, status: "ready", cart: nextCart });
  }

  const hasLines = status === "ready" && cart !== null && cart.lines.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-md gap-0 p-0"
      >
        <SheetHeader className="border-b border-border p-5 pe-12 text-start">
          <SheetTitle className="font-heading text-lg font-bold text-dark">
            سبد خرید
          </SheetTitle>
          <SheetDescription>
            {status === "ready" && cart && cart.count > 0
              ? `${formatNumber(cart.count)} کالا در سبد شما`
              : "مروری بر سبد خرید شما"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5">
          {status === "idle" || status === "loading" ? (
            <CartSheetSkeleton />
          ) : null}

          {status === "error" ? (
            <ErrorState
              className="border-0 bg-transparent px-0 py-10"
              title="بارگذاری سبد خرید ناموفق بود"
              description="مشکلی در دریافت سبد خرید پیش آمد. لطفاً دوباره تلاش کنید."
              onRetry={() => setRetryKey((value) => value + 1)}
            />
          ) : null}

          {status === "ready" && cart ? (
            cart.lines.length === 0 ? (
              <EmptyCart onClose={() => onOpenChange(false)} />
            ) : (
              <div>
                {cart.lines.map((line) => (
                  <CartLineItem
                    key={line.id}
                    line={line}
                    compact
                    onCartChange={handleCartChange}
                  />
                ))}
              </div>
            )
          ) : null}
        </div>

        {hasLines && cart ? (
          <CartSheetFooter cart={cart} onClose={() => onOpenChange(false)} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function CartSheetFooter({
  cart,
  onClose,
}: {
  cart: Cart;
  onClose: () => void;
}) {
  const hasIssues = cart.lines.some((line) => line.status !== "ok");

  return (
    <SheetFooter className="border-t border-border p-5">
      <FreeShippingHint
        subtotal={cart.totals.subtotal}
        amountToFreeShipping={cart.totals.amountToFreeShipping}
      />

      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">جمع کالاها</dt>
          <dd className="font-medium text-foreground">
            {formatPrice(cart.totals.subtotal)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">هزینه ارسال</dt>
          <dd className="font-medium text-foreground">
            {cart.totals.shippingCost === 0
              ? "رایگان"
              : formatPrice(cart.totals.shippingCost)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
          <dt className="font-bold text-dark">مبلغ کل</dt>
          <dd className="font-bold text-primary">
            {formatPrice(cart.totals.total)}
          </dd>
        </div>
      </dl>

      {hasIssues ? (
        <p className="text-xs leading-5 text-destructive">
          برای ادامه، موارد ناموجود یا بیش از موجودی را از سبد حذف یا اصلاح
          کنید.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button asChild variant="outline" onClick={onClose}>
          <Link href="/cart">مشاهده سبد خرید</Link>
        </Button>
        {hasIssues ? (
          <Button type="button" size="lg" disabled>
            ادامه به پرداخت
          </Button>
        ) : (
          <Button asChild size="lg" onClick={onClose}>
            <Link href="/checkout">ادامه به پرداخت</Link>
          </Button>
        )}
      </div>
    </SheetFooter>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-14 text-center">
      <div
        className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary"
        aria-hidden="true"
      >
        <ShoppingBag className="size-5" />
      </div>
      <div>
        <p className="font-heading text-base font-bold text-dark">
          سبد خرید شما خالی است
        </p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          از فروشگاه قطعه‌های مورد علاقه‌تان را انتخاب کنید.
        </p>
      </div>
      <Button asChild onClick={onClose}>
        <Link href="/shop">رفتن به فروشگاه</Link>
      </Button>
    </div>
  );
}

function CartSheetSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <p className="sr-only" role="status">
        در حال بارگذاری سبد خرید
      </p>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex gap-3" aria-hidden="true">
          <div className="size-20 shrink-0 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            <div className="h-10 w-28 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}
