import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import {
  CheckCircle2,
  Circle,
  CreditCard,
  MapPin,
  Package,
  UserRound,
  XCircle,
} from "lucide-react";
import type { OrderStatus } from "@/generated/prisma/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderStatusActions } from "@/components/admin/order-status-actions";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { EmptyState } from "@/components/empty-state";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { Button } from "@/components/ui/button";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STEPS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { getAllowedOrderStatuses, getAdminOrder } from "@/server/admin-orders";

export const metadata: Metadata = {
  title: "جزئیات سفارش | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminOrderDetailPage({
  params,
}: PageProps<"/admin/orders/[orderNumber]">) {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="جزئیات سفارش"
        description="بررسی کامل سفارش، مشتری، اقلام و تغییر وضعیت."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/orders">بازگشت به سفارش‌ها</Link>
          </Button>
        }
      />

      <Suspense fallback={<OrderDetailFallback />}>
        <OrderDetailContent params={params} />
      </Suspense>
    </div>
  );
}

async function OrderDetailContent({
  params,
}: {
  params: PageProps<"/admin/orders/[orderNumber]">["params"];
}) {
  const { orderNumber } = await params;

  let order;

  try {
    order = await getAdminOrder(orderNumber);
  } catch (error) {
    unstable_rethrow(error);

    return (
      <EmptyState
        title="بارگذاری سفارش ناموفق بود"
        description="ارتباط با سرور برقرار نشد. صفحه را دوباره بارگذاری کنید."
        action={
          <Button asChild>
            <Link href={`/admin/orders/${orderNumber}`}>تلاش دوباره</Link>
          </Button>
        }
      />
    );
  }

  if (!order) {
    notFound();
  }

  const allowedStatuses = getAllowedOrderStatuses(order.status);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-xl font-bold text-dark sm:text-2xl">
            سفارش{" "}
            <span dir="ltr" className="inline-block">
              {order.orderNumber}
            </span>
          </h2>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          تاریخ ثبت: {formatDate(order.createdAt)}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div className="flex flex-col gap-6">
          <section
            aria-label="اقلام سفارش"
            className="rounded-lg border border-border bg-card px-5 sm:px-6"
          >
            <h3 className="border-b border-border py-4 font-heading text-lg font-bold text-dark">
              اقلام سفارش
            </h3>

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
            <h3 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-dark">
              <MapPin className="size-4 text-primary" aria-hidden="true" />
              نشانی ارسال
            </h3>
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
            aria-label="مشتری"
            className="rounded-lg border border-border bg-card p-5"
          >
            <h3 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold text-dark">
              <UserRound className="size-4 text-primary" aria-hidden="true" />
              مشتری
            </h3>
            <p className="text-sm font-medium text-foreground">
              {order.customer.name}
            </p>
            <p className="text-sm text-muted-foreground" dir="ltr">
              {order.customer.mobile}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href={`/admin/customers/${order.customer.id}`}>
                مشاهدهٔ پروفایل مشتری
              </Link>
            </Button>
          </section>

          <section
            aria-label="خلاصه پرداخت"
            className="rounded-lg border border-border border-t-2 border-t-primary bg-card p-5 shadow-sm"
          >
            <h3 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-dark">
              <CreditCard className="size-4 text-primary" aria-hidden="true" />
              خلاصه پرداخت
            </h3>

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
            <h3 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-dark">
              <Package className="size-4 text-primary" aria-hidden="true" />
              وضعیت سفارش
            </h3>
            <StatusTimeline status={order.status} />
          </section>

          <section
            aria-label="تغییر وضعیت سفارش"
            className="rounded-lg border border-border bg-card p-5"
          >
            <h3 className="mb-3 font-heading text-lg font-bold text-dark">
              تغییر وضعیت
            </h3>
            <OrderStatusActions
              orderId={order.id}
              paymentStatus={order.paymentStatus}
              allowedStatuses={allowedStatuses}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}

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

function OrderDetailFallback() {
  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" role="status">
        در حال بارگذاری سفارش
      </p>
      <div
        className="h-16 animate-pulse rounded-lg border border-border bg-muted/60 motion-reduce:animate-none"
        aria-hidden="true"
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div
          className="h-80 animate-pulse rounded-lg border border-border bg-muted/60 motion-reduce:animate-none"
          aria-hidden="true"
        />
        <div
          className="h-80 animate-pulse rounded-lg border border-border bg-muted/60 motion-reduce:animate-none"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
