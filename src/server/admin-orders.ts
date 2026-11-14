import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type {
  OrderStatus,
  PaymentStatus,
} from "@/generated/prisma/client";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VALUES } from "@/lib/order-status";
import { requireAdmin } from "./auth/session";
import { prisma } from "./db";
import { normalizeSearchTerm, toEnglishDigits } from "./products";

export const ADMIN_ORDERS_PAGE_SIZE = 15;

export const ADMIN_ORDER_STATUSES = [
  "all",
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const satisfies readonly (OrderStatus | "all")[];

export type AdminOrderStatus = (typeof ADMIN_ORDER_STATUSES)[number];

export const ADMIN_PAYMENT_STATUSES = [
  "all",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const satisfies readonly (PaymentStatus | "all")[];

export type AdminPaymentStatus = (typeof ADMIN_PAYMENT_STATUSES)[number];

export const ADMIN_ORDER_RANGES = ["all", "today", "7d", "30d"] as const;

export type AdminOrderRange = (typeof ADMIN_ORDER_RANGES)[number];

const INVALID_REQUEST = "درخواست نامعتبر است.";
const ORDER_NOT_FOUND = "سفارش پیدا نشد.";
const CONCURRENT_CHANGE =
  "وضعیت سفارش هم‌زمان توسط کاربر دیگری تغییر کرده است. صفحه را دوباره بارگذاری کنید.";

const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function getAllowedOrderStatuses(
  status: OrderStatus
): readonly OrderStatus[] {
  return ALLOWED_ORDER_TRANSITIONS[status];
}

/* -------------------------------------------------------------------------- */
/* Query params                                                               */
/* -------------------------------------------------------------------------- */

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

const optionalPage = z
  .preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const number = Number(toEnglishDigits(value).trim());
      return Number.isSafeInteger(number) ? number : undefined;
    },
    z.number().int().min(1).max(1000).optional()
  )
  .catch(undefined);

const optionalStatus = z
  .preprocess(
    (value) => (typeof value === "string" ? value : undefined),
    z.enum(ORDER_STATUS_VALUES).optional()
  )
  .catch(undefined);

const optionalPaymentStatus = z
  .preprocess(
    (value) => (typeof value === "string" ? value : undefined),
    z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional()
  )
  .catch(undefined);

const adminOrdersQuerySchema = z.object({
  q: optionalText(80),
  status: optionalStatus,
  paymentStatus: optionalPaymentStatus,
  range: z
    .preprocess(
      (value) => (typeof value === "string" ? value : undefined),
      z.enum(ADMIN_ORDER_RANGES).optional()
    )
    .catch(undefined),
  page: optionalPage,
});

export type AdminOrdersQuery = {
  q: string | null;
  status: OrderStatus | null;
  paymentStatus: PaymentStatus | null;
  range: AdminOrderRange;
  page: number;
};

export type AdminOrdersSearchParams = Record<
  string,
  string | string[] | undefined
>;

export function parseAdminOrdersQuery(
  raw: AdminOrdersSearchParams
): AdminOrdersQuery {
  const parsed = adminOrdersQuerySchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};

  return {
    q: data.q ? normalizeSearchTerm(data.q) || null : null,
    status: data.status ?? null,
    paymentStatus: data.paymentStatus ?? null,
    range: data.range ?? "all",
    page: data.page ?? 1,
  };
}

export function buildAdminOrdersHref(
  query: AdminOrdersQuery,
  overrides: Partial<AdminOrdersQuery> = {}
): string {
  const next = { ...query, ...overrides };

  if (!("page" in overrides)) {
    next.page = 1;
  }

  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.status) params.set("status", next.status);
  if (next.paymentStatus) params.set("paymentStatus", next.paymentStatus);
  if (next.range !== "all") params.set("range", next.range);
  if (next.page > 1) params.set("page", String(next.page));

  const search = params.toString();
  return search ? `/admin/orders?${search}` : "/admin/orders";
}

