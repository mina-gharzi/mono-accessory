import { cn } from "@/lib/utils";

type InlineMessageProps = {
  tone: "success" | "error";
  message: string | null;
  className?: string;
};

export function InlineMessage({
  tone,
  message,
  className,
}: InlineMessageProps) {
  return (
    <div aria-live="polite" aria-atomic="true" className={className}>
      {message ? (
        <p
          role={tone === "error" ? "alert" : "status"}
          className={cn(
            "rounded-md border px-3 py-2 text-sm leading-6",
            tone === "error"
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-primary/20 bg-secondary text-secondary-foreground"
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
