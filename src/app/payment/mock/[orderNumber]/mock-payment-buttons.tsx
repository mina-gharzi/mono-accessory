"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MockPayButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <Loader2
            className="size-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          در حال پردازش...
        </>
      ) : (
        "پرداخت موفق (آزمایشی)"
      )}
    </Button>
  );
}

export function MockCancelButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      variant="outline"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "در حال لغو..." : "لغو پرداخت"}
    </Button>
  );
}
