import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/admin/data-table";
import {
  ReviewApproveButton,
  ReviewDeleteButton,
  ReviewRejectButton,
} from "@/components/admin/review-actions";
import { EmptyState } from "@/components/empty-state";
import { RatingStars } from "@/components/product/rating-stars";
import { ReviewStatusBadge } from "@/components/review-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatNumber } from "@/lib/format";
import { REVIEW_STATUS_LABELS } from "@/lib/review-status";
import { cn } from "@/lib/utils";
import {
  buildAdminReviewsHref,
  listAdminReviews,
  parseAdminReviewsQuery,
  type AdminReviewListItem,
  type AdminReviewStatus,
  type AdminReviewsQuery,
} from "@/server/admin-reviews";

export const metadata: Metadata = {
  title: "دیدگاه‌ها | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

const statusLabels: Record<AdminReviewStatus, string> = {
  all: "همه دیدگاه‌ها",
  ...REVIEW_STATUS_LABELS,
};

const columns: DataTableColumn[] = [
  { key: "product", label: "محصول" },
  { key: "customer", label: "مشتری" },
  { key: "rating", label: "امتیاز" },
  { key: "comment", label: "متن دیدگاه" },
  { key: "date", label: "تاریخ" },
  { key: "status", label: "وضعیت" },
  { key: "actions", label: "عملیات" },
];

const pageLinkClass =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-border bg-card px-2.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const linkClass =
  "font-medium text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function AdminReviewsPage({
  searchParams,
}: PageProps<"/admin/reviews">) {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="دیدگاه‌ها"
        description="بررسی، تأیید یا رد دیدگاه‌های مشتریان."
      />

      <Suspense fallback={<ReviewsFallback />}>
        <ReviewsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ReviewsContent({
  searchParams,
}: {
  searchParams: PageProps<"/admin/reviews">["searchParams"];
}) {
  const params = await searchParams;
  const query = parseAdminReviewsQuery(params);

  let result;

  try {
    result = await listAdminReviews(query);
  } catch (error) {
    unstable_rethrow(error);

    return (
      <EmptyState
        title="بارگذاری دیدگاه‌ها ناموفق بود"
        description="ارتباط با سرور برقرار نشد. صفحه را دوباره بارگذاری کنید."
        action={
          <Button asChild>
            <Link href="/admin/reviews">تلاش دوباره</Link>
          </Button>
        }
      />
    );
  }

  const hasActiveFilters = Boolean(query.q) || query.status !== "PENDING";

  return (
    <div className="flex flex-col gap-5">
      <ReviewsFilters query={query} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {formatNumber(result.pendingCount)} دیدگاه در انتظار تأیید
          {result.total > 0
            ? ` · ${formatNumber(result.total)} دیدگاه در این فهرست`
            : ""}
        </p>
        {hasActiveFilters ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/reviews">پاک کردن فیلترها</Link>
          </Button>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        isEmpty={result.items.length === 0}
        caption="فهرست دیدگاه‌ها"
        empty={
          hasActiveFilters ? (
            <EmptyState
              title="دیدگاهی با این فیلترها پیدا نشد"
              description="عبارت جستجو یا وضعیت دیدگاه را تغییر دهید."
              action={
                <Button asChild>
                  <Link href="/admin/reviews">پاک کردن فیلترها</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="دیدگاهی در انتظار تأیید نیست"
              description="دیدگاه‌های جدید پس از ثبت توسط مشتریان در این بخش نمایش داده می‌شوند."
            />
          )
        }
      >
        {result.items.map((review) => (
          <ReviewRow key={review.id} review={review} />
        ))}
      </DataTable>

      <ReviewsPagination query={query} totalPages={result.totalPages} />
    </div>
  );
}

function ReviewsFilters({ query }: { query: AdminReviewsQuery }) {
  return (
    <form
      action="/admin/reviews"
      method="get"
      role="search"
      className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_12rem_auto] lg:items-end"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="reviews-search"
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
            id="reviews-search"
            key={query.q ?? "all"}
            type="search"
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="نام محصول یا مشتری..."
            className="ps-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="reviews-status"
          className="text-sm font-medium text-dark"
        >
          وضعیت دیدگاه
        </label>
        <select
          id="reviews-status"
          name="status"
          defaultValue={query.status}
          className="h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          {(
            ["PENDING", "APPROVED", "REJECTED", "all"] as const
          ).map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit">اعمال فیلترها</Button>
    </form>
  );
}

function ReviewRow({ review }: { review: AdminReviewListItem }) {
  return (
    <tr className="border-b border-border align-top last:border-0">
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <Link
            href={`/product/${review.productSlug}`}
            className={linkClass}
          >
            {review.productName}
          </Link>
          <Link
            href={`/admin/products/${review.productId}/edit`}
            className="w-fit text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            ویرایش محصول
          </Link>
        </div>
      </td>

      <td className="px-4 py-3">
        <Link
          href={`/admin/customers/${review.customerId}`}
          className={linkClass}
        >
          {review.customerName}
        </Link>
      </td>

      <td className="whitespace-nowrap px-4 py-3">
        <RatingStars rating={review.rating} starClassName="size-3.5" />
      </td>

      <td className="max-w-xs px-4 py-3">
        {review.comment ? (
          <p className="line-clamp-3 text-sm leading-6 text-foreground/80">
            {review.comment}
          </p>
        ) : (
          <span className="text-sm text-muted-foreground">بدون متن</span>
        )}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
        {formatDate(review.createdAt)}
      </td>

      <td className="whitespace-nowrap px-4 py-3">
        <ReviewStatusBadge status={review.status} />
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-wrap items-start gap-2">
          {review.status !== "APPROVED" ? (
            <ReviewApproveButton reviewId={review.id} />
          ) : null}
          {review.status !== "REJECTED" ? (
            <ReviewRejectButton reviewId={review.id} />
          ) : null}
          <ReviewDeleteButton
            reviewId={review.id}
            productName={review.productName}
          />
        </div>
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

function ReviewsPagination({
  query,
  totalPages,
}: {
  query: AdminReviewsQuery;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const current = Math.min(query.page, totalPages);

  return (
    <nav
      aria-label="صفحه‌بندی دیدگاه‌ها"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {current > 1 ? (
        <Link
          href={buildAdminReviewsHref(query, { page: current - 1 })}
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
            href={buildAdminReviewsHref(query, { page })}
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
          href={buildAdminReviewsHref(query, { page: current + 1 })}
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

function ReviewsFallback() {
  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" role="status">
        در حال بارگذاری دیدگاه‌ها
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
