"use client";

import { Container } from "@/components/container";
import { ErrorState } from "@/components/error-state";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <Container className="flex flex-1 items-center justify-center py-20">
      <ErrorState className="w-full max-w-xl" onRetry={reset} />
    </Container>
  );
}
