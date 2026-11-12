export const SHOP_PAGE_SIZE = 12;

export const SORT_VALUES = [
  "newest",
  "bestselling",
  "price-asc",
  "price-desc",
] as const;

export type SortValue = (typeof SORT_VALUES)[number];

export const SORT_LABELS: Record<SortValue, string> = {
  newest: "جدیدترین",
  bestselling: "پرفروش‌ترین",
  "price-asc": "ارزان‌ترین",
  "price-desc": "گران‌ترین",
};

export function isSortValue(value: string): value is SortValue {
  return (SORT_VALUES as readonly string[]).includes(value);
}

export type ShopQuery = {
  q: string | null;
  category: string | null;
  collection: string | null;
  color: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  sort: SortValue;
  page: number;
};

export const defaultShopQuery: ShopQuery = {
  q: null,
  category: null,
  collection: null,
  color: null,
  minPrice: null,
  maxPrice: null,
  inStock: false,
  sort: "newest",
  page: 1,
};

/**
 * Builds a shop URL from the current query plus the values being changed.
 * Filters, sort and pagination are preserved unless explicitly overridden.
 * Changing anything other than the page resets pagination to the first page.
 */
export function buildShopHref(
  pathname: string,
  query: ShopQuery,
  overrides: Partial<ShopQuery> = {}
): string {
  const next = { ...query, ...overrides };

  if (!("page" in overrides)) {
    next.page = 1;
  }

  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.category) params.set("category", next.category);
  if (next.collection) params.set("collection", next.collection);
  if (next.color) params.set("color", next.color);
  if (next.minPrice !== null) params.set("minPrice", String(next.minPrice));
  if (next.maxPrice !== null) params.set("maxPrice", String(next.maxPrice));
  if (next.inStock) params.set("inStock", "1");
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));

  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function hasActiveFilters(query: ShopQuery): boolean {
  return Boolean(
    query.q ||
      query.category ||
      query.collection ||
      query.color ||
      query.minPrice !== null ||
      query.maxPrice !== null ||
      query.inStock
  );
}

export { formatNumber } from "@/lib/format";
