import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ArrowLeft, BadgeCheck, RotateCcw, Truck } from "lucide-react";
import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { Hero } from "@/components/home/hero";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard, type ProductCardProduct } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { ProductCardSkeleton } from "@/components/skeletons";
import {
  getActiveCollections,
  getBestSellers,
  getDiscountedProducts,
  getNewProducts,
  getRecommendedProducts,
  type HomeCollection,
} from "@/server/products";
import { formatNumber } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "مونو اکسسوری | جواهرات استیل، عینک و اکسسوری زنانه",
  description:
    "خرید آنلاین گردنبند، گوشواره، انگشتر و عینک آفتابی از مونو اکسسوری؛ طراحی مینیمال، کیفیت ماندگار و ارسال سریع به سراسر ایران.",
  alternates: {
    canonical: "/",
  },
};

const productGridClassName =
  "grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4";

const brandValues = [
  {
    icon: Truck,
    title: "ارسال سریع",
    description: "بسته‌بندی محافظت‌شده و ارسال به سراسر ایران",
  },
  {
    icon: RotateCcw,
    title: "بازگشت آسان",
    description: `تا ${formatNumber(siteConfig.returnWindowDays)} روز پس از دریافت`,
  },
  {
    icon: BadgeCheck,
    title: "کیفیت تضمین‌شده",
    description: "بررسی هر قطعه پیش از ارسال",
  },
];

function Section({
  title,
  href,
  muted = false,
  children,
}: {
  title: string;
  href?: string;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn("py-16 sm:py-24", muted && "bg-secondary/40")}>
      <Container className="flex flex-col gap-10">
        <Reveal>
          <SectionHeading title={title} href={href} />
        </Reveal>
        {children}
      </Container>
    </section>
  );
}

function ProductGrid({ products }: { products: ProductCardProduct[] }) {
  return (
    <div className={productGridClassName}>
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}

function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={productGridClassName} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

function CollectionsSkeleton() {
  return (
    <div
      className="grid gap-4 sm:gap-5 md:grid-cols-3 md:grid-rows-2"
      aria-hidden="true"
    >
      <div className="aspect-4/5 animate-pulse rounded-3xl bg-muted motion-reduce:animate-none md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-120" />
      <div className="aspect-4/5 animate-pulse rounded-3xl bg-muted motion-reduce:animate-none md:aspect-auto md:min-h-58" />
      <div className="aspect-4/5 animate-pulse rounded-3xl bg-muted motion-reduce:animate-none md:aspect-auto md:min-h-58" />
    </div>
  );
}

function OffersSkeleton() {
  return (
    <section className="py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <div
          className="h-32 animate-pulse rounded-3xl bg-muted motion-reduce:animate-none"
          aria-hidden="true"
        />
        <GridSkeleton />
      </Container>
    </section>
  );
}

function CollectionTile({
  collection,
  featured = false,
}: {
  collection: HomeCollection;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      aria-label={collection.name}
      className={cn(
        "group relative flex overflow-hidden rounded-3xl bg-dark text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        featured
          ? "aspect-4/5 md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-120"
          : "aspect-4/5 md:aspect-auto md:min-h-58"
      )}
    >
      <Image
        src={collection.image}
        alt=""
        fill
        sizes={
          featured
            ? "(min-width: 768px) 66vw, 100vw"
            : "(min-width: 768px) 33vw, 100vw"
        }
        className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.04]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-dark/75 via-dark/10 to-transparent"
      />
      <div className="relative mt-auto flex w-full items-end justify-between gap-4 p-5 sm:p-7">
        <h3
          className={cn(
            "font-heading font-extrabold",
            featured ? "text-2xl sm:text-3xl" : "text-xl"
          )}
        >
          {collection.name}
        </h3>
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground text-dark transition-transform duration-300 motion-safe:group-hover:-translate-x-1"
        >
          <ArrowLeft className="size-4" />
        </span>
      </div>
    </Link>
  );
}

