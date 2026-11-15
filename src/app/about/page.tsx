import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Eye, Gem, Sparkles, Sun } from "lucide-react";
import { Container } from "@/components/container";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "دربارهٔ ما | مونو اکسسوری",
  description:
    "داستان مونو، ارزش‌ها و نگاه ما به اکسسوری‌های مینیمال، روزمره و ماندگار.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: siteConfig.name,
    title: "دربارهٔ ما | مونو اکسسوری",
    description:
      "داستان مونو، ارزش‌ها و نگاه ما به اکسسوری‌های مینیمال، روزمره و ماندگار.",
    url: "/about",
  },
};

const values = [
  {
    icon: Sparkles,
    title: "طراحی مینیمال",
    description:
      "قطعه‌هایی که به‌سادگی با استایل روزمره ترکیب می‌شوند و بدون شلوغی دیده می‌شوند.",
  },
  {
    icon: Gem,
    title: "کیفیت در جزئیات",
    description:
      "به متریال، پرداخت سطح و دوام اتصال‌ها توجه می‌کنیم؛ چون جزئیات کوچک، تفاوت را می‌سازند.",
  },
  {
    icon: Sun,
    title: "استفادهٔ روزمره",
    description:
      "اکسسوری برای زندگی واقعی؛ سبک، راحت و مناسب تکرار در روزهای معمولی.",
  },
  {
    icon: Eye,
    title: "شفافیت در انتخاب",
    description:
      "مشخصات و توضیحات هر قطعه را روشن می‌نویسیم تا انتخاب آگاهانه‌تری داشته باشید.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Container className="flex flex-col gap-14 py-10 sm:gap-20 sm:py-16">
        <header className="flex flex-col gap-4">
          <p className="text-[11px] font-medium tracking-[0.35em] text-primary">
            MONO STORY
          </p>
          <Reveal>
            <h1 className="font-heading text-3xl font-extrabold text-dark sm:text-4xl">
              دربارهٔ مونو
            </h1>
          </Reveal>
          <p className="max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
            مونو یک فروشگاه اکسسوری است که با تمرکز بر طراحی مینیمال، انتخاب‌های
            روزمره و کیفیت جزئیات شکل گرفته است.
          </p>
        </header>

        <section
          aria-labelledby="about-story"
          className="grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-12"
        >
          <Reveal>
            <h2
              id="about-story"
              className="font-heading text-2xl font-extrabold text-dark sm:text-3xl"
            >
              از یک ایدهٔ ساده
            </h2>
          </Reveal>
          <div className="flex max-w-2xl flex-col gap-4 text-sm leading-8 text-foreground/80 sm:text-base">
            <p>
              مونو از این ایده شروع شد که اکسسوری نباید فقط برای مناسبت‌های خاص
              باشد؛ باید بخشی طبیعی از استایل روزمره باشد. قطعه‌ای که صبح با آن
              بیرون می‌روید، عصر هم با همان لباس‌ها هماهنگ است و لازم نیست برای
              دیده‌شدن تلاش کند.
            </p>
            <p>
              ما قطعه‌هایی را انتخاب می‌کنیم که ساده، قابل ترکیب و مناسب استفادهٔ
              تکرارشونده باشند. طراحی‌ها بدون شلوغی، با تمرکز بر فرم، تناسب و
              جزئیات شکل می‌گیرند. هر قطعه پیش از ارسال بررسی و با بسته‌بندی
              محافظت‌شده آماده می‌شود.
            </p>
            <p>
              مونو یک انتخاب شخصی است؛ برای کسانی که به طراحی آرام، جزئیات دقیق و
              اکسسوری‌هایی که سال‌ها همراهشان می‌مانند اهمیت می‌دهند.
            </p>
          </div>
        </section>

        <section aria-labelledby="about-values" className="flex flex-col gap-8">
          <Reveal>
            <h2
              id="about-values"
              className="font-heading text-2xl font-extrabold text-dark sm:text-3xl"
            >
              ارزش‌های ما
            </h2>
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2">
            {values.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6"
              >
                <span
                  className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary"
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="font-heading text-lg font-bold text-dark">
                  {title}
                </h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  {description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="about-cta"
          className="relative isolate overflow-hidden rounded-3xl bg-dark px-6 py-10 text-primary-foreground sm:px-12 sm:py-14"
        >
          <div
            aria-hidden="true"
            className="absolute -inset-e-16 -top-16 -z-10 size-48 rounded-full border border-primary-foreground/15"
          />
          <div
            aria-hidden="true"
            className="absolute inset-e-24 -bottom-20 -z-10 size-32 rounded-full border border-primary-foreground/10"
          />
          <div className="flex max-w-xl flex-col gap-4">
            <h2
              id="about-cta"
              className="font-heading text-2xl font-extrabold sm:text-3xl"
            >
              قطعهٔ بعدی استایل شما
            </h2>
            <p className="text-sm leading-8 text-primary-foreground/75 sm:text-base">
              مجموعهٔ مونو را ببینید و قطعه‌ای پیدا کنید که با روزهای شما هماهنگ
              باشد.
            </p>
            <div className="mt-2">
              <Button asChild size="lg" variant="secondary">
                <Link href="/shop">
                  مشاهدهٔ فروشگاه
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}
