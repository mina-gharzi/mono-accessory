import { randomInt } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma/client";
import { CART_MAX_QUANTITY } from "@/lib/cart";
import { IRAN_PROVINCES, isIranProvince } from "@/lib/iran-provinces";
import { ORDER_STATUS_VALUES } from "@/lib/order-status";
import { mobileSchema, toEnglishDigits } from "./auth/mobile";
import { prisma } from "./db";
import { calculateTotals, resolveShippingSettings } from "./pricing";

export type ShippingInput = {
  recipientName: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
};

export type ShippingField = keyof ShippingInput;

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; total: number }
  | {
      ok: false;
      message: string;
      fieldErrors: Partial<Record<ShippingField, string>>;
    };

export type OrderMutationResult =
  | { ok: true }
  | { ok: false; message: string };

export type OrderItemDetail = {
  id: string;
  productName: string;
  productSlug: string;
  color: string;
  model: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  image: { url: string; alt: string } | null;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  recipientName: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  createdAt: Date;
  items: OrderItemDetail[];
};

const idSchema = z.string().trim().min(1).max(64);
const orderNumberSchema = z
  .string()
  .trim()
  .regex(/^MN-\d{6}-\d{5}$/);

const INVALID_REQUEST = "درخواست نامعتبر است.";
const EMPTY_CART = "سبد خرید شما خالی است.";
const UNAVAILABLE_PRODUCT = "یکی از محصولات سبد خرید شما در دسترس نیست.";
const ORDER_NOT_FOUND = "سفارش پیدا نشد.";
const ORDER_NOT_PAYABLE = "این سفارش قابل پرداخت نیست.";
const ORDER_NOT_CANCELLABLE = "این سفارش قابل لغو نیست.";
const ORDER_FAILED = "ثبت سفارش ناموفق بود. لطفاً دوباره تلاش کنید.";

const ORDER_NUMBER_ATTEMPTS = 5;

class PlaceOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlaceOrderError";
  }
}

function normalizePostalCode(value: string): string | null {
  const digits = toEnglishDigits(value).replace(/[\s-]/g, "");

  return /^\d{10}$/.test(digits) ? digits : null;
}

export const shippingInputSchema = z.object({
  recipientName: z
    .string()
    .trim()
    .min(2, "نام گیرنده باید حداقل ۲ نویسه باشد.")
    .max(60, "نام گیرنده نباید بیشتر از ۶۰ نویسه باشد."),
  mobile: mobileSchema,
  province: z.enum(IRAN_PROVINCES, {
    message: "استان را انتخاب کنید.",
  }),
  city: z
    .string()
    .trim()
    .min(2, "شهر باید حداقل ۲ نویسه باشد.")
    .max(60, "شهر نباید بیشتر از ۶۰ نویسه باشد."),
  address: z
    .string()
    .trim()
    .min(10, "نشانی باید حداقل ۱۰ نویسه باشد.")
    .max(300, "نشانی نباید بیشتر از ۳۰۰ نویسه باشد."),
  postalCode: z
    .string()
    .trim()
    .min(1, "کد پستی را وارد کنید.")
    .transform((value, ctx) => {
      const normalized = normalizePostalCode(value);

      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message: "کد پستی باید ۱۰ رقم باشد.",
        });

        return z.NEVER;
      }

      return normalized;
    }),
});

const orderInclude = {
  items: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      productName: true,
      color: true,
      model: true,
      unitPrice: true,
      quantity: true,
      variant: {
        select: {
          product: {
            select: {
              slug: true,
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
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function toOrderDetail(order: OrderRow): OrderDetail {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    discountAmount: order.discountAmount,
    total: order.total,
    recipientName: order.recipientName,
    mobile: order.mobile,
    province: order.province,
    city: order.city,
    address: order.address,
    postalCode: order.postalCode,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      productSlug: item.variant.product.slug,
      color: item.color,
      model: item.model,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.unitPrice * item.quantity,
      image: item.variant.product.images[0] ?? null,
    })),
  };
}

function toFieldErrors(
  error: z.ZodError
): Partial<Record<ShippingField, string>> {
  const fieldErrors: Partial<Record<ShippingField, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (
      (field === "recipientName" ||
        field === "mobile" ||
        field === "province" ||
        field === "city" ||
        field === "address" ||
        field === "postalCode") &&
      !fieldErrors[field]
    ) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

export function generateOrderNumber(now = new Date()): string {
  const year = String(now.getUTCFullYear()).slice(-2);
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const suffix = String(randomInt(0, 100_000)).padStart(5, "0");

  return `MN-${year}${month}${day}-${suffix}`;
}

function isOrderNumberCollision(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return target.includes("orderNumber");
  }

  return typeof target === "string" && target.includes("orderNumber");
}

/**
 * The whole placement runs in one transaction: every stock decrement, the
 * order and its item snapshots either commit together or roll back together.
 *
 * Known limitation: an abandoned PENDING order keeps its stock reserved until
 * it is cancelled. An expiry job can be added later; admin cancellation is
 * planned for phase 12.
 */
export async function placeOrder(
  userId: string,
  shippingInput: ShippingInput
): Promise<PlaceOrderResult> {
  const parsedUser = idSchema.safeParse(userId);
  const parsedShipping = shippingInputSchema.safeParse(shippingInput);

  if (!parsedUser.success) {
    return { ok: false, message: INVALID_REQUEST, fieldErrors: {} };
  }

  if (!parsedShipping.success) {
    return {
      ok: false,
      message: "لطفاً خطاهای فرم را بررسی کنید.",
      fieldErrors: toFieldErrors(parsedShipping.error),
    };
  }

  for (let attempt = 0; attempt < ORDER_NUMBER_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction((tx) =>
        createPendingOrder(tx, parsedUser.data, parsedShipping.data)
      );
    } catch (error) {
      if (error instanceof PlaceOrderError) {
        return { ok: false, message: error.message, fieldErrors: {} };
      }

      if (isOrderNumberCollision(error)) {
        continue;
      }

      throw error;
    }
  }

  return { ok: false, message: ORDER_FAILED, fieldErrors: {} };
}

