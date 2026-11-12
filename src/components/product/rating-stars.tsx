import { Star } from "lucide-react";
import { formatRating } from "@/lib/format";
import { cn } from "@/lib/utils";

type RatingStarsProps = {
  rating: number;
  className?: string;
  starClassName?: string;
};

export function RatingStars({
  rating,
  className,
  starClassName,
}: RatingStarsProps) {
  const clamped = Math.min(Math.max(rating, 0), 5);
  const filled = Math.round(clamped);

  return (
    <span
      role="img"
      aria-label={`امتیاز ${formatRating(clamped)} از ۵`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn(
            "size-4",
            index < filled
              ? "fill-primary text-primary"
              : "fill-transparent text-muted-foreground/35",
            starClassName
          )}
        />
      ))}
    </span>
  );
}
