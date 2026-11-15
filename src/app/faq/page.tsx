import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Container } from "@/components/container";
import { Reveal } from "@/components/motion/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { formatNumber, formatPrice } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";
import {
  getShippingSettings,
  type ShippingSettings,
} from "@/server/pricing";

export const metadata: Metadata = {
  title: "سؤالات متداول | مونو اکسسوری",
  description:
    "پاسخ سؤال‌های رایج دربارهٔ ثبت سفارش، پرداخت، ارسال، بازگشت کالا، نگهداری جواهرات و سایز انگشتر در مونو اکسسوری.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: siteConfig.name,
    title: "سؤالات متداول | مونو اکسسوری",
    description:
      "پاسخ سؤال‌های رایج دربارهٔ ثبت سفارش، پرداخت، ارسال، بازگشت کالا، نگهداری جواهرات و سایز انگشتر در مونو اکسسوری.",
    url: "/faq",
  },
};

type FaqItem = {
  question: string;
  answer: string;
};

function buildFaqItems({
  shippingCost,
  freeShippingThreshold,
}: ShippingSettings): FaqItem[] {
  return [
    {
      question: "چطور در مونو اکسسوری سفارش ثبت کنم؟",
      answer:
        "محصول موردنظر را در فروشگاه انتخاب کنید، گزینهٔ رنگ یا سایز را مشخص کنید و آن را به سبد خرید اضافه کنید. در صفحهٔ سبد خرید اطلاعات ارسال را وارد کنید و سفارش را نهایی کنید. برای تکمیل خرید باید وارد حساب کاربری شوید.",
    },
    {
      question: "پرداخت سفارش چگونه انجام می‌شود؟",
      answer:
        "در نسخهٔ فعلی فروشگاه، پرداخت از طریق یک درگاه آزمایشی انجام می‌شود و هیچ مبلغی از حساب بانکی شما کسر نمی‌شود. این مرحله فقط برای بررسی مسیر خرید است و پرداخت واقعی محسوب نمی‌شود. پیش از شروع فروش واقعی، درگاه پرداخت معتبر جایگزین می‌شود.",
    },
    {
      question: "ارسال سفارش چقدر زمان می‌برد؟",
      answer: `سفارش‌ها پس از ثبت و تأیید، معمولاً در بازهٔ ${siteConfig.deliveryTimeText} به دست شما می‌رسند. این بازه تقریبی است و ممکن است در روزهای پرترافیک یا برای شهرهای دور کمی بیشتر شود.`,
    },
    {
      question: "هزینهٔ ارسال چقدر است؟",
      answer: `هزینهٔ ارسال ${formatPrice(shippingCost)} است. این مبلغ پیش از نهایی‌کردن سفارش در صفحهٔ سبد خرید نمایش داده می‌شود تا از ابتدا بدانید چه مبلغی پرداخت می‌کنید.`,
    },
    {
      question: "از چه مبلغی ارسال رایگان است؟",
      answer: `برای سفارش‌های با مبلغ ${formatPrice(freeShippingThreshold)} و بیشتر، ارسال رایگان است. اگر مبلغ سبد خرید شما کمتر از این مقدار باشد، مقدار باقی‌مانده تا ارسال رایگان در سبد خرید نشان داده می‌شود.`,
    },
    {
      question: "شرایط بازگشت کالا چیست؟",
      answer: `تا ${formatNumber(siteConfig.returnWindowDays)} روز پس از دریافت کالا، اگر قطعه استفاده نشده و در بسته‌بندی اصلی خود باشد، می‌توانید درخواست بازگشت ثبت کنید. به دلیل رعایت بهداشت، گوشواره پس از باز شدن بسته قابل بازگشت نیست. جزئیات کامل در صفحهٔ ارسال و بازگشت آمده است.`,
    },
    {
      question: "جواهرات استیل و بدلیجات را چطور نگهداری کنم؟",
      answer:
        "برای نگهداری قطعات استیل، آن‌ها را با پارچهٔ نرم و خشک تمیز کنید و از تماس با عطر، مواد شوینده و آب کلردار دور نگه دارید. بدلیجات آبکاری‌شده را پیش از شست‌وشو و ورزش جدا کنید و در کیسهٔ پارچه‌ای یا جعبهٔ دربسته نگه دارید. برای حفظ رنگ و درخشش، از استخر و حمام کنار بگذارید.",
    },
    {
      question: "سایز انگشتر را چطور انتخاب کنم؟",
      answer:
        "دور انگشت را با نواری کاغذی یا متر خیاطی اندازه بگیرید و اندازهٔ به‌دست‌آمده را با جدول سایز در صفحهٔ محصول مقایسه کنید. اگر بین دو سایز هستید، سایز بزرگ‌تر را انتخاب کنید. اندازه‌گیری در پایان روز، زمانی که انگشت کمی بزرگ‌تر است، نتیجهٔ دقیق‌تری می‌دهد.",
    },
    {
      question: "سفارشم را چطور پیگیری کنم؟",
      answer:
        "از بخش حساب کاربری و صفحهٔ سفارش‌ها، وضعیت هر سفارش را می‌بینید. اگر کد رهگیری برای سفارش ثبت شده باشد، همان‌جا نمایش داده می‌شود. برای پیگیری تلفنی، شمارهٔ سفارش را همراه داشته باشید.",
    },
    {
      question: "برای خرید باید حساب کاربری بسازم؟",
      answer:
        "برای ثبت سفارش و پیگیری آن، ورود به حساب کاربری لازم است. ثبت‌نام با شمارهٔ موبایل و رمز عبور انجام می‌شود. علاقه‌مندی‌های شما هم در حساب کاربری ذخیره می‌شود تا بعداً راحت‌تر پیدایشان کنید.",
    },
  ];
}

function FaqSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 10 }, (_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-xl bg-muted motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

async function FaqContent() {
  await connection();
  const shipping = await getShippingSettings();
  const items = buildFaqItems(shipping);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="flex flex-col gap-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-5 sm:px-7">
        {items.map((item, index) => (
          <AccordionItem key={item.question} value={`faq-${index + 1}`}>
            <AccordionTrigger className="py-5 text-start text-base font-bold text-dark hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-sm leading-8 text-muted-foreground">
              <p>{item.answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <section
        aria-labelledby="faq-more"
        className="flex flex-col gap-4 rounded-2xl border border-border bg-secondary/40 p-6 sm:p-8"
      >
        <h2
          id="faq-more"
          className="font-heading text-2xl font-extrabold text-dark sm:text-3xl"
        >
          پاسخ سؤالتان را پیدا نکردید؟
        </h2>
        <p className="max-w-2xl text-sm leading-8 text-foreground/80">
          جزئیات ارسال، هزینه‌ها و شرایط بازگشت در صفحهٔ ارسال و بازگشت آمده است.
          اگر باز هم سؤالی داشتید، از راه‌های تماس با ما در ارتباط باشید.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/shipping-returns">ارسال و بازگشت</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">تماس با ما</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Container className="flex flex-col gap-10 py-10 sm:gap-12 sm:py-16">
        <header className="flex flex-col gap-4">
          <p className="text-[11px] font-medium tracking-[0.35em] text-primary">
            MONO FAQ
          </p>
          <Reveal>
            <h1 className="font-heading text-3xl font-extrabold text-dark sm:text-4xl">
              سؤالات متداول
            </h1>
          </Reveal>
          <p className="max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
            پاسخ کوتاه و روشن برای سؤال‌هایی که بیشتر از ما پرسیده می‌شود؛ از ثبت
            سفارش و پرداخت تا ارسال، بازگشت و نگهداری اکسسوری‌ها.
          </p>
        </header>

        <Suspense fallback={<FaqSkeleton />}>
          <FaqContent />
        </Suspense>
      </Container>
    </div>
  );
}
