import { z } from "zod";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "./auth/session";
import { prisma } from "./db";

/* -------------------------------------------------------------------------- */
/* Periods and Tehran day boundaries                                          */
/* -------------------------------------------------------------------------- */

export const DASHBOARD_PERIODS = ["7d", "30d", "90d", "all"] as const;

export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export const DEFAULT_DASHBOARD_PERIOD: DashboardPeriod = "30d";

const dashboardPeriodSchema = z.enum(DASHBOARD_PERIODS);

export function parseDashboardPeriod(
  raw: string | string[] | undefined
): DashboardPeriod {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = dashboardPeriodSchema.safeParse(value);

  return parsed.success ? parsed.data : DEFAULT_DASHBOARD_PERIOD;
}

const TEHRAN_TIME_ZONE = "Asia/Tehran";
const DAY_MS = 24 * 60 * 60 * 1000;

const tehranPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TEHRAN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type TehranParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getTehranParts(date: Date): TehranParts {
  const parts = tehranPartsFormatter.formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) => {
    const part = parts.find((item) => item.type === type);
    return part ? Number(part.value) : 0;
  };

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

function tehranOffsetMs(date: Date): number {
  const parts = getTehranParts(date);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

function startOfTehranDay(date: Date): Date {
  const parts = getTehranParts(date);
  const localMidnightUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    0,
    0,
    0
  );

  // Two passes make the conversion stable even if the zone offset changes.
  let offset = tehranOffsetMs(new Date(localMidnightUtc));
  let instant = localMidnightUtc - offset;
  offset = tehranOffsetMs(new Date(instant));
  instant = localMidnightUtc - offset;

  return new Date(instant);
}

function addTehranDays(date: Date, days: number): Date {
  return startOfTehranDay(new Date(date.getTime() + days * DAY_MS));
}

function tehranDateKey(date: Date): string {
  const parts = getTehranParts(date);
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");

  return `${parts.year}-${month}-${day}`;
}

function startOfTehranWeek(date: Date): Date {
  const dayStart = startOfTehranDay(date);
  const [year, month, day] = tehranDateKey(dayStart)
    .split("-")
    .map(Number);

  // The dashboard week starts on Saturday (Iranian week).
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const daysSinceSaturday = (weekday + 1) % 7;

  return addTehranDays(dayStart, -daysSinceSaturday);
}

type PeriodWindow = {
  start: Date | null;
  end: Date;
  previous: { start: Date; end: Date } | null;
};

function getPeriodWindow(period: DashboardPeriod, now = new Date()): PeriodWindow {
  const todayStart = startOfTehranDay(now);
  const end = addTehranDays(todayStart, 1);

  const daysByPeriod: Record<Exclude<DashboardPeriod, "all">, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };

  if (period === "all") {
    return { start: null, end, previous: null };
  }

  const length = daysByPeriod[period];
  const start = addTehranDays(todayStart, -(length - 1));

  return {
    start,
    end,
    previous: {
      start: addTehranDays(start, -length),
      end: start,
    },
  };
}

function createdAtFilter(window: {
  start: Date | null;
  end: Date;
}): Prisma.DateTimeFilter {
  return window.start
    ? { gte: window.start, lt: window.end }
    : { lt: window.end };
}

/* -------------------------------------------------------------------------- */
/* Sales definition                                                           */
/* -------------------------------------------------------------------------- */

// "Sales" for the dashboard means orders that reached payment or later.
// PENDING and CANCELLED orders are never counted in revenue or sales counts.
export const SALES_ORDER_STATUSES = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const satisfies readonly OrderStatus[];

const salesStatuses: readonly OrderStatus[] = SALES_ORDER_STATUSES;

/* -------------------------------------------------------------------------- */
/* KPIs                                                                       */
/* -------------------------------------------------------------------------- */

export type KpiMetric = {
  value: number;
  previous: number | null;
};

export type DashboardKpis = {
  revenue: KpiMetric;
  salesOrders: KpiMetric;
  averageOrderValue: KpiMetric;
  pendingOrders: KpiMetric;
  awaitingProcessingOrders: KpiMetric;
  newCustomers: KpiMetric;
  totalCustomers: KpiMetric;
};

