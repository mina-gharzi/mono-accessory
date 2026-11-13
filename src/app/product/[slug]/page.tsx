import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageSquare } from "lucide-react";
import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/motion/reveal";
import { ProductGallery } from "@/components/product/product-gallery";
import { RatingStars } from "@/components/product/rating-stars";
import { VariantPurchasePanel } from "@/components/product/variant-purchase-panel";
import { SectionHeading } from "@/components/section-heading";
import { ProductGrid } from "@/components/shop/product-grid";
import { ProductDetailSkeleton } from "@/components/skeletons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatDate,
  formatNumber,
  formatPrice,
  formatRating,
} from "@/lib/format";
import {
  getProductBySlug,
  getSimilarProducts,
  pickVariant,
  type ProductDetail,
  type ProductReview,
  type ProductSpec,
} from "@/server/products";

type ProductPageProps = PageProps<"/product/[slug]">;

const focusRing =
  "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function toMetaDescription(product: ProductDetail): string {
  const text = product.description.replace(/\s+/g, " ").trim();

  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "محصول پیدا نشد | مونو اکسسوری",
      robots: { index: false },
    };
  }

  const description = toMetaDescription(product);
  const image = product.images[0];

  return {
    title: `${product.name} | مونو اکسسوری`,
    description,
    alternates: {
      canonical: `/product/${product.slug}`,
    },
    openGraph: {
      type: "website",
      title: `${product.name} | مونو اکسسوری`,
      description,
      url: `/product/${product.slug}`,
      images: image ? [{ url: image.url, alt: image.alt }] : undefined,
    },
  };
}

export default function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductContent({ params, searchParams }: ProductPageProps) {
  await connection();

  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const rawSearchParams = await searchParams;
  const selectedVariant = pickVariant(
    product.variants,
    rawSearchParams.variant
  );
  const similarProducts = await getSimilarProducts(product.id, 4);

  return (
    <div className="flex flex-1 flex-col pb-24 md:pb-0">
      <Container className="flex flex-1 flex-col gap-10 py-6 sm:py-10">
        <ProductBreadcrumb product={product} />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start lg:gap-12">
          <ProductGallery
            images={product.images}
            productName={product.name}
          />

          <div className="flex flex-col gap-7">
            <ProductSummary product={product} />
            <VariantPurchasePanel
              productId={product.id}
              productName={product.name}
              variants={product.variants}
              initialSku={selectedVariant?.sku ?? null}
              price={product.price}
            />
          </div>
        </div>

        <ProductTabs product={product} />

        {similarProducts.length > 0 ? (
          <section
            aria-label="محصولات مشابه"
            className="border-t border-border pt-10"
          >
            <SectionHeading
              title="محصولات مشابه"
              subtitle="قطعه‌هایی از همین دسته که ممکن است دوست داشته باشید."
            />
            <Reveal delay={0.05} className="mt-6">
              <ProductGrid products={similarProducts} />
            </Reveal>
          </section>
        ) : null}
      </Container>

      <ProductJsonLd product={product} />
    </div>
  );
}

function ProductBreadcrumb({ product }: { product: ProductDetail }) {
  return (
    <nav aria-label="مسیر صفحه">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <li>
          <Link
            href="/"
            className={`transition-colors hover:text-primary ${focusRing}`}
          >
            خانه
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronLeft className="size-3.5" />
        </li>
        <li>
          <Link
            href={`/shop?category=${product.category.slug}`}
            className={`transition-colors hover:text-primary ${focusRing}`}
          >
            {product.category.name}
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronLeft className="size-3.5" />
        </li>
        <li
          aria-current="page"
          className="line-clamp-1 max-w-[16rem] font-medium text-foreground"
        >
          {product.name}
        </li>
      </ol>
    </nav>
  );
}

