"use client";

import { ErrorState } from "@/components/error-state";

export default function AdminError({ retry }: { retry: () => void }) {
  return (
    <ErrorState
      title="بارگذاری پنل مدیریت ناموفق بود"
      description="مشکلی در دریافت اطلاعات پیش آمد. لطفاً دوباره تلاش کنید."
      onRetry={retry}
    />
  );
}
