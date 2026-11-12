import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "سفارش‌های من | مونو اکسسوری",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersPage() {
  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 sm:py-14">
      <header className="flex flex-col gap-1">
        <p className="text-[11px] font-medium tracking-[0.35em] text-primary">
          MONO ACCOUNT
        </p>
        <h1 className="font-heading text-2xl font-bold text-dark sm:text-3xl">
          سفارش‌های من
        </h1>
      </header>

      <EmptyState
        title="فهرست سفارش‌ها"
        description="فهرست کامل سفارش‌ها در به‌روزرسانی بعدی حساب کاربری نمایش داده می‌شود."
        action={
          <Button asChild>
            <Link href="/shop">رفتن به فروشگاه</Link>
          </Button>
        }
      />
    </Container>
  );
}
