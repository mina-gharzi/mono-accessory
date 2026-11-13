import { OrdersListSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="sr-only" role="status">
        در حال بارگذاری سفارش‌ها
      </p>
      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className="h-7 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-56 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>
      <div className="flex gap-2" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-7 w-20 animate-pulse rounded-full bg-muted motion-reduce:animate-none"
          />
        ))}
      </div>
      <OrdersListSkeleton />
    </div>
  );
}
