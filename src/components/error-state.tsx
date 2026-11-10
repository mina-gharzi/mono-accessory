"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "خطایی رخ داد",
  description = "مشکلی در بارگذاری اطلاعات پیش آمد. لطفاً دوباره تلاش کنید.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-14 text-center",
        className
      )}
    >
      <div
        className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
        aria-hidden="true"
      >
        <AlertTriangle className="size-5" />
      </div>
      <h2 className="font-heading text-lg font-bold text-dark">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="mt-6">
          <RefreshCw className="size-4" aria-hidden="true" />
          تلاش دوباره
        </Button>
      ) : null}
    </div>
  );
}
