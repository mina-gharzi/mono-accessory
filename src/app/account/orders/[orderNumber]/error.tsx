"use client";

import Link from "next/link";
import { Container } from "@/components/container";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";

export default function OrderError({ retry }: { retry: () => void }) {
  return (
    <Container className="flex flex-1 items-center justify-center py-20">
      <div className="flex w-full max-w-xl flex-col gap-4">
        <ErrorState
          title="بارگذاری سفارش ناموفق بود"
          description="مشکلی در دریافت اطلاعات این سفارش پیش آمد. لطفاً دوباره تلاش کنید."
          onRetry={retry}
        />
        <div className="text-center">
          <Button asChild variant="outline">
            <Link href="/account/orders">بازگشت به سفارش‌ها</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
