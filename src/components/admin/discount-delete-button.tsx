"use client";

import { Trash2 } from "lucide-react";
import { deleteDiscountAction } from "@/app/admin/discounts/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./confirm-dialog";

type DiscountDeleteButtonProps = {
  discountId: string;
  code: string;
};

export function DiscountDeleteButton({
  discountId,
  code,
}: DiscountDeleteButtonProps) {
  return (
    <ConfirmDialog
      title="حذف کد تخفیف"
      description={`آیا از حذف «${code}» مطمئن هستید؟ این کار قابل بازگشت نیست.`}
      confirmLabel="حذف کد تخفیف"
      onConfirm={() => deleteDiscountAction(discountId)}
      trigger={
        <Button type="button" variant="outline" size="sm">
          <Trash2 className="size-4" aria-hidden="true" />
          حذف
        </Button>
      }
    />
  );
}
