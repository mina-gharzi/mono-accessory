import { OrdersListSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <p className="sr-only" role="status">
        در حال بارگذاری سفارش
      </p>

      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className="h-3 w-28 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-8 w-64 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10">
        <OrdersListSkeleton count={2} />
        <div
          className="h-72 animate-pulse rounded-lg bg-muted motion-reduce:animate-none"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
