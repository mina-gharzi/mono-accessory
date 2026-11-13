import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ComingSoon } from "@/components/admin/coming-soon";

export const metadata: Metadata = {
  title: "دیدگاه‌ها | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminReviewsPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="دیدگاه‌ها"
        description="بررسی و تأیید دیدگاه‌های کاربران."
      />
      <ComingSoon
        title="مدیریت دیدگاه‌ها"
        description="مدیریت دیدگاه‌ها در فاز ۱۵ اضافه می‌شود و فعلاً هیچ داده‌ای ندارد."
      />
    </div>
  );
}
