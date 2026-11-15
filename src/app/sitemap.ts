import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { siteUrl } from "@/lib/site-config";
import {
  getActiveCollectionsList,
  getSitemapProducts,
} from "@/server/products";

const staticPages: {
  path: string;
  changeFrequency: "weekly" | "monthly";
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/shop", changeFrequency: "weekly", priority: 0.9 },
  { path: "/collections", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/shipping-returns", changeFrequency: "monthly", priority: 0.6 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  const [collections, products] = await Promise.all([
    getActiveCollectionsList(),
    getSitemapProducts(),
  ]);

  const now = new Date();

  return [
    ...staticPages.map((page) => ({
      url: new URL(page.path, siteUrl).toString(),
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...collections.map((collection) => ({
      url: new URL(`/collections/${collection.slug}`, siteUrl).toString(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: new URL(`/product/${product.slug}`, siteUrl).toString(),
      lastModified: product.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
