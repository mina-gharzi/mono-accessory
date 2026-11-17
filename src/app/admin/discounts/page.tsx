import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/admin/data-table";
import { DiscountActiveButton } from "@/components/admin/discount-active-button";
import { DiscountDeleteButton } from "@/components/admin/discount-delete-button";
import { InlineMessage } from "@/components/admin/inline-message";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  buildAdminDiscountsHref,
  listAdminDiscounts,
  parseAdminDiscountsQuery,
  type AdminDiscount,
  type AdminDiscountsQuery,
  type DiscountStatus,
} from "@/server/discounts";

export const metadata: Metadata = {
  title: "تخفیف‌ها | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

const columns: DataTableColumn[] = [
  { key: "code", label: "کد" },
  { key: "type", label: "نوع" },
  { key: "value", label: "مقدار" },
  { key: "minOrder", label: "حداقل سفارش" },
  { key: "usage", label: "استفاده" },
  { key: "expiresAt", label: "انقضا" },
  { key: "status", label: "وضعیت" },
  { key: "actions", label: "عملیات", className: "text-end" },
];

const statusLabels: Record<DiscountStatus, string> = {
  active: "فعال",
  inactive: "غیرفعال",
  expired: "منقضی",
  exhausted: "تکمیل شده",
};

const statusStyles: Record<DiscountStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-900",
  inactive: "border-border bg-muted text-muted-foreground",
  expired: "border-destructive/30 bg-destructive/5 text-destructive",
  exhausted: "border-amber-200 bg-amber-50 text-amber-900",
};

