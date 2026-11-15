"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-1 items-center justify-center py-16 sm:py-24">
      <div
        role="alert"
        className="relative isolate flex w-full max-w-2xl flex-col items-center overflow-hidden rounded-3xl border border-border bg-card px-6 py-12 text-center sm:px-12 sm:py-16"
      >
        <div
          aria-hidden="true"
          className="absolute -inset-e-16 -top-20 -z-10 size-52 rounded-full border border-destructive/10"
        />
        <div
          aria-hidden="true"
          className="absolute inset-e-10 -bottom-16 -z-10 size-32 rounded-full border border-destructive/10"
        />

        <span
          className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
          aria-hidden="true"
        >
          <AlertTriangle className="size-5" />
        </span>

        <p className="mt-6 text-[11px] font-medium tracking-[0.35em] text-primary">
          MONO ERROR
        </p>

        <h1 className="mt-3 font-heading text-3xl font-extrabold text-dark sm:text-4xl">
          خطایی رخ داد
        </h1>

        <p className="mt-3 max-w-md text-sm leading-8 text-muted-foreground">
          مشکلی در بارگذاری این بخش پیش آمد. می‌توانید دوباره تلاش کنید؛ اگر خطا
          ادامه داشت، کمی بعد سر بزنید.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={() => retry()}>
            <RefreshCw className="size-4" aria-hidden="true" />
            تلاش دوباره
          </Button>
          <Button asChild variant="outline">
            <Link href="/">بازگشت به صفحهٔ اصلی</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
