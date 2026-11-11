import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Search } from "lucide-react";
import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/motion/reveal";
import {
  ActiveFilters,
  CategoryChips,
  DesktopFilters,
  MobileFilters,
  countActiveFilters,
} from "@/components/shop/filters";
import { Pagination } from "@/components/shop/pagination";
import {
  ProductGrid,
  ShopResultsSkeleton,
} from "@/components/shop/product-grid";
import { SortSelect } from "@/components/shop/sort-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildShopHref,
  formatNumber,
  hasActiveFilters,
  SHOP_PAGE_SIZE,
  type ShopQuery,
} from "@/lib/shop-params";
import {
  getAvailableColors,
  getCategoriesWithCounts,
  getPriceRange,
  listProducts,
  parseShopQuery,
} from "@/server/products";

export const metadata: Metadata = {
  title: "فروشگاه | مونو اکسسوری",
  description:
    "خرید گردنبند، گوشواره، انگشتر، عینک آفتابی و اکسسوری زنانه از مونو اکسسوری؛ فیلتر بر اساس دسته، رنگ، قیمت و موجودی.",
  alternates: {
    canonical: "/shop",
  },
};

const PATHNAME = "/shop";

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <div className="flex flex-1 flex-col">
      <Container className="flex flex-col gap-8 py-10 sm:py-14">
        <header className="flex flex-col gap-2">
          <p className="text-[11px] font-medium tracking-[0.35em] text-primary">
            MONO SHOP
          </p>
          <h1 className="font-heading text-3xl font-extrabold text-dark sm:text-4xl">
            فروشگاه
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            همهٔ قطعه‌های مونو در یک‌جا؛ با فیلتر دسته، رنگ، قیمت و موجودی انتخاب
            دقیق‌تری داشته باشید.
          </p>
        </header>

        <Suspense fallback={<ShopResultsSkeleton />}>
          <ShopResults searchParams={searchParams} />
        </Suspense>
      </Container>
    </div>
  );
}

async function ShopResults({
  searchParams,
}: Pick<PageProps<"/shop">, "searchParams">) {
  await connection();

  const raw = await searchParams;
  const query = parseShopQuery(raw);

  const [result, categories, colors, priceRange] = await Promise.all([
    listProducts({ ...query, pageSize: SHOP_PAGE_SIZE }),
    getCategoriesWithCounts(),
    getAvailableColors(),
    getPriceRange(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <SearchForm query={query} />

      <CategoryChips pathname={PATHNAME} query={query} categories={categories} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="hidden lg:block lg:w-64 lg:shrink-0">
          <DesktopFilters
            pathname={PATHNAME}
            query={query}
            colors={colors}
            priceRange={priceRange}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-heading text-xl font-extrabold text-dark sm:text-2xl">
                {result.total > 0
                  ? `${formatNumber(result.total)} محصول`
                  : "محصولی پیدا نشد"}
              </h2>
              {query.q ? (
                <p className="text-xs text-muted-foreground">
                  نتایج برای «{query.q}»
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <MobileFilters
                pathname={PATHNAME}
                query={query}
                colors={colors}
                priceRange={priceRange}
                activeCount={countActiveFilters(query)}
              />
              <SortSelect pathname={PATHNAME} query={query} />
            </div>
          </div>

          <ActiveFilters
            pathname={PATHNAME}
            query={query}
            categories={categories}
          />

          {result.items.length > 0 ? (
            <Reveal delay={0.05}>
              <ProductGrid products={result.items} />
            </Reveal>
          ) : (
            <EmptyState
              title="محصولی با این فیلترها پیدا نشد"
              description="فیلترها را تغییر دهید یا همهٔ فیلترها را پاک کنید."
              action={
                hasActiveFilters(query) ? (
                  <Button asChild>
                    <Link
                      href={buildShopHref(PATHNAME, query, {
                        q: null,
                        category: null,
                        collection: null,
                        color: null,
                        minPrice: null,
                        maxPrice: null,
                        inStock: false,
                      })}
                    >
                      پاک کردن فیلترها
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          )}

          <Pagination
            pathname={PATHNAME}
            query={query}
            totalPages={result.totalPages}
          />
        </div>
      </div>
    </div>
  );
}

function SearchForm({ query }: { query: ShopQuery }) {
  return (
    <form
      action={PATHNAME}
      method="get"
      role="search"
      className="relative"
    >
      <Search
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />

      {query.category ? (
        <input type="hidden" name="category" value={query.category} />
      ) : null}
      {query.collection ? (
        <input type="hidden" name="collection" value={query.collection} />
      ) : null}
      {query.color ? (
        <input type="hidden" name="color" value={query.color} />
      ) : null}
      {query.minPrice !== null ? (
        <input type="hidden" name="minPrice" value={query.minPrice} />
      ) : null}
      {query.maxPrice !== null ? (
        <input type="hidden" name="maxPrice" value={query.maxPrice} />
      ) : null}
      {query.inStock ? <input type="hidden" name="inStock" value="1" /> : null}
      {query.sort !== "newest" ? (
        <input type="hidden" name="sort" value={query.sort} />
      ) : null}

      <Input
        key={query.q ?? "all"}
        type="search"
        name="q"
        defaultValue={query.q ?? ""}
        placeholder="جستجو در محصولات..."
        aria-label="جستجو در محصولات"
        className="h-12 pe-24 ps-9"
      />
      <Button
        type="submit"
        size="sm"
        className="absolute end-1.5 top-1/2 -translate-y-1/2"
      >
        جستجو
      </Button>
    </form>
  );
}
