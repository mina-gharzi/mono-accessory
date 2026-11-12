import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { FreeShippingHint } from "@/components/cart/free-shipping-hint";
import { ShippingForm } from "@/components/checkout/shipping-form";
import { Container } from "@/components/container";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { Button } from "@/components/ui/button";
import { formatNumber, formatPrice } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import { getCart } from "@/server/cart";
import { getCheckoutDefaults, type ShippingInput } from "@/server/orders";

export const instant = false;

export const metadata: Metadata = {
  title: "تسویه حساب | مونو اکسسوری",
  description: "اطلاعات ارسال و خلاصه سفارش.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckoutPage() {
  const user = await requireUser();
  const [cart, lastOrder] = await Promise.all([
    getCart(user.id),
    getCheckoutDefaults(user.id),
  ]);

  if (cart.lines.length === 0 || cart.lines.some((line) => line.status !== "ok")) {
    redirect("/cart");
  }

  const defaults: ShippingInput = {
    recipientName: lastOrder?.recipientName || user.name,
    mobile: lastOrder?.mobile || user.mobile,
    province: lastOrder?.province ?? "",
    city: lastOrder?.city ?? "",
    address: lastOrder?.address ?? "",
    postalCode: lastOrder?.postalCode ?? "",
  };

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 sm:py-14">
      <header className="flex flex-col gap-1">
        <p className="text-[11px] font-medium tracking-[0.35em] text-primary">
          MONO CHECKOUT
        </p>
        <h1 className="font-heading text-2xl font-bold text-dark sm:text-3xl">
          تسویه حساب
        </h1>
        <p className="text-sm leading-7 text-muted-foreground">
          اطلاعات گیرنده و نشانی ارسال را بررسی کنید.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
        <section
          aria-label="اطلاعات ارسال"
          className="rounded-lg border border-border bg-card p-5 sm:p-6"
        >
          <h2 className="mb-5 font-heading text-lg font-bold text-dark">
            اطلاعات ارسال
          </h2>
          <ShippingForm defaults={defaults} />
        </section>

        <aside className="lg:sticky lg:top-24">
          <div className="flex flex-col gap-5 rounded-lg border border-border border-t-2 border-t-primary bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-heading text-lg font-bold text-dark">
              خلاصه سفارش
            </h2>

            <ul className="flex flex-col gap-3">
              {cart.lines.map((line) => (
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

            <FreeShippingHint
              subtotal={cart.totals.subtotal}
              amountToFreeShipping={cart.totals.amountToFreeShipping}
            />

            <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
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

            <Button asChild variant="ghost">
              <Link href="/cart">
                <ChevronRight className="size-4" aria-hidden="true" />
                بازگشت به سبد خرید
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </Container>
  );
}
