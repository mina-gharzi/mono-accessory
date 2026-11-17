import { randomInt } from "node:crypto";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import type { ShippingInput } from "@/server/orders";
import { prisma } from "@/server/db";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/server/auth/session", () => ({
  requireAdmin: vi.fn(async () => ({
    id: "test-admin",
    name: "Test Admin",
    mobile: "09120000000",
    role: "ADMIN" as const,
    mobileVerifiedAt: new Date(),
  })),
}));

import { changeOrderStatus } from "@/server/admin-orders";
import { listAdminDiscounts } from "@/server/discounts";
import {
  cancelPendingOrder,
  markOrderPaid,
  placeOrder,
} from "@/server/orders";
import { DEFAULT_SHIPPING_COST } from "@/server/pricing";

const shipping: ShippingInput = {
  recipientName: "کاربر آزمایشی",
  mobile: "09121234567",
  province: "تهران",
  city: "تهران",
  address: "خیابان آزمایشی، پلاک ۱۲، واحد ۳",
  postalCode: "1234567890",
};

const createdUserIds: string[] = [];
const createdCategoryIds: string[] = [];
const createdProductIds: string[] = [];
const createdDiscountIds: string[] = [];

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

async function createProduct(options: { price: number; stock: number }) {
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
      description: "Integration test product",
      specs: {},
      price: options.price,
      categoryId: category.id,
    },
  });

  createdProductIds.push(product.id);

  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      color: "طلایی",
      sku: `SKU-${suffix}`,
      stock: options.stock,
    },
  });

  return { product, variant };
}

async function putInCart(userId: string, variantId: string, quantity: number) {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  return prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity },
    create: { cartId: cart.id, variantId, quantity },
  });
}

async function readStock(variantId: string): Promise<number> {
  const variant = await prisma.productVariant.findUniqueOrThrow({
    where: { id: variantId },
    select: { stock: true },
  });

  return variant.stock;
}

async function readSoldCount(productId: string): Promise<number> {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    select: { soldCount: true },
  });

  return product.soldCount;
}

async function createDiscount(options: {
  usageLimit: number | null;
  value: number;
}) {
  const code = `TEST${uniqueSuffix()}`.toUpperCase().slice(0, 20);
  const discount = await prisma.discount.create({
    data: {
      code,
      type: "FIXED",
      value: options.value,
      usageLimit: options.usageLimit,
    },
  });

  createdDiscountIds.push(discount.id);

  return discount;
}

async function readDiscountUsedCount(discountId: string): Promise<number> {
  const discount = await prisma.discount.findUniqueOrThrow({
    where: { id: discountId },
    select: { usedCount: true },
  });

  return discount.usedCount;
}

afterEach(async () => {
  if (createdUserIds.length > 0) {
    await prisma.order.deleteMany({
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

  if (createdDiscountIds.length > 0) {
    await prisma.discount.deleteMany({
      where: { id: { in: createdDiscountIds } },
    });
  }

  createdUserIds.length = 0;
  createdCategoryIds.length = 0;
  createdProductIds.length = 0;
  createdDiscountIds.length = 0;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("placeOrder", () => {
  it("computes totals on the server, decrements stock and rolls back on shortage", async () => {
    const user = await createUser();
    const { product, variant } = await createProduct({
      price: 100_000,
      stock: 10,
    });

    await putInCart(user.id, variant.id, 3);

    // Extra fields stand in for prices a hostile client might send.
    const clientInput = { ...shipping, price: 1, subtotal: 1, total: 1 };
    const result = await placeOrder(user.id, clientInput as ShippingInput);

    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const order = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: result.orderNumber },
      include: { items: true },
    });

    expect(order.subtotal).toBe(300_000);
    expect(order.shippingCost).toBe(DEFAULT_SHIPPING_COST);
    expect(order.total).toBe(300_000 + DEFAULT_SHIPPING_COST);
    expect(order.discountAmount).toBe(0);
    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.unitPrice).toBe(100_000);
    expect(order.items[0]?.quantity).toBe(3);

    expect(await readStock(variant.id)).toBe(7);
    expect(await readSoldCount(product.id)).toBe(0);

    // A second cart with one short line must roll back the line that succeeded.
    const rollbackUser = await createUser();
    const enough = await createProduct({ price: 100_000, stock: 10 });
    const short = await createProduct({ price: 50_000, stock: 1 });

    await putInCart(rollbackUser.id, enough.variant.id, 2);
    await putInCart(rollbackUser.id, short.variant.id, 5);

    const rejected = await placeOrder(rollbackUser.id, shipping);

    expect(rejected.ok).toBe(false);
    expect(await readStock(enough.variant.id)).toBe(10);
    expect(await readStock(short.variant.id)).toBe(1);
    expect(
      await prisma.order.count({ where: { userId: rollbackUser.id } })
    ).toBe(0);
  });
});

describe("markOrderPaid", () => {
  it("is idempotent and rejects paying another user's order", async () => {
    const user = await createUser();
    const otherUser = await createUser();
    const { product, variant } = await createProduct({
      price: 100_000,
      stock: 10,
    });

    await putInCart(user.id, variant.id, 2);

    const placed = await placeOrder(user.id, shipping);

    expect(placed.ok).toBe(true);

    if (!placed.ok) return;

    const order = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: placed.orderNumber },
      select: { id: true },
    });

    const stolen = await markOrderPaid(order.id, otherUser.id, "ref-stolen");
    expect(stolen.ok).toBe(false);

    const untouched = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      select: { status: true, paymentStatus: true },
    });
    expect(untouched.status).toBe("PENDING");
    expect(untouched.paymentStatus).toBe("PENDING");
    expect(await readSoldCount(product.id)).toBe(0);

    const first = await markOrderPaid(order.id, user.id, "ref-1");
    expect(first.ok).toBe(true);

    const paid = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      select: { status: true, paymentStatus: true },
    });
    expect(paid.status).toBe("PAID");
    expect(paid.paymentStatus).toBe("PAID");
    expect(await readSoldCount(product.id)).toBe(2);
    expect(
      await prisma.cartItem.count({ where: { cart: { userId: user.id } } })
    ).toBe(0);

    // A new cart line added after payment must survive a replayed callback.
    await putInCart(user.id, variant.id, 1);

    const replay = await markOrderPaid(order.id, user.id, "ref-1");
    expect(replay.ok).toBe(true);
    expect(await readSoldCount(product.id)).toBe(2);
    expect(
      await prisma.cartItem.count({ where: { cart: { userId: user.id } } })
    ).toBe(1);
  });
});

