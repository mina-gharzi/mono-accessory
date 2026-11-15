import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  Banknote,
  CheckCircle2,
  Clock,
  Mail,
  PackageCheck,
  Phone,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Container } from "@/components/container";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { formatNumber, formatPrice } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";
import { getShippingSettings } from "@/server/pricing";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "ارسال و بازگشت | مونو اکسسوری",
  description:
    "اطلاعات ارسال، هزینه و زمان تحویل سفارش، شرایط بازگشت کالا و مراحل ثبت درخواست بازگشت در مونو اکسسوری.",
  alternates: {
    canonical: "/shipping-returns",
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: siteConfig.name,
    title: "ارسال و بازگشت | مونو اکسسوری",
    description:
      "اطلاعات ارسال، هزینه و زمان تحویل سفارش، شرایط بازگشت کالا و مراحل ثبت درخواست بازگشت در مونو اکسسوری.",
    url: "/shipping-returns",
  },
};

const focusRing =
  "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const cardClass =
  "flex flex-col gap-3 rounded-2xl border border-border bg-card p-6";

const returnConditions = [
  "قطعه استفاده نشده باشد و آثار استفاده، خط‌وخش یا تغییر شکل نداشته باشد.",
  "بسته‌بندی اصلی و لوازم همراه، مانند جعبه، کیسه و کارت محصول، موجود باشد.",
  "درخواست بازگشت در بازهٔ مجاز پس از دریافت ثبت شده باشد.",
];

function ShippingSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
    </div>
  );
}

