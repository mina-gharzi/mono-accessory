import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ComingSoon } from "@/components/admin/coming-soon";

export const metadata: Metadata = {
  title: "سفارش‌ها | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="سفارش‌ها"
        description="مشاهده و تغییر وضعیت سفارش‌های فروشگاه."
      />
      <ComingSoon
        title="مدیریت سفارش‌ها"
        description="مدیریت سفارش‌ها در فاز ۱۲ اضافه می‌شود و فعلاً هیچ داده‌ای ندارد."
      />
    </div>
  );
}
