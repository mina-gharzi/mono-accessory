import type { Metadata } from "next";
import Link from "next/link";
import { AtSign, Clock, Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/container";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import {
  instagramDisplay,
  instagramUrl,
  siteConfig,
} from "@/lib/site-config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "تماس با ما | مونو اکسسوری",
  description:
    "راه‌های ارتباط با مونو اکسسوری؛ شمارهٔ تماس، ایمیل، اینستاگرام، ساعت پاسخ‌گویی و نشانی.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: siteConfig.name,
    title: "تماس با ما | مونو اکسسوری",
    description:
      "راه‌های ارتباط با مونو اکسسوری؛ شمارهٔ تماس، ایمیل، اینستاگرام، ساعت پاسخ‌گویی و نشانی.",
    url: "/contact",
  },
};

const focusRing =
  "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const cardClass =
  "flex flex-col gap-3 rounded-2xl border border-border bg-card p-6";

export default function ContactPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Container className="flex flex-col gap-12 py-10 sm:gap-16 sm:py-16">
        <header className="flex flex-col gap-4">
          <p className="text-[11px] font-medium tracking-[0.35em] text-primary">
            MONO CONTACT
          </p>
          <Reveal>
            <h1 className="font-heading text-3xl font-extrabold text-dark sm:text-4xl">
              تماس با ما
            </h1>
          </Reveal>
          <p className="max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
            برای سؤال دربارهٔ سفارش، محصول، ارسال یا بازگشت، از راهی که برایتان
            راحت‌تر است با ما در ارتباط باشید. پیام‌ها در ساعات کاری بررسی
            می‌شوند.
          </p>
        </header>

        <section aria-labelledby="contact-channels" className="flex flex-col gap-6">
          <Reveal>
            <h2
              id="contact-channels"
              className="font-heading text-2xl font-extrabold text-dark sm:text-3xl"
            >
              راه‌های ارتباطی
            </h2>
          </Reveal>

          <ul className="grid gap-4 sm:grid-cols-2">
            <li className={cardClass}>
              <span
                className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary"
                aria-hidden="true"
              >
                <Phone className="size-5" />
              </span>
              <h3 className="font-heading text-lg font-bold text-dark">تلفن</h3>
              <a
                href={`tel:${siteConfig.phone}`}
                dir="ltr"
                className={cn(
                  "w-fit text-sm text-foreground/80 transition-colors hover:text-primary",
                  focusRing
                )}
              >
                {siteConfig.phoneDisplay}
              </a>
              <p className="text-sm leading-7 text-muted-foreground">
                برای پیگیری سفارش و سؤال‌های خرید، تماس تلفنی سریع‌ترین راه است.
              </p>
            </li>

            <li className={cardClass}>
              <span
                className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary"
                aria-hidden="true"
              >
                <Mail className="size-5" />
              </span>
              <h3 className="font-heading text-lg font-bold text-dark">ایمیل</h3>
              <a
                href={`mailto:${siteConfig.email}`}
                dir="ltr"
                className={cn(
                  "w-fit text-sm text-foreground/80 transition-colors hover:text-primary",
                  focusRing
                )}
              >
                {siteConfig.email}
              </a>
              <p className="text-sm leading-7 text-muted-foreground">
                برای ارسال جزئیات سفارش، تصویر محصول یا توضیح طولانی‌تر، ایمیل
                مناسب‌تر است.
              </p>
            </li>

            <li className={cardClass}>
              <span
                className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary"
                aria-hidden="true"
              >
                <AtSign className="size-5" />
              </span>
              <h3 className="font-heading text-lg font-bold text-dark">
                اینستاگرام
              </h3>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                dir="ltr"
                className={cn(
                  "w-fit text-sm text-foreground/80 transition-colors hover:text-primary",
                  focusRing
                )}
              >
                {instagramDisplay}
              </a>
              <p className="text-sm leading-7 text-muted-foreground">
                محصولات تازه و پشت‌صحنهٔ مونو را اینجا می‌بینید؛ برای پیگیری
                سفارش، تلفن یا ایمیل مطمئن‌تر است.
              </p>
            </li>

            <li className={cardClass}>
              <span
                className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary"
                aria-hidden="true"
              >
                <Clock className="size-5" />
              </span>
              <h3 className="font-heading text-lg font-bold text-dark">
                ساعت پاسخ‌گویی
              </h3>
              <p className="text-sm text-foreground/80">
                {siteConfig.workingHours}
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                پیام‌هایی که خارج از این بازه برسند، در اولین فرصت کاری بررسی
                می‌شوند.
              </p>
            </li>
          </ul>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/40 p-6 sm:flex-row sm:items-start sm:gap-4">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-primary"
              aria-hidden="true"
            >
              <MapPin className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-lg font-bold text-dark">نشانی</h3>
              <p className="text-sm leading-7 text-foreground/80">
                {siteConfig.address}
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                خریدها به‌صورت آنلاین ثبت می‌شوند و مراجعهٔ حضوری نداریم.
              </p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="contact-note"
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:p-8"
        >
          <Reveal>
            <h2
              id="contact-note"
              className="font-heading text-2xl font-extrabold text-dark sm:text-3xl"
            >
              یک نکتهٔ صادقانه
            </h2>
          </Reveal>
          <div className="flex max-w-2xl flex-col gap-3 text-sm leading-8 text-foreground/80">
            <p>
              در حال حاضر فرم تماس آنلاین نداریم؛ چون ترجیح می‌دهیم پیام‌ها
              مستقیم به دست کسی برسد که می‌تواند پاسخ دهد. برای شروع، کافی است
              تماس بگیرید یا ایمیل بزنید و شمارهٔ سفارش را در پیام بنویسید.
            </p>
            <p>
              اگر پاسخ سؤالتان دربارهٔ ارسال، بازگشت یا قوانین خرید است، ممکن است
              پیش از تماس در بخش سؤالات متداول پیدا شود.
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/faq">سؤالات متداول</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/shipping-returns">ارسال و بازگشت</Link>
            </Button>
          </div>
        </section>
      </Container>
    </div>
  );
}
