"use client";

import {
  useId,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { Star } from "lucide-react";
import { submitReviewAction } from "@/app/product/[slug]/actions";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const RATING_VALUES = [1, 2, 3, 4, 5] as const;
const MIN_COMMENT = 10;
const MAX_COMMENT = 1000;

type ReviewFormProps = {
  productId: string;
};

type FieldErrors = Partial<Record<"rating" | "comment", string>>;

type FormMessage = {
  tone: "success" | "error";
  text: string;
};

export function ReviewForm({ productId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();
  const ratingErrorId = useId();
  const commentId = useId();
  const commentErrorId = useId();
  const counterId = useId();

  const trimmedLength = comment.trim().length;
  const disabled = pending || submitted;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    const errors: FieldErrors = {};

    if (rating < 1) {
      errors.rating = "امتیاز را انتخاب کنید.";
    }

    if (trimmedLength < MIN_COMMENT) {
      errors.comment = "متن دیدگاه باید حداقل ۱۰ نویسه باشد.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setMessage({ tone: "error", text: "لطفاً خطاهای فرم را بررسی کنید." });
      return;
    }

    setFieldErrors({});
    setMessage(null);

    startTransition(async () => {
      const result = await submitReviewAction({
        productId,
        rating: String(rating),
        comment,
      });

      if (result.ok) {
        setSubmitted(true);
        setMessage({ tone: "success", text: result.message });
        return;
      }

      setFieldErrors(result.fieldErrors ?? {});
      setMessage({ tone: "error", text: result.message });
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5"
    >
      <div>
        <h2 className="font-heading text-lg font-bold text-dark">ثبت دیدگاه</h2>
        <p className="mt-1 text-sm leading-7 text-muted-foreground">
          تجربهٔ خود از این محصول را با دیگران به اشتراک بگذارید.
        </p>
      </div>

      <fieldset
        className="flex flex-col gap-2"
        aria-describedby={fieldErrors.rating ? ratingErrorId : undefined}
      >
        <legend className="text-sm font-medium text-dark">امتیاز شما</legend>

        <div className="flex flex-row-reverse justify-end gap-1">
          {RATING_VALUES.map((value) => {
            const active = value <= rating;

            return (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  disabled={disabled}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "inline-flex size-10 items-center justify-center rounded-md text-muted-foreground/40 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                    active && "text-primary"
                  )}
                >
                  <Star
                    aria-hidden="true"
                    className={cn(
                      "size-7",
                      active ? "fill-primary" : "fill-transparent"
                    )}
                  />
                </span>
                <span className="sr-only">{formatNumber(value)} ستاره</span>
              </label>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          ۱ ستاره کمترین و ۵ ستاره بیشترین امتیاز است.
        </p>

        {fieldErrors.rating ? (
          <p id={ratingErrorId} className="text-xs text-destructive">
            {fieldErrors.rating}
          </p>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor={commentId} className="text-sm font-medium text-dark">
          متن دیدگاه
        </label>
        <textarea
          id={commentId}
          name="comment"
          rows={5}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={MAX_COMMENT}
          disabled={disabled}
          aria-invalid={fieldErrors.comment ? true : undefined}
          aria-describedby={cn(
            counterId,
            fieldErrors.comment && commentErrorId
          )}
          placeholder="کیفیت، ظاهر و تجربهٔ استفاده از محصول را بنویسید..."
          className="min-h-28 w-full resize-y rounded-md border border-input bg-card px-3.5 py-3 text-sm leading-7 text-foreground outline-none transition-colors placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
        />
        <p id={counterId} className="text-xs text-muted-foreground">
          {formatNumber(trimmedLength)} از {formatNumber(MAX_COMMENT)} نویسه
          (حداقل {formatNumber(MIN_COMMENT)})
        </p>
        {fieldErrors.comment ? (
          <p id={commentErrorId} className="text-xs text-destructive">
            {fieldErrors.comment}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={disabled}>
          {pending ? "در حال ارسال..." : "ثبت دیدگاه"}
        </Button>
        <p className="text-xs leading-6 text-muted-foreground">
          دیدگاه شما پس از تأیید مدیر نمایش داده می‌شود.
        </p>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {message ? (
          <p
            role={message.tone === "error" ? "alert" : "status"}
            className={cn(
              "rounded-md border px-3 py-2 text-sm leading-6",
              message.tone === "error"
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : "border-primary/20 bg-secondary text-secondary-foreground"
            )}
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}
