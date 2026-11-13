import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = {
  title: "دسته‌بندی جدید | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewCategoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="دسته‌بندی جدید"
        description="نام، اسلاگ، ترتیب نمایش و تصویر دسته‌بندی را مشخص کنید."
      />
      <CategoryForm mode="create" />
    </div>
  );
}
