"use server";

import { requireAdmin } from "@/server/auth/session";
import {
  deleteReview,
  setReviewStatus,
  type AdminReviewMutationResult,
} from "@/server/admin-reviews";

export async function approveReviewAction(
  reviewId: string
): Promise<AdminReviewMutationResult> {
  await requireAdmin();

  return setReviewStatus(reviewId, "APPROVED");
}

export async function rejectReviewAction(
  reviewId: string
): Promise<AdminReviewMutationResult> {
  await requireAdmin();

  return setReviewStatus(reviewId, "REJECTED");
}

export async function deleteReviewAction(
  reviewId: string
): Promise<AdminReviewMutationResult> {
  await requireAdmin();

  return deleteReview(reviewId);
}
