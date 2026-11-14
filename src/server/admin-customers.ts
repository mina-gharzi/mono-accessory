import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type {
  OrderStatus,
  PaymentStatus,
  Role,
} from "@/generated/prisma/client";
import { requireAdmin } from "./auth/session";
import { prisma } from "./db";
import { normalizeSearchTerm, toEnglishDigits } from "./products";

export const ADMIN_CUSTOMERS_PAGE_SIZE = 15;

const PAID_ORDER_STATUSES: readonly OrderStatus[] = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

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

const adminCustomersQuerySchema = z.object({
  q: optionalText(80),
  page: optionalPage,
});

export type AdminCustomersQuery = {
  q: string | null;
  page: number;
};

export type AdminCustomersSearchParams = Record<
  string,
  string | string[] | undefined
>;

export function parseAdminCustomersQuery(
  raw: AdminCustomersSearchParams
): AdminCustomersQuery {
  const parsed = adminCustomersQuerySchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};

  return {
    q: data.q ? normalizeSearchTerm(data.q) || null : null,
    page: data.page ?? 1,
  };
}

export function buildAdminCustomersHref(
  query: AdminCustomersQuery,
  overrides: Partial<AdminCustomersQuery> = {}
): string {
  const next = { ...query, ...overrides };

  if (!("page" in overrides)) {
    next.page = 1;
  }

  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.page > 1) params.set("page", String(next.page));

  const search = params.toString();
  return search ? `/admin/customers?${search}` : "/admin/customers";
}

/* -------------------------------------------------------------------------- */
/* List                                                                       */
/* -------------------------------------------------------------------------- */

export type AdminCustomerListItem = {
  id: string;
  name: string;
  mobile: string;
  role: Role;
  createdAt: Date;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: Date | null;
};

export type AdminCustomersResult = {
  items: AdminCustomerListItem[];
  total: number;
  totalPages: number;
  page: number;
};

const customerListSelect = {
  id: true,
  name: true,
  mobile: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const customerOrderStatsSelect = {
  userId: true,
  status: true,
  total: true,
  createdAt: true,
} satisfies Prisma.OrderSelect;

type CustomerOrderStatRow = Prisma.OrderGetPayload<{
  select: typeof customerOrderStatsSelect;
}>;

function summarizeOrders(rows: CustomerOrderStatRow[]): {
  orderCount: number;
  totalSpent: number;
  lastOrderAt: Date | null;
} {
  let totalSpent = 0;
  let lastOrderAt: Date | null = null;

  for (const row of rows) {
    if (PAID_ORDER_STATUSES.includes(row.status)) {
      totalSpent += row.total;
    }

    if (!lastOrderAt || row.createdAt > lastOrderAt) {
      lastOrderAt = row.createdAt;
    }
  }

  return { orderCount: rows.length, totalSpent, lastOrderAt };
}

export async function listCustomers(
  query: AdminCustomersQuery
): Promise<AdminCustomersResult> {
  await requireAdmin();

  const where: Prisma.UserWhereInput = {};

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { mobile: { contains: query.q } },
    ];
  }

  const total = await prisma.user.count({ where });
  const totalPages = Math.max(
    1,
    Math.ceil(total / ADMIN_CUSTOMERS_PAGE_SIZE)
  );
  const page = Math.min(query.page, totalPages);

  const rows = await prisma.user.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * ADMIN_CUSTOMERS_PAGE_SIZE,
    take: ADMIN_CUSTOMERS_PAGE_SIZE,
    select: customerListSelect,
  });

  const ids = rows.map((row) => row.id);
  const orderRows =
    ids.length > 0
      ? await prisma.order.findMany({
          where: { userId: { in: ids } },
          select: customerOrderStatsSelect,
        })
      : [];

  const ordersByUser = new Map<string, CustomerOrderStatRow[]>();

  for (const order of orderRows) {
    const list = ordersByUser.get(order.userId);

    if (list) {
      list.push(order);
    } else {
      ordersByUser.set(order.userId, [order]);
    }
  }

  const items = rows.map((row) => {
    const stats = summarizeOrders(ordersByUser.get(row.id) ?? []);

    return {
      id: row.id,
      name: row.name,
      mobile: row.mobile,
      role: row.role,
      createdAt: row.createdAt,
      ...stats,
    };
  });

  return { items, total, totalPages, page };
}

/* -------------------------------------------------------------------------- */
/* Detail                                                                     */
/* -------------------------------------------------------------------------- */

export type AdminCustomerOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  itemCount: number;
  createdAt: Date;
};

export type AdminCustomerDetail = {
  id: string;
  name: string;
  mobile: string;
  role: Role;
  createdAt: Date;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: Date | null;
  orders: AdminCustomerOrder[];
};

const customerDetailSelect = {
  id: true,
  name: true,
  mobile: true,
  role: true,
  createdAt: true,
  orders: {
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      total: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  },
} satisfies Prisma.UserSelect;

type CustomerDetailRow = Prisma.UserGetPayload<{
  select: typeof customerDetailSelect;
}>;

function toCustomerDetail(row: CustomerDetailRow): AdminCustomerDetail {
  let totalSpent = 0;
  let lastOrderAt: Date | null = null;

  for (const order of row.orders) {
    if (PAID_ORDER_STATUSES.includes(order.status)) {
      totalSpent += order.total;
    }

    if (!lastOrderAt || order.createdAt > lastOrderAt) {
      lastOrderAt = order.createdAt;
    }
  }

  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    role: row.role,
    createdAt: row.createdAt,
    orderCount: row.orders.length,
    totalSpent,
    lastOrderAt,
    orders: row.orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      itemCount: order._count.items,
      createdAt: order.createdAt,
    })),
  };
}

export async function getCustomer(
  id: string
): Promise<AdminCustomerDetail | null> {
  await requireAdmin();

  const parsed = z.string().trim().min(1).max(64).safeParse(id);

  if (!parsed.success) return null;

  const row = await prisma.user.findUnique({
    where: { id: parsed.data },
    select: customerDetailSelect,
  });

  return row ? toCustomerDetail(row) : null;
}
