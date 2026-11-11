import { ProductCard, type ProductCardProduct } from "@/components/product-card";
import { ProductCardSkeleton } from "@/components/skeletons";
import { SHOP_PAGE_SIZE } from "@/lib/shop-params";

const gridClassName =
  "grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4";

export function ProductGrid({ products }: { products: ProductCardProduct[] }) {
  return (
    <div className={gridClassName}>
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({
  count = SHOP_PAGE_SIZE,
}: {
  count?: number;
}) {
  return (
    <div className={gridClassName} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ShopResultsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="h-12 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />

      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-8 w-20 animate-pulse rounded-full bg-muted motion-reduce:animate-none"
          />
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="hidden h-80 w-64 animate-pulse rounded-lg bg-muted motion-reduce:animate-none lg:block" />
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="h-8 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
