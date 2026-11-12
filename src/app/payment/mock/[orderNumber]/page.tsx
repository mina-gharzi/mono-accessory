import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import {
  cancelMockOrder,
  payMockOrder,
} from "@/app/payment/mock/[orderNumber]/actions";
import {
  MockCancelButton,
  MockPayButton,
} from "@/app/payment/mock/[orderNumber]/mock-payment-buttons";
import { Container } from "@/components/container";
import { formatPrice } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import { getOrderForUser } from "@/server/orders";
import { getPaymentProvider } from "@/server/payment";

export const instant = false;

export const metadata: Metadata = {
  title: "درگاه پرداخت آزمایشی | مونو اکسسوری",
  robots: {
    index: false,
    follow: false,
  },
};

type MockPaymentPageProps = {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ ref?: string | string[] }>;
};

export default async function MockPaymentPage({
  params,
  searchParams,
}: MockPaymentPageProps) {
  const user = await requireUser();
  const { orderNumber } = await params;
  const rawReference = (await searchParams).ref;
  const reference = typeof rawReference === "string" ? rawReference : "";
  const order = await getOrderForUser(orderNumber, user.id);

  if (!order) {
    notFound();
  }

  if (
    order.status !== "PENDING" ||
    order.paymentStatus !== "PENDING" ||
    !reference
  ) {
    redirect(`/account/orders/${order.orderNumber}`);
  }

  const provider = getPaymentProvider();
  const verification = await provider.verifyPayment(
    { orderNumber: order.orderNumber, amount: order.total },
    reference
  );

  if (!verification.ok) {
    redirect(`/account/orders/${order.orderNumber}`);
  }

  return (
    <Container className="flex flex-1 items-center justify-center py-12 sm:py-16">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-800 px-5 py-4 text-white">
          <ShieldCheck className="size-5" aria-hidden="true" />
          <p className="font-heading text-base font-bold">
            درگاه پرداخت آزمایشی
          </p>
        </div>

        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div
            role="note"
            className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-900"
          >
            این یک درگاه آزمایشی است؛ هیچ پرداخت واقعی انجام نمی‌شود و مبلغی از
            حساب شما کسر نمی‌گردد.
          </div>

          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-600">شماره سفارش</dt>
              <dd className="font-medium text-slate-900" dir="ltr">
                {order.orderNumber}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
              <dt className="text-slate-600">مبلغ قابل پرداخت</dt>
              <dd className="font-heading text-lg font-bold text-slate-900">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2">
            <form action={payMockOrder}>
              <input type="hidden" name="orderNumber" value={order.orderNumber} />
              <input
                type="hidden"
                name="reference"
                value={verification.reference}
              />
              <MockPayButton />
            </form>

            <form action={cancelMockOrder}>
              <input type="hidden" name="orderNumber" value={order.orderNumber} />
              <MockCancelButton />
            </form>
          </div>

          <p className="text-center text-xs leading-6 text-slate-500">
            با پرداخت موفق، سفارش نهایی می‌شود. با لغو، سفارش لغو و موجودی کالاها
            آزاد می‌شود.
          </p>

          <p className="text-center text-xs leading-6">
            <Link
              href={`/account/orders/${order.orderNumber}`}
              className="rounded-sm text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              مشاهده جزئیات سفارش
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
}
