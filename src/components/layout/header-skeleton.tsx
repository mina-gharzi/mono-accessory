import Link from "next/link";
import { Container } from "@/components/container";
import { mainNavItems } from "@/lib/nav";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Static placeholder for the header while session and cart counts load.
 * It renders the same navigation items as the real header but never sets
 * aria-current or active styles, so the static shell cannot disagree with the
 * first client render.
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

        <nav
          aria-label="ناوبری اصلی"
          className="hidden items-center gap-9 lg:flex"
        >
          {mainNavItems.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative rounded-sm py-2 text-sm font-medium text-foreground/75 transition-colors hover:text-primary",
                focusRing
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

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
