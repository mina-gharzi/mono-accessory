import Link from "next/link";
import type { ReactNode } from "react";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { RatingStars } from "@/components/product/rating-stars";
import { ReviewForm } from "@/components/product/review-form";
import { ReviewStatusBadge } from "@/components/review-status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { ProductReview } from "@/server/products";
import type { OwnReview, ReviewEligibility } from "@/server/reviews";

type ReviewsPanelProps = {
  productId: string;
  reviews: ProductReview[];
  eligibility: ReviewEligibility;
  isLoggedIn: boolean;
  loginHref: string;
};

export function ReviewsPanel({
  productId,
  reviews,
  eligibility,
  isLoggedIn,
  loginHref,
}: ReviewsPanelProps) {
  return (
    <div className="flex flex-col gap-8">
      {!isLoggedIn ? (
        <ReviewNotice
          title="برای ثبت دیدگاه وارد حساب خود شوید"
          description="فقط مشتریانی که این محصول را دریافت کرده‌اند می‌توانند دیدگاه ثبت کنند."
          action={
            <Button asChild size="sm">
              <Link href={loginHref}>ورود به حساب</Link>
            </Button>
          }
        />
      ) : eligibility.eligible ? (
        <ReviewForm productId={productId} />
      ) : eligibility.review ? (
        <OwnReviewCard review={eligibility.review} />
      ) : (
        <ReviewNotice
          title="ثبت دیدگاه امکان‌پذیر نیست"
          description={
            eligibility.reason ??
            "فقط مشتریانی که این محصول را دریافت کرده‌اند می‌توانند دیدگاه ثبت کنند."
          }
        />
      )}

      <ReviewsList reviews={reviews} />
    </div>
  );
}

function ReviewNotice({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-secondary/30 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-heading text-base font-bold text-dark">{title}</h2>
        <p className="mt-1 text-sm leading-7 text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function OwnReviewCard({ review }: { review: OwnReview }) {
  return (
    <section
      aria-label="دیدگاه شما"
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-base font-bold text-dark">
            دیدگاه شما
          </h2>
          <ReviewStatusBadge status={review.status} />
        </div>
        <time
          dateTime={review.createdAt.toISOString()}
          className="text-xs text-muted-foreground"
        >
          {formatDate(review.createdAt)}
        </time>
      </div>

      <RatingStars rating={review.rating} starClassName="size-4" />

      {review.comment ? (
        <p className="text-sm leading-7 text-foreground/80">{review.comment}</p>
      ) : null}

      <p className="text-xs leading-6 text-muted-foreground">
        هر کاربر فقط یک دیدگاه برای هر محصول می‌تواند ثبت کند.
      </p>
    </section>
  );
}

function ReviewsList({ reviews }: { reviews: ProductReview[] }) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="size-5" />}
        title="هنوز دیدگاهی ثبت نشده است"
        description="پس از خرید، می‌توانید دیدگاه خود را دربارهٔ این محصول ثبت کنید."
      />
    );
  }

  return (
    <section aria-label="دیدگاه‌های تأییدشده" className="flex flex-col gap-4">
      <h2 className="font-heading text-base font-bold text-dark">
        دیدگاه‌های تأییدشده
      </h2>

      <ul className="flex flex-col gap-4">
        {reviews.map((review) => (
          <li
            key={review.id}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {review.authorName}
                </span>
                <RatingStars rating={review.rating} starClassName="size-3.5" />
              </div>

              <time
                dateTime={review.createdAt.toISOString()}
                className="text-xs text-muted-foreground"
              >
                {formatDate(review.createdAt)}
              </time>
            </div>

            {review.comment ? (
              <p className="mt-3 text-sm leading-7 text-foreground/80">
                {review.comment}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
