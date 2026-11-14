import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { PaymentStatus } from "@/generated/prisma/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/admin/data-table";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/order-status";
import { cn } from "@/lib/utils";
import {
  ADMIN_ORDER_RANGES,
  ADMIN_ORDER_STATUSES,
  ADMIN_PAYMENT_STATUSES,
  buildAdminOrdersHref,
  listAdminOrders,
  parseAdminOrdersQuery,
  type AdminOrderListItem,
  type AdminOrderRange,
  type AdminOrderStatus,
  type AdminOrdersQuery,
  type AdminPaymentStatus,
} from "@/server/admin-orders";

export const metadata: Metadata = {
  title: "سفارش‌ها | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

const statusLabels: Record<AdminOrderStatus, string> = {
  all: "همه وضعیت‌ها",
  ...ORDER_STATUS_LABELS,
};

const paymentStatusLabels: Record<AdminPaymentStatus, string> = {
  all: "همه پرداخت‌ها",
  ...PAYMENT_STATUS_LABELS,
};

const rangeLabels: Record<AdminOrderRange, string> = {
  all: "همه زمان‌ها",
  today: "امروز",
  "7d": "۷ روز اخیر",
  "30d": "۳۰ روز اخیر",
};

const paymentStyles: Record<PaymentStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-900",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-900",
  FAILED: "border-destructive/30 bg-destructive/5 text-destructive",
  REFUNDED: "border-sky-200 bg-sky-50 text-sky-900",
};

const columns: DataTableColumn[] = [
  { key: "orderNumber", label: "شماره سفارش" },
  { key: "date", label: "تاریخ" },
  { key: "customer", label: "مشتری" },
  { key: "items", label: "اقلام" },
  { key: "total", label: "مبلغ کل" },
  { key: "status", label: "وضعیت سفارش" },
  { key: "payment", label: "وضعیت پرداخت" },
];

