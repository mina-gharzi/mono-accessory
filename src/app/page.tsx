import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
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
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "مونو اکسسوری | جواهرات استیل، عینک و اکسسوری زنانه",
  description:
    "خرید آنلاین گردنبند، گوشواره، انگشتر و عینک آفتابی از مونو اکسسوری؛ طراحی مینیمال، کیفیت ماندگار و ارسال سریع به سراسر ایران.",
};

const productGridClassName =
  "grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-4";

const brandValues = [
  {
    icon: Truck,
    title: "ارسال سریع",
    description: "ارسال به سراسر ایران؛ رایگان برای خرید بالای ۱٫۵ میلیون تومان.",
  },
  {
    icon: RotateCcw,
    title: "بازگشت آسان",
    description: "تا ۷ روز پس از دریافت، بدون دردسر و با هماهنگی قبلی.",
  },
  {
    icon: BadgeCheck,
    title: "کیفیت تضمین‌شده",
    description: "مواد ماندگار و بررسی کیفیت هر قطعه پیش از ارسال.",
  },
];

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
      <div className="aspect-[4/5] animate-pulse rounded-xl bg-muted motion-reduce:animate-none md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[480px]" />
      <div className="aspect-[4/5] animate-pulse rounded-xl bg-muted motion-reduce:animate-none md:aspect-auto md:min-h-[232px]" />
      <div className="aspect-[4/5] animate-pulse rounded-xl bg-muted motion-reduce:animate-none md:aspect-auto md:min-h-[232px]" />
    </div>
  );
}

function OffersSkeleton() {
  return (
    <section className="py-12 sm:py-16">
      <Container className="flex flex-col gap-8">
        <div
          className="h-40 animate-pulse rounded-xl bg-muted motion-reduce:animate-none"
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
      className={cn(
        "group relative flex overflow-hidden rounded-xl bg-dark text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        featured
          ? "aspect-[4/5] md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[480px]"
          : "aspect-[4/5] md:aspect-auto md:min-h-[232px]"
      )}
    >
      <Image
        src={collection.image}
        alt={collection.name}
        fill
        sizes={
          featured
            ? "(min-width: 768px) 66vw, 100vw"
            : "(min-width: 768px) 33vw, 100vw"
        }
        className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.03]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/35 to-transparent"
      />
      <div className="relative mt-auto flex flex-col gap-2 p-5 sm:p-6">
        <h3 className="font-heading text-xl font-extrabold sm:text-2xl">
          {collection.name}
        </h3>
        <p className="line-clamp-2 max-w-sm text-sm leading-6 text-primary-foreground/80">
          {collection.description}
        </p>
        <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium">
          مشاهدهٔ مجموعه
          <ArrowLeft
            className="size-4 transition-transform motion-safe:group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

async function CollectionsGrid() {
  await connection();

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
  await connection();

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
  await connection();

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
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:px-0 md:grid md:grid-cols-4 md:gap-x-6 md:gap-y-8 md:overflow-visible md:pb-0">
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
  await connection();

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
  await connection();

  const products = await getDiscountedProducts(4);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16">
      <Container className="flex flex-col gap-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl bg-primary text-primary-foreground">
            <div
              aria-hidden="true"
              className="absolute -end-12 -top-12 size-48 rounded-full border border-primary-foreground/15"
            />
            <div className="relative flex flex-col gap-3 px-6 py-8 sm:px-10 sm:py-10">
              <p className="text-[11px] font-medium tracking-[0.35em] text-primary-foreground/70">
                MONO OFFERS
              </p>
              <h2 className="font-heading text-2xl font-extrabold sm:text-3xl">
                پیشنهادهای این هفته
              </h2>
              <p className="max-w-xl text-sm leading-7 text-primary-foreground/80">
                قطعه‌های منتخب با قیمت ویژه؛ فرصتی کوتاه برای تکمیل استایل.
              </p>
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
    <section className="border-y border-border/60 bg-card/60">
      <Container className="grid gap-6 py-8 sm:grid-cols-3 sm:gap-8">
        {brandValues.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-start gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"
              aria-hidden="true"
            >
              <Icon className="size-5" />
            </span>
            <div>
              <h2 className="font-heading text-base font-bold text-dark">
                {title}
              </h2>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />

      <section className="py-12 sm:py-16">
        <Container className="flex flex-col gap-8">
          <Reveal>
            <SectionHeading
              title="مجموعه‌ها"
              subtitle="از پرفروش‌ها تا هدیه؛ انتخاب‌هایی برای هر لحظه."
            />
          </Reveal>
          <Suspense fallback={<CollectionsSkeleton />}>
            <CollectionsGrid />
          </Suspense>
        </Container>
      </section>

      <section className="border-t border-border/60 py-12 sm:py-16">
        <Container className="flex flex-col gap-8">
          <Reveal>
            <SectionHeading
              title="تازه‌ها"
              subtitle="جدیدترین قطعه‌هایی که به مونو اضافه شده‌اند."
              href="/shop"
            />
          </Reveal>
          <Suspense fallback={<GridSkeleton />}>
            <NewArrivalsGrid />
          </Suspense>
        </Container>
      </section>

      <section className="border-y border-border/60 bg-secondary/40 py-12 sm:py-16">
        <Container className="flex flex-col gap-8">
          <Reveal>
            <SectionHeading
              title="پرفروش‌ها"
              subtitle="محبوب‌ترین قطعه‌های مونو به انتخاب مشتریان."
              href="/shop"
            />
          </Reveal>
          <Suspense fallback={<GridSkeleton />}>
            <BestSellersRow />
          </Suspense>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="flex flex-col gap-8">
          <Reveal>
            <SectionHeading
              title="پیشنهاد مونو"
              subtitle="انتخاب‌های ویژه برای تکمیل استایل روزمره."
              href="/shop"
            />
          </Reveal>
          <Suspense fallback={<GridSkeleton />}>
            <RecommendedGrid />
          </Suspense>
        </Container>
      </section>

      <Suspense fallback={<OffersSkeleton />}>
        <OffersSection />
      </Suspense>

      <BrandValues />
    </div>
  );
}