async function ShippingContent() {
  await connection();
  const { shippingCost, freeShippingThreshold } = await getShippingSettings();

  return (
    <div className="flex flex-col gap-14 sm:gap-20">
      <section aria-labelledby="shipping-info" className="flex flex-col gap-6">
        <Reveal>
          <h2
            id="shipping-info"
            className="font-heading text-2xl font-extrabold text-dark sm:text-3xl"
          >
            ارسال سفارش
          </h2>
        </Reveal>

        <ul className="grid gap-4 sm:grid-cols-3">
          <li className={cardClass}>
            <span
              className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary"
              aria-hidden="true"
            >
              <Truck className="size-5" />
            </span>
            <h3 className="font-heading text-lg font-bold text-dark">
              هزینهٔ ارسال
            </h3>
            <p className="font-heading text-xl font-extrabold text-primary">
              {formatPrice(shippingCost)}
            </p>
            <p className="text-sm leading-7 text-muted-foreground">
              این مبلغ پیش از نهایی‌کردن سفارش در سبد خرید نمایش داده می‌شود.
            </p>
          </li>

          <li className={cardClass}>
            <span
              className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary"
              aria-hidden="true"
            >
              <PackageCheck className="size-5" />
            </span>
            <h3 className="font-heading text-lg font-bold text-dark">
              ارسال رایگان
            </h3>
            <p className="font-heading text-xl font-extrabold text-primary">
              {formatPrice(freeShippingThreshold)}
            </p>
            <p className="text-sm leading-7 text-muted-foreground">
              برای سفارش‌های با این مبلغ و بیشتر، ارسال رایگان است.
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
              زمان تحویل
            </h3>
            <p className="font-heading text-xl font-extrabold text-primary">
              {siteConfig.deliveryTimeText}
            </p>
            <p className="text-sm leading-7 text-muted-foreground">
              بازهٔ تقریبی پس از تأیید سفارش؛ در روزهای پرترافیک ممکن است کمی
              بیشتر شود.
            </p>
          </li>
        </ul>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/40 p-6 text-sm leading-8 text-foreground/80">
          <p>
            سفارش‌ها با بسته‌بندی محافظت‌شده آماده می‌شوند. لطفاً هنگام ثبت سفارش،
            نشانی و شمارهٔ تماس را کامل و دقیق وارد کنید تا در تحویل مشکلی پیش
            نیاید.
          </p>
          <p>
            اگر بسته هنگام تحویل آسیب‌دیده به نظر می‌رسد، پیش از باز کردن با ما
            تماس بگیرید تا راهنمایی لازم را دریافت کنید.
          </p>
        </div>
      </section>

      <section aria-labelledby="returns-info" className="flex flex-col gap-6">
        <Reveal>
          <h2
            id="returns-info"
            className="font-heading text-2xl font-extrabold text-dark sm:text-3xl"
          >
            بازگشت کالا
          </h2>
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
            <span
              className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary"
              aria-hidden="true"
            >
              <RotateCcw className="size-5" />
            </span>
            <h3 className="font-heading text-lg font-bold text-dark">
              بازهٔ بازگشت
            </h3>
            <p className="text-sm leading-8 text-foreground/80">
              تا {formatNumber(siteConfig.returnWindowDays)} روز پس از دریافت
              کالا می‌توانید درخواست بازگشت ثبت کنید.
            </p>
            <p className="text-sm leading-8 text-muted-foreground">
              مبنای این بازه، تاریخ تحویل سفارش است. درخواست‌هایی که پس از این
              مدت ثبت شوند، بسته به شرایط بررسی می‌شوند.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
            <span
              className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary"
              aria-hidden="true"
            >
              <ShieldCheck className="size-5" />
            </span>
            <h3 className="font-heading text-lg font-bold text-dark">
              شرایط پذیرش
            </h3>
            <ul className="flex flex-col gap-2 text-sm leading-8 text-foreground/80">
              {returnConditions.map((condition) => (
                <li key={condition} className="flex gap-2">
                  <CheckCircle2
                    className="mt-2 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/40 p-6">
          <h3 className="font-heading text-lg font-bold text-dark">
            استثنای بهداشتی گوشواره
          </h3>
          <p className="text-sm leading-8 text-foreground/80">
            به دلیل رعایت بهداشت، گوشواره پس از باز شدن بسته‌بندی قابل بازگشت
            نیست. اگر گوشواره آسیب‌دیده یا اشتباه ارسال شده باشد، این محدودیت
            اعمال نمی‌شود؛ در این حالت پیش از هر اقدامی با ما تماس بگیرید.
          </p>
        </div>
      </section>

      <section aria-labelledby="return-steps" className="flex flex-col gap-6">
        <Reveal>
          <h2
            id="return-steps"
            className="font-heading text-2xl font-extrabold text-dark sm:text-3xl"
          >
            مراحل درخواست بازگشت
          </h2>
        </Reveal>

        <ol className="flex flex-col gap-4">
          <li className="flex gap-4 rounded-2xl border border-border bg-card p-6">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-sm font-bold text-primary-foreground">
              {formatNumber(1)}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-lg font-bold text-dark">
                با ما تماس بگیرید
              </h3>
              <p className="text-sm leading-8 text-foreground/80">
                شمارهٔ سفارش و دلیل بازگشت را از طریق تلفن یا ایمیل اعلام کنید تا
                شرایط بررسی شود.
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-4">
                <a
                  href={`tel:${siteConfig.phone}`}
                  dir="ltr"
                  className={cn(
                    "inline-flex w-fit items-center gap-2 text-sm text-foreground/80 transition-colors hover:text-primary",
                    focusRing
                  )}
                >
                  <Phone className="size-4" aria-hidden="true" />
                  {siteConfig.phoneDisplay}
                </a>
                <a
                  href={`mailto:${siteConfig.email}`}
                  dir="ltr"
                  className={cn(
                    "inline-flex w-fit items-center gap-2 text-sm text-foreground/80 transition-colors hover:text-primary",
                    focusRing
                  )}
                >
                  <Mail className="size-4" aria-hidden="true" />
                  {siteConfig.email}
                </a>
              </div>
            </div>
          </li>

          <li className="flex gap-4 rounded-2xl border border-border bg-card p-6">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-sm font-bold text-primary-foreground">
              {formatNumber(2)}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-lg font-bold text-dark">
                کالا را آماده کنید
              </h3>
              <p className="text-sm leading-8 text-foreground/80">
                قطعه را در بسته‌بندی اصلی و همراه با لوازم آن بسته‌بندی کنید تا
                در مسیر بازگشت آسیب نبیند.
              </p>
            </div>
          </li>

          <li className="flex gap-4 rounded-2xl border border-border bg-card p-6">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-sm font-bold text-primary-foreground">
              {formatNumber(3)}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-lg font-bold text-dark">
                هماهنگی ارسال
              </h3>
              <p className="text-sm leading-8 text-foreground/80">
                روش ارسال کالای بازگشتی را با ما هماهنگ کنید. جزئیات ارسال را
                هنگام تأیید درخواست دریافت می‌کنید.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section aria-labelledby="refund-info" className="flex flex-col gap-4">
        <Reveal>
          <h2
            id="refund-info"
            className="font-heading text-2xl font-extrabold text-dark sm:text-3xl"
          >
            بازپرداخت
          </h2>
        </Reveal>
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <span
            className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary"
            aria-hidden="true"
          >
            <Banknote className="size-5" />
          </span>
          <p className="max-w-2xl text-sm leading-8 text-foreground/80">
            پس از دریافت و بررسی کالای بازگشتی، مبلغ به همان روش پرداخت یا حسابی
            که اعلام می‌کنید بازگردانده می‌شود. زمان واریز به بانک مقصد بستگی دارد
            و از کنترل ما خارج است.
          </p>
          <p className="max-w-2xl text-sm leading-8 text-muted-foreground">
            اگر کالا آسیب‌دیده، ناقص یا اشتباه ارسال شده باشد، پیش از هر اقدامی با
            ما تماس بگیرید تا سریع‌تر بررسی شود.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/contact">تماس با ما</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/faq">سؤالات متداول</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ShippingReturnsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Container className="flex flex-col gap-10 py-10 sm:gap-12 sm:py-16">
        <header className="flex flex-col gap-4">
          <p className="text-[11px] font-medium tracking-[0.35em] text-primary">
            MONO SHIPPING
          </p>
          <Reveal>
            <h1 className="font-heading text-3xl font-extrabold text-dark sm:text-4xl">
              ارسال و بازگشت
            </h1>
          </Reveal>
          <p className="max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
            هر چیزی که برای دریافت سفارش و بازگرداندن کالا لازم است بدانید؛ هزینه
            و زمان ارسال، شرایط بازگشت و مراحل ثبت درخواست.
          </p>
        </header>

        <Suspense fallback={<ShippingSkeleton />}>
          <ShippingContent />
        </Suspense>
      </Container>
    </div>
  );
}
