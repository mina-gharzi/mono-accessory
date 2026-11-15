import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { Reveal } from "@/components/motion/reveal";
import { formatNumber } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

// توجه: این متن یک نمونهٔ اولیهٔ حقوقی است. پیش از استفادهٔ تجاری واقعی باید
// توسط مشاور حقوقی بازبینی و با شرایط واقعی کسب‌وکار تطبیق داده شود.

export const metadata: Metadata = {
  title: "قوانین و مقررات | مونو اکسسوری",
  description:
    "قوانین خرید از مونو اکسسوری؛ ثبت سفارش، قیمت‌ها، پرداخت، ارسال، بازگشت کالا، حریم خصوصی و مسئولیت‌ها.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: siteConfig.name,
    title: "قوانین و مقررات | مونو اکسسوری",
    description:
      "قوانین خرید از مونو اکسسوری؛ ثبت سفارش، قیمت‌ها، پرداخت، ارسال، بازگشت کالا، حریم خصوصی و مسئولیت‌ها.",
    url: "/terms",
  },
};

const sections = [
  {
    id: "general",
    title: "کلیات",
    body: [
      "استفاده از فروشگاه مونو اکسسوری و ثبت سفارش به معنای پذیرش این قوانین است. اگر با هر بخش از این متن موافق نیستید، لطفاً پیش از ثبت سفارش با ما در ارتباط باشید.",
      "این قوانین برای خریدهای آنلاین از این فروشگاه تنظیم شده و ممکن است برای پاسخ به تغییرات فروشگاه به‌روزرسانی شود. نسخهٔ معتبر همیشه همین صفحه است.",
    ],
  },
  {
    id: "orders",
    title: "ثبت و تأیید سفارش",
    body: [
      "سفارش پس از تکمیل مراحل خرید ثبت می‌شود. مسئولیت درستی نام، شمارهٔ تماس، نشانی و کد پستی با خریدار است؛ اگر اطلاعات ناقص یا نادرست باشد، ممکن است ارسال سفارش با تأخیر یا لغو روبه‌رو شود.",
      "در صورت ناموجود شدن یک قطعه پس از ثبت سفارش یا وجود خطای واضح در قیمت یا موجودی، حق لغو سفارش و بازگرداندن مبلغ پرداخت‌شده محفوظ است. در این حالت پیش از هر اقدامی با خریدار تماس می‌گیریم.",
    ],
  },
  {
    id: "prices",
    title: "قیمت‌ها و محاسبهٔ مبلغ",
    body: [
      "همهٔ قیمت‌ها به تومان نمایش داده می‌شوند. مبلغ نهایی سفارش، شامل هزینهٔ ارسال، پیش از پرداخت در صفحهٔ سبد خرید و تسویه حساب نمایش داده می‌شود.",
      "مبلغ سفارش در سرور محاسبه می‌شود و مبلغ نمایش‌داده‌شده در زمان ثبت سفارش ملاک است. قیمت محصولات ممکن است در آینده تغییر کند، اما این تغییر روی سفارش‌های ثبت‌شده اثر ندارد.",
    ],
  },
  {
    id: "payment",
    title: "پرداخت",
    body: [
      "سفارش پس از پرداخت موفق تأیید می‌شود. در نسخهٔ فعلی فروشگاه، پرداخت از طریق یک درگاه آزمایشی انجام می‌شود و مبلغی از حساب بانکی خریدار کسر نمی‌شود؛ این وضعیت برای تست مسیر خرید است و پرداخت واقعی محسوب نمی‌شود.",
      "اطلاعات کارت بانکی در فروشگاه ذخیره نمی‌شود و پرداخت در اختیار درگاه پرداخت است. اگر پرداخت انجام شد اما سفارش تأیید نشد، با شمارهٔ سفارش با ما تماس بگیرید.",
    ],
  },
  {
    id: "shipping",
    title: "ارسال",
    body: [
      `سفارش‌ها پس از تأیید آماده و ارسال می‌شوند. زمان تقریبی رسیدن سفارش ${siteConfig.deliveryTimeText} است؛ این بازه تخمینی است و در روزهای پرترافیک یا برای شهرهای دور ممکن است بیشتر شود.`,
      "هزینهٔ ارسال و مبلغ ارسال رایگان پیش از پرداخت نمایش داده می‌شود. جزئیات کامل در صفحهٔ ارسال و بازگشت آمده است.",
    ],
  },
  {
    id: "returns",
    title: "بازگشت و تعویض",
    body: [
      `تا ${formatNumber(siteConfig.returnWindowDays)} روز پس از دریافت کالا، درخواست بازگشت برای قطعهٔ استفاده‌نشده و دارای بسته‌بندی اصلی امکان‌پذیر است. به دلیل رعایت بهداشت، گوشواره پس از باز شدن بسته قابل بازگشت نیست.`,
      "برای ثبت درخواست بازگشت، پیش از هر اقدامی با ما تماس بگیرید یا ایمیل بزنید و شمارهٔ سفارش را ذکر کنید. شرایط و مراحل کامل در صفحهٔ ارسال و بازگشت توضیح داده شده است.",
    ],
  },
  {
    id: "privacy",
    title: "حریم خصوصی و داده‌ها",
    body: [
      "اطلاعاتی که هنگام ثبت‌نام و خرید وارد می‌کنید، مانند نام، شمارهٔ موبایل و نشانی، فقط برای پردازش سفارش، پشتیبانی و بهبود تجربهٔ خرید استفاده می‌شود.",
      "اطلاعات شما برای اهداف تبلیغاتی به اشخاص دیگر فروخته نمی‌شود. برای نگهداری امن حساب، رمز عبور به‌صورت هش‌شده ذخیره می‌شود و در اختیار ما نیست.",
    ],
  },
  {
    id: "liability",
    title: "مسئولیت و محدودیت‌ها",
    body: [
      "تلاش می‌کنیم مشخصات، تصاویر و موجودی محصولات دقیق باشد؛ با این حال ممکن است رنگ در نمایشگرها کمی متفاوت دیده شود یا در توضیحات خطای جزئی رخ دهد. در چنین مواردی پیش از استفاده با ما تماس بگیرید.",
      "فروشگاه مسئول خسارت‌های ناشی از استفادهٔ نادرست از محصول، نگهداری نامناسب یا حوادث خارج از کنترل خود نیست. این موارد جایگزین حقوق قانونی خریدار نیست.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Container className="flex flex-col gap-10 py-10 sm:gap-14 sm:py-16">
        <header className="flex flex-col gap-4">
          <p className="text-[11px] font-medium tracking-[0.35em] text-primary">
            MONO TERMS
          </p>
          <Reveal>
            <h1 className="font-heading text-3xl font-extrabold text-dark sm:text-4xl">
              قوانین و مقررات
            </h1>
          </Reveal>
          <p className="max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
            شرایط خرید، پرداخت، ارسال و بازگشت کالا در مونو اکسسوری. این متن را
            پیش از ثبت سفارش بخوانید.
          </p>
        </header>

        <article className="flex max-w-3xl flex-col gap-10">
          {sections.map((section, index) => (
            <section
              key={section.id}
              aria-labelledby={`terms-${section.id}`}
              className="flex flex-col gap-3 border-t border-border pt-8 first:border-t-0 first:pt-0"
            >
              <h2
                id={`terms-${section.id}`}
                className="font-heading text-xl font-extrabold text-dark sm:text-2xl"
              >
                <span className="me-2 text-primary">
                  {formatNumber(index + 1)}.
                </span>
                {section.title}
              </h2>
              <div className="flex flex-col gap-3 text-sm leading-8 text-foreground/80">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </article>

        <section
          aria-labelledby="terms-help"
          className="flex max-w-3xl flex-col gap-3 rounded-2xl border border-border bg-secondary/40 p-6 sm:p-8"
        >
          <h2
            id="terms-help"
            className="font-heading text-xl font-extrabold text-dark sm:text-2xl"
          >
            سؤالی دربارهٔ این قوانین دارید؟
          </h2>
          <p className="text-sm leading-8 text-foreground/80">
            جزئیات ارسال و بازگشت در صفحهٔ{" "}
            <Link
              href="/shipping-returns"
              className="rounded-md font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              ارسال و بازگشت
            </Link>{" "}
            آمده است. برای هر پرسش دیگری می‌توانید از صفحهٔ{" "}
            <Link
              href="/contact"
              className="rounded-md font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              تماس با ما
            </Link>{" "}
            با ما در ارتباط باشید.
          </p>
        </section>
      </Container>
    </div>
  );
}
