import { updateTag } from "next/cache";

/**
 * Cache tags for public storefront listings. Only data that is the same for
 * every visitor is tagged; cart, checkout, account and admin data never is.
 */
export const CACHE_TAGS = {
  products: "storefront:products",
  categories: "storefront:categories",
  collections: "storefront:collections",
} as const;

/** Stock, sold count and product card data. */
export function invalidateProductCache(): void {
  updateTag(CACHE_TAGS.products);
}

/** Category names and the active-product count shown in shop filters. */
export function invalidateCategoryCache(): void {
  updateTag(CACHE_TAGS.categories);
}

/** Product create/delete/activate also changes the category counts. */
export function invalidateProductCatalogCache(): void {
  updateTag(CACHE_TAGS.products);
  updateTag(CACHE_TAGS.categories);
}
