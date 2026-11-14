"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, Pencil, Trash2 } from "lucide-react";
import {
  deleteProductAction,
  setProductActiveAction,
} from "@/app/admin/products/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./confirm-dialog";

type ProductRowActionsProps = {
  productId: string;
  productName: string;
  isActive: boolean;
};

export function ProductRowActions({
  productId,
  productName,
  isActive,
}: ProductRowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleActive() {
    if (pending) return;

    setError(null);

    startTransition(async () => {
      const result = await setProductActiveAction(productId, !isActive);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.refresh();
    });
  }

  async function handleDelete() {
    const result = await deleteProductAction(productId);

    if (result.ok) {
      router.refresh();
    }

    return result;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/products/${productId}/edit`}>
            <Pencil className="size-4" aria-hidden="true" />
            ویرایش
          </Link>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleActive}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? (
            <Loader2
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : isActive ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
          {isActive ? "غیرفعال" : "فعال"}
        </Button>

        <ConfirmDialog
          title="حذف محصول"
          description={`آیا از حذف «${productName}» مطمئن هستید؟ این کار قابل بازگشت نیست. اگر محصول در سفارش‌های ثبت‌شده استفاده شده باشد، حذف انجام نمی‌شود.`}
          confirmLabel="حذف محصول"
          onConfirm={handleDelete}
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
      </div>

      <div aria-live="polite" aria-atomic="true" className="max-w-56">
        {error ? (
          <p role="alert" className="text-end text-xs leading-5 text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