function ProductSummary({ product }: { product: ProductDetail }) {
  const showCompareAtPrice =
    product.compareAtPrice !== null && product.compareAtPrice > product.price;

  return (
    <header className="flex flex-col gap-4">
      <Link
        href={`/shop?category=${product.category.slug}`}
        className={`w-fit text-xs font-medium text-primary transition-colors hover:text-dark ${focusRing}`}
      >
        {product.category.name}
      </Link>

      <h1 className="font-heading text-2xl font-extrabold leading-tight text-dark sm:text-3xl">
        {product.name}
      </h1>

      {product.averageRating !== null ? (
        <div className="flex flex-wrap items-center gap-2">
          <RatingStars rating={product.averageRating} />
          <span className="text-sm font-bold text-foreground">
            {formatRating(product.averageRating)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({formatNumber(product.reviewCount)} دیدگاه)
          </span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-heading text-2xl font-extrabold text-primary">
          {formatPrice(product.price)}
        </span>
        {showCompareAtPrice ? (
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(product.compareAtPrice ?? 0)}
          </span>
        ) : null}
        {product.discountPercent ? (
          <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
            {formatNumber(product.discountPercent)}٪ تخفیف
          </span>
        ) : null}
      </div>

      <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">
        {product.description}
      </p>
    </header>
  );
}

function ProductTabs({ product }: { product: ProductDetail }) {
  return (
    <section aria-label="جزئیات محصول">
      <Tabs defaultValue="description" className="gap-0">
        <TabsList
          variant="line"
          className="w-full flex-nowrap justify-start gap-x-4"
        >
          <TabsTrigger value="description" className="flex-none px-1">
            توضیحات
          </TabsTrigger>
          <TabsTrigger value="specs" className="flex-none px-1">
            مشخصات
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex-none px-1">
            دیدگاه‌ها ({formatNumber(product.reviewCount)})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="pt-6">
          <p className="max-w-3xl whitespace-pre-line text-sm leading-8 text-foreground/80">
            {product.description}
          </p>
        </TabsContent>

        <TabsContent value="specs" className="pt-6">
          <SpecsTable productName={product.name} specs={product.specs} />
        </TabsContent>

        <TabsContent value="reviews" className="pt-6">
          <ReviewsList reviews={product.reviews} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function SpecsTable({
  productName,
  specs,
}: {
  productName: string;
  specs: ProductSpec[];
}) {
  if (specs.length === 0) {
    return (
      <EmptyState
        title="مشخصاتی ثبت نشده است"
        description="به‌زودی جزئیات فنی این محصول اضافه می‌شود."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">مشخصات {productName}</caption>
        <tbody>
          {specs.map((spec) => (
            <tr
              key={spec.key}
              className="border-b border-border last:border-b-0"
            >
              <th
                scope="row"
                className="w-1/3 bg-secondary/40 px-4 py-3 text-start font-medium text-foreground"
              >
                {spec.key}
              </th>
              <td className="px-4 py-3 text-foreground/80">{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewsList({ reviews }: { reviews: ProductReview[] }) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="size-5" />}
        title="هنوز دیدگاهی ثبت نشده است"
        description="پس از خرید، می‌توانید دیدگاه خود را دربارهٔ این محصول ثبت کنید."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-lg border border-border bg-card p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {review.authorName}
              </span>
              <RatingStars rating={review.rating} starClassName="size-3.5" />
            </div>

            <time
              dateTime={review.createdAt.toISOString()}
              className="text-xs text-muted-foreground"
            >
              {formatDate(review.createdAt)}
            </time>
          </div>

          {review.comment ? (
            <p className="mt-3 text-sm leading-7 text-foreground/80">
              {review.comment}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ProductJsonLd({ product }: { product: ProductDetail }) {
  const firstVariant = product.variants[0];
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: "MONO ACCESSORY",
    },
    ...(product.images.length > 0
      ? {
          image: product.images.map((image) =>
            new URL(image.url, siteUrl).toString()
          ),
        }
      : {}),
    ...(firstVariant ? { sku: firstVariant.sku } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "IRR",
      price: product.price * 10,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: new URL(`/product/${product.slug}`, siteUrl).toString(),
    },
    ...(product.averageRating !== null && product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.averageRating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
