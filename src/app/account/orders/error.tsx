"use client";

import Link from "next/link";
import { Container } from "@/components/container";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";

export default function OrdersError({ retry }: { retry: () => void }) {
  return (
    <Container className="flex flex-1 items-center justify-center py-20">
      <div className="flex w-full max-w-xl flex-col gap-4">
        <ErrorState
          title="بارگذاری سفارش‌ها ناموفق بود"
          description="مشکلی در دریافت سفارش‌ها پیش آمد. لطفاً دوباره تلاش کنید."
          onRetry={retry}
        />
        <div className="text-center">
          <Button asChild variant="outline">
            <Link href="/account">بازگشت به حساب کاربری</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
