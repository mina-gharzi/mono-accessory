import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
};

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = "مشاهدهٔ همه",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-extrabold text-dark sm:text-3xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-md text-sm font-medium text-primary transition-colors hover:text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {linkLabel}
          <ArrowLeft
            className="size-4 transition-transform motion-safe:group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      ) : null}
    </div>
  );
}
