import type { ProductCardProduct } from "@/components/product-card";
import { prisma } from "./db";

export async function getFeaturedProducts(
  limit: number
): Promise<ProductCardProduct[]> {
  const take = Math.min(Math.max(Math.trunc(limit), 1), 24);

  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { soldCount: "desc" },
    take,
    select: {
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
    },
  });

  return products.map(({ images, variants, ...product }) => ({
    ...product,
    image: images[0] ?? null,
    inStock: variants.some((variant) => variant.stock > 0),
  }));
}