async function createPendingOrder(
  tx: Prisma.TransactionClient,
  userId: string,
  shipping: z.output<typeof shippingInputSchema>
): Promise<PlaceOrderResult> {
  const cart = await tx.cart.findUnique({
    where: { userId },
    select: {
      items: {
        orderBy: { id: "asc" },
        select: {
          quantity: true,
          variant: {
            select: {
              id: true,
              color: true,
              model: true,
              stock: true,
              product: {
                select: {
                  name: true,
                  price: true,
                  isActive: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new PlaceOrderError(EMPTY_CART);
  }

  const settingRows = await tx.setting.findMany({
    where: { key: { in: ["shippingCost", "freeShippingThreshold"] } },
    select: { key: true, value: true },
  });
  const settings = resolveShippingSettings(settingRows);

  let subtotal = 0;

  for (const item of cart.items) {
    const product = item.variant.product;

    if (!product.isActive) {
      throw new PlaceOrderError(UNAVAILABLE_PRODUCT);
    }

    if (item.quantity < 1 || item.quantity > CART_MAX_QUANTITY) {
      throw new PlaceOrderError(INVALID_REQUEST);
    }

    const updated = await tx.productVariant.updateMany({
      where: {
        id: item.variant.id,
        stock: { gte: item.quantity },
      },
      data: { stock: { decrement: item.quantity } },
    });

    if (updated.count === 0) {
      throw new PlaceOrderError(
        `موجودی کالای ${product.name} کافی نیست.`
      );
    }

    subtotal += product.price * item.quantity;
  }

  const totals = calculateTotals({ subtotal, ...settings });
  const orderNumber = generateOrderNumber();
  const order = await tx.order.create({
    data: {
      orderNumber,
      userId,
      status: "PENDING",
      paymentStatus: "PENDING",
      subtotal: totals.subtotal,
      shippingCost: totals.shippingCost,
      discountAmount: 0,
      total: totals.total,
      ...shipping,
      items: {
        create: cart.items.map((item) => ({
          variantId: item.variant.id,
          productName: item.variant.product.name,
          color: item.variant.color,
          model: item.variant.model,
          unitPrice: item.variant.product.price,
          quantity: item.quantity,
        })),
      },
    },
    select: { orderNumber: true, total: true },
  });

  return {
    ok: true,
    orderNumber: order.orderNumber,
    total: order.total,
  };
}

export async function markOrderPaid(
  orderId: string,
  userId: string,
  paymentRef: string
): Promise<OrderMutationResult> {
  const parsed = z
    .object({
      orderId: idSchema,
      userId: idSchema,
      paymentRef: z.string().trim().min(1).max(200),
    })
    .safeParse({ orderId, userId, paymentRef });

  if (!parsed.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: parsed.data.orderId, userId: parsed.data.userId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        items: {
          select: {
            quantity: true,
            variant: { select: { productId: true } },
          },
        },
      },
    });

    if (!order) {
      return { ok: false, message: ORDER_NOT_FOUND };
    }

    // Replaying the payment action must not decrement soldCount twice or fail.
    if (order.status === "PAID" && order.paymentStatus === "PAID") {
      return { ok: true };
    }

    if (order.status !== "PENDING" || order.paymentStatus !== "PENDING") {
      return { ok: false, message: ORDER_NOT_PAYABLE };
    }

    const updated = await tx.order.updateMany({
      where: {
        id: order.id,
        userId: parsed.data.userId,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
      data: { status: "PAID", paymentStatus: "PAID" },
    });

    if (updated.count === 0) {
      const current = await tx.order.findUnique({
        where: { id: order.id },
        select: { status: true, paymentStatus: true },
      });

      return current?.status === "PAID" && current.paymentStatus === "PAID"
        ? { ok: true }
        : { ok: false, message: ORDER_NOT_PAYABLE };
    }

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.variant.productId },
        data: { soldCount: { increment: item.quantity } },
      });
    }

    await tx.cartItem.deleteMany({
      where: { cart: { userId: parsed.data.userId } },
    });

    return { ok: true };
  });
}

export async function cancelPendingOrder(
  orderId: string,
  userId: string
): Promise<OrderMutationResult> {
  const parsed = z
    .object({ orderId: idSchema, userId: idSchema })
    .safeParse({ orderId, userId });

  if (!parsed.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: parsed.data.orderId, userId: parsed.data.userId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        items: {
          select: { variantId: true, quantity: true },
        },
      },
    });

    if (!order) {
      return { ok: false, message: ORDER_NOT_FOUND };
    }

    // Replaying the cancel action must not restore stock twice.
    if (order.status === "CANCELLED") {
      return { ok: true };
    }

    if (order.status !== "PENDING" || order.paymentStatus !== "PENDING") {
      return { ok: false, message: ORDER_NOT_CANCELLABLE };
    }

    const updated = await tx.order.updateMany({
      where: {
        id: order.id,
        userId: parsed.data.userId,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
      data: { status: "CANCELLED", paymentStatus: "FAILED" },
    });

    if (updated.count === 0) {
      const current = await tx.order.findUnique({
        where: { id: order.id },
        select: { status: true },
      });

      return current?.status === "CANCELLED"
        ? { ok: true }
        : { ok: false, message: ORDER_NOT_CANCELLABLE };
    }

    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    }

    return { ok: true };
  });
}

