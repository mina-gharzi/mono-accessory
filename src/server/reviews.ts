import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { ReviewStatus } from "@/generated/prisma/client";
import { REVIEW_STATUS_LABELS } from "@/lib/review-status";
import { prisma } from "./db";
import { toEnglishDigits } from "./products";

export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;
export const REVIEW_COMMENT_MIN = 10;
export const REVIEW_COMMENT_MAX = 1000;

const RATING_ERROR = "امتیاز باید بین ۱ تا ۵ باشد.";
const COMMENT_REQUIRED = "متن دیدگاه را وارد کنید.";
const COMMENT_MIN_ERROR = "متن دیدگاه باید حداقل ۱۰ نویسه باشد.";
const COMMENT_MAX_ERROR = "متن دیدگاه نباید بیشتر از ۱۰۰۰ نویسه باشد.";
const INVALID_REQUEST = "درخواست نامعتبر است.";
const FORM_ERROR = "لطفاً خطاهای فرم را بررسی کنید.";
const SAVE_FAILED = "ثبت دیدگاه ناموفق بود. لطفاً دوباره تلاش کنید.";
const DUPLICATE_REVIEW =
  "شما قبلاً برای این محصول دیدگاه ثبت کرده‌اید. هر کاربر فقط یک دیدگاه می‌تواند ثبت کند.";
const RATE_LIMITED =
  "تعداد دیدگاه‌های ارسالی شما بیش از حد مجاز است. لطفاً بعداً دوباره تلاش کنید.";
const APPROVAL_NOTICE =
  "دیدگاه شما ثبت شد و پس از تأیید مدیر نمایش داده می‌شود.";

const NOT_LOGGED_IN = "برای ثبت دیدگاه ابتدا وارد حساب خود شوید.";
const NEVER_BOUGHT =
  "فقط مشتریانی که این محصول را دریافت کرده‌اند می‌توانند دیدگاه ثبت کنند.";
const NOT_DELIVERED =
  "سفارش شما هنوز تحویل داده نشده است؛ پس از تحویل می‌توانید دیدگاه ثبت کنید.";

const idSchema = z.string().trim().min(1).max(64);

const ratingSchema = z.preprocess(
  (value) => {
    if (typeof value === "string") {
      const normalized = toEnglishDigits(value).trim();
      return /^\d+$/.test(normalized) ? Number(normalized) : value;
    }

    return value;
  },
  z
    .number({ message: RATING_ERROR })
    .int(RATING_ERROR)
    .min(REVIEW_RATING_MIN, RATING_ERROR)
    .max(REVIEW_RATING_MAX, RATING_ERROR)
);

export const reviewSubmissionSchema = z.object({
  rating: ratingSchema,
  comment: z
    .string({ message: COMMENT_REQUIRED })
    .trim()
    .min(REVIEW_COMMENT_MIN, COMMENT_MIN_ERROR)
    .max(REVIEW_COMMENT_MAX, COMMENT_MAX_ERROR),
});

export type ReviewSubmission = z.infer<typeof reviewSubmissionSchema>;

export type OwnReview = {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  createdAt: Date;
};

export type ReviewEligibility = {
  eligible: boolean;
  reason: string | null;
  review: OwnReview | null;
};

const ownReviewSelect = {
  id: true,
  rating: true,
  comment: true,
  status: true,
  createdAt: true,
} satisfies Prisma.ReviewSelect;

const pendingOrderStatuses = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
] as const;

/**
 * A customer may review a product once they have at least one DELIVERED order
 * that contains a variant of it, and only if they have not reviewed it before.
 * The check is always repeated on the server before a review is created.
 */
export async function canUserReview(
  userId: string | null,
  productId: string
): Promise<ReviewEligibility> {
  const parsedProduct = idSchema.safeParse(productId);

  if (!parsedProduct.success) {
    return { eligible: false, reason: INVALID_REQUEST, review: null };
  }

  if (!userId) {
    return { eligible: false, reason: NOT_LOGGED_IN, review: null };
  }

  const parsedUser = idSchema.safeParse(userId);

  if (!parsedUser.success) {
    return { eligible: false, reason: INVALID_REQUEST, review: null };
  }

  const existingReview = await prisma.review.findUnique({
    where: {
      userId_productId: {
        userId: parsedUser.data,
        productId: parsedProduct.data,
      },
    },
    select: ownReviewSelect,
  });

  if (existingReview) {
    return {
      eligible: false,
      reason: `شما قبلاً برای این محصول دیدگاه ثبت کرده‌اید. وضعیت دیدگاه شما: ${
        REVIEW_STATUS_LABELS[existingReview.status]
      }.`,
      review: existingReview,
    };
  }

  const orders = await prisma.order.findMany({
    where: {
      userId: parsedUser.data,
      items: { some: { variant: { productId: parsedProduct.data } } },
    },
    select: { status: true },
  });

  if (orders.some((order) => order.status === "DELIVERED")) {
    return { eligible: true, reason: null, review: null };
  }

  const awaitingDelivery = orders.some((order) =>
    (pendingOrderStatuses as readonly string[]).includes(order.status)
  );

  return {
    eligible: false,
    reason: awaitingDelivery ? NOT_DELIVERED : NEVER_BOUGHT,
    review: null,
  };
}

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                              */
/* -------------------------------------------------------------------------- */

