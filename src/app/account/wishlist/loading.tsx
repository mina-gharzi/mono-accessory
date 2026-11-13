import { ProductGridSkeleton } from "@/components/shop/product-grid";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="sr-only" role="status">
        در حال بارگذاری علاقه‌مندی‌ها
      </p>
      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className="h-7 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-56 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>
      <ProductGridSkeleton count={6} />
    </div>
  );
}
