import { z } from "zod";
import type { ProductCardProduct } from "@/components/product-card";
import {
  defaultShopQuery,
  SHOP_PAGE_SIZE,
  SORT_VALUES,
  type ShopQuery,
  type SortValue,
} from "@/lib/shop-params";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "./db";

export const productCardSelect = {
  id: true,
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

export type ProductCardRow = Prisma.ProductGetPayload<{
  select: typeof productCardSelect;
}>;

export function toProductCard(row: ProductCardRow): ProductCardProduct {
  return {
    id: row.id,
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

function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

function normalizeSearchTerm(value: string): string {
  return toEnglishDigits(value)
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

function toInteger(value: string): number | undefined {
  const normalized = toEnglishDigits(value).trim();

  if (!/^\d+$/.test(normalized)) return undefined;

  const number = Number(normalized);
  return Number.isSafeInteger(number) ? number : undefined;
}

const optionalText = (maxLength: number) =>
  z
    .preprocess(
      (value) => {
        if (typeof value !== "string") return undefined;
        const text = value.trim();
        return text ? text.slice(0, maxLength) : undefined;
      },
      z.string().optional()
    )
    .catch(undefined);

const optionalNumber = (max: number) =>
  z
    .preprocess(
      (value) => (typeof value === "string" ? toInteger(value) : undefined),
      z.number().int().min(0).max(max).optional()
    )
    .catch(undefined);

const optionalPage = z
  .preprocess(
    (value) => (typeof value === "string" ? toInteger(value) : undefined),
    z.number().int().min(1).max(1000).optional()
  )
  .catch(undefined);

const shopSearchParamsSchema = z.object({
  q: optionalText(80),
  category: optionalText(60),
  collection: optionalText(60),
  color: optionalText(40),
  minPrice: optionalNumber(1_000_000_000),
  maxPrice: optionalNumber(1_000_000_000),
  inStock: optionalText(10),
  sort: z
    .preprocess(
      (value) => (typeof value === "string" ? value : undefined),
      z.enum(SORT_VALUES).optional()
    )
    .catch(undefined),
  page: optionalPage,
});

export type ShopSearchParams = Record<string, string | string[] | undefined>;

export function parseShopQuery(raw: ShopSearchParams): ShopQuery {
  const parsed = shopSearchParamsSchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};

  let minPrice = data.minPrice ?? null;
  let maxPrice = data.maxPrice ?? null;

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const q = data.q ? normalizeSearchTerm(data.q) : "";

  return {
    ...defaultShopQuery,
    q: q || null,
    category: data.category ?? null,
    collection: data.collection ?? null,
    color: data.color ?? null,
    minPrice,
    maxPrice,
    inStock:
      data.inStock === "1" ||
      data.inStock === "true" ||
      data.inStock === "on",
    sort: data.sort ?? defaultShopQuery.sort,
    page: data.page ?? defaultShopQuery.page,
  };
}

export type ShopCategory = {
  name: string;
  slug: string;
  count: number;
};

export async function getCategoriesWithCounts(): Promise<ShopCategory[]> {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      name: true,
      slug: true,
      _count: {
        select: { products: { where: { isActive: true } } },
      },
    },
  });

  return categories.map((category) => ({
    name: category.name,
    slug: category.slug,
    count: category._count.products,
  }));
}

export type ShopColor = {
  color: string;
  count: number;
};

export async function getAvailableColors(): Promise<ShopColor[]> {
  const colors = await prisma.productVariant.groupBy({
    by: ["color"],
    where: {
      product: { isActive: true },
      stock: { gt: 0 },
    },
    _count: { _all: true },
    orderBy: { color: "asc" },
  });

  return colors.map((item) => ({
    color: item.color,
    count: item._count._all,
  }));
}

export type PriceRange = {
  min: number;
  max: number;
};

