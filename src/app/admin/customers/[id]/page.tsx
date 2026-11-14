import type { Metadata } from "next";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { UserRound } from "lucide-react";
import type { PaymentStatus, Role } from "@/generated/prisma/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/admin/data-table";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { PAYMENT_STATUS_LABELS } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import {
  getCustomer,
  type AdminCustomerOrder,
} from "@/server/admin-customers";

export const metadata: Metadata = {
  title: "جزئیات مشتری | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

const roleLabels: Record<Role, string> = {
  ADMIN: "مدیر",
  CUSTOMER: "مشتری",
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
  { key: "items", label: "اقلام" },
  { key: "total", label: "مبلغ کل" },
  { key: "status", label: "وضعیت سفارش" },
  { key: "payment", label: "وضعیت پرداخت" },
];

export default function AdminCustomerDetailPage({
  params,
}: PageProps<"/admin/customers/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="جزئیات مشتری"
        description="پروفایل مشتری و سابقهٔ سفارش‌های او."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/customers">بازگشت به مشتریان</Link>
          </Button>
        }
      />

      <Suspense fallback={<CustomerDetailFallback />}>
        <CustomerDetailContent params={params} />
      </Suspense>
    </div>
  );
}

async function CustomerDetailContent({
  params,
}: {
  params: PageProps<"/admin/customers/[id]">["params"];
}) {
  const { id } = await params;

  let customer;

  try {
    customer = await getCustomer(id);
  } catch (error) {
    unstable_rethrow(error);

    return (
      <EmptyState
        title="بارگذاری مشتری ناموفق بود"
        description="ارتباط با سرور برقرار نشد. صفحه را دوباره بارگذاری کنید."
        action={
          <Button asChild>
            <Link href={`/admin/customers/${id}`}>تلاش دوباره</Link>
          </Button>
        }
      />
    );
  }

  if (!customer) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="پروفایل مشتری"
        className="rounded-lg border border-border border-t-2 border-t-primary bg-card p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <UserRound className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-xl font-bold text-dark">
                {customer.name}
              </h2>
              <p className="text-sm text-muted-foreground" dir="ltr">
                {customer.mobile}
              </p>
            </div>
          </div>

          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
              customer.role === "ADMIN"
                ? "border-primary/20 bg-secondary text-primary"
                : "border-border bg-muted text-muted-foreground"
            )}
          >
            {roleLabels[customer.role]}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">تاریخ عضویت</dt>
            <dd className="font-medium text-foreground">
              {formatDate(customer.createdAt)}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">تعداد سفارش</dt>
            <dd className="font-medium text-foreground">
              {formatNumber(customer.orderCount)} سفارش
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">مجموع خرید</dt>
            <dd className="font-medium text-primary">
              {formatPrice(customer.totalSpent)}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">آخرین سفارش</dt>
            <dd className="font-medium text-foreground">
              {customer.lastOrderAt
                ? formatDate(customer.lastOrderAt)
                : "بدون سفارش"}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-label="سفارش‌های مشتری" className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold text-dark">
          سفارش‌های مشتری
        </h2>

        <DataTable
          columns={columns}
          isEmpty={customer.orders.length === 0}
          caption="سفارش‌های مشتری"
          empty={
            <EmptyState
              title="این مشتری هنوز سفارشی ثبت نکرده است"
              description="سفارش‌های مشتری پس از ثبت در این بخش نمایش داده می‌شوند."
            />
          }
        >
          {customer.orders.map((order) => (
            <CustomerOrderRow key={order.id} order={order} />
          ))}
        </DataTable>
      </section>
    </div>
  );
}

function CustomerOrderRow({ order }: { order: AdminCustomerOrder }) {
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

function CustomerDetailFallback() {
  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" role="status">
        در حال بارگذاری مشتری
      </p>
      <div
        className="h-48 animate-pulse rounded-lg border border-border bg-muted/60 motion-reduce:animate-none"
        aria-hidden="true"
      />
      <div
        className="h-64 animate-pulse rounded-lg border border-border bg-muted/60 motion-reduce:animate-none"
        aria-hidden="true"
      />
    </div>
  );
}
