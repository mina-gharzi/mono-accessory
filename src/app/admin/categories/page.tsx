import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Gem, Pencil, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryDeleteButton } from "@/components/admin/category-delete-button";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/admin/data-table";
import { InlineMessage } from "@/components/admin/inline-message";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { listCategories } from "@/server/categories";

export const metadata: Metadata = {
  title: "دسته‌بندی‌ها | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

const columns: DataTableColumn[] = [
  { key: "image", label: "تصویر" },
  { key: "name", label: "نام" },
  { key: "slug", label: "اسلاگ" },
  { key: "products", label: "تعداد محصول" },
  { key: "sortOrder", label: "ترتیب" },
  { key: "actions", label: "عملیات", className: "text-end" },
];

export default async function CategoriesPage({
  searchParams,
}: PageProps<"/admin/categories">) {
  const [categories, params] = await Promise.all([
    listCategories(),
    searchParams,
  ]);

  const status = typeof params.status === "string" ? params.status : null;
  const successMessage =
    status === "created"
      ? "دسته‌بندی با موفقیت ایجاد شد."
      : status === "updated"
        ? "تغییرات دسته‌بندی با موفقیت ذخیره شد."
        : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="دسته‌بندی‌ها"
        description="دسته‌بندی‌های فروشگاه را ایجاد و ویرایش کنید. ترتیب نمایش و تصویر هر دسته در فروشگاه استفاده می‌شود."
        actions={
          <Button asChild>
            <Link href="/admin/categories/new">
              <Plus className="size-4" aria-hidden="true" />
              دسته‌بندی جدید
            </Link>
          </Button>
        }
      />

      <InlineMessage tone="success" message={successMessage} />

      <DataTable
        columns={columns}
        isEmpty={categories.length === 0}
        caption="فهرست دسته‌بندی‌ها"
        empty={
          <EmptyState
            title="هنوز دسته‌بندی‌ای ثبت نشده است"
            description="با ایجاد اولین دسته‌بندی، محصولات فروشگاه را دسته‌بندی کنید."
            action={
              <Button asChild>
                <Link href="/admin/categories/new">ایجاد دسته‌بندی</Link>
              </Button>
            }
          />
        }
      >
        {categories.map((category) => (
          <tr
            key={category.id}
            className="border-b border-border align-middle last:border-0"
          >
            <td className="px-4 py-3">
              {category.image ? (
                <Image
                  src={category.image}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  className="size-12 rounded-md border border-border object-cover"
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-md border border-dashed border-border bg-muted text-muted-foreground">
                  <Gem className="size-4" aria-hidden="true" />
                </div>
              )}
            </td>
            <td className="px-4 py-3 font-medium text-dark">
              {category.name}
            </td>
            <td className="px-4 py-3 text-muted-foreground" dir="ltr">
              {category.slug}
            </td>
            <td className="px-4 py-3">
              {category.productCount > 0
                ? `${formatNumber(category.productCount)} محصول`
                : "بدون محصول"}
            </td>
            <td className="px-4 py-3">{formatNumber(category.sortOrder)}</td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-end gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/categories/${category.id}/edit`}>
                    <Pencil className="size-4" aria-hidden="true" />
                    ویرایش
                  </Link>
                </Button>
                <CategoryDeleteButton
                  categoryId={category.id}
                  categoryName={category.name}
                  productCount={category.productCount}
                />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
