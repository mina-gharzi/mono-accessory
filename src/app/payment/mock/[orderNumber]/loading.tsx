import { Container } from "@/components/container";

export default function Loading() {
  return (
    <Container className="flex flex-1 items-center justify-center py-12 sm:py-16">
      <p className="sr-only" role="status">
        در حال بارگذاری درگاه پرداخت
      </p>
      <div
        className="h-80 w-full max-w-lg animate-pulse rounded-lg bg-muted motion-reduce:animate-none"
        aria-hidden="true"
      />
    </Container>
  );
}
