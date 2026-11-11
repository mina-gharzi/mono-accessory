import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/motion/reveal";
import { Pagination } from "@/components/shop/pagination";
import {
  ProductGrid,
  ProductGridSkeleton,
} from "@/components/shop/product-grid";
import { SortSelect } from "@/components/shop/sort-select";
import { Button } from "@/components/ui/button";
import {
  defaultShopQuery,
  formatNumber,
  SHOP_PAGE_SIZE,
  type ShopQuery,
} from "@/lib/shop-params";
import {
  getCollectionBySlug,
  listProducts,
  parseShopQuery,
  type HomeCollection,
} from "@/server/products";

type CollectionPageProps = PageProps<"/collections/[slug]">;

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    return {
      title: "کالکشن پیدا نشد | مونو اکسسوری",
      robots: { index: false },
    };
  }

  return {
    title: `${collection.name} | مونو اکسسوری`,
    description: collection.description,
    alternates: {
      canonical: `/collections/${collection.slug}`,
    },
  };
}

export default function CollectionPage({
  params,
  searchParams,
}: CollectionPageProps) {
  return (
    <Suspense fallback={<CollectionSkeleton />}>
      <CollectionContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CollectionContent({
  params,
  searchParams,
}: CollectionPageProps) {
  await connection();

  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  const raw = await searchParams;
  const parsed = parseShopQuery(raw);
  const query: ShopQuery = {
    ...defaultShopQuery,
    sort: parsed.sort,
    page: parsed.page,
  };

  const result = await listProducts({
    collection: slug,
    sort: query.sort,
    page: query.page,
    pageSize: SHOP_PAGE_SIZE,
  });

  const pathname = `/collections/${slug}`;

  return (
    <>
      <CollectionHero collection={collection} />

      <Container className="flex flex-1 flex-col gap-6 py-10 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-extrabold text-dark sm:text-2xl">
            {result.total > 0
              ? `${formatNumber(result.total)} محصول`
              : "محصولی در این کالکشن نیست"}
          </h2>
          <SortSelect pathname={pathname} query={query} />
        </div>

        {result.items.length > 0 ? (
          <Reveal delay={0.05}>
            <ProductGrid products={result.items} />
          </Reveal>
        ) : (
          <EmptyState
            title="این کالکشن هنوز محصولی ندارد"
            description="به‌زودی قطعه‌های تازه‌ای به این مجموعه اضافه می‌شود."
            action={
              <Button asChild>
                <Link href="/shop">مشاهدهٔ همهٔ محصولات</Link>
              </Button>
            }
          />
        )}

        <Pagination
          pathname={pathname}
          query={query}
          totalPages={result.totalPages}
        />
      </Container>
    </>
  );
}

function CollectionHero({ collection }: { collection: HomeCollection }) {
  return (
    <section className="relative overflow-hidden bg-dark">
      <div className="relative aspect-[16/10] min-h-[300px] sm:aspect-[21/9] sm:min-h-[360px]">
        {collection.image ? (
          <Image
            src={collection.image}
            alt={collection.name}
            fill
            preload
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-dark/95 via-dark/45 to-dark/10"
        />
        <div className="absolute inset-0">
          <Container className="flex h-full flex-col justify-end pb-8 sm:pb-12">
            <p className="text-[11px] font-medium tracking-[0.35em] text-primary-foreground/70">
              MONO COLLECTION
            </p>
            <h1 className="mt-2 font-heading text-3xl font-extrabold text-primary-foreground sm:text-4xl">
              {collection.name}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-primary-foreground/80">
              {collection.description}
            </p>
          </Container>
        </div>
      </div>
    </section>
  );
}

function CollectionSkeleton() {
  return (
    <>
      <div
        className="aspect-[16/10] min-h-[300px] animate-pulse bg-muted motion-reduce:animate-none sm:aspect-[21/9] sm:min-h-[360px]"
        aria-hidden="true"
      />
      <Container className="flex flex-col gap-6 py-10 sm:py-12">
        <div className="h-8 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <ProductGridSkeleton />
      </Container>
    </>
  );
}
