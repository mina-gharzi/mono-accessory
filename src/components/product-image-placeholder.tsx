import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductImagePlaceholderProps = {
  className?: string;
  iconClassName?: string;
};

export function ProductImagePlaceholder({
  className,
  iconClassName,
}: ProductImagePlaceholderProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgb(246_233_225),rgb(255_252_247))] text-primary/25",
        className
      )}
    >
      <Gem className={cn("size-10", iconClassName)} />
    </div>
  );
}
