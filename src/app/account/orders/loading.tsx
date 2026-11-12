import { Container } from "@/components/container";

export default function Loading() {
  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 sm:py-14">
      <p className="sr-only" role="status">
        در حال بارگذاری سفارش‌ها
      </p>
      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className="h-3 w-28 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-8 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>
      <div
        className="h-64 animate-pulse rounded-lg bg-muted motion-reduce:animate-none"
        aria-hidden="true"
      />
    </Container>
  );
}
