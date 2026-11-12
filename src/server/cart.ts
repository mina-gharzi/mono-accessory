import { z } from "zod";
import { CART_MAX_QUANTITY } from "@/lib/cart";
import { formatNumber } from "@/lib/format";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "./db";
import {
  calculateTotals,
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_COST,
  getShippingSettings,
  type CartTotals,
  type ShippingSettings,
} from "./pricing";

export type CartLineStatus = "ok" | "lowStock" | "outOfStock" | "unavailable";

export type CartLine = {
  id: string;
  productName: string;
  productSlug: string;
  image: { url: string; alt: string } | null;
  variant: {
    id: string;
    color: string;
    model: string | null;
    sku: string;
  };
  unitPrice: number;
  quantity: number;
  availableQuantity: number;
  stock: number;
  status: CartLineStatus;
  lineTotal: number;
};

export type Cart = {
  lines: CartLine[];
  totals: CartTotals;
  count: number;
};

export type CartMutationResult =
  | { ok: true; cart: Cart }
  | { ok: false; message: string };

const cartInclude = {
  items: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      quantity: true,
      variant: {
        select: {
          id: true,
          color: true,
          model: true,
          sku: true,
          stock: true,
          product: {
            select: {
              name: true,
              slug: true,
              price: true,
              isActive: true,
              images: {
                orderBy: { sortOrder: "asc" },
                take: 1,
                select: { url: true, alt: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartRow = Prisma.CartGetPayload<{ include: typeof cartInclude }>;
type CartItemRow = CartRow["items"][number];

const idSchema = z.string().trim().min(1).max(64);
const quantitySchema = z.number().int().min(1).max(CART_MAX_QUANTITY);

const addToCartInput = z.object({
  userId: idSchema,
  variantId: idSchema,
  quantity: quantitySchema,
});

const updateQuantityInput = z.object({
  userId: idSchema,
  itemId: idSchema,
  quantity: quantitySchema,
});

const removeItemInput = z.object({
  userId: idSchema,
  itemId: idSchema,
});

const INVALID_REQUEST = "درخواست نامعتبر است.";
const ITEM_NOT_FOUND = "این آیتم در سبد خرید شما پیدا نشد.";

function emptyCart(settings: ShippingSettings): Cart {
  return {
    lines: [],
    totals: calculateTotals({ subtotal: 0, ...settings }),
    count: 0,
  };
}

function toCartLine(item: CartItemRow): CartLine {
  const product = item.variant.product;
  const status: CartLineStatus = !product.isActive
    ? "unavailable"
    : item.variant.stock <= 0
      ? "outOfStock"
      : item.quantity > item.variant.stock
        ? "lowStock"
        : "ok";
  const availableQuantity =
    status === "ok"
      ? item.quantity
      : status === "lowStock"
        ? item.variant.stock
        : 0;

  return {
    id: item.id,
    productName: product.name,
    productSlug: product.slug,
    image: product.images[0] ?? null,
    variant: {
      id: item.variant.id,
      color: item.variant.color,
      model: item.variant.model,
      sku: item.variant.sku,
    },
    unitPrice: product.price,
    quantity: item.quantity,
    availableQuantity,
    stock: item.variant.stock,
    status,
    lineTotal: availableQuantity * product.price,
  };
}

export async function getCart(userId: string): Promise<Cart> {
  const parsedUserId = idSchema.safeParse(userId);

  if (!parsedUserId.success) {
    return emptyCart({
      shippingCost: DEFAULT_SHIPPING_COST,
      freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD,
    });
  }

  const [cart, settings] = await Promise.all([
    prisma.cart.findUnique({
      where: { userId: parsedUserId.data },
      include: cartInclude,
    }),
    getShippingSettings(),
  ]);

  if (!cart) {
    return emptyCart(settings);
  }

  const lines = cart.items.map(toCartLine);
  const subtotal = lines.reduce(
    (sum, line) => (line.status === "ok" ? sum + line.lineTotal : sum),
    0
  );
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  return {
    lines,
    count,
    totals: calculateTotals({ subtotal, ...settings }),
  };
}

export async function getCartCount(userId: string): Promise<number> {
  const parsed = idSchema.safeParse(userId);

  if (!parsed.success) {
    return 0;
  }

  const result = await prisma.cartItem.aggregate({
    where: { cart: { userId: parsed.data } },
    _sum: { quantity: true },
  });

  return result._sum.quantity ?? 0;
}

export async function addToCart(
  userId: string,
  variantId: string,
  quantity: number
): Promise<CartMutationResult> {
  const parsed = addToCartInput.safeParse({ userId, variantId, quantity });

  if (!parsed.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  const variant = await prisma.productVariant.findFirst({
    where: {
      id: parsed.data.variantId,
      product: { isActive: true },
    },
    select: { id: true, stock: true },
  });

  if (!variant) {
    return {
      ok: false,
      message: "این محصول یا گزینه در دسترس نیست.",
    };
  }

  if (variant.stock <= 0) {
    return { ok: false, message: "این گزینه فعلاً ناموجود است." };
  }

  if (parsed.data.quantity > variant.stock) {
    return {
      ok: false,
      message: `فقط ${formatNumber(variant.stock)} عدد از این گزینه موجود است.`,
    };
  }

  const limit = Math.min(variant.stock, CART_MAX_QUANTITY);
  const cart = await prisma.cart.upsert({
    where: { userId: parsed.data.userId },
    update: {},
    create: { userId: parsed.data.userId },
  });
  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_variantId: {
        cartId: cart.id,
        variantId: parsed.data.variantId,
      },
    },
    select: { id: true, quantity: true },
  });

  if (existing) {
    if (existing.quantity >= limit) {
      return {
        ok: false,
        message: "حداکثر تعداد قابل سفارش برای این گزینه در سبد شماست.",
      };
    }

    await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: Math.min(limit, existing.quantity + parsed.data.quantity),
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: parsed.data.variantId,
        quantity: Math.min(limit, parsed.data.quantity),
      },
    });
  }

  return { ok: true, cart: await getCart(parsed.data.userId) };
}

export async function updateQuantity(
  userId: string,
  itemId: string,
  quantity: number
): Promise<CartMutationResult> {
  const parsed = updateQuantityInput.safeParse({ userId, itemId, quantity });

  if (!parsed.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  const item = await prisma.cartItem.findFirst({
    where: {
      id: parsed.data.itemId,
      cart: { userId: parsed.data.userId },
    },
    select: {
      id: true,
      variant: {
        select: {
          stock: true,
          product: { select: { isActive: true } },
        },
      },
    },
  });

  if (!item) {
    return { ok: false, message: ITEM_NOT_FOUND };
  }

  if (!item.variant.product.isActive) {
    return { ok: false, message: "این محصول دیگر در دسترس نیست." };
  }

  if (item.variant.stock <= 0) {
    return { ok: false, message: "این گزینه فعلاً ناموجود است." };
  }

  if (parsed.data.quantity > item.variant.stock) {
    return {
      ok: false,
      message: `فقط ${formatNumber(item.variant.stock)} عدد از این گزینه موجود است.`,
    };
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity: parsed.data.quantity },
  });

  return { ok: true, cart: await getCart(parsed.data.userId) };
}

export async function removeItem(
  userId: string,
  itemId: string
): Promise<CartMutationResult> {
  const parsed = removeItemInput.safeParse({ userId, itemId });

  if (!parsed.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  const deleted = await prisma.cartItem.deleteMany({
    where: {
      id: parsed.data.itemId,
      cart: { userId: parsed.data.userId },
    },
  });

  if (deleted.count === 0) {
    return { ok: false, message: ITEM_NOT_FOUND };
  }

  return { ok: true, cart: await getCart(parsed.data.userId) };
}