export async function getPriceRange(): Promise<PriceRange> {
  const range = await prisma.product.aggregate({
    where: { isActive: true },
    _min: { price: true },
    _max: { price: true },
  });

  return {
    min: range._min.price ?? 0,
    max: range._max.price ?? 0,
  };
}

export type ListProductsParams = {
  category?: string | null;
  collection?: string | null;
  q?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  inStock?: boolean;
  color?: string | null;
  sort?: SortValue;
  page?: number;
  pageSize?: number;
};

export type ProductListResult = {
  items: ProductCardProduct[];
  total: number;
  totalPages: number;
  page: number;
};

function productOrderBy(
  sort: SortValue | undefined
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "bestselling":
      return [{ soldCount: "desc" }, { createdAt: "desc" }];
    case "price-asc":
      return [{ price: "asc" }, { createdAt: "desc" }];
    case "price-desc":
      return [{ price: "desc" }, { createdAt: "desc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function listProducts(
  params: ListProductsParams
): Promise<ProductListResult> {
  const pageSize = clampLimit(params.pageSize ?? SHOP_PAGE_SIZE, 48);
  const requestedPage = Math.max(1, Math.trunc(params.page ?? 1));
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (params.category) {
    where.category = { slug: params.category };
  }

  if (params.collection) {
    where.collections = {
      some: { slug: params.collection, isActive: true },
    };
  }

  const q = params.q ? normalizeSearchTerm(params.q) : "";

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const priceFilter: Prisma.IntFilter<"Product"> = {};

  if (params.minPrice !== null && params.minPrice !== undefined) {
    priceFilter.gte = params.minPrice;
  }
  if (params.maxPrice !== null && params.maxPrice !== undefined) {
    priceFilter.lte = params.maxPrice;
  }
  if (priceFilter.gte !== undefined || priceFilter.lte !== undefined) {
    where.price = priceFilter;
  }

  if (params.color) {
    where.variants = {
      some: {
        color: params.color,
        ...(params.inStock ? { stock: { gt: 0 } } : {}),
      },
    };
  } else if (params.inStock) {
    where.variants = { some: { stock: { gt: 0 } } };
  }

  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const products = await prisma.product.findMany({
    where,
    orderBy: productOrderBy(params.sort),
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: productCardSelect,
  });

  return {
    items: products.map(toProductCard),
    total,
    totalPages,
    page,
  };
}

export async function getCollectionBySlug(
  slug: string
): Promise<HomeCollection | null> {
  return prisma.collection.findFirst({
    where: { slug, isActive: true },
    select: {
      name: true,
      slug: true,
      description: true,
      image: true,
    },
  });
}

export async function getActiveCollectionsList(): Promise<HomeCollection[]> {
  return prisma.collection.findMany({
    where: { isActive: true },
    orderBy: { slug: "asc" },
    select: {
      name: true,
      slug: true,
      description: true,
      image: true,
    },
  });
}

const productSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u);

const variantSkuSchema = z.string().trim().min(1).max(64);

const productIdSchema = z.string().trim().min(1).max(64);

const productSpecsSchema = z.record(z.string(), z.unknown());

const productDetailSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  specs: true,
  price: true,
  compareAtPrice: true,
  category: {
    select: { name: true, slug: true },
  },
  images: {
    orderBy: { sortOrder: "asc" },
    select: { url: true, alt: true },
  },
  variants: {
    orderBy: [{ color: "asc" }, { model: "asc" }, { sku: "asc" }],
    select: {
      id: true,
      color: true,
      model: true,
      sku: true,
      stock: true,
    },
  },
  reviews: {
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  },
} satisfies Prisma.ProductSelect;

type ProductDetailRow = Prisma.ProductGetPayload<{
  select: typeof productDetailSelect;
}>;

export type ProductSpec = {
  key: string;
  value: string;
};

export type ProductDetailVariant = {
  id: string;
  color: string;
  model: string | null;
  sku: string;
  stock: number;
};

