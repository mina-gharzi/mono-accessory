import type { ReviewStatus } from "@/generated/prisma/client";

export const REVIEW_STATUS_VALUES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const satisfies readonly ReviewStatus[];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  PENDING: "در انتظار تأیید",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
};
