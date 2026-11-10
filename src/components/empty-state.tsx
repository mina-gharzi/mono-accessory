import type { ReactNode } from "react";
import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/60 px-6 py-14 text-center",
        className
      )}
    >
      <div
        className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary text-primary"
        aria-hidden="true"
      >
        {icon ?? <PackageOpen className="size-5" />}
      </div>
      <h2 className="font-heading text-lg font-bold text-dark">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
