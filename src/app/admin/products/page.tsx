import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Plus,
  Search,
  Star,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/admin/data-table";
import { EmptyState } from "@/components/empty-state";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ADMIN_PRODUCT_STATUSES,
  LOW_STOCK_MAX,
  buildAdminProductsHref,
  listAdminProducts,
  listProductFormOptions,
  parseAdminProductsQuery,
  type AdminProductListItem,
  type AdminProductStatus,
  type AdminProductsQuery,
  type ProductFormOptions,
} from "@/server/admin-products";

export const metadata: Metadata = {
  title: "محصولات | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

const statusLabels: Record<AdminProductStatus, string> = {
  all: "همه وضعیت‌ها",
  active: "فعال",
  inactive: "غیرفعال",
  "out-of-stock": "ناموجود",
  "low-stock": "کم‌موجود",
};

const columns: DataTableColumn[] = [
  { key: "image", label: "تصویر" },
  { key: "name", label: "نام" },
  { key: "category", label: "دسته‌بندی" },
  { key: "price", label: "قیمت" },
  { key: "stock", label: "موجودی" },
  { key: "status", label: "وضعیت" },
  { key: "actions", label: "عملیات", className: "text-end" },
];

const pageLinkClass =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-border bg-card px-2.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="محصولات"
        description="مدیریت محصولات، تصاویر، قیمت و موجودی. جستجو و فیلترها در نشانی صفحه ذخیره می‌شوند."
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="size-4" aria-hidden="true" />
              محصول جدید
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<ProductsFallback />}>
        <ProductsTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProductsTable({
  searchParams,
}: {
  searchParams: PageProps<"/admin/products">["searchParams"];
}) {
  const params = await searchParams;
  const query = parseAdminProductsQuery(params);

  let data;

  try {
    data = await Promise.all([
      listAdminProducts(query),
      listProductFormOptions(),
    ]);
  } catch (error) {
    unstable_rethrow(error);

    return (
      <EmptyState
        title="بارگذاری محصولات ناموفق بود"
        description="ارتباط با سرور برقرار نشد. صفحه را دوباره بارگذاری کنید."
        action={
          <Button asChild>
            <Link href="/admin/products">تلاش دوباره</Link>
          </Button>
        }
      />
    );
  }

  const [result, options] = data;

  return (
    <div className="flex flex-col gap-5">
      <ProductsFilters query={query} options={options} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {result.total > 0
            ? `${formatNumber(result.total)} محصول`
            : "محصولی پیدا نشد"}
        </p>
        {hasActiveFilters(query) ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/products">پاک کردن فیلترها</Link>
          </Button>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        isEmpty={result.items.length === 0}
        caption="فهرست محصولات"
        empty={
          hasActiveFilters(query) ? (
            <EmptyState
              title="محصولی با این فیلترها پیدا نشد"
              description="عبارت جستجو یا فیلترهای دسته‌بندی و وضعیت را تغییر دهید."
              action={
                <Button asChild>
                  <Link href="/admin/products">پاک کردن فیلترها</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="هنوز محصولی ثبت نشده است"
              description="با ایجاد اولین محصول، آن را با تصویر، قیمت و واریانت‌ها در فروشگاه نمایش دهید."
              action={
                <Button asChild>
                  <Link href="/admin/products/new">ایجاد محصول</Link>
                </Button>
              }
            />
          )
        }
      >
        {result.items.map((product) => (
          <ProductRow key={product.id} product={product} />
        ))}
      </DataTable>

      <ProductsPagination query={query} totalPages={result.totalPages} />
    </div>
  );
}

function hasActiveFilters(query: AdminProductsQuery): boolean {
  return Boolean(query.q) || Boolean(query.categoryId) || query.status !== "all";
}

function ProductsFilters({
  query,
  options,
}: {
  query: AdminProductsQuery;
  options: ProductFormOptions;
}) {
  return (
    <form
      action="/admin/products"
      method="get"
      role="search"
      className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_14rem_12rem_auto] lg:items-end"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="products-search" className="text-sm font-medium text-dark">
          جستجو
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="products-search"
            key={query.q ?? "all"}
            type="search"
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="نام یا اسلاگ محصول..."
            className="ps-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="products-category"
          className="text-sm font-medium text-dark"
        >
          دسته‌بندی
        </label>
        <select
          id="products-category"
          name="categoryId"
          defaultValue={query.categoryId ?? ""}
          className="h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <option value="">همه دسته‌بندی‌ها</option>
          {options.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="products-status" className="text-sm font-medium text-dark">
          وضعیت
        </label>
        <select
          id="products-status"
          name="status"
          defaultValue={query.status}
          className="h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          {ADMIN_PRODUCT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
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

function ProductRow({ product }: { product: AdminProductListItem }) {
  const stockTone =
    product.totalStock === 0
      ? "border-destructive/30 bg-destructive/5 text-destructive"
      : product.totalStock <= LOW_STOCK_MAX
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
        : "border-primary/20 bg-secondary text-primary";

  return (
    <tr className="border-b border-border align-middle last:border-0">
      <td className="px-4 py-3">
        {product.image ? (
          <Image
            src={product.image.url}
            alt=""
            width={48}
            height={48}
            unoptimized
            className="size-12 rounded-md border border-border object-cover"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-md border border-dashed border-border bg-muted text-muted-foreground">
            <ImageOff className="size-4" aria-hidden="true" />
          </div>
        )}
      </td>

      <td className="px-4 py-3">
        <p className="font-medium text-dark">{product.name}</p>
        <p className="text-xs text-muted-foreground" dir="ltr">
          {product.slug}
        </p>
      </td>

      <td className="px-4 py-3 text-muted-foreground">
        {product.category.name}
      </td>

      <td className="whitespace-nowrap px-4 py-3">
        {formatPrice(product.price)}
      </td>

      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            stockTone
          )}
        >
          {product.totalStock === 0
            ? `${formatNumber(0)} - ناموجود`
            : product.totalStock <= LOW_STOCK_MAX
              ? `${formatNumber(product.totalStock)} - کم‌موجود`
              : formatNumber(product.totalStock)}
        </span>
        <p className="mt-1 text-xs text-muted-foreground">
          {product.variantCount > 0
            ? `${formatNumber(product.variantCount)} واریانت`
            : "بدون واریانت"}
        </p>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
              product.isActive
                ? "border-primary/20 bg-secondary text-primary"
                : "border-border bg-muted text-muted-foreground"
            )}
          >
            {product.isActive ? "فعال" : "غیرفعال"}
          </span>
          {product.isFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">
              <Star className="size-3" aria-hidden="true" />
              ویژه
            </span>
          ) : null}
        </div>
      </td>

      <td className="px-4 py-3">
        <ProductRowActions
          productId={product.id}
          productName={product.name}
          isActive={product.isActive}
        />
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

function ProductsPagination({
  query,
  totalPages,
}: {
  query: AdminProductsQuery;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const current = Math.min(query.page, totalPages);

  return (
    <nav
      aria-label="صفحه‌بندی محصولات"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {current > 1 ? (
        <Link
          href={buildAdminProductsHref(query, { page: current - 1 })}
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
            href={buildAdminProductsHref(query, { page })}
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
          href={buildAdminProductsHref(query, { page: current + 1 })}
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

function ProductsFallback() {
  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" role="status">
        در حال بارگذاری محصولات
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
