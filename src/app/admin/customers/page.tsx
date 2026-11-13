import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ComingSoon } from "@/components/admin/coming-soon";

export const metadata: Metadata = {
  title: "مشتریان | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminCustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="مشتریان"
        description="فهرست مشتریان و سابقهٔ سفارش‌های آن‌ها."
      />
      <ComingSoon
        title="مدیریت مشتریان"
        description="فهرست مشتریان در فاز ۱۲ اضافه می‌شود و فعلاً هیچ داده‌ای ندارد."
      />
    </div>
  );
}
