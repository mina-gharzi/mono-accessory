import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { Role } from "@/generated/prisma/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/admin/data-table";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  buildAdminCustomersHref,
  listCustomers,
  parseAdminCustomersQuery,
  type AdminCustomerListItem,
  type AdminCustomersQuery,
} from "@/server/admin-customers";

export const metadata: Metadata = {
  title: "مشتریان | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

const roleLabels: Record<Role, string> = {
  ADMIN: "مدیر",
  CUSTOMER: "مشتری",
};

const columns: DataTableColumn[] = [
  { key: "name", label: "نام" },
  { key: "mobile", label: "موبایل" },
  { key: "role", label: "نقش" },
  { key: "createdAt", label: "تاریخ عضویت" },
  { key: "orders", label: "تعداد سفارش" },
  { key: "totalSpent", label: "مجموع خرید" },
  { key: "lastOrder", label: "آخرین سفارش" },
];

const pageLinkClass =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-border bg-card px-2.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function AdminCustomersPage({
  searchParams,
}: PageProps<"/admin/customers">) {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="مشتریان"
        description="فهرست مشتریان، تعداد سفارش‌ها و مجموع خرید آن‌ها."
      />

      <Suspense fallback={<CustomersFallback />}>
        <CustomersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CustomersContent({
  searchParams,
}: {
  searchParams: PageProps<"/admin/customers">["searchParams"];
}) {
  const params = await searchParams;
  const query = parseAdminCustomersQuery(params);

  let result;

  try {
    result = await listCustomers(query);
  } catch (error) {
    unstable_rethrow(error);

    return (
      <EmptyState
        title="بارگذاری مشتریان ناموفق بود"
        description="ارتباط با سرور برقرار نشد. صفحه را دوباره بارگذاری کنید."
        action={
          <Button asChild>
            <Link href="/admin/customers">تلاش دوباره</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <CustomersFilters query={query} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {result.total > 0
            ? `${formatNumber(result.total)} مشتری`
            : "مشتری پیدا نشد"}
        </p>
        {query.q ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/customers">پاک کردن جستجو</Link>
          </Button>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        isEmpty={result.items.length === 0}
        caption="فهرست مشتریان"
        empty={
          query.q ? (
            <EmptyState
              title="مشتری با این مشخصات پیدا نشد"
              description="عبارت جستجوی نام یا موبایل را تغییر دهید."
              action={
                <Button asChild>
                  <Link href="/admin/customers">پاک کردن جستجو</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="هنوز مشتری ثبت‌نام نکرده است"
              description="کاربران پس از ثبت‌نام در این بخش نمایش داده می‌شوند."
            />
          )
        }
      >
        {result.items.map((customer) => (
          <CustomerRow key={customer.id} customer={customer} />
        ))}
      </DataTable>

      <CustomersPagination query={query} totalPages={result.totalPages} />
    </div>
  );
}

function CustomersFilters({ query }: { query: AdminCustomersQuery }) {
  return (
    <form
      action="/admin/customers"
      method="get"
      role="search"
      className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="customers-search"
          className="text-sm font-medium text-dark"
        >
          جستجو
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="customers-search"
            key={query.q ?? "all"}
            type="search"
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="نام یا موبایل مشتری..."
            className="ps-9"
          />
        </div>
      </div>

      <Button type="submit" className="sm:mb-0">
        جستجو
      </Button>
    </form>
  );
}

function CustomerRow({ customer }: { customer: AdminCustomerListItem }) {
  return (
    <tr className="border-b border-border align-middle last:border-0">
      <td className="px-4 py-3">
        <Link
          href={`/admin/customers/${customer.id}`}
          className="font-medium text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {customer.name}
        </Link>
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground" dir="ltr">
        {customer.mobile}
      </td>

      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
            customer.role === "ADMIN"
              ? "border-primary/20 bg-secondary text-primary"
              : "border-border bg-muted text-muted-foreground"
          )}
        >
          {roleLabels[customer.role]}
        </span>
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
        {formatDate(customer.createdAt)}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
        {formatNumber(customer.orderCount)} سفارش
      </td>

      <td className="whitespace-nowrap px-4 py-3 font-medium">
        {formatPrice(customer.totalSpent)}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
        {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "بدون سفارش"}
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

function CustomersPagination({
  query,
  totalPages,
}: {
  query: AdminCustomersQuery;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const current = Math.min(query.page, totalPages);

  return (
    <nav
      aria-label="صفحه‌بندی مشتریان"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {current > 1 ? (
        <Link
          href={buildAdminCustomersHref(query, { page: current - 1 })}
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
            href={buildAdminCustomersHref(query, { page })}
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
          href={buildAdminCustomersHref(query, { page: current + 1 })}
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

function CustomersFallback() {
  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" role="status">
        در حال بارگذاری مشتریان
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
