import Link from "next/link";
import { Container } from "@/components/container";
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
  { href: "/shipping-and-returns", label: "ارسال و بازگشت" },
  { href: "/terms", label: "قوانین و مقررات" },
];

const monoLinks: FooterLink[] = [
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-bold text-dark">{title}</h2>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(
                "rounded-md text-sm text-muted-foreground transition-colors hover:text-primary",
                focusRing
              )}
            >
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
    <footer className="border-t border-border bg-card/60">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              aria-label="مونو اکسسوری، صفحهٔ اصلی"
              className={cn("w-fit rounded-md", focusRing)}
            >
              <span
                dir="ltr"
                className="font-heading text-xl font-extrabold tracking-[0.32em] text-dark"
              >
                MONO
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-7 text-muted-foreground">
              جواهرات استیل، اکسسوری و عینک؛ انتخاب‌هایی مینیمال برای زنان
              امروز.
            </p>
            <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              <a
                href="mailto:hello@mono.example"
                dir="ltr"
                className={cn("w-fit rounded-md hover:text-primary", focusRing)}
              >
                hello@mono.example
              </a>
              <a
                href="tel:+982100000000"
                dir="ltr"
                className={cn("w-fit rounded-md hover:text-primary", focusRing)}
              >
                ۰۲۱ ۰۰۰ ۰۰۰۰
              </a>
              <span>تهران، ایران</span>
            </div>
          </div>

          <FooterColumn title="فروشگاه" links={shopLinks} />
          <FooterColumn title="پشتیبانی" links={helpLinks} />
          <FooterColumn title="مونو" links={monoLinks} />
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <JalaliYear /> MONO ACCESSORY. تمام حقوق محفوظ است.
          </p>
          <p>طراحی و توسعه در ایران</p>
        </div>
      </Container>
    </footer>
  );
}
