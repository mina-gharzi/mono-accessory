import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type FreeShippingHintProps = {
  subtotal: number;
  amountToFreeShipping: number;
  className?: string;
};

export function FreeShippingHint({
  subtotal,
  amountToFreeShipping,
  className,
}: FreeShippingHintProps) {
  const reached = amountToFreeShipping <= 0;
  const threshold = subtotal + amountToFreeShipping;
  const percent = reached
    ? 100
    : threshold > 0
      ? Math.min(100, Math.round((subtotal / threshold) * 100))
      : 0;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-xs leading-6 text-muted-foreground">
        {reached
          ? "ارسال رایگان فعال شد."
          : `${formatPrice(amountToFreeShipping)} تا ارسال رایگان`}
      </p>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-secondary"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
