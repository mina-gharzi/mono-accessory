"use client";

import { useState, useTransition } from "react";
import { setDiscountActiveAction } from "@/app/admin/discounts/actions";
import { Button } from "@/components/ui/button";

type DiscountActiveButtonProps = {
  discountId: string;
  isActive: boolean;
};

export function DiscountActiveButton({
  discountId,
  isActive,
}: DiscountActiveButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    startTransition(async () => {
      const result = await setDiscountActiveAction(discountId, !isActive);
      setError(result.ok ? null : result.message);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={pending}
      >
        {pending
          ? "در حال ذخیره..."
          : isActive
            ? "غیرفعال کردن"
            : "فعال کردن"}
      </Button>
      {error ? (
        <p role="alert" className="text-[11px] leading-5 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
