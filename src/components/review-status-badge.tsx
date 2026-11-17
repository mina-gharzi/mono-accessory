import type { ReviewStatus } from "@/generated/prisma/client";
import { REVIEW_STATUS_LABELS } from "@/lib/review-status";
import { cn } from "@/lib/utils";

const statusStyles: Record<ReviewStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-900",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  REJECTED: "border-destructive/30 bg-destructive/5 text-destructive",
};

export function ReviewStatusBadge({
  status,
  className,
}: {
  status: ReviewStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {REVIEW_STATUS_LABELS[status]}
    </span>
  );
}
