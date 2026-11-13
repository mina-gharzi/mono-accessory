"use client";

import { Trash2 } from "lucide-react";
import { deleteCategoryAction } from "@/app/admin/categories/actions";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { ConfirmDialog } from "./confirm-dialog";

type CategoryDeleteButtonProps = {
  categoryId: string;
  categoryName: string;
  productCount: number;
};

export function CategoryDeleteButton({
  categoryId,
  categoryName,
  productCount,
}: CategoryDeleteButtonProps) {
  const description =
    productCount > 0
      ? `این دسته‌بندی ${formatNumber(productCount)} محصول دارد و تا زمانی که محصولات آن جابه‌جا یا حذف نشوند قابل حذف نیست.`
      : `آیا از حذف «${categoryName}» مطمئن هستید؟ تصویر ذخیره‌شدهٔ آن هم حذف می‌شود و این کار قابل بازگشت نیست.`;

  return (
    <ConfirmDialog
      title="حذف دسته‌بندی"
      description={description}
      confirmLabel="حذف دسته‌بندی"
      onConfirm={() => deleteCategoryAction(categoryId)}
      trigger={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          حذف
        </Button>
      }
    />
  );
}
