import { randomInt } from "node:crypto";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import type { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import {
  canUserReview,
  getApprovedReviews,
  getApprovedReviewSummary,
  submitReview,
} from "@/server/reviews";
import { getProductBySlug } from "@/server/products";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const createdUserIds: string[] = [];
const createdCategoryIds: string[] = [];
const createdProductIds: string[] = [];

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${randomInt(0, 1_000_000)}`;
}

async function createUser() {
  const user = await prisma.user.create({
    data: {
      name: `Test ${uniqueSuffix()}`,
      mobile: `09${randomInt(100_000_000, 999_999_999)}`,
      passwordHash: "not-used-in-these-tests",
    },
  });

  createdUserIds.push(user.id);

  return user;
}

async function createProduct() {
  const suffix = uniqueSuffix();
  const category = await prisma.category.create({
    data: {
      name: `Category ${suffix}`,
      slug: `category-${suffix}`,
      image: "/images/categories/test.jpg",
    },
  });

  createdCategoryIds.push(category.id);

  const product = await prisma.product.create({
    data: {
      name: `Product ${suffix}`,
      slug: `product-${suffix}`,
      description: "Integration test product for reviews",
      specs: {},
      price: 100_000,
      categoryId: category.id,
    },
  });

  createdProductIds.push(product.id);

  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      color: "طلایی",
      sku: `SKU-${suffix}`,
      stock: 10,
    },
  });

  return { product, variant };
}

async function createOrder(
  userId: string,
  variantId: string,
  productName: string,
  status: OrderStatus
) {
  return prisma.order.create({
    data: {
      orderNumber: `TEST-${uniqueSuffix()}`,
      userId,
      status,
      paymentStatus: status === "DELIVERED" ? "PAID" : "PENDING",
      subtotal: 100_000,
      shippingCost: 0,
      total: 100_000,
      recipientName: "کاربر آزمایشی",
      mobile: "09121234567",
      province: "تهران",
      city: "تهران",
      address: "خیابان آزمایشی، پلاک ۱۲",
      postalCode: "1234567890",
      items: {
        create: {
          variantId,
          productName,
          color: "طلایی",
          unitPrice: 100_000,
          quantity: 1,
        },
      },
    },
  });
}

afterEach(async () => {
  if (createdUserIds.length > 0) {
    await prisma.order.deleteMany({
      where: { userId: { in: createdUserIds } },
    });
    await prisma.review.deleteMany({
      where: { userId: { in: createdUserIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }

  if (createdProductIds.length > 0) {
    await prisma.product.deleteMany({
      where: { id: { in: createdProductIds } },
    });
  }

  if (createdCategoryIds.length > 0) {
    await prisma.category.deleteMany({
      where: { id: { in: createdCategoryIds } },
    });
  }

  createdUserIds.length = 0;
  createdCategoryIds.length = 0;
  createdProductIds.length = 0;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("review eligibility", () => {
  it("does not allow a customer without a DELIVERED order to submit", async () => {
    const user = await createUser();
    const { product, variant } = await createProduct();

    await createOrder(user.id, variant.id, product.name, "SHIPPED");

    const eligibility = await canUserReview(user.id, product.id);
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reason).toContain("تحویل");

    const result = await submitReview(user.id, product.id, {
      rating: 5,
      comment: "کیفیت این محصول واقعاً خوب بود",
    });

    expect(result.ok).toBe(false);
    expect(
      await prisma.review.count({
        where: { userId: user.id, productId: product.id },
      })
    ).toBe(0);
  });
});

describe("review submission", () => {
  it("allows one review after delivery and rejects a second attempt", async () => {
    const user = await createUser();
    const { product, variant } = await createProduct();

    await createOrder(user.id, variant.id, product.name, "DELIVERED");

    const first = await submitReview(user.id, product.id, {
      rating: 4,
      comment: "کیفیت ساخت و بسته‌بندی خیلی خوب بود",
    });

    expect(first.ok).toBe(true);

    if (!first.ok) return;

    expect(first.review.status).toBe("PENDING");

    const second = await submitReview(user.id, product.id, {
      rating: 5,
      comment: "تلاش دوم برای ثبت دیدگاه دیگر",
    });

    expect(second.ok).toBe(false);

    const eligibility = await canUserReview(user.id, product.id);
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.review?.status).toBe("PENDING");
    expect(eligibility.reason).toContain("در انتظار تأیید");

    expect(
      await prisma.review.count({
        where: { userId: user.id, productId: product.id },
      })
    ).toBe(1);
  });
});

describe("approved review aggregation", () => {
  it("excludes a PENDING review from the product rating and includes it after approval", async () => {
    const user = await createUser();
    const { product, variant } = await createProduct();

    await createOrder(user.id, variant.id, product.name, "DELIVERED");

    const submitted = await submitReview(user.id, product.id, {
      rating: 4,
      comment: "رنگ و اندازه دقیقاً مطابق توضیحات بود",
    });

    expect(submitted.ok).toBe(true);

    const pendingSummary = await getApprovedReviewSummary(product.id);
    expect(pendingSummary).toEqual({ averageRating: null, reviewCount: 0 });
    expect(await getApprovedReviews(product.id)).toHaveLength(0);

    const pendingProduct = await getProductBySlug(product.slug);
    expect(pendingProduct?.averageRating).toBeNull();
    expect(pendingProduct?.reviewCount).toBe(0);

    await prisma.review.update({
      where: { userId_productId: { userId: user.id, productId: product.id } },
      data: { status: "APPROVED" },
    });

    const approvedSummary = await getApprovedReviewSummary(product.id);
    expect(approvedSummary).toEqual({ averageRating: 4, reviewCount: 1 });
    expect(await getApprovedReviews(product.id)).toHaveLength(1);

    const approvedProduct = await getProductBySlug(product.slug);
    expect(approvedProduct?.averageRating).toBe(4);
    expect(approvedProduct?.reviewCount).toBe(1);
    expect(approvedProduct?.reviews[0]?.comment).toBe(
      "رنگ و اندازه دقیقاً مطابق توضیحات بود"
    );
  });
});