export async function getOrderForUser(
  orderNumber: string,
  userId: string
): Promise<OrderDetail | null> {
  const parsedNumber = orderNumberSchema.safeParse(orderNumber);
  const parsedUser = idSchema.safeParse(userId);

  if (!parsedNumber.success || !parsedUser.success) {
    return null;
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber: parsedNumber.data,
      userId: parsedUser.data,
    },
    include: orderInclude,
  });

  return order ? toOrderDetail(order) : null;
}

export async function getCheckoutDefaults(
  userId: string
): Promise<ShippingInput | null> {
  const parsed = idSchema.safeParse(userId);

  if (!parsed.success) {
    return null;
  }

  const order = await prisma.order.findFirst({
    where: { userId: parsed.data },
    orderBy: { createdAt: "desc" },
    select: {
      recipientName: true,
      mobile: true,
      province: true,
      city: true,
      address: true,
      postalCode: true,
    },
  });

  if (!order) {
    return null;
  }

  return {
    ...order,
    province: isIranProvince(order.province) ? order.province : "",
  };
}

export const ORDERS_PAGE_SIZE = 10;

export type OrderListItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  itemCount: number;
  thumbnails: { url: string; alt: string }[];
};

export type UserOrdersResult = {
  items: OrderListItem[];
  total: number;
  totalPages: number;
  page: number;
  status: OrderStatus | null;
};

const orderListSelect = {
  id: true,
  orderNumber: true,
  status: true,
  total: true,
  createdAt: true,
  _count: { select: { items: true } },
  items: {
    orderBy: { id: "asc" },
    take: 3,
    select: {
      id: true,
      variant: {
        select: {
          product: {
            select: {
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
} satisfies Prisma.OrderSelect;

type OrderListRow = Prisma.OrderGetPayload<{ select: typeof orderListSelect }>;

function toOrderListItem(order: OrderListRow): OrderListItem {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    itemCount: order._count.items,
    thumbnails: order.items.flatMap((item) => {
      const image = item.variant.product.images[0];

      return image ? [image] : [];
    }),
  };
}

const ordersPageSchema = z
  .preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;

      const normalized = value.trim();

      return /^\d+$/.test(normalized) ? Number(normalized) : undefined;
    },
    z.number().int().min(1).max(1000).optional()
  )
  .catch(undefined);

const ordersStatusSchema = z
  .preprocess(
    (value) => (typeof value === "string" ? value : undefined),
    z.enum(ORDER_STATUS_VALUES).optional()
  )
  .catch(undefined);

const ordersQuerySchema = z.object({
  page: ordersPageSchema,
  status: ordersStatusSchema,
});

export function parseOrdersQuery(
  raw: Record<string, string | string[] | undefined>
): { page: number; status: OrderStatus | null } {
  const parsed = ordersQuerySchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};

  return {
    page: data.page ?? 1,
    status: data.status ?? null,
  };
}

export async function getUserOrders(
  userId: string,
  options: { page?: number; status?: OrderStatus | null } = {}
): Promise<UserOrdersResult> {
  const parsedUser = idSchema.safeParse(userId);
  const status = options.status ?? null;

  if (!parsedUser.success) {
    return { items: [], total: 0, totalPages: 1, page: 1, status };
  }

  const where: Prisma.OrderWhereInput = { userId: parsedUser.data };

  if (status) {
    where.status = status;
  }

  const total = await prisma.order.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE));
  const requestedPage = Math.max(1, Math.trunc(options.page ?? 1));
  const page = Math.min(requestedPage, totalPages);

  const orders = await prisma.order.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * ORDERS_PAGE_SIZE,
    take: ORDERS_PAGE_SIZE,
    select: orderListSelect,
  });

  return {
    items: orders.map(toOrderListItem),
    total,
    totalPages,
    page,
    status,
  };
}
