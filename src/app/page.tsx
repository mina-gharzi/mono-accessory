import { Suspense } from "react";
import { connection } from "next/server";
import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { ProductCardSkeleton } from "@/components/skeletons";
import { getFeaturedProducts } from "@/server/products";

function FeaturedSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

async function FeaturedGrid() {
  await connection();

  const products = await getFeaturedProducts(8);

  if (products.length === 0) {
    return (
      <EmptyState
        title="هنوز محصولی ثبت نشده"
        description="پس از اجرای seed، محصولات منتخب اینجا نمایش داده می‌شوند."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-border/60">
        <Container className="flex flex-col gap-5 py-14 sm:py-20">
          <p className="text-xs font-medium tracking-[0.35em] text-muted-foreground">
            MONO ACCESSORY
          </p>
          <h1 className="max-w-2xl font-heading text-4xl font-extrabold leading-[1.3] text-dark sm:text-5xl">
            اکسسوری مینیمال، برای هر روز.
          </h1>
          <p className="max-w-xl text-base leading-8 text-muted-foreground">
            صفحهٔ موقت فاز سه برای بررسی کارت محصول، تایپوگرافی و چیدمان
            راست‌به‌چپ.
          </p>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="flex flex-col gap-8">
          <SectionHeading
            title="منتخب مونو"
            subtitle="قطعه‌هایی که بیشترین همراهی را با استایل روزمره دارند."
            href="/shop"
          />
          <Suspense fallback={<FeaturedSkeleton />}>
            <FeaturedGrid />
          </Suspense>
        </Container>
      </section>
    </div>
  );
}
