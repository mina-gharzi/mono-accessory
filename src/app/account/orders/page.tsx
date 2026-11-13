import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VALUES,
} from "@/lib/order-status";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/client";
import { requireUser } from "@/server/auth/session";
import { getUserOrders, parseOrdersQuery } from "@/server/orders";

export const instant = false;

export const metadata: Metadata = {
  title: "سفارش‌های من | مونو اکسسوری",
  robots: {
    index: false,
    follow: false,
  },
};

const PATHNAME = "/account/orders";

const chipClass =
  "inline-flex items-center whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none";

const pageLinkClass =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-border bg-card px-2.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none";

function buildOrdersHref(status: OrderStatus | null, page = 1): string {
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `${PATHNAME}?${query}` : PATHNAME;
}

export default async function OrdersPage({
  searchParams,
}: PageProps<"/account/orders">) {
  const user = await requireUser();
  const query = parseOrdersQuery(await searchParams);
  const result = await getUserOrders(user.id, query);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-heading text-xl font-bold text-dark sm:text-2xl">
          سفارش‌های من
        </h2>
        <p className="text-sm leading-7 text-muted-foreground">
          {result.total > 0
            ? `${formatNumber(result.total)} سفارش ثبت شده است.`
            : "سفارش‌های شما اینجا نمایش داده می‌شوند."}
        </p>
      </header>

      <nav
        aria-label="فیلتر وضعیت سفارش"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        <Link
          href={buildOrdersHref(null)}
          aria-current={result.status === null ? "page" : undefined}
          className={cn(
            chipClass,
            result.status === null &&
              "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
          )}
        >
          همه
        </Link>

        {ORDER_STATUS_VALUES.map((status) => (
          <Link
            key={status}
            href={buildOrdersHref(status)}
            aria-current={result.status === status ? "page" : undefined}
            className={cn(
              chipClass,
              result.status === status &&
                "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
            )}
          >
            {ORDER_STATUS_LABELS[status]}
          </Link>
        ))}
      </nav>

      {result.items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {result.items.map((order) => (
            <li key={order.id}>
              <Link
                href={`${PATHNAME}/${order.orderNumber}`}
                className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span
                      dir="ltr"
                      className="font-heading text-sm font-bold text-dark"
                    >
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {order.thumbnails.length > 0 ? (
                        order.thumbnails.map((image, index) => (
                          <span
                            key={`${image.url}-${index}`}
                            className="relative size-11 shrink-0 overflow-hidden rounded-md bg-secondary/60"
                          >
                            <Image
                              src={image.url}
                              alt={image.alt}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          </span>
                        ))
                      ) : (
                        <span className="flex size-11 items-center justify-center rounded-md bg-secondary/60 text-muted-foreground">
                          <Package className="size-4" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(order.itemCount)} قلم
                    </span>
                  </div>

                  <span className="font-heading text-base font-bold text-primary">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : result.status ? (
        <EmptyState
          title="سفارشی با این وضعیت پیدا نشد"
          description="برای دیدن همهٔ سفارش‌ها، فیلتر وضعیت را بردارید."
          action={
            <Button asChild variant="outline">
              <Link href={PATHNAME}>نمایش همهٔ سفارش‌ها</Link>
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="هنوز سفارشی ثبت نکرده‌اید"
          description="با انتخاب محصولات مورد علاقه، اولین سفارش خود را ثبت کنید."
          action={
            <Button asChild>
              <Link href="/shop">رفتن به فروشگاه</Link>
            </Button>
          }
        />
      )}

      <OrdersPagination
        page={result.page}
        totalPages={result.totalPages}
        status={result.status}
      />
    </div>
  );
}

function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let previous = 0;

  for (const page of sorted) {
    if (previous && page - previous > 1) {
      result.push("ellipsis");
    }
    result.push(page);
    previous = page;
  }

  return result;
}

function OrdersPagination({
  page,
  totalPages,
  status,
}: {
  page: number;
  totalPages: number;
  status: OrderStatus | null;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="صفحه‌بندی سفارش‌ها"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 ? (
        <Link
          href={buildOrdersHref(status, page - 1)}
          aria-label="صفحهٔ قبلی"
          className={pageLinkClass}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">قبلی</span>
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(pageLinkClass, "pointer-events-none opacity-40")}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">قبلی</span>
        </span>
      )}

      {pageWindow(page, totalPages).map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden="true"
            className="px-1 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildOrdersHref(status, item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              pageLinkClass,
              item === page &&
                "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {formatNumber(item)}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link
          href={buildOrdersHref(status, page + 1)}
          aria-label="صفحهٔ بعدی"
          className={pageLinkClass}
        >
          <span className="hidden sm:inline">بعدی</span>
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(pageLinkClass, "pointer-events-none opacity-40")}
        >
          <span className="hidden sm:inline">بعدی</span>
          <ChevronLeft className="size-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