const pageLinkClass =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-border bg-card px-2.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function AdminOrdersPage({
  searchParams,
}: PageProps<"/admin/orders">) {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="سفارش‌ها"
        description="مشاهدهٔ سفارش‌های فروشگاه، پیگیری پرداخت و تغییر وضعیت آن‌ها."
      />

      <Suspense fallback={<OrdersFallback />}>
        <OrdersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrdersContent({
  searchParams,
}: {
  searchParams: PageProps<"/admin/orders">["searchParams"];
}) {
  const params = await searchParams;
  const query = parseAdminOrdersQuery(params);

  let result;

  try {
    result = await listAdminOrders(query);
  } catch (error) {
    unstable_rethrow(error);

    return (
      <EmptyState
        title="بارگذاری سفارش‌ها ناموفق بود"
        description="ارتباط با سرور برقرار نشد. صفحه را دوباره بارگذاری کنید."
        action={
          <Button asChild>
            <Link href="/admin/orders">تلاش دوباره</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <OrdersFilters query={query} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {result.total > 0
            ? `${formatNumber(result.total)} سفارش`
            : "سفارشی پیدا نشد"}
        </p>
        {hasActiveFilters(query) ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/orders">پاک کردن فیلترها</Link>
          </Button>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        isEmpty={result.items.length === 0}
        caption="فهرست سفارش‌ها"
        empty={
          hasActiveFilters(query) ? (
            <EmptyState
              title="سفارشی با این فیلترها پیدا نشد"
              description="عبارت جستجو، وضعیت، پرداخت یا بازهٔ زمانی را تغییر دهید."
              action={
                <Button asChild>
                  <Link href="/admin/orders">پاک کردن فیلترها</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="هنوز سفارشی ثبت نشده است"
              description="سفارش‌های مشتریان پس از ثبت در این بخش نمایش داده می‌شوند."
            />
          )
        }
      >
        {result.items.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
      </DataTable>

      <OrdersPagination query={query} totalPages={result.totalPages} />
    </div>
  );
}

function hasActiveFilters(query: AdminOrdersQuery): boolean {
  return Boolean(query.q) || Boolean(query.status) || Boolean(query.paymentStatus) || query.range !== "all";
}

function OrdersFilters({ query }: { query: AdminOrdersQuery }) {
  return (
    <form
      action="/admin/orders"
      method="get"
      role="search"
      className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_10rem_auto] lg:items-end"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="orders-search" className="text-sm font-medium text-dark">
          جستجو
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="orders-search"
            key={query.q ?? "all"}
            type="search"
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="شماره سفارش، نام گیرنده یا موبایل..."
            className="ps-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="orders-status" className="text-sm font-medium text-dark">
          وضعیت سفارش
        </label>
        <select
          id="orders-status"
          name="status"
          defaultValue={query.status ?? "all"}
          className="h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          {ADMIN_ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="orders-payment"
          className="text-sm font-medium text-dark"
        >
          وضعیت پرداخت
        </label>
        <select
          id="orders-payment"
          name="paymentStatus"
          defaultValue={query.paymentStatus ?? "all"}
          className="h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          {ADMIN_PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {paymentStatusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="orders-range" className="text-sm font-medium text-dark">
          بازهٔ زمانی
        </label>
        <select
          id="orders-range"
          name="range"
          defaultValue={query.range}
          className="h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          {ADMIN_ORDER_RANGES.map((range) => (
            <option key={range} value={range}>
              {rangeLabels[range]}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" className="lg:mb-0">
        اعمال فیلتر
      </Button>
    </form>
  );
}

function OrderRow({ order }: { order: AdminOrderListItem }) {
  return (
    <tr className="border-b border-border align-middle last:border-0">
      <td className="whitespace-nowrap px-4 py-3">
        <Link
          href={`/admin/orders/${order.orderNumber}`}
          dir="ltr"
          className="inline-block font-medium text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {order.orderNumber}
        </Link>
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
        {formatDate(order.createdAt)}
      </td>

      <td className="px-4 py-3">
        <p className="font-medium text-dark">{order.customerName}</p>
        <p className="text-xs text-muted-foreground" dir="ltr">
          {order.customerMobile}
        </p>
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
        {formatNumber(order.itemCount)} قلم
      </td>

      <td className="whitespace-nowrap px-4 py-3 font-medium">
        {formatPrice(order.total)}
      </td>

      <td className="px-4 py-3">
        <OrderStatusBadge status={order.status} />
      </td>

      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
            paymentStyles[order.paymentStatus]
          )}
        >
          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
        </span>
      </td>
    </tr>
  );
}

function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([
    1,
    total,
    current - 1,
    current,
    current + 1,
  ]);
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
  query,
  totalPages,
}: {
  query: AdminOrdersQuery;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const current = Math.min(query.page, totalPages);

  return (
    <nav
      aria-label="صفحه‌بندی سفارش‌ها"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {current > 1 ? (
        <Link
          href={buildAdminOrdersHref(query, { page: current - 1 })}
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

      {pageWindow(current, totalPages).map((page, index) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden="true"
            className="px-1 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildAdminOrdersHref(query, { page })}
            aria-current={page === current ? "page" : undefined}
            className={cn(
              pageLinkClass,
              page === current &&
                "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {formatNumber(page)}
          </Link>
        )
      )}

      {current < totalPages ? (
        <Link
          href={buildAdminOrdersHref(query, { page: current + 1 })}
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

function OrdersFallback() {
  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" role="status">
        در حال بارگذاری سفارش‌ها
      </p>
      <div
        className="h-28 animate-pulse rounded-lg border border-border bg-muted/60 motion-reduce:animate-none"
        aria-hidden="true"
      />
      <div
        className="h-72 animate-pulse rounded-lg border border-border bg-muted/60 motion-reduce:animate-none"
        aria-hidden="true"
      />
    </div>
  );
}
