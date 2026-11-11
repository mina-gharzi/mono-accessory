import { Container } from "@/components/container";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <Container className="flex flex-col gap-8 py-10 sm:py-14">
        <div className="flex flex-col gap-2" aria-hidden="true">
          <div className="h-3 w-32 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-9 w-44 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted motion-reduce:animate-none" />
        </div>
        <div
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          aria-hidden="true"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="aspect-[4/5] animate-pulse rounded-xl bg-muted motion-reduce:animate-none"
            />
          ))}
        </div>
      </Container>
    </div>
  );
}