describe("cancelling an order", () => {
  it("restores stock exactly once for the customer and the admin path", async () => {
    const user = await createUser();
    const { variant } = await createProduct({ price: 100_000, stock: 10 });

    await putInCart(user.id, variant.id, 2);

    const placed = await placeOrder(user.id, shipping);

    expect(placed.ok).toBe(true);

    if (!placed.ok) return;

    const order = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: placed.orderNumber },
      select: { id: true },
    });

    expect(await readStock(variant.id)).toBe(8);

    const first = await cancelPendingOrder(order.id, user.id);
    expect(first.ok).toBe(true);
    expect(await readStock(variant.id)).toBe(10);

    const replay = await cancelPendingOrder(order.id, user.id);
    expect(replay.ok).toBe(true);
    expect(await readStock(variant.id)).toBe(10);

    // Admin cancellation on a fresh order restores stock once as well.
    await putInCart(user.id, variant.id, 1);

    const secondPlaced = await placeOrder(user.id, shipping);

    expect(secondPlaced.ok).toBe(true);

    if (!secondPlaced.ok) return;

    const secondOrder = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: secondPlaced.orderNumber },
      select: { id: true },
    });

    expect(await readStock(variant.id)).toBe(9);

    const cancelled = await changeOrderStatus(secondOrder.id, "CANCELLED");
    expect(cancelled.ok).toBe(true);
    expect(await readStock(variant.id)).toBe(10);

    const cancelledAgain = await changeOrderStatus(secondOrder.id, "CANCELLED");
    expect(cancelledAgain.ok).toBe(true);
    expect(await readStock(variant.id)).toBe(10);
  });
});

describe("discount usage", () => {
  it("enforces the usage limit atomically and restores it on cancellation", async () => {
    const user = await createUser();
    const { variant } = await createProduct({ price: 100_000, stock: 10 });
    const discount = await createDiscount({ usageLimit: 1, value: 50_000 });

    await putInCart(user.id, variant.id, 1);

    const first = await placeOrder(user.id, shipping, discount.code);

    expect(first.ok).toBe(true);

    if (!first.ok) return;

    const order = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: first.orderNumber },
      select: {
        id: true,
        discountCode: true,
        discountAmount: true,
        total: true,
      },
    });

    expect(order.discountCode).toBe(discount.code);
    expect(order.discountAmount).toBe(50_000);
    expect(order.total).toBe(110_000);
    expect(await readStock(variant.id)).toBe(9);
    expect(await readDiscountUsedCount(discount.id)).toBe(1);

    const listed = await listAdminDiscounts({ q: discount.code, page: 1 });
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]?.usedCount).toBe(1);
    expect(listed.items[0]?.orderCount).toBe(1);

    // The cart still holds the item. The second order must fail on the usage
    // limit and roll back the stock decrement it already performed.
    const second = await placeOrder(user.id, shipping, discount.code);

    expect(second.ok).toBe(false);
    expect(await readStock(variant.id)).toBe(9);
    expect(await prisma.order.count({ where: { userId: user.id } })).toBe(1);
    expect(await readDiscountUsedCount(discount.id)).toBe(1);

    const cancelled = await cancelPendingOrder(order.id, user.id);
    expect(cancelled.ok).toBe(true);
    expect(await readStock(variant.id)).toBe(10);
    expect(await readDiscountUsedCount(discount.id)).toBe(0);

    const replay = await cancelPendingOrder(order.id, user.id);
    expect(replay.ok).toBe(true);
    expect(await readDiscountUsedCount(discount.id)).toBe(0);
  });
});
