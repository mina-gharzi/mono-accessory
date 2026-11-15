import Link from "next/link";
import { Container } from "@/components/container";
import {
  instagramDisplay,
  instagramUrl,
  siteConfig,
} from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { JalaliYear } from "./jalali-year";

type FooterLink = {
  href: string;
  label: string;
};

const shopLinks: FooterLink[] = [
  { href: "/shop", label: "همهٔ محصولات" },
  { href: "/collections/bestsellers", label: "پرفروش‌ها" },
  { href: "/collections/new-arrivals", label: "تازه‌ها" },
  { href: "/collections/gifts", label: "هدیه" },
];

const helpLinks: FooterLink[] = [
  { href: "/faq", label: "سؤالات متداول" },
  { href: "/shipping-returns", label: "ارسال و بازگشت" },
  { href: "/terms", label: "قوانین و مقررات" },
];

const monoLinks: FooterLink[] = [
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70 focus-visible:ring-offset-2 focus-visible:ring-offset-dark";

const linkClass = cn(
  "w-fit rounded-md text-sm text-primary-foreground/65 transition-colors hover:text-primary-foreground",
  focusRing
);

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-bold text-primary-foreground">{title}</h2>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-8 pb-4 sm:mt-12 sm:pb-6">
      <Container>
        <div className="relative isolate overflow-hidden rounded-3xl bg-dark text-primary-foreground">
          {/* درخشش بوردو و دایره‌های تزئینی */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_90%_0%,rgb(128_0_32/0.6),transparent_50%),radial-gradient(circle_at_5%_100%,rgb(176_96_110/0.25),transparent_45%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -inset-e-16 -top-16 -z-10 size-48 rounded-full border border-primary-foreground/15"
          />
          <div
            aria-hidden="true"
            className="absolute inset-e-24 -top-8 -z-10 size-24 rounded-full border border-primary-foreground/10"
          />
          {/* قاب داخلی */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-2 rounded-[1.25rem] border border-primary-foreground/15 sm:inset-3"
          />

          <div className="px-7 pt-10 sm:px-12 sm:pt-12">
            <div className="mb-8 flex flex-col gap-2">
              <p
                dir="ltr"
                className="font-heading text-lg font-extrabold tracking-[0.2em] text-primary-foreground"
              >
                {siteConfig.name}
              </p>
              <p className="max-w-md text-sm leading-7 text-primary-foreground/65">
                {siteConfig.tagline}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
              <FooterColumn title="فروشگاه" links={shopLinks} />
              <FooterColumn title="پشتیبانی" links={helpLinks} />
              <FooterColumn title="مونو" links={monoLinks} />

              <div className="flex flex-col gap-4">
                <h2 className="text-sm font-bold text-primary-foreground">
                  تماس
                </h2>
                <div className="flex flex-col gap-2.5">
                  <a
                    href={`mailto:${siteConfig.email}`}
                    dir="ltr"
                    className={cn(linkClass, "self-start")}
                  >
                    {siteConfig.email}
                  </a>
                  <a
                    href={`tel:${siteConfig.phone}`}
                    dir="ltr"
                    className={cn(linkClass, "self-start")}
                  >
                    {siteConfig.phoneDisplay}
                  </a>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    dir="ltr"
                    className={cn(linkClass, "self-start")}
                  >
                    {instagramDisplay}
                  </a>
                  <span className="text-sm text-primary-foreground/65">
                    {siteConfig.address}
                  </span>
                  <span className="text-sm text-primary-foreground/65">
                    {siteConfig.workingHours}
                  </span>
                </div>
              </div>
            </div>

            <div
              aria-hidden="true"
              dir="ltr"
              className="pointer-events-none mt-8 select-none text-center font-heading text-[22vw] font-extrabold leading-none tracking-[0.2em] text-primary-foreground/[0.07] sm:text-[11vw] lg:text-[8rem]"
            >
              {siteConfig.shortName}
            </div>

            <p className="pb-7 text-center text-xs text-primary-foreground/50 sm:pb-8">
              © <JalaliYear /> {siteConfig.name}. تمام حقوق محفوظ است.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
