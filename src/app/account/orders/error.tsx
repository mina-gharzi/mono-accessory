"use client";

import Link from "next/link";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";

export default function OrdersError({ retry }: { retry: () => void }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <ErrorState
        title="بارگذاری سفارش‌ها ناموفق بود"
        description="مشکلی در دریافت سفارش‌ها پیش آمد. لطفاً دوباره تلاش کنید."
        onRetry={retry}
      />
      <div className="text-center">
        <Button asChild variant="outline">
          <Link href="/shop">رفتن به فروشگاه</Link>
        </Button>
      </div>
    </div>
  );
}
