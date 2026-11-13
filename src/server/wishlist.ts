import { z } from "zod";
import type { ProductCardProduct } from "@/components/product-card";
import { Prisma } from "@/generated/prisma/client";
import { getSession } from "./auth/session";
import { prisma } from "./db";
import { productCardSelect, toProductCard } from "./products";

const idSchema = z.string().trim().min(1).max(64);

const INVALID_REQUEST = "درخواست نامعتبر است.";
const PRODUCT_UNAVAILABLE = "این محصول در دسترس نیست.";

export type WishlistMutationResult =
  | { ok: true; wishlisted: boolean }
  | { ok: false; message: string };

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/**
 * Adds or removes a wishlist item. The product has to exist and be active.
 * Expected failures are returned as typed results instead of thrown errors.
 */
export async function toggleWishlist(
  userId: string,
  productId: string
): Promise<WishlistMutationResult> {
  const parsed = z
    .object({ userId: idSchema, productId: idSchema })
    .safeParse({ userId, productId });

  if (!parsed.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, isActive: true },
    select: { id: true },
  });

  if (!product) {
    return { ok: false, message: PRODUCT_UNAVAILABLE };
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId: parsed.data.userId,
        productId: parsed.data.productId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.wishlistItem.deleteMany({
      where: {
        userId: parsed.data.userId,
        productId: parsed.data.productId,
      },
    });

    return { ok: true, wishlisted: false };
  }

  try {
    await prisma.wishlistItem.create({
      data: {
        userId: parsed.data.userId,
        productId: parsed.data.productId,
      },
    });
  } catch (error) {
    // A concurrent toggle may have created the same row first.
    if (isUniqueConstraintError(error)) {
      return { ok: true, wishlisted: true };
    }

    throw error;
  }

  return { ok: true, wishlisted: true };
}

export async function getWishlistProducts(
  userId: string
): Promise<ProductCardProduct[]> {
  const parsed = idSchema.safeParse(userId);

  if (!parsed.success) return [];

  const items = await prisma.wishlistItem.findMany({
    where: {
      userId: parsed.data,
      product: { isActive: true },
    },
    orderBy: { createdAt: "desc" },
    select: {
      product: { select: productCardSelect },
    },
  });

  return items.map((item) => toProductCard(item.product));
}

export async function getWishlistProductIds(
  userId: string
): Promise<string[]> {
  const parsed = idSchema.safeParse(userId);

  if (!parsed.success) return [];

  const items = await prisma.wishlistItem.findMany({
    where: {
      userId: parsed.data,
      product: { isActive: true },
    },
    select: { productId: true },
  });

  return items.map((item) => item.productId);
}

export function getWishlistIdsForSession(): Promise<string[]> {
  return getSession().then((user) =>
    user ? getWishlistProductIds(user.id) : []
  );
}

export async function getWishlistCount(userId: string): Promise<number> {
  const parsed = idSchema.safeParse(userId);

  if (!parsed.success) return 0;

  return prisma.wishlistItem.count({
    where: {
      userId: parsed.data,
      product: { isActive: true },
    },
  });
}