function rangeStart(range: AdminOrderRange): Date | null {
  const now = new Date();

  switch (range) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/* List                                                                       */
/* -------------------------------------------------------------------------- */

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  customerName: string;
  customerMobile: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
};

export type AdminOrdersResult = {
  items: AdminOrderListItem[];
  total: number;
  totalPages: number;
  page: number;
};

const adminOrderListSelect = {
  id: true,
  orderNumber: true,
  createdAt: true,
  recipientName: true,
  mobile: true,
  total: true,
  status: true,
  paymentStatus: true,
  _count: { select: { items: true } },
} satisfies Prisma.OrderSelect;

type AdminOrderListRow = Prisma.OrderGetPayload<{
  select: typeof adminOrderListSelect;
}>;

function toAdminOrderListItem(row: AdminOrderListRow): AdminOrderListItem {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    createdAt: row.createdAt,
    customerName: row.recipientName,
    customerMobile: row.mobile,
    itemCount: row._count.items,
    total: row.total,
    status: row.status,
    paymentStatus: row.paymentStatus,
  };
}

export async function listAdminOrders(
  query: AdminOrdersQuery
): Promise<AdminOrdersResult> {
  await requireAdmin();

  const where: Prisma.OrderWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.paymentStatus) {
    where.paymentStatus = query.paymentStatus;
  }

  const start = rangeStart(query.range);

  if (start) {
    where.createdAt = { gte: start };
  }

  if (query.q) {
    where.OR = [
      { orderNumber: { contains: query.q, mode: "insensitive" } },
      { recipientName: { contains: query.q, mode: "insensitive" } },
      { mobile: { contains: query.q } },
    ];
  }

  const total = await prisma.order.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_ORDERS_PAGE_SIZE));
  const page = Math.min(query.page, totalPages);

  const rows = await prisma.order.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * ADMIN_ORDERS_PAGE_SIZE,
    take: ADMIN_ORDERS_PAGE_SIZE,
    select: adminOrderListSelect,
  });

  return {
    items: rows.map(toAdminOrderListItem),
    total,
    totalPages,
    page,
  };
}

/* -------------------------------------------------------------------------- */
/* Detail                                                                     */
/* -------------------------------------------------------------------------- */

export type AdminOrderItem = {
  id: string;
  productName: string;
  color: string;
  model: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  productSlug: string;
  image: { url: string; alt: string } | null;
};

export type AdminOrderDetail = {
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
  updatedAt: Date;
  customer: { id: string; name: string; mobile: string };
  items: AdminOrderItem[];
};

const adminOrderDetailSelect = {
  id: true,
  orderNumber: true,
  status: true,
  paymentStatus: true,
  subtotal: true,
  shippingCost: true,
  discountAmount: true,
  total: true,
  recipientName: true,
  mobile: true,
  province: true,
  city: true,
  address: true,
  postalCode: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, mobile: true } },
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
} satisfies Prisma.OrderSelect;

type AdminOrderDetailRow = Prisma.OrderGetPayload<{
  select: typeof adminOrderDetailSelect;
}>;

function toAdminOrderDetail(row: AdminOrderDetailRow): AdminOrderDetail {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    paymentStatus: row.paymentStatus,
    subtotal: row.subtotal,
    shippingCost: row.shippingCost,
    discountAmount: row.discountAmount,
    total: row.total,
    recipientName: row.recipientName,
    mobile: row.mobile,
    province: row.province,
    city: row.city,
    address: row.address,
    postalCode: row.postalCode,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    customer: row.user,
    items: row.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      color: item.color,
      model: item.model,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.unitPrice * item.quantity,
      productSlug: item.variant.product.slug,
      image: item.variant.product.images[0] ?? null,
    })),
  };
}

