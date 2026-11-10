import type { ProductCardProduct } from "@/components/product-card";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "./db";

const productCardSelect = {
  name: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  images: {
    orderBy: { sortOrder: "asc" },
    take: 1,
    select: { url: true, alt: true },
  },
  variants: { select: { stock: true } },
} satisfies Prisma.ProductSelect;

type ProductCardRow = Prisma.ProductGetPayload<{
  select: typeof productCardSelect;
}>;

function toProductCard(row: ProductCardRow): ProductCardProduct {
  return {
    name: row.name,
    slug: row.slug,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    image: row.images[0] ?? null,
    inStock: row.variants.some((variant) => variant.stock > 0),
  };
}

function clampLimit(limit: number, max = 24) {
  return Math.min(Math.max(Math.trunc(limit), 1), max);
}

export async function getNewProducts(
  limit: number
): Promise<ProductCardProduct[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: clampLimit(limit),
    select: productCardSelect,
  });

  return products.map(toProductCard);
}

export async function getBestSellers(
  limit: number
): Promise<ProductCardProduct[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { soldCount: "desc" },
    take: clampLimit(limit),
    select: productCardSelect,
  });

  return products.map(toProductCard);
}

export async function getRecommendedProducts(
  limit: number
): Promise<ProductCardProduct[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { soldCount: "desc" },
    take: clampLimit(limit),
    select: productCardSelect,
  });

  return products.map(toProductCard);
}

export async function getDiscountedProducts(
  limit: number
): Promise<ProductCardProduct[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, compareAtPrice: { not: null } },
    orderBy: { soldCount: "desc" },
    take: clampLimit(limit),
    select: productCardSelect,
  });

  return products.map(toProductCard);
}

export type HomeCollection = {
  name: string;
  slug: string;
  description: string;
  image: string;
};

export async function getActiveCollections(
  limit: number
): Promise<HomeCollection[]> {
  return prisma.collection.findMany({
    where: { isActive: true },
    orderBy: { slug: "asc" },
    take: clampLimit(limit, 6),
    select: {
      name: true,
      slug: true,
      description: true,
      image: true,
    },
  });
}