export type ProductReview = {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
  createdAt: Date;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  specs: ProductSpec[];
  price: number;
  compareAtPrice: number | null;
  discountPercent: number | null;
  images: { url: string; alt: string }[];
  variants: ProductDetailVariant[];
  category: { name: string; slug: string };
  reviews: ProductReview[];
  averageRating: number | null;
  reviewCount: number;
  inStock: boolean;
};

function parseProductSpecs(value: Prisma.JsonValue): ProductSpec[] {
  const parsed = productSpecsSchema.safeParse(value);

  if (!parsed.success) return [];

  return Object.entries(parsed.data)
    .map(([key, rawValue]) => ({
      key: key.trim(),
      value:
        typeof rawValue === "string" ||
        typeof rawValue === "number" ||
        typeof rawValue === "boolean"
          ? String(rawValue).trim()
          : "",
    }))
    .filter((spec) => spec.key.length > 0 && spec.value.length > 0);
}

function toProductDetail(row: ProductDetailRow): ProductDetail {
  const variants = row.variants.map((variant) => ({
    id: variant.id,
    color: variant.color,
    model: variant.model,
    sku: variant.sku,
    stock: variant.stock,
  }));

  const reviews = row.reviews.map((review) => {
    const firstName = review.user.name.trim().split(/\s+/)[0];

    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment?.trim() || null,
      authorName: firstName || "کاربر مونو",
      createdAt: review.createdAt,
    };
  });

  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? Math.round(
          (reviews.reduce((total, review) => total + review.rating, 0) /
            reviewCount) *
            10
        ) / 10
      : null;

  const discountPercent =
    row.compareAtPrice && row.compareAtPrice > row.price
      ? Math.round((1 - row.price / row.compareAtPrice) * 100)
      : null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    specs: parseProductSpecs(row.specs),
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    discountPercent,
    images: row.images.map((image) => ({ url: image.url, alt: image.alt })),
    variants,
    category: row.category,
    reviews,
    averageRating,
    reviewCount,
    inStock: variants.some((variant) => variant.stock > 0),
  };
}

export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  const parsed = productSlugSchema.safeParse(slug);

  if (!parsed.success) return null;

  const product = await prisma.product.findFirst({
    where: { slug: parsed.data, isActive: true },
    select: productDetailSelect,
  });

  return product ? toProductDetail(product) : null;
}

export function pickVariant(
  variants: ProductDetailVariant[],
  requestedSku: string | string[] | undefined
): ProductDetailVariant | null {
  if (variants.length === 0) return null;

  const value = Array.isArray(requestedSku) ? undefined : requestedSku;
  const parsed = variantSkuSchema.safeParse(value);
  const requested = parsed.success
    ? variants.find((variant) => variant.sku === parsed.data)
    : undefined;

  return (
    requested ??
    variants.find((variant) => variant.stock > 0) ??
    variants[0] ??
    null
  );
}

export async function getSimilarProducts(
  productId: string,
  limit: number
): Promise<ProductCardProduct[]> {
  const parsed = productIdSchema.safeParse(productId);

  if (!parsed.success) return [];

  const take = clampLimit(limit);
  const current = await prisma.product.findUnique({
    where: { id: parsed.data },
    select: {
      categoryId: true,
      collections: { select: { id: true } },
    },
  });

  if (!current) return [];

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: current.categoryId,
      id: { not: parsed.data },
    },
    orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
    take,
    select: productCardSelect,
  });

  if (products.length >= take || current.collections.length === 0) {
    return products.map(toProductCard);
  }

  const fallback = await prisma.product.findMany({
    where: {
      isActive: true,
      id: {
        notIn: [parsed.data, ...products.map((product) => product.id)],
      },
      collections: {
        some: { id: { in: current.collections.map((collection) => collection.id) } },
      },
    },
    orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
    take: take - products.length,
    select: productCardSelect,
  });

  return [...products, ...fallback].map(toProductCard);
}