export async function getAdminOrder(
  orderNumber: string
): Promise<AdminOrderDetail | null> {
  await requireAdmin();

  const parsed = z.string().trim().min(1).max(64).safeParse(orderNumber);

  if (!parsed.success) return null;

  const row = await prisma.order.findUnique({
    where: { orderNumber: parsed.data },
    select: adminOrderDetailSelect,
  });

  return row ? toAdminOrderDetail(row) : null;
}

/* -------------------------------------------------------------------------- */
/* Status changes                                                             */
/* -------------------------------------------------------------------------- */

export type AdminOrderMutationResult =
  | { ok: true; status: OrderStatus }
  | { ok: false; message: string };

type TransactionOutcome =
  | {
      ok: true;
      changed: boolean;
      orderNumber: string;
      userId: string;
      productSlugs: string[];
    }
  | { ok: false; message: string };

const orderIdSchema = z.string().trim().min(1).max(64);
const orderStatusSchema = z.enum(ORDER_STATUS_VALUES);

const statusChangeSelect = {
  id: true,
  orderNumber: true,
  userId: true,
  status: true,
  paymentStatus: true,
  items: {
    select: {
      variantId: true,
      quantity: true,
      variant: { select: { product: { select: { slug: true } } } },
    },
  },
} satisfies Prisma.OrderSelect;

type StatusChangeRow = Prisma.OrderGetPayload<{
  select: typeof statusChangeSelect;
}>;

function revalidateOrderPaths({
  orderNumber,
  userId,
  productSlugs,
}: {
  orderNumber: string;
  userId: string;
  productSlugs: string[];
}) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin/products");
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderNumber}`);
  revalidatePath("/");
  revalidatePath("/shop");

  for (const slug of new Set(productSlugs)) {
    revalidatePath(`/product/${slug}`);
  }
}

export async function changeOrderStatus(
  orderId: string,
  nextStatus: string
): Promise<AdminOrderMutationResult> {
  await requireAdmin();

  const parsedId = orderIdSchema.safeParse(orderId);
  const parsedStatus = orderStatusSchema.safeParse(nextStatus);

  if (!parsedId.success || !parsedStatus.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  const status = parsedStatus.data;

  const outcome = await prisma.$transaction<TransactionOutcome>(
    async (tx) => {
      const order: StatusChangeRow | null = await tx.order.findUnique({
        where: { id: parsedId.data },
        select: statusChangeSelect,
      });

      if (!order) {
        return { ok: false, message: ORDER_NOT_FOUND };
      }

      if (order.status === status) {
        return {
          ok: true,
          changed: false,
          orderNumber: order.orderNumber,
          userId: order.userId,
          productSlugs: [],
        };
      }

      const allowed = ALLOWED_ORDER_TRANSITIONS[order.status];

      if (!allowed.includes(status)) {
        return {
          ok: false,
          message: `تغییر وضعیت از «${ORDER_STATUS_LABELS[order.status]}» به «${ORDER_STATUS_LABELS[status]}» مجاز نیست.`,
        };
      }

      const shouldRefund =
        status === "CANCELLED" && order.paymentStatus === "PAID";

      const updated = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: {
          status,
          ...(shouldRefund ? { paymentStatus: "REFUNDED" as const } : {}),
        },
      });

      if (updated.count === 0) {
        return { ok: false, message: CONCURRENT_CHANGE };
      }

      if (status === "CANCELLED") {
        // The status guard above makes this run at most once per order.
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return {
        ok: true,
        changed: true,
        orderNumber: order.orderNumber,
        userId: order.userId,
        productSlugs: order.items.map(
          (item) => item.variant.product.slug
        ),
      };
    }
  );

  if (!outcome.ok) {
    return { ok: false, message: outcome.message };
  }

  if (outcome.changed) {
    revalidateOrderPaths({
      orderNumber: outcome.orderNumber,
      userId: outcome.userId,
      productSlugs: outcome.productSlugs,
    });
  }

  return { ok: true, status };
}
