import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { buildShopHref, formatNumber, type ShopQuery } from "@/lib/shop-params";
import { cn } from "@/lib/utils";
import type {
  PriceRange,
  ShopCategory,
  ShopColor,
} from "@/server/products";

type FilterFormProps = {
  id: string;
  pathname: string;
  query: ShopQuery;
  colors: ShopColor[];
  priceRange: PriceRange;
};

const chipBase =
  "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const chipActive = "border-primary bg-primary text-primary-foreground";
const chipIdle =
  "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary";

function filterKey(query: ShopQuery): string {
  return [
    query.q,
    query.category,
    query.collection,
    query.color,
    query.minPrice,
    query.maxPrice,
    query.inStock,
  ].join("|");
}

export function countActiveFilters(query: ShopQuery): number {
  let count = 0;

  if (query.q) count += 1;
  if (query.category) count += 1;
  if (query.collection) count += 1;
  if (query.color) count += 1;
  if (query.minPrice !== null || query.maxPrice !== null) count += 1;
  if (query.inStock) count += 1;

  return count;
}

function clearFiltersHref(pathname: string, query: ShopQuery): string {
  return buildShopHref(pathname, query, {
    q: null,
    category: null,
    collection: null,
    color: null,
    minPrice: null,
    maxPrice: null,
    inStock: false,
  });
}

export function CategoryChips({
  pathname,
  query,
  categories,
}: {
  pathname: string;
  query: ShopQuery;
  categories: ShopCategory[];
}) {
  return (
    <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      <Link
        href={buildShopHref(pathname, query, { category: null })}
        className={cn(chipBase, !query.category ? chipActive : chipIdle)}
      >
        همه
      </Link>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={buildShopHref(pathname, query, { category: category.slug })}
          className={cn(
            chipBase,
            query.category === category.slug ? chipActive : chipIdle
          )}
        >
          {category.name}
          <span className="text-[11px] opacity-70">
            {formatNumber(category.count)}
          </span>
        </Link>
      ))}
    </div>
  );
}

function FilterForm({
  id,
  pathname,
  query,
  colors,
  priceRange,
}: FilterFormProps) {
  return (
    <form
      id={id}
      action={pathname}
      method="get"
      className="flex flex-col gap-6"
    >
      {query.q ? <input type="hidden" name="q" value={query.q} /> : null}
      {query.category ? (
        <input type="hidden" name="category" value={query.category} />
      ) : null}
      {query.collection ? (
        <input type="hidden" name="collection" value={query.collection} />
      ) : null}
      {query.sort !== "newest" ? (
        <input type="hidden" name="sort" value={query.sort} />
      ) : null}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-heading text-sm font-bold text-dark">
          محدوده قیمت
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`${id}-min`}
              className="text-xs text-muted-foreground"
            >
              از
            </Label>
            <Input
              id={`${id}-min`}
              name="minPrice"
              type="number"
              inputMode="numeric"
              min={0}
              max={priceRange.max}
              defaultValue={query.minPrice ?? ""}
              placeholder={formatNumber(priceRange.min)}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`${id}-max`}
              className="text-xs text-muted-foreground"
            >
              تا
            </Label>
            <Input
              id={`${id}-max`}
              name="maxPrice"
              type="number"
              inputMode="numeric"
              min={0}
              max={priceRange.max}
              defaultValue={query.maxPrice ?? ""}
              placeholder={formatNumber(priceRange.max)}
              className="h-10"
            />
          </div>
        </div>
        <p className="text-xs leading-6 text-muted-foreground">
          بازهٔ موجود: {formatNumber(priceRange.min)} تا{" "}
          {formatNumber(priceRange.max)} تومان
        </p>
      </fieldset>

      <div className="border-t border-border/60 pt-5">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2.5">
          <span className="text-sm font-medium text-foreground">
            فقط کالاهای موجود
          </span>
          <input
            type="checkbox"
            name="inStock"
            value="1"
            defaultChecked={query.inStock}
            className="size-4 accent-primary"
          />
        </label>
      </div>

      <fieldset className="flex flex-col gap-3 border-t border-border/60 pt-5">
        <legend className="mb-3 font-heading text-sm font-bold text-dark">
          رنگ
        </legend>
        <div className="flex flex-wrap gap-2">
          <label
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
              !query.color ? chipActive : chipIdle
            )}
          >
            <input
              type="radio"
              name="color"
              value=""
              defaultChecked={!query.color}
              className="sr-only"
            />
            همه
          </label>
          {colors.map(({ color, count }) => (
            <label
              key={color}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
                query.color === color ? chipActive : chipIdle
              )}
            >
              <input
                type="radio"
                name="color"
                value={color}
                defaultChecked={query.color === color}
                className="sr-only"
              />
              {color}
              <span className="opacity-60"> ({formatNumber(count)})</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Link
        href={buildShopHref(pathname, query, {
          color: null,
          minPrice: null,
          maxPrice: null,
          inStock: false,
        })}
        className="text-xs font-medium text-primary underline-offset-4 hover:underline"
      >
        پاک کردن فیلترهای این بخش
      </Link>
    </form>
  );
}

