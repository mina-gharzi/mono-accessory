"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Check, Trash2, X } from "lucide-react";
import {
  approveReviewAction,
  deleteReviewAction,
  rejectReviewAction,
} from "@/app/admin/reviews/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./confirm-dialog";

type ReviewActionProps = {
  reviewId: string;
};

function ModerationButton({
  reviewId,
  label,
  pendingLabel,
  action,
  variant,
  icon,
}: ReviewActionProps & {
  label: string;
  pendingLabel: string;
  action: (reviewId: string) => Promise<{ ok: boolean; message?: string }>;
  variant: "default" | "outline";
  icon: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const result = await action(reviewId);
      setError(result.ok ? null : (result.message ?? "عملیات ناموفق بود."));
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={variant}
        size="sm"
        onClick={handleClick}
        disabled={pending}
      >
        {icon}
        {pending ? pendingLabel : label}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ReviewApproveButton({ reviewId }: ReviewActionProps) {
  return (
    <ModerationButton
      reviewId={reviewId}
      label="تأیید"
      pendingLabel="در حال تأیید..."
      action={approveReviewAction}
      variant="default"
      icon={<Check className="size-4" aria-hidden="true" />}
    />
  );
}

export function ReviewRejectButton({ reviewId }: ReviewActionProps) {
  return (
    <ModerationButton
      reviewId={reviewId}
      label="رد"
      pendingLabel="در حال رد..."
      action={rejectReviewAction}
      variant="outline"
      icon={<X className="size-4" aria-hidden="true" />}
    />
  );
}

export function ReviewDeleteButton({
  reviewId,
  productName,
}: ReviewActionProps & { productName: string }) {
  return (
    <ConfirmDialog
      title="حذف دیدگاه"
      description={`آیا از حذف دیدگاه «${productName}» مطمئن هستید؟ این کار قابل بازگشت نیست.`}
      confirmLabel="حذف دیدگاه"
      onConfirm={() => deleteReviewAction(reviewId)}
      trigger={
        <Button type="button" variant="outline" size="sm">
          <Trash2 className="size-4" aria-hidden="true" />
          حذف
        </Button>
      }
    />
  );
}
