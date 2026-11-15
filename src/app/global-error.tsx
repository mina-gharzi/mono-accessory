"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { pinar } from "@/lib/fonts";
import "./globals.css";

export default function GlobalError({
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
    <html lang="fa" dir="rtl" className={`${pinar.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div
            role="alert"
            className="flex w-full max-w-2xl flex-col items-center rounded-3xl border border-border bg-card px-6 py-12 text-center sm:px-12 sm:py-16"
          >
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
              مشکلی در بارگذاری فروشگاه پیش آمد. می‌توانید دوباره تلاش کنید یا به
              صفحهٔ اصلی برگردید.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => retry()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                تلاش دوباره
              </button>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                بازگشت به صفحهٔ اصلی
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