export function DesktopFilters({
  pathname,
  query,
  colors,
  priceRange,
}: Omit<FilterFormProps, "id">) {
  const activeCount = countActiveFilters(query);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-5 flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-bold text-dark">فیلترها</h2>
        {activeCount > 0 ? (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-primary">
            {formatNumber(activeCount)} فعال
          </span>
        ) : null}
      </div>
      <FilterForm
        key={filterKey(query)}
        id="desktop-filters"
        pathname={pathname}
        query={query}
        colors={colors}
        priceRange={priceRange}
      />
      <Button
        type="submit"
        form="desktop-filters"
        className="mt-6 w-full"
      >
        اعمال فیلترها
      </Button>
    </div>
  );
}

export function MobileFilters({
  pathname,
  query,
  colors,
  priceRange,
  activeCount,
}: Omit<FilterFormProps, "id"> & { activeCount: number }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          فیلترها
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {formatNumber(activeCount)}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88%] max-w-sm gap-0 p-0">
        <SheetHeader className="border-b border-border p-5 pe-12 text-start">
          <SheetTitle>فیلترها</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-5">
          <FilterForm
            key={filterKey(query)}
            id="mobile-filters"
            pathname={pathname}
            query={query}
            colors={colors}
            priceRange={priceRange}
          />
        </div>
        <SheetFooter className="border-t border-border">
          <SheetClose asChild>
            <Button type="submit" form="mobile-filters" className="w-full">
              اعمال فیلترها
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function priceLabel(min: number | null, max: number | null): string {
  if (min !== null && max !== null) {
    return `قیمت: ${formatNumber(min)} تا ${formatNumber(max)} تومان`;
  }
  if (min !== null) {
    return `قیمت: از ${formatNumber(min)} تومان`;
  }
  return `قیمت: تا ${formatNumber(max ?? 0)} تومان`;
}

export function ActiveFilters({
  pathname,
  query,
  categories,
}: {
  pathname: string;
  query: ShopQuery;
  categories: ShopCategory[];
}) {
  const chips: { label: string; href: string }[] = [];

  if (query.q) {
    chips.push({
      label: `جستجو: ${query.q}`,
      href: buildShopHref(pathname, query, { q: null }),
    });
  }

  if (query.category) {
    const name =
      categories.find((category) => category.slug === query.category)?.name ??
      query.category;
    chips.push({
      label: `دسته: ${name}`,
      href: buildShopHref(pathname, query, { category: null }),
    });
  }

  if (query.collection) {
    chips.push({
      label: `کالکشن: ${query.collection}`,
      href: buildShopHref(pathname, query, { collection: null }),
    });
  }

  if (query.color) {
    chips.push({
      label: `رنگ: ${query.color}`,
      href: buildShopHref(pathname, query, { color: null }),
    });
  }

  if (query.minPrice !== null || query.maxPrice !== null) {
    chips.push({
      label: priceLabel(query.minPrice, query.maxPrice),
      href: buildShopHref(pathname, query, {
        minPrice: null,
        maxPrice: null,
      }),
    });
  }

  if (query.inStock) {
    chips.push({
      label: "فقط موجود",
      href: buildShopHref(pathname, query, { inStock: false }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {chip.label}
          <X className="size-3.5" aria-hidden="true" />
          <span className="sr-only">حذف فیلتر</span>
        </Link>
      ))}
      <Link
        href={clearFiltersHref(pathname, query)}
        className="rounded-md text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        پاک کردن همه
      </Link>
    </div>
  );
}
