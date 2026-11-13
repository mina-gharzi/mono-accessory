"use client";

import Link from "next/link";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";

export default function OrderError({ retry }: { retry: () => void }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
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
  );
}
