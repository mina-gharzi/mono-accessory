import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { FreeShippingHint } from "@/components/cart/free-shipping-hint";
import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { formatNumber, formatPrice } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import { getCart } from "@/server/cart";

export const instant = false;

export const metadata: Metadata = {
  title: "سبد خرید | مونو اکسسوری",
  description: "مروری بر اقلام سبد خرید شما.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CartPage() {
  const user = await requireUser();
  const cart = await getCart(user.id);
  const hasIssues = cart.lines.some((line) => line.status !== "ok");

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 sm:py-14">
      <header className="flex flex-col gap-1">
        <p className="text-[11px] font-medium tracking-[0.35em] text-primary">
          MONO CART
        </p>
        <h1 className="font-heading text-2xl font-bold text-dark sm:text-3xl">
          سبد خرید
        </h1>
        {cart.count > 0 ? (
          <p className="text-sm text-muted-foreground">
            {formatNumber(cart.count)} کالا در سبد شما
          </p>
        ) : null}
      </header>

      {cart.lines.length === 0 ? (
        <EmptyState
          title="سبد خرید شما خالی است"
          description="هنوز قطعه‌ای به سبد خرید اضافه نکرده‌اید. از فروشگاه موارد مورد علاقه‌تان را انتخاب کنید."
          action={
            <Button asChild>
              <Link href="/shop">رفتن به فروشگاه</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
          <section
            aria-label="اقلام سبد خرید"
            className="rounded-lg border border-border bg-card px-5 sm:px-6"
          >
            {cart.lines.map((line) => (
              <CartLineItem key={line.id} line={line} />
            ))}
          </section>

          <aside className="lg:sticky lg:top-24">
            <div className="flex flex-col gap-5 rounded-lg border border-border border-t-2 border-t-primary bg-card p-5 shadow-sm sm:p-6">
              <h2 className="font-heading text-lg font-bold text-dark">
                خلاصه سفارش
              </h2>

              <FreeShippingHint
                subtotal={cart.totals.subtotal}
                amountToFreeShipping={cart.totals.amountToFreeShipping}
              />

              <dl className="flex flex-col gap-2 text-sm">
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
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                  <dt className="font-bold text-dark">مبلغ کل</dt>
                  <dd className="font-bold text-primary">
                    {formatPrice(cart.totals.total)}
                  </dd>
                </div>
              </dl>

              {hasIssues ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md bg-destructive/5 p-3 text-xs leading-6 text-destructive"
                >
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  برای ادامه خرید، موارد ناموجود یا بیش از موجودی را از سبد حذف
                  یا اصلاح کنید.
                </div>
              ) : null}

              {hasIssues ? (
                <Button type="button" size="lg" disabled>
                  ادامه به پرداخت
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href="/checkout">ادامه به پرداخت</Link>
                </Button>
              )}

              <Button asChild variant="ghost">
                <Link href="/shop">ادامه خرید</Link>
              </Button>
            </div>
          </aside>
        </div>
      )}
    </Container>
  );
}
