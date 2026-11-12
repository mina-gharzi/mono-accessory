import { Container } from "@/components/container";

export default function Loading() {
  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 sm:py-14">
      <p className="sr-only" role="status">
        در حال بارگذاری سبد خرید
      </p>

      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className="h-3 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-8 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-5 sm:px-6">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="flex gap-4 border-b border-border py-5 last:border-b-0"
              aria-hidden="true"
            >
              <div className="size-24 shrink-0 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                <div className="h-10 w-28 animate-pulse rounded bg-muted motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>

        <div
          className="h-80 animate-pulse rounded-lg bg-muted motion-reduce:animate-none"
          aria-hidden="true"
        />
      </div>
    </Container>
  );
}
