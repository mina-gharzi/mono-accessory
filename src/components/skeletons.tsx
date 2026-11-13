import { Container } from "@/components/container";
import { cn } from "@/lib/utils";

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)} aria-hidden="true">
      <div className="aspect-[4/5] animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>
    </div>
  );
}

export function PageSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-8", className)} aria-hidden="true">
      <div className="h-8 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-4">
        {Array.from({ length: count }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function OrdersListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse rounded-lg bg-muted motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <Container
      className="flex flex-1 flex-col gap-10 py-6 sm:py-10"
      aria-hidden="true"
    >
      <div className="h-4 w-56 animate-pulse rounded bg-muted motion-reduce:animate-none" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-12">
        <div className="flex flex-col-reverse gap-4 md:flex-row">
          <div className="flex gap-3 md:w-20 md:flex-col">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="size-16 shrink-0 animate-pulse rounded-md bg-muted motion-reduce:animate-none md:size-20"
              />
            ))}
          </div>
          <div className="aspect-[4/5] flex-1 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        </div>

        <div className="flex flex-col gap-4">
          <div className="h-4 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-5 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-10 w-48 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-4 w-full animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="mt-2 flex gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-9 w-20 animate-pulse rounded-full bg-muted motion-reduce:animate-none"
              />
            ))}
          </div>
          <div className="h-12 w-full animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-8">
        <div className="h-9 w-full max-w-md animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-32 w-full animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      </div>
    </Container>
  );
}
