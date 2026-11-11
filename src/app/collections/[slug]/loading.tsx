import { Container } from "@/components/container";
import { ProductGridSkeleton } from "@/components/shop/product-grid";

export default function Loading() {
  return (
    <>
      <div
        className="aspect-[16/10] min-h-[300px] animate-pulse bg-muted motion-reduce:animate-none sm:aspect-[21/9] sm:min-h-[360px]"
        aria-hidden="true"
      />
      <Container className="flex flex-col gap-6 py-10 sm:py-12">
        <div className="h-8 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <ProductGridSkeleton />
      </Container>
    </>
  );
}
