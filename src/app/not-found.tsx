import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Compass, Search } from "lucide-react";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "صفحه پیدا نشد | مونو اکسسوری",
  description:
    "این صفحه پیدا نشد. از فروشگاه، کالکشن‌ها یا جستجو مسیر خود را ادامه دهید.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <Container className="flex flex-1 items-center justify-center py-16 sm:py-24">
      <div className="relative isolate flex w-full max-w-2xl flex-col items-center overflow-hidden rounded-3xl border border-border bg-card px-6 py-12 text-center sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="absolute -inset-e-16 -top-20 -z-10 size-52 rounded-full border border-primary/10"
        />
        <div
          aria-hidden="true"
          className="absolute inset-e-10 -bottom-16 -z-10 size-32 rounded-full border border-primary/10"
        />

        <span
          className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary"
          aria-hidden="true"
        >
          <Compass className="size-5" />
        </span>

        <p className="mt-6 text-[11px] font-medium tracking-[0.35em] text-primary">
          MONO 404
        </p>

        <h1 className="mt-3 font-heading text-3xl font-extrabold text-dark sm:text-4xl">
          این صفحه پیدا نشد
        </h1>

        <p className="mt-3 max-w-md text-sm leading-8 text-muted-foreground">
          ممکن است آدرس تغییر کرده باشد یا صفحه هنوز آماده نشده باشد. می‌توانید
          محصول موردنظر را جستجو کنید یا از فروشگاه ادامه دهید.
        </p>

        <form
          action="/shop"
          method="get"
          role="search"
          className="mt-8 flex w-full max-w-md flex-col gap-2 sm:flex-row"
        >
          <label htmlFor="not-found-search" className="sr-only">
            جستجوی محصولات
          </label>
          <Input
            id="not-found-search"
            name="q"
            type="search"
            placeholder="نام محصول یا دسته‌بندی"
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            <Search className="size-4" aria-hidden="true" />
            جستجو
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/shop">
              فروشگاه
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/collections">کالکشن‌ها</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">بازگشت به صفحهٔ اصلی</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