async function CollectionsGrid() {
  const collections = await getActiveCollections(3);

  if (collections.length === 0) {
    return (
      <EmptyState
        title="هنوز مجموعه‌ای ثبت نشده"
        description="مجموعه‌ها پس از افزودن در فروشگاه نمایش داده می‌شوند."
      />
    );
  }

  const [featured, ...rest] = collections;

  return (
    <Reveal delay={0.05}>
      <div className="grid gap-4 sm:gap-5 md:grid-cols-3 md:grid-rows-2">
        <CollectionTile collection={featured} featured />
        {rest.map((collection) => (
          <CollectionTile key={collection.slug} collection={collection} />
        ))}
      </div>
    </Reveal>
  );
}

async function NewArrivalsGrid() {
  const products = await getNewProducts(8);

  if (products.length === 0) {
    return (
      <EmptyState
        title="هنوز محصول تازه‌ای نیست"
        description="به‌زودی قطعه‌های جدید به فروشگاه اضافه می‌شوند."
      />
    );
  }

  return (
    <Reveal delay={0.05}>
      <ProductGrid products={products} />
    </Reveal>
  );
}

async function BestSellersRow() {
  const products = await getBestSellers(8);

  if (products.length === 0) {
    return (
      <EmptyState
        title="هنوز فروشی ثبت نشده"
        description="پس از ثبت سفارش‌ها، پرفروش‌ترین قطعه‌ها اینجا نمایش داده می‌شوند."
      />
    );
  }

  return (
    <Reveal delay={0.05}>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-thin sm:mx-0 sm:px-0 md:grid md:grid-cols-4 md:gap-x-6 md:gap-y-10 md:overflow-visible md:pb-0">
        {products.map((product) => (
          <ProductCard
            key={product.slug}
            product={product}
            className="min-w-[68%] shrink-0 snap-start sm:min-w-[42%] md:min-w-0 md:shrink"
          />
        ))}
      </div>
    </Reveal>
  );
}

async function RecommendedGrid() {
  const products = await getRecommendedProducts(4);

  if (products.length === 0) {
    return (
      <EmptyState
        title="هنوز محصول منتخبی نیست"
        description="محصولات منتخب مونو به‌زودی اینجا نمایش داده می‌شوند."
      />
    );
  }

  return (
    <Reveal delay={0.05}>
      <ProductGrid products={products} />
    </Reveal>
  );
}

async function OffersSection() {
  const products = await getDiscountedProducts(4);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-3xl bg-primary text-primary-foreground">
            <div
              aria-hidden="true"
              className="absolute -inset-e-16 -top-16 -z-10 size-56 rounded-full border border-primary-foreground/15"
            />
            <div
              aria-hidden="true"
              className="absolute inset-e-20 -bottom-20 -z-10 size-40 rounded-full border border-primary-foreground/10"
            />
            <div className="flex flex-col gap-2 px-6 py-8 sm:px-12 sm:py-10">
              <p className="text-[11px] font-medium tracking-[0.4em] text-primary-foreground/70">
                MONO OFFERS
              </p>
              <h2 className="font-heading text-2xl font-extrabold sm:text-4xl">
                پیشنهادهای این هفته
              </h2>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <ProductGrid products={products} />
        </Reveal>
      </Container>
    </section>
  );
}

function BrandValues() {
  return (
    <section className="pb-16 sm:pb-24">
      <Container>
        <ul className="grid gap-6 rounded-3xl bg-card px-6 py-8 sm:grid-cols-3 sm:gap-8 sm:px-10">
          {brandValues.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-center gap-4">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"
                aria-hidden="true"
              >
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-heading text-base font-bold text-dark">
                  {title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />

      <Section title="مجموعه‌ها">
        <Suspense fallback={<CollectionsSkeleton />}>
          <CollectionsGrid />
        </Suspense>
      </Section>

      <Section title="تازه‌ها" href="/shop">
        <Suspense fallback={<GridSkeleton />}>
          <NewArrivalsGrid />
        </Suspense>
      </Section>

      <Section title="پرفروش‌ها" href="/shop" muted>
        <Suspense fallback={<GridSkeleton />}>
          <BestSellersRow />
        </Suspense>
      </Section>

      <Section title="پیشنهاد مونو" href="/shop">
        <Suspense fallback={<GridSkeleton />}>
          <RecommendedGrid />
        </Suspense>
      </Section>

      <Suspense fallback={<OffersSkeleton />}>
        <OffersSection />
      </Suspense>

      <BrandValues />
    </div>
  );
}