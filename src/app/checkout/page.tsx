import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { ShippingForm } from "@/components/checkout/shipping-form";
import { Container } from "@/components/container";
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

      <ShippingForm
        defaults={defaults}
        summary={
          <CheckoutSummary
            lines={cart.lines}
            subtotal={cart.totals.subtotal}
            shippingCost={cart.totals.shippingCost}
            total={cart.totals.total}
            amountToFreeShipping={cart.totals.amountToFreeShipping}
          />
        }
      />
    </Container>
  );
}
