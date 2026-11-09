import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatPrice } from "@/lib/format";

const palette = [
  {
    name: "پس‌زمینه",
    value: "rgb(255, 249, 242)",
    className: "bg-background",
  },
  {
    name: "اصلی",
    value: "rgb(128, 0, 32)",
    className: "bg-primary",
  },
  {
    name: "تیره",
    value: "rgb(45, 0, 0)",
    className: "bg-dark",
  },
];

const weights = [
  { label: "Regular 400", className: "font-normal" },
  { label: "Medium 500", className: "font-medium" },
  { label: "Bold 700", className: "font-bold" },
  { label: "ExtraBold 800", className: "font-extrabold" },
];

export default function Home() {
  const today = formatDate("2026-11-09");

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-14 px-6 py-16">
      <Reveal className="flex flex-col gap-4">
        <p className="text-xs font-medium tracking-[0.35em] text-muted-foreground">
          MONO ACCESSORY
        </p>
        <h1 className="font-heading text-4xl font-extrabold leading-tight text-dark">
          بنیان طراحی مونو
        </h1>
        <p className="max-w-xl text-base leading-8 text-muted-foreground">
          صفحهٔ موقت برای بررسی راست‌به‌چپ بودن رابط، فونت پینار، رنگ‌های برند و
          قالب‌بندی قیمت و تاریخ.
        </p>
      </Reveal>

      <Reveal className="flex flex-col gap-5" delay={0.05}>
        <h2 className="text-lg font-bold text-dark">پالت رنگ</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {palette.map((color) => (
            <div
              key={color.name}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className={`h-20 w-full ${color.className}`} />
              <div className="flex flex-col gap-1 p-4">
                <span className="text-sm font-medium text-foreground">
                  {color.name}
                </span>
                <span
                  dir="ltr"
                  className="text-left text-xs text-muted-foreground"
                >
                  {color.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal className="grid gap-8 md:grid-cols-2" delay={0.05}>
        <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-dark">دکمه‌ها</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button>افزودن به سبد</Button>
            <Button variant="outline">مشاهدهٔ محصول</Button>
            <Button variant="secondary">ذخیره</Button>
            <Button variant="ghost">بیشتر</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">کوچک</Button>
            <Button size="lg">بزرگ</Button>
          </div>
        </div>

        <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-dark">ورودی</h2>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">شمارهٔ موبایل</Label>
            <Input
              id="phone"
              inputMode="tel"
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              dir="ltr"
              className="text-left"
            />
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            اعتبارسنجی و پردازش داده‌ها در مراحل بعدی روی سرور انجام می‌شود.
          </p>
        </div>
      </Reveal>

      <Reveal className="grid gap-8 md:grid-cols-2" delay={0.05}>
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-dark">قالب‌بندی قیمت</h2>
          <p className="text-2xl font-bold text-primary">
            {formatPrice(1280000)}
          </p>
          <p className="text-sm text-muted-foreground">
            قیمت‌ها با ارقام فارسی و جداکنندهٔ هزارگان نمایش داده می‌شوند.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-dark">تاریخ شمسی</h2>
          <p className="text-2xl font-bold text-primary">{today}</p>
          <p className="text-sm text-muted-foreground">
            تاریخ‌ها فقط برای نمایش با تقویم جلالی قالب‌بندی می‌شوند.
          </p>
        </div>
      </Reveal>

      <Reveal className="flex flex-col gap-4" delay={0.05}>
        <h2 className="text-lg font-bold text-dark">فونت پینار</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {weights.map((weight) => (
            <div
              key={weight.label}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <span className={`text-base text-foreground ${weight.className}`}>
                اکسسوری مینیمال
              </span>
              <span dir="ltr" className="text-xs text-muted-foreground">
                {weight.label}
              </span>
            </div>
          ))}
        </div>
      </Reveal>
    </main>
  );
}
