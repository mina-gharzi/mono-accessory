import { Container } from "@/components/container";
import { siteConfig } from "@/lib/site-config";

/**
 * Static placeholder for the header while session and cart counts load.
 * It must not use client hooks such as usePathname, because it is rendered
 * during prerendering of the app shell.
 */
export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-background">
      <Container className="grid h-18 grid-cols-[1fr_auto] items-center gap-2 lg:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-3 px-1">
          <span
            dir="ltr"
            className="font-heading text-xl font-extrabold tracking-[0.32em] text-dark"
          >
            {siteConfig.shortName}
          </span>
          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-border sm:block"
          />
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            {siteConfig.brandLabel}
          </span>
        </div>

        <div
          aria-hidden="true"
          className="hidden h-4 w-44 animate-pulse rounded bg-muted motion-reduce:animate-none lg:block"
        />

        <div
          aria-hidden="true"
          className="flex items-center justify-end gap-1"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <span
              key={index}
              className="size-9 animate-pulse rounded-md bg-muted motion-reduce:animate-none"
            />
          ))}
        </div>
      </Container>
    </header>
  );
}