export async function getKpis(
  period: DashboardPeriod
): Promise<DashboardKpis> {
  await requireAdmin();

  const window = getPeriodWindow(period);
  const currentFilter = createdAtFilter(window);
  const previousFilter = window.previous
    ? createdAtFilter(window.previous)
    : null;

  const currentSalesWhere: Prisma.OrderWhereInput = {
    status: { in: [...salesStatuses] },
    createdAt: currentFilter,
  };

  const previousSalesWhere: Prisma.OrderWhereInput | null = previousFilter
    ? { status: { in: [...salesStatuses] }, createdAt: previousFilter }
    : null;

  // Operational counts use the order's current status and the selected creation
  // window. There is no status history, so the previous window applies the same
  // rule to orders created in that window.
  const [
    currentSales,
    previousSales,
    pendingOrders,
    previousPendingOrders,
    awaitingProcessingOrders,
    previousAwaitingProcessingOrders,
    newCustomers,
    previousNewCustomers,
    totalCustomers,
    previousTotalCustomers,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: currentSalesWhere,
      _sum: { total: true },
      _count: { _all: true },
    }),
    previousSalesWhere
      ? prisma.order.aggregate({
          where: previousSalesWhere,
          _sum: { total: true },
          _count: { _all: true },
        })
      : Promise.resolve(null),
    prisma.order.count({
      where: { status: "PENDING", createdAt: currentFilter },
    }),
    previousFilter
      ? prisma.order.count({
          where: { status: "PENDING", createdAt: previousFilter },
        })
      : Promise.resolve(null),
    prisma.order.count({
      where: { status: "PAID", createdAt: currentFilter },
    }),
    previousFilter
      ? prisma.order.count({
          where: { status: "PAID", createdAt: previousFilter },
        })
      : Promise.resolve(null),
    prisma.user.count({
      where: { role: "CUSTOMER", createdAt: currentFilter },
    }),
    previousFilter
      ? prisma.user.count({
          where: { role: "CUSTOMER", createdAt: previousFilter },
        })
      : Promise.resolve(null),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    window.start
      ? prisma.user.count({
          where: { role: "CUSTOMER", createdAt: { lt: window.start } },
        })
      : Promise.resolve(null),
  ]);

  const revenue = currentSales._sum.total ?? 0;
  const salesOrders = currentSales._count._all;
  const previousRevenue = previousSales ? previousSales._sum.total ?? 0 : null;
  const previousSalesOrders = previousSales?._count._all ?? null;

  return {
    revenue: { value: revenue, previous: previousRevenue },
    salesOrders: { value: salesOrders, previous: previousSalesOrders },
    averageOrderValue: {
      value: salesOrders > 0 ? Math.round(revenue / salesOrders) : 0,
      previous:
        previousSalesOrders !== null && previousSalesOrders > 0
          ? Math.round((previousRevenue ?? 0) / previousSalesOrders)
          : previousSalesOrders === null
            ? null
            : 0,
    },
    pendingOrders: {
      value: pendingOrders,
      previous: previousPendingOrders,
    },
    awaitingProcessingOrders: {
      value: awaitingProcessingOrders,
      previous: previousAwaitingProcessingOrders,
    },
    newCustomers: {
      value: newCustomers,
      previous: previousNewCustomers,
    },
    totalCustomers: {
      value: totalCustomers,
      previous: previousTotalCustomers,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Sales series                                                               */
/* -------------------------------------------------------------------------- */

export type SalesSeriesGranularity = "day" | "week";

export type SalesSeriesPoint = {
  key: string;
  date: Date;
  revenue: number;
  orders: number;
};

export type SalesSeries = {
  granularity: SalesSeriesGranularity;
  points: SalesSeriesPoint[];
  totalRevenue: number;
  totalOrders: number;
};

export async function getSalesSeries(
  period: DashboardPeriod
): Promise<SalesSeries> {
  await requireAdmin();

  const window = getPeriodWindow(period);
  const granularity: SalesSeriesGranularity =
    period === "7d" || period === "30d" ? "day" : "week";

  const rows = await prisma.order.findMany({
    where: {
      status: { in: [...salesStatuses] },
      createdAt: createdAtFilter(window),
    },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true, total: true },
  });

  const buckets = new Map<string, { revenue: number; orders: number }>();

  for (const row of rows) {
    const bucketDate =
      granularity === "day"
        ? startOfTehranDay(row.createdAt)
        : startOfTehranWeek(row.createdAt);
    const key = tehranDateKey(bucketDate);
    const bucket = buckets.get(key);

    if (bucket) {
      bucket.revenue += row.total;
      bucket.orders += 1;
    } else {
      buckets.set(key, { revenue: row.total, orders: 1 });
    }
  }

  const points: SalesSeriesPoint[] = [];

  if (granularity === "day" && window.start) {
    for (
      let cursor = window.start;
      cursor < window.end;
      cursor = addTehranDays(cursor, 1)
    ) {
      const key = tehranDateKey(cursor);
      const bucket = buckets.get(key);

      points.push({
        key,
        date: cursor,
        revenue: bucket?.revenue ?? 0,
        orders: bucket?.orders ?? 0,
      });
    }
  } else {
    const firstDay =
      window.start ??
      (rows.length > 0 ? startOfTehranDay(rows[0].createdAt) : null);

    if (firstDay) {
      const lastDay = startOfTehranDay(
        new Date(window.end.getTime() - 1)
      );
      const lastWeek = startOfTehranWeek(lastDay);
      let cursor = startOfTehranWeek(firstDay);

      while (cursor <= lastWeek) {
        const key = tehranDateKey(cursor);
        const bucket = buckets.get(key);

        points.push({
          key,
          date: cursor,
          revenue: bucket?.revenue ?? 0,
          orders: bucket?.orders ?? 0,
        });

        cursor = addTehranDays(cursor, 7);
      }
    }
  }

  return {
    granularity,
    points,
    totalRevenue: points.reduce((sum, point) => sum + point.revenue, 0),
    totalOrders: points.reduce((sum, point) => sum + point.orders, 0),
  };
}

/* -------------------------------------------------------------------------- */
/* Top products                                                               */
/* -------------------------------------------------------------------------- */

export type TopProduct = {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
  image: { url: string; alt: string } | null;
  href: string;
};

const limitSchema = z.number().int().min(1).max(20);

export async function getTopProducts(
  period: DashboardPeriod,
  limit = 5
): Promise<TopProduct[]> {
  await requireAdmin();

  const safeLimit = limitSchema.safeParse(limit);
  const take = safeLimit.success ? safeLimit.data : 5;
  const window = getPeriodWindow(period);

  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        status: { in: [...salesStatuses] },
        createdAt: createdAtFilter(window),
      },
    },
    select: {
      quantity: true,
      unitPrice: true,
      variant: {
        select: {
          product: {
            select: {
              id: true,
              name: true,
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
  });

  const grouped = new Map<string, TopProduct>();

  for (const item of items) {
    const product = item.variant.product;
    const lineRevenue = item.unitPrice * item.quantity;
    const existing = grouped.get(product.id);

    if (existing) {
      existing.quantity += item.quantity;
      existing.revenue += lineRevenue;
    } else {
      grouped.set(product.id, {
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        revenue: lineRevenue,
        image: product.images[0] ?? null,
        href: `/admin/products/${product.id}/edit`,
      });
    }
  }

  return [...grouped.values()]
    .sort(
      (a, b) =>
        b.quantity - a.quantity ||
        b.revenue - a.revenue ||
        a.name.localeCompare(b.name, "fa")
    )
    .slice(0, take);
}

/* -------------------------------------------------------------------------- */
/* Status breakdown                                                           */
/* -------------------------------------------------------------------------- */

export type StatusBreakdownRow = {
  status: OrderStatus;
  count: number;
};

const STATUS_ORDER: readonly OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export async function getStatusBreakdown(): Promise<StatusBreakdownRow[]> {
  await requireAdmin();

  const rows = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts = new Map(
    rows.map((row) => [row.status, row._count._all] as const)
  );

  return STATUS_ORDER.map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }));
}

