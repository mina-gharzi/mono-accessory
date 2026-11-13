import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = {
  title: "پنل مدیریت | مونو اکسسوری",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="نمای کلی"
        description="پوستهٔ پنل مدیریت. داشبورد فروش و آمار در فاز ۱۲ اضافه می‌شود."
      />
      <EmptyState
        title="داشبورد هنوز آماده نیست"
        description="این صفحه فعلاً فقط پوستهٔ پنل مدیریت را نشان می‌دهد. آمار فروش، سفارش‌ها و مشتریان در فاز ۱۲ اضافه می‌شود."
      />
    </div>
  );
}
