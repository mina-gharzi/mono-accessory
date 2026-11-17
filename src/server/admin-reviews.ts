import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { ReviewStatus } from "@/generated/prisma/client";
import { REVIEW_STATUS_VALUES } from "@/lib/review-status";
import { requireAdmin } from "./auth/session";
import { prisma } from "./db";
import { normalizeSearchTerm, toEnglishDigits } from "./products";

export const ADMIN_REVIEWS_PAGE_SIZE = 15;

export const ADMIN_REVIEW_STATUSES = [
  ...REVIEW_STATUS_VALUES,
  "all",
] as const;

export type AdminReviewStatus = (typeof ADMIN_REVIEW_STATUSES)[number];

const INVALID_REQUEST = "درخواست نامعتبر است.";
const REVIEW_NOT_FOUND = "دیدگاه پیدا نشد.";
const SAVE_FAILED = "ذخیرهٔ وضعیت دیدگاه ناموفق بود. لطفاً دوباره تلاش کنید.";
const DELETE_FAILED = "حذف دیدگاه ناموفق بود. لطفاً دوباره تلاش کنید.";

/* -------------------------------------------------------------------------- */
/* Query params                                                               */
/* -------------------------------------------------------------------------- */

const optionalText = (maxLength: number) =>
  z
    .preprocess(
      (value) => {
        if (typeof value !== "string") return undefined;
        const text = value.trim();
        return text ? text.slice(0, maxLength) : undefined;
      },
      z.string().optional()
    )
    .catch(undefined);

const optionalPage = z
  .preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const number = Number(toEnglishDigits(value).trim());
      return Number.isSafeInteger(number) ? number : undefined;
    },
    z.number().int().min(1).max(1000).optional()
  )
  .catch(undefined);

const adminReviewsQuerySchema = z.object({
  q: optionalText(80),
  status: z
    .preprocess(
      (value) => (typeof value === "string" ? value : undefined),
      z.enum(ADMIN_REVIEW_STATUSES).optional()
    )
    .catch(undefined),
  page: optionalPage,
});

export type AdminReviewsQuery = {
  q: string | null;
  status: AdminReviewStatus;
  page: number;
};

export type AdminReviewsSearchParams = Record<
  string,
  string | string[] | undefined
>;

export function parseAdminReviewsQuery(
  raw: AdminReviewsSearchParams
): AdminReviewsQuery {
  const parsed = adminReviewsQuerySchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};

  return {
    q: data.q ? normalizeSearchTerm(data.q) || null : null,
    status: data.status ?? "PENDING",
    page: data.page ?? 1,
  };
}

export function buildAdminReviewsHref(
  query: AdminReviewsQuery,
  overrides: Partial<AdminReviewsQuery> = {}
): string {
  const next = { ...query, ...overrides };

  if (!("page" in overrides)) {
    next.page = 1;
  }

  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.status !== "PENDING") params.set("status", next.status);
  if (next.page > 1) params.set("page", String(next.page));

  const search = params.toString();
  return search ? `/admin/reviews?${search}` : "/admin/reviews";
}

/* -------------------------------------------------------------------------- */
/* List                                                                       */
/* -------------------------------------------------------------------------- */

export type AdminReviewListItem = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  createdAt: Date;
};

export type AdminReviewsResult = {
  items: AdminReviewListItem[];
  total: number;
  totalPages: number;
  page: number;
  pendingCount: number;
};

const adminReviewListSelect = {
  id: true,
  rating: true,
  comment: true,
  status: true,
  createdAt: true,
  product: { select: { id: true, name: true, slug: true } },
  user: { select: { id: true, name: true } },
} satisfies Prisma.ReviewSelect;

type AdminReviewListRow = Prisma.ReviewGetPayload<{
  select: typeof adminReviewListSelect;
}>;

function toAdminReviewListItem(row: AdminReviewListRow): AdminReviewListItem {
  return {
    id: row.id,
    productId: row.product.id,
    productName: row.product.name,
    productSlug: row.product.slug,
    customerId: row.user.id,
    customerName: row.user.name,
    rating: row.rating,
    comment: row.comment?.trim() || null,
    status: row.status,
    createdAt: row.createdAt,
  };
}

export async function listAdminReviews(
  query: AdminReviewsQuery
): Promise<AdminReviewsResult> {
  await requireAdmin();

  const where: Prisma.ReviewWhereInput = {};

  if (query.status !== "all") {
    where.status = query.status;
  }

  if (query.q) {
    where.OR = [
      { product: { name: { contains: query.q, mode: "insensitive" } } },
      { user: { name: { contains: query.q, mode: "insensitive" } } },
    ];
  }

  const [total, pendingCount] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.count({ where: { status: "PENDING" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_REVIEWS_PAGE_SIZE));
  const page = Math.min(query.page, totalPages);

  const rows = await prisma.review.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * ADMIN_REVIEWS_PAGE_SIZE,
    take: ADMIN_REVIEWS_PAGE_SIZE,
    select: adminReviewListSelect,
  });

  return {
    items: rows.map(toAdminReviewListItem),
    total,
    totalPages,
    page,
    pendingCount,
  };
}

/* -------------------------------------------------------------------------- */
/* Moderation                                                                 */
/* -------------------------------------------------------------------------- */

export type AdminReviewMutationResult =
  | { ok: true }
  | { ok: false; message: string };

const reviewIdSchema = z.string().trim().min(1).max(64);
const moderationStatusSchema = z.enum(["APPROVED", "REJECTED"]);

const reviewProductSelect = {
  product: { select: { slug: true } },
} satisfies Prisma.ReviewSelect;

function revalidateReviewPaths(productSlug: string) {
  revalidatePath("/admin/reviews");
  revalidatePath(`/product/${productSlug}`);
}

async function findReviewProductSlug(
  reviewId: string
): Promise<string | null> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: reviewProductSelect,
  });

  return review?.product.slug ?? null;
}

export async function setReviewStatus(
  reviewId: string,
  nextStatus: string
): Promise<AdminReviewMutationResult> {
  await requireAdmin();

  const parsedId = reviewIdSchema.safeParse(reviewId);
  const parsedStatus = moderationStatusSchema.safeParse(nextStatus);

  if (!parsedId.success || !parsedStatus.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  const productSlug = await findReviewProductSlug(parsedId.data);

  if (!productSlug) {
    return { ok: false, message: REVIEW_NOT_FOUND };
  }

  try {
    await prisma.review.update({
      where: { id: parsedId.data },
      data: { status: parsedStatus.data },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { ok: false, message: REVIEW_NOT_FOUND };
    }

    return { ok: false, message: SAVE_FAILED };
  }

  revalidateReviewPaths(productSlug);

  return { ok: true };
}

export async function deleteReview(
  reviewId: string
): Promise<AdminReviewMutationResult> {
  await requireAdmin();

  const parsedId = reviewIdSchema.safeParse(reviewId);

  if (!parsedId.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  const productSlug = await findReviewProductSlug(parsedId.data);

  if (!productSlug) {
    return { ok: false, message: REVIEW_NOT_FOUND };
  }

  try {
    await prisma.review.delete({ where: { id: parsedId.data } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { ok: false, message: REVIEW_NOT_FOUND };
    }

    return { ok: false, message: DELETE_FAILED };
  }

  revalidateReviewPaths(productSlug);

  return { ok: true };
}