/* -------------------------------------------------------------------------- */
/* Low stock                                                                  */
/* -------------------------------------------------------------------------- */

export type LowStockVariant = {
  id: string;
  productId: string;
  productName: string;
  color: string;
  model: string | null;
  stock: number;
  image: { url: string; alt: string } | null;
  href: string;
};

export async function getLowStock(limit = 8): Promise<LowStockVariant[]> {
  await requireAdmin();

  const safeLimit = limitSchema.safeParse(limit);
  const take = safeLimit.success ? safeLimit.data : 8;

  const variants = await prisma.productVariant.findMany({
    where: {
      stock: { gte: 0, lte: 5 },
      product: { isActive: true },
    },
    orderBy: [{ stock: "asc" }, { id: "asc" }],
    take,
    select: {
      id: true,
      stock: true,
      color: true,
      model: true,
      product: {
        select: {
          id: true,
          name: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { url: true, alt: true },
          },
        },
      },
    },
  });

  return variants.map((variant) => ({
    id: variant.id,
    productId: variant.product.id,
    productName: variant.product.name,
    color: variant.color,
    model: variant.model,
    stock: variant.stock,
    image: variant.product.images[0] ?? null,
    href: `/admin/products/${variant.product.id}/edit`,
  }));
}

/* -------------------------------------------------------------------------- */
/* Recent orders                                                              */
/* -------------------------------------------------------------------------- */

export type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  href: string;
};

export async function getRecentOrders(limit = 6): Promise<RecentOrder[]> {
  await requireAdmin();

  const safeLimit = limitSchema.safeParse(limit);
  const take = safeLimit.success ? safeLimit.data : 6;

  const orders = await prisma.order.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    select: {
      id: true,
      orderNumber: true,
      recipientName: true,
      total: true,
      status: true,
      createdAt: true,
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.recipientName,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt,
    href: `/admin/orders/${order.orderNumber}`,
  }));
}
