import Link from "next/link";
import { getImageProps } from "next/image";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { HeroMedia } from "./hero-media";

const imageSizes = "(min-width: 1152px) 1152px, 100vw";

export function Hero() {
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    alt: "",
    sizes: imageSizes,
    src: "/images/hero/hero-desktop.jpg",
    width: 2400,
    height: 1200,
  });

  const { props: mobile } = getImageProps({
    alt: "",
    sizes: imageSizes,
    src: "/images/hero/hero-mobile.jpg",
    width: 1080,
    height: 1440,
    loading: "eager",
    fetchPriority: "high",
  });

  return (
    <section className="pt-6 sm:pt-10">
      <Container>
        <div className="relative isolate flex aspect-[4/5] overflow-hidden rounded-xl bg-dark sm:aspect-[2/1]">
          <div
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden bg-dark"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgb(128_0_32_/_0.95),transparent_55%),radial-gradient(circle_at_15%_85%,rgb(176_96_110_/_0.5),transparent_45%)]" />
            <div className="absolute -end-20 top-8 size-64 rounded-full border border-primary-foreground/15 sm:size-80" />
            <div className="absolute end-24 bottom-10 size-32 rounded-full border border-primary-foreground/10 sm:size-44" />
          </div>

          <HeroMedia desktopSrcSet={desktopSrcSet} mobile={mobile} />

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-dark/95 via-dark/50 to-dark/15 sm:bg-gradient-to-l sm:from-dark/95 sm:via-dark/60 sm:to-dark/10"
          />

          <div className="relative mt-auto flex flex-col gap-4 p-6 sm:my-auto sm:max-w-xl sm:p-10 lg:p-14">
            <p className="text-[11px] font-medium tracking-[0.35em] text-primary-foreground/70">
              MONO ACCESSORY
            </p>
            <h1 className="font-heading text-3xl font-extrabold leading-[1.35] text-primary-foreground sm:text-4xl lg:text-5xl">
              درخشش ساده، برای هر روز.
            </h1>
            <p className="max-w-md text-sm leading-7 text-primary-foreground/80 sm:text-base sm:leading-8">
              از گردنبندهای استیل تا عینک‌های آفتابی؛ قطعه‌هایی ساده و ماندگار
              برای استایلی که هر روز کنارت است.
            </p>
            <div className="pt-1">
              <Button
                asChild
                size="lg"
                className="bg-primary-foreground text-dark hover:bg-primary-foreground/90"
              >
                <Link href="/shop">مشاهدهٔ فروشگاه</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
