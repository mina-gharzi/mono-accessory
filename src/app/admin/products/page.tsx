import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ComingSoon } from "@/components/admin/coming-soon";

export const metadata: Metadata = {
  title: "محصولات | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminProductsPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="محصولات"
        description="مدیریت محصولات، تصاویر، قیمت و موجودی."
      />
      <ComingSoon
        title="مدیریت محصولات"
        description="افزودن و ویرایش محصولات در فاز ۱۱ب اضافه می‌شود و فعلاً هیچ داده‌ای ندارد."
      />
    </div>
  );
}
