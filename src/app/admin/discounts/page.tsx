import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ComingSoon } from "@/components/admin/coming-soon";

export const metadata: Metadata = {
  title: "تخفیف‌ها | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminDiscountsPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="تخفیف‌ها"
        description="ساخت و مدیریت کدهای تخفیف."
      />
      <ComingSoon
        title="مدیریت تخفیف‌ها"
        description="مدیریت کدهای تخفیف در فاز ۱۵ اضافه می‌شود و فعلاً هیچ داده‌ای ندارد."
      />
    </div>
  );
}