const pageLinkClass =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-border bg-card px-2.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function AdminDiscountsPage({
  searchParams,
}: PageProps<"/admin/discounts">) {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="تخفیف‌ها"
        description="کدهای تخفیف را ایجاد، ویرایش و غیرفعال کنید. کدها در تسویه حساب اعمال می‌شوند."
        actions={
          <Button asChild>
            <Link href="/admin/discounts/new">
              <Plus className="size-4" aria-hidden="true" />
              کد تخفیف جدید
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<DiscountsFallback />}>
        <DiscountsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function DiscountsContent({
  searchParams,
}: {
  searchParams: PageProps<"/admin/discounts">["searchParams"];
}) {
  const params = await searchParams;
  const query = parseAdminDiscountsQuery(params);

  let result;

  try {
    result = await listAdminDiscounts(query);
  } catch (error) {
    unstable_rethrow(error);

    return (
      <EmptyState
        title="بارگذاری کدهای تخفیف ناموفق بود"
        description="ارتباط با سرور برقرار نشد. صفحه را دوباره بارگذاری کنید."
        action={
          <Button asChild>
            <Link href="/admin/discounts">تلاش دوباره</Link>
          </Button>
        }
      />
    );
  }

  const status = typeof params.status === "string" ? params.status : null;
  const successMessage =
    status === "created"
      ? "کد تخفیف با موفقیت ایجاد شد."
      : status === "updated"
        ? "تغییرات کد تخفیف با موفقیت ذخیره شد."
        : null;

  return (
    <div className="flex flex-col gap-5">
      <InlineMessage tone="success" message={successMessage} />

      <DiscountsFilters query={query} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {result.total > 0
            ? `${formatNumber(result.total)} کد تخفیف`
            : "کد تخفیفی پیدا نشد"}
        </p>
        {query.q ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/discounts">پاک کردن جستجو</Link>
          </Button>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        isEmpty={result.items.length === 0}
        caption="فهرست کدهای تخفیف"
        empty={
          query.q ? (
            <EmptyState
              title="کد تخفیفی با این جستجو پیدا نشد"
              description="عبارت جستجو را تغییر دهید یا همهٔ کدها را ببینید."
              action={
                <Button asChild>
                  <Link href="/admin/discounts">پاک کردن جستجو</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="هنوز کد تخفیفی ثبت نشده است"
              description="با ایجاد اولین کد تخفیف، امکان اعمال آن در تسویه حساب فراهم می‌شود."
              action={
                <Button asChild>
                  <Link href="/admin/discounts/new">ایجاد کد تخفیف</Link>
                </Button>
              }
            />
          )
        }
      >
        {result.items.map((discount) => (
          <DiscountRow key={discount.id} discount={discount} />
        ))}
      </DataTable>

      <DiscountsPagination query={query} totalPages={result.totalPages} />
    </div>
  );
}

function DiscountRow({ discount }: { discount: AdminDiscount }) {
  const deletable = discount.usedCount === 0 && discount.orderCount === 0;

  return (
    <tr className="border-b border-border align-middle last:border-0">
      <td className="px-4 py-3 font-medium text-dark" dir="ltr">
        {discount.code}
      </td>
      <td className="px-4 py-3">
        {discount.type === "PERCENT" ? "درصدی" : "مبلغ ثابت"}
      </td>
      <td className="px-4 py-3">
        {discount.type === "PERCENT"
          ? `${formatNumber(discount.value)}٪`
          : formatPrice(discount.value)}
        {discount.type === "PERCENT" && discount.maxDiscountAmount !== null
          ? ` (تا ${formatPrice(discount.maxDiscountAmount)})`
          : ""}
      </td>
      <td className="px-4 py-3">
        {discount.minOrder > 0 ? formatPrice(discount.minOrder) : "بدون حداقل"}
      </td>
      <td className="px-4 py-3">
        {formatNumber(discount.usedCount)}
        {discount.usageLimit !== null
          ? ` / ${formatNumber(discount.usageLimit)}`
          : " / بدون محدودیت"}
      </td>
      <td className="px-4 py-3">
        {discount.expiresAt ? formatDate(discount.expiresAt) : "بدون انقضا"}
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
            statusStyles[discount.status]
          )}
        >
          {statusLabels[discount.status]}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center justify-end gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/discounts/${discount.id}/edit`}>
                <Pencil className="size-4" aria-hidden="true" />
                ویرایش
              </Link>
            </Button>
            {deletable ? (
              <DiscountDeleteButton
                discountId={discount.id}
                code={discount.code}
              />
            ) : (
              <DiscountActiveButton
                discountId={discount.id}
                isActive={discount.isActive}
              />
            )}
          </div>
          {deletable ? null : (
            <p className="text-[11px] leading-5 text-muted-foreground">
              در سفارش‌ها استفاده شده؛ فقط غیرفعال‌سازی
            </p>
          )}
        </div>
      </td>
    </tr>
  );
}

function DiscountsFilters({ query }: { query: AdminDiscountsQuery }) {
  return (
    <form
      action="/admin/discounts"
      method="get"
      role="search"
      className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="discounts-search"
          className="text-sm font-medium text-dark"
        >
          جستجوی کد تخفیف
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="discounts-search"
            key={query.q ?? "all"}
            type="search"
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="کد تخفیف..."
            className="ps-9"
          />
        </div>
      </div>
      <Button type="submit">جستجو</Button>
    </form>
  );
}

function DiscountsPagination({
  query,
  totalPages,
}: {
  query: AdminDiscountsQuery;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const current = Math.min(query.page, totalPages);

  return (
    <nav
      aria-label="صفحه‌بندی کدهای تخفیف"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {current > 1 ? (
        <Link
          href={buildAdminDiscountsHref(query, { page: current - 1 })}
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

      <span className="px-2 text-sm text-muted-foreground">
        صفحهٔ {formatNumber(current)} از {formatNumber(totalPages)}
      </span>

      {current < totalPages ? (
        <Link
          href={buildAdminDiscountsHref(query, { page: current + 1 })}
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

function DiscountsFallback() {
  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" role="status">
        در حال بارگذاری کدهای تخفیف
      </p>
      <div
        className="h-24 animate-pulse rounded-lg border border-border bg-muted/60 motion-reduce:animate-none"
        aria-hidden="true"
      />
      <div
        className="h-72 animate-pulse rounded-lg border border-border bg-muted/60 motion-reduce:animate-none"
        aria-hidden="true"
      />
    </div>
  );
}