type ReviewAttempt = {
  count: number;
  resetAt: number;
};

export type ReviewLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export type ReviewLimiter = {
  check(key: string): ReviewLimitResult;
  record(key: string): void;
  clear(key: string): void;
};

const REVIEW_WINDOW_MS = 60 * 60 * 1000;
const REVIEW_MAX_PER_WINDOW = 5;
const PRUNE_THRESHOLD = 5_000;

export function createReviewLimiter(): ReviewLimiter {
  const attempts = new Map<string, ReviewAttempt>();

  function read(key: string): ReviewAttempt | null {
    const attempt = attempts.get(key);

    if (!attempt) {
      return null;
    }

    if (attempt.resetAt <= Date.now()) {
      attempts.delete(key);
      return null;
    }

    return attempt;
  }

  function prune(): void {
    if (attempts.size < PRUNE_THRESHOLD) {
      return;
    }

    const now = Date.now();

    for (const [key, attempt] of attempts) {
      if (attempt.resetAt <= now) {
        attempts.delete(key);
      }
    }
  }

  return {
    check(key) {
      const attempt = read(key);

      if (!attempt || attempt.count < REVIEW_MAX_PER_WINDOW) {
        return { allowed: true };
      }

      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((attempt.resetAt - Date.now()) / 1000),
      };
    },
    record(key) {
      prune();

      const attempt = read(key);

      if (!attempt) {
        attempts.set(key, {
          count: 1,
          resetAt: Date.now() + REVIEW_WINDOW_MS,
        });
        return;
      }

      attempt.count += 1;
    },
    clear(key) {
      attempts.delete(key);
    },
  };
}

// In-memory store: limits are per process and reset on deploy.
// Production should replace this with a shared store (for example Redis)
// so limits hold across instances and restarts.
export const reviewLimiter = createReviewLimiter();

/* -------------------------------------------------------------------------- */
/* Submission                                                                 */
/* -------------------------------------------------------------------------- */

export type SubmitReviewResult =
  | { ok: true; message: string; review: OwnReview }
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<"rating" | "comment", string>>;
    };

export async function submitReview(
  userId: string,
  productId: string,
  input: { rating: unknown; comment: unknown }
): Promise<SubmitReviewResult> {
  const parsedUser = idSchema.safeParse(userId);
  const parsedProduct = idSchema.safeParse(productId);

  if (!parsedUser.success || !parsedProduct.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  const parsed = reviewSubmissionSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<"rating" | "comment", string>> = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if ((field === "rating" || field === "comment") && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }

    return { ok: false, message: FORM_ERROR, fieldErrors };
  }

  const eligibility = await canUserReview(
    parsedUser.data,
    parsedProduct.data
  );

  if (!eligibility.eligible) {
    return {
      ok: false,
      message: eligibility.reason ?? INVALID_REQUEST,
    };
  }

  const limiterKey = `user:${parsedUser.data}`;
  const limit = reviewLimiter.check(limiterKey);

  if (!limit.allowed) {
    return { ok: false, message: RATE_LIMITED };
  }

  try {
    const review = await prisma.review.create({
      data: {
        userId: parsedUser.data,
        productId: parsedProduct.data,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        status: "PENDING",
      },
      select: ownReviewSelect,
    });

    reviewLimiter.record(limiterKey);
    revalidatePath("/admin/reviews");

    return { ok: true, message: APPROVAL_NOTICE, review };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, message: DUPLICATE_REVIEW };
    }

    return { ok: false, message: SAVE_FAILED };
  }
}

/* -------------------------------------------------------------------------- */
/* Public reads (approved reviews only)                                       */
/* -------------------------------------------------------------------------- */

export type ApprovedReview = {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
  createdAt: Date;
};

export type ApprovedReviewSummary = {
  averageRating: number | null;
  reviewCount: number;
};

export async function getApprovedReviews(
  productId: string
): Promise<ApprovedReview[]> {
  const parsed = idSchema.safeParse(productId);

  if (!parsed.success) return [];

  const rows = await prisma.review.findMany({
    where: { productId: parsed.data, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  return rows.map((review) => {
    const firstName = review.user.name.trim().split(/\s+/)[0];

    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment?.trim() || null,
      authorName: firstName || "کاربر مونو",
      createdAt: review.createdAt,
    };
  });
}

export async function getApprovedReviewSummary(
  productId: string
): Promise<ApprovedReviewSummary> {
  const parsed = idSchema.safeParse(productId);

  if (!parsed.success) {
    return { averageRating: null, reviewCount: 0 };
  }

  const aggregate = await prisma.review.aggregate({
    where: { productId: parsed.data, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const reviewCount = aggregate._count._all;

  return {
    reviewCount,
    averageRating:
      reviewCount > 0 && aggregate._avg.rating !== null
        ? Math.round(aggregate._avg.rating * 10) / 10
        : null,
  };
}
