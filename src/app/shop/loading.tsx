import { Container } from "@/components/container";
import { ShopResultsSkeleton } from "@/components/shop/product-grid";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <Container className="flex flex-col gap-8 py-10 sm:py-14">
        <div className="flex flex-col gap-2" aria-hidden="true">
          <div className="h-3 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-9 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted motion-reduce:animate-none" />
        </div>
        <ShopResultsSkeleton />
      </Container>
    </div>
  );
}
