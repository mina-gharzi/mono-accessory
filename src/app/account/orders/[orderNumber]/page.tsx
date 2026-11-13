import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  CreditCard,
  MapPin,
  Package,
  XCircle,
} from "lucide-react";
import { OrderCancelDialog } from "@/components/account/order-cancel-dialog";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { Button } from "@/components/ui/button";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STEPS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/order-status";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/client";
import { requireUser } from "@/server/auth/session";
import { getOrderForUser } from "@/server/orders";

export const instant = false;

export const metadata: Metadata = {
  title: "جزئیات سفارش | مونو اکسسوری",
  robots: {
    index: false,
    follow: false,
  },
};

type OrderPageProps = {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ payment?: string | string[] }>;
};

function StatusTimeline({ status }: { status: OrderStatus }) {
  const currentIndex = (ORDER_STATUS_STEPS as readonly OrderStatus[]).indexOf(
    status
  );

  return (
    <ol className="flex flex-col gap-3">
      {ORDER_STATUS_STEPS.map((step, index) => {
        const done = currentIndex >= index;

        return (
          <li key={step} className="flex items-center gap-2.5 text-sm">
            {done ? (
              <CheckCircle2
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
            ) : (
              <Circle
                className="size-4 shrink-0 text-muted-foreground/40"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                done ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {ORDER_STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}

      {status === "CANCELLED" ? (
        <li className="flex items-center gap-2.5 text-sm text-destructive">
          <XCircle className="size-4 shrink-0" aria-hidden="true" />
          <span className="font-medium">{ORDER_STATUS_LABELS.CANCELLED}</span>
        </li>
      ) : null}
    </ol>
  );
}

export default async function OrderPage({
  params,
  searchParams,
}: OrderPageProps) {
  const user = await requireUser();
  const { orderNumber } = await params;
  const rawPayment = (await searchParams).payment;
  const payment = typeof rawPayment === "string" ? rawPayment : "";
  const order = await getOrderForUser(orderNumber, user.id);

  if (!order) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-[11px] font-medium tracking-[0.35em] text-primary">
          MONO ORDER
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-dark sm:text-3xl">
            سفارش{" "}
            <span dir="ltr" className="inline-block">
              {order.orderNumber}
            </span>
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          تاریخ ثبت: {formatDate(order.createdAt)}
        </p>
      </header>

      {payment === "success" && order.paymentStatus === "PAID" ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm leading-6 text-primary"
        >
          <CheckCircle2
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          پرداخت با موفقیت انجام شد و سفارش شما نهایی شد.
        </div>
      ) : null}

      {payment === "error" ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive"
        >
          <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          پرداخت انجام نشد. اگر سفارش هنوز در انتظار پرداخت است، دوباره تلاش
          کنید.
        </div>
      ) : null}

      {order.status === "CANCELLED" ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive"
        >
          <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          این سفارش لغو شده است و مبلغی پرداخت نشده است.
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10">
        <div className="flex flex-col gap-6">
          <section
            aria-label="اقلام سفارش"
            className="rounded-lg border border-border bg-card px-5 sm:px-6"
          >
            <h2 className="border-b border-border py-4 font-heading text-lg font-bold text-dark">
              اقلام سفارش
            </h2>

            <ul>
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 border-b border-border py-4 last:border-b-0 sm:gap-4"
                >
                  <Link
                    href={`/product/${item.productSlug}`}
                    aria-label={`مشاهدهٔ ${item.productName}`}
                    className="relative size-20 shrink-0 overflow-hidden rounded-md bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:size-24"
                  >
                    <ProductImagePlaceholder iconClassName="size-5" />
                    {item.image ? (
                      <Image
                        src={item.image.url}
                        alt={item.image.alt}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : null}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      href={`/product/${item.productSlug}`}
                      className="line-clamp-2 text-sm font-medium text-foreground transition-colors hover:text-primary motion-reduce:transition-none"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {item.color}
                      {item.model ? ` · ${item.model}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(item.quantity)} عدد ×{" "}
                      {formatPrice(item.unitPrice)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-primary">
                      {formatPrice(item.lineTotal)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-label="نشانی ارسال"
            className="rounded-lg border border-border bg-card p-5 sm:p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-dark">
              <MapPin className="size-4 text-primary" aria-hidden="true" />
              نشانی ارسال
            </h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">گیرنده:</dt>
                <dd className="text-foreground">{order.recipientName}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">موبایل:</dt>
                <dd className="text-foreground" dir="ltr">
                  {order.mobile}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">استان و شهر:</dt>
                <dd className="text-foreground">
                  {order.province}، {order.city}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">نشانی:</dt>
                <dd className="text-foreground">{order.address}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">کد پستی:</dt>
                <dd className="text-foreground" dir="ltr">
                  {order.postalCode}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
          <section
            aria-label="خلاصه پرداخت"
            className="rounded-lg border border-border border-t-2 border-t-primary bg-card p-5 shadow-sm"
          >
            <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-dark">
              <CreditCard className="size-4 text-primary" aria-hidden="true" />
              خلاصه پرداخت
            </h2>

            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">جمع کالاها</dt>
                <dd className="font-medium text-foreground">
                  {formatPrice(order.subtotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">هزینه ارسال</dt>
                <dd className="font-medium text-foreground">
                  {order.shippingCost === 0
                    ? "رایگان"
                    : formatPrice(order.shippingCost)}
                </dd>
              </div>
              {order.discountAmount > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">تخفیف</dt>
                  <dd className="font-medium text-foreground">
                    {formatPrice(order.discountAmount)}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <dt className="font-bold text-dark">مبلغ کل</dt>
                <dd className="font-bold text-primary">
                  {formatPrice(order.total)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <dt className="text-muted-foreground">وضعیت پرداخت</dt>
                <dd className="font-medium text-foreground">
                  {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                </dd>
              </div>
            </dl>
          </section>

          <section
            aria-label="وضعیت سفارش"
            className="rounded-lg border border-border bg-card p-5"
          >
            <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-dark">
              <Package className="size-4 text-primary" aria-hidden="true" />
              وضعیت سفارش
            </h2>
            <StatusTimeline status={order.status} />
          </section>

          {order.status === "PENDING" ? (
            <section
              aria-label="اقدام‌های سفارش"
              className="flex flex-col gap-2"
            >
              <Button asChild>
                <Link href={`/payment/mock/${order.orderNumber}`}>
                  <CreditCard className="size-4" aria-hidden="true" />
                  پرداخت سفارش
                </Link>
              </Button>
              <OrderCancelDialog
                orderId={order.id}
                orderNumber={order.orderNumber}
              />
            </section>
          ) : null}

          <Button asChild variant="outline">
            <Link href="/account/orders">بازگشت به سفارش‌ها</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
