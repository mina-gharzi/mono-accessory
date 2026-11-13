import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryForm } from "@/components/admin/category-form";
import { getCategory } from "@/server/categories";

export const metadata: Metadata = {
  title: "ویرایش دسته‌بندی | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EditCategoryPage({
  params,
}: PageProps<"/admin/categories/[id]/edit">) {
  const { id } = await params;
  const category = await getCategory(id);

  if (!category) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="ویرایش دسته‌بندی"
        description={`تغییرات «${category.name}» را ویرایش کنید.`}
      />
      <CategoryForm mode="edit" category={category} />
    </div>
  );
}
