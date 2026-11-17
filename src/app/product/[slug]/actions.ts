"use server";

import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { submitReview, type SubmitReviewResult } from "@/server/reviews";

const submitReviewInputSchema = z.object({
  productId: z.string().trim().min(1).max(64),
  rating: z.string().trim().min(1).max(4),
  comment: z.string().max(2000),
});

const INVALID_REQUEST = "درخواست نامعتبر است.";

export async function submitReviewAction(
  input: unknown
): Promise<SubmitReviewResult> {
  const user = await requireUser();
  const parsed = submitReviewInputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  return submitReview(user.id, parsed.data.productId, {
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  });
}
