import Link from "next/link";
import { getImageProps } from "next/image";
import { ArrowLeft } from "lucide-react";
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
        <div className="relative isolate flex aspect-4/5 overflow-hidden rounded-3xl bg-dark sm:aspect-2/1">
          <HeroMedia desktopSrcSet={desktopSrcSet} mobile={mobile} />

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-dark/80 via-dark/10 to-transparent sm:bg-linear-to-l sm:from-dark/70 sm:via-dark/10 sm:to-transparent"
          />

          <div className="relative mt-auto flex flex-col items-start gap-6 p-6 sm:my-auto sm:p-12 lg:p-16">
            <p className="text-[11px] font-medium tracking-[0.4em] text-primary-foreground/80">
              MONO
            </p>
            <h1 className="font-heading text-4xl font-extrabold leading-[1.3] text-primary-foreground sm:text-5xl lg:text-6xl">
              درخشش ساده،
              <br />
              برای هر روز.
            </h1>
            <Button
              asChild
              size="lg"
              className="rounded-full bg-primary-foreground px-7 text-dark hover:bg-primary-foreground/90"
            >
              <Link href="/shop">
                مشاهدهٔ فروشگاه
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}