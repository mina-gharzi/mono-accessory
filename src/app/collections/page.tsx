import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/motion/reveal";
import {
  getActiveCollectionsList,
  type HomeCollection,
} from "@/server/products";

export const metadata: Metadata = {
  title: "کالکشن‌ها | مونو اکسسوری",
  description:
    "مجموعه‌های منتخب مونو اکسسوری؛ از پرفروش‌ها و تازه‌ها تا انتخاب‌های آماده برای هدیه.",
  alternates: {
    canonical: "/collections",
  },
};

export default function CollectionsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Container className="flex flex-col gap-8 py-10 sm:py-14">
        <header className="flex flex-col gap-2">
          <p className="text-[11px] font-medium tracking-[0.35em] text-primary">
            MONO COLLECTIONS
          </p>
          <h1 className="font-heading text-3xl font-extrabold text-dark sm:text-4xl">
            کالکشن‌ها
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            مجموعه‌هایی که با یک ایده کنار هم چیده شده‌اند؛ از محبوب‌ترین قطعه‌ها
            تا تازه‌ترین انتخاب‌های فصل.
          </p>
        </header>

        <Suspense fallback={<CollectionsSkeleton />}>
          <CollectionsGrid />
        </Suspense>
      </Container>
    </div>
  );
}

async function CollectionsGrid() {
  await connection();

  const collections = await getActiveCollectionsList();

  if (collections.length === 0) {
    return (
      <EmptyState
        title="هنوز کالکشنی ثبت نشده"
        description="کالکشن‌ها پس از افزودن در این صفحه نمایش داده می‌شوند."
      />
    );
  }

  return (
    <Reveal delay={0.05}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <CollectionCard key={collection.slug} collection={collection} />
        ))}
      </div>
    </Reveal>
  );
}

function CollectionCard({ collection }: { collection: HomeCollection }) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group relative flex aspect-[4/5] overflow-hidden rounded-xl bg-dark text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {collection.image ? (
        <Image
          src={collection.image}
          alt={collection.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.03]"
        />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/35 to-transparent"
      />
      <div className="relative mt-auto flex flex-col gap-2 p-5 sm:p-6">
        <h2 className="font-heading text-xl font-extrabold sm:text-2xl">
          {collection.name}
        </h2>
        <p className="line-clamp-2 text-sm leading-6 text-primary-foreground/80">
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

function CollectionsSkeleton() {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-hidden="true"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="aspect-[4/5] animate-pulse rounded-xl bg-muted motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}
