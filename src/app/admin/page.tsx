import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Minus,
  Package,
  ShoppingBag,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SalesChart } from "@/components/admin/sales-chart";
import { EmptyState } from "@/components/empty-state";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import {
  formatDate,
  formatNumber,
  formatPercent,
  formatPrice,
} from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_PERIODS,
  getKpis,
  getLowStock,
  getRecentOrders,
  getSalesSeries,
  getStatusBreakdown,
  getTopProducts,
  parseDashboardPeriod,
  type DashboardKpis,
  type DashboardPeriod,
  type KpiMetric,
  type LowStockVariant,
  type RecentOrder,
  type SalesSeries,
  type StatusBreakdownRow,
  type TopProduct,
} from "@/server/admin-stats";

export const metadata: Metadata = {
  title: "نمای کلی | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

const periodLabels: Record<DashboardPeriod, string> = {
  "7d": "۷ روز اخیر",
  "30d": "۳۰ روز اخیر",
  "90d": "۹۰ روز اخیر",
  all: "کل دوره",
};

type DashboardSearchParams = PageProps<"/admin">["searchParams"];

export default function AdminDashboardPage({
  searchParams,
}: PageProps<"/admin">) {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="نمای کلی"
        description="آمار فروش، سفارش‌ها، مشتریان و موجودی فروشگاه در یک نگاه."
        actions={
          <Suspense fallback={<PeriodSelectorSkeleton />}>
            <PeriodSelector searchParams={searchParams} />
          </Suspense>
        }
      />

      <Suspense fallback={<KpiSkeleton />}>
        <KpiSection searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<PanelSkeleton className="min-h-85" />}>
        <SalesChartSection searchParams={searchParams} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<PanelSkeleton className="min-h-90" />}>
          <TopProductsSection searchParams={searchParams} />
        </Suspense>

        <Suspense fallback={<PanelSkeleton className="min-h-90" />}>
          <StatusBreakdownSection searchParams={searchParams} />
        </Suspense>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<PanelSkeleton className="min-h-90" />}>
          <LowStockSection searchParams={searchParams} />
        </Suspense>

        <Suspense fallback={<PanelSkeleton className="min-h-90" />}>
          <RecentOrdersSection searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Period selector                                                            */
/* -------------------------------------------------------------------------- */

async function PeriodSelector({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  const period = await resolvePeriod(searchParams);

  return (
    <nav
      aria-label="بازه زمانی داشبورد"
      className="inline-flex flex-wrap items-center gap-1 rounded-md border border-border bg-card p-1"
    >
      {DASHBOARD_PERIODS.map((value) => {
        const active = value === period;

        return (
          <Link
            key={value}
            href={`/admin?period=${value}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded px-3 py-1.5 text-xs font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-dark"
            )}
          >
            {periodLabels[value]}
          </Link>
        );
      })}
    </nav>
  );
}

async function resolvePeriod(
  searchParams: DashboardSearchParams
): Promise<DashboardPeriod> {
  const params = await searchParams;

  return parseDashboardPeriod(params.period);
}

function periodOrdersHref(period: DashboardPeriod): string {
  if (period === "7d") return "/admin/orders?range=7d";
  if (period === "30d") return "/admin/orders?range=30d";

  return "/admin/orders";
}

/* -------------------------------------------------------------------------- */
/* KPI tiles                                                                  */
/* -------------------------------------------------------------------------- */

async function KpiSection({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  const period = await resolvePeriod(searchParams);
  let kpis: DashboardKpis;

  try {
    kpis = await getKpis(period);
  } catch (error) {
    unstable_rethrow(error);

    return <WidgetError title="بارگذاری شاخص‌های فروش ناموفق بود" />;
  }

  const ordersHref = periodOrdersHref(period);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiTile
        label="درآمد فروش"
        value={formatPrice(kpis.revenue.value)}
        metric={kpis.revenue}
        period={period}
        href={ordersHref}
        icon={Banknote}
      />
      <KpiTile
        label="سفارش‌های فروش"
        value={`${formatNumber(kpis.salesOrders.value)} سفارش`}
        metric={kpis.salesOrders}
        period={period}
        href={ordersHref}
        icon={ShoppingBag}
      />
      <KpiTile
        label="میانگین ارزش سفارش"
        value={formatPrice(kpis.averageOrderValue.value)}
        metric={kpis.averageOrderValue}
        period={period}
        href={ordersHref}
        icon={Wallet}
      />
      <KpiTile
        label="مشتریان جدید"
        value={`${formatNumber(kpis.newCustomers.value)} مشتری`}
        metric={kpis.newCustomers}
        period={period}
        href="/admin/customers"
        icon={UserPlus}
      />
      <KpiTile
        label="در انتظار پرداخت"
        value={`${formatNumber(kpis.pendingOrders.value)} سفارش`}
        metric={kpis.pendingOrders}
        period={period}
        href="/admin/orders?status=PENDING"
        icon={Clock}
      />
      <KpiTile
        label="آمادهٔ پردازش"
        value={`${formatNumber(kpis.awaitingProcessingOrders.value)} سفارش`}
        metric={kpis.awaitingProcessingOrders}
        period={period}
        href="/admin/orders?status=PAID"
        icon={Package}
      />
      <KpiTile
        label="کل مشتریان"
        value={`${formatNumber(kpis.totalCustomers.value)} مشتری`}
        metric={kpis.totalCustomers}
        period={period}
        href="/admin/customers"
        icon={Users}
      />
    </div>
  );
}

function KpiTile({
  label,
  value,
  metric,
  period,
  href,
  icon: Icon,
}: {
  label: string;
  value: string;
  metric: KpiMetric;
  period: DashboardPeriod;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium leading-5 text-muted-foreground">
          {label}
        </span>
        <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
      </div>

      <p className="font-heading text-lg font-bold leading-7 text-dark sm:text-xl">
        {value}
      </p>

      <KpiChange metric={metric} period={period} />
    </Link>
  );
}

function KpiChange({
  metric,
  period,
}: {
  metric: KpiMetric;
  period: DashboardPeriod;
}) {
  if (period === "all") {
    return <p className="text-[11px] text-muted-foreground">کل دوره</p>;
  }

  if (metric.previous === null) {
    return <p className="text-[11px] text-muted-foreground">بدون مقایسه</p>;
  }

  if (metric.previous === 0) {
    return (
      <p className="text-[11px] text-muted-foreground">بازهٔ قبل بدون داده</p>
    );
  }

  const change = ((metric.value - metric.previous) / metric.previous) * 100;
  const isUp = change > 0;
  const isFlat = change === 0;
  const Icon = isFlat ? Minus : isUp ? ArrowUp : ArrowDown;

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] leading-4",
        isFlat
          ? "text-muted-foreground"
          : isUp
            ? "text-emerald-700"
            : "text-destructive"
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span>
        {isFlat
          ? "بدون تغییر"
          : `${formatPercent(change)} ${isUp ? "افزایش" : "کاهش"}`}
      </span>
      <span className="text-muted-foreground">نسبت به بازهٔ قبل</span>
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Sales chart                                                                */
/* -------------------------------------------------------------------------- */

async function SalesChartSection({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  const period = await resolvePeriod(searchParams);
  let series: SalesSeries;

  try {
    series = await getSalesSeries(period);
  } catch (error) {
    unstable_rethrow(error);

    return (
      <DashboardPanel title="روند فروش">
        <WidgetError title="بارگذاری نمودار فروش ناموفق بود" />
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel
      title="روند فروش"
      description={`درآمد و تعداد سفارش‌های فروش، ${periodLabels[period]}.`}
      action={<PanelLink href={periodOrdersHref(period)}>مشاهدهٔ سفارش‌ها</PanelLink>}
    >
      <SalesChart series={series} period={period} />
    </DashboardPanel>
  );
}

/* -------------------------------------------------------------------------- */
/* Top products                                                               */
/* -------------------------------------------------------------------------- */

async function TopProductsSection({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  const period = await resolvePeriod(searchParams);
  let products: TopProduct[];

  try {
    products = await getTopProducts(period, 5);
  } catch (error) {
    unstable_rethrow(error);

    return (
      <DashboardPanel title="پرفروش‌ترین محصولات">
        <WidgetError title="بارگذاری محصولات پرفروش ناموفق بود" />
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel
      title="پرفروش‌ترین محصولات"
      description={`بر اساس تعداد فروش، ${periodLabels[period]}.`}
      action={<PanelLink href="/admin/products">مدیریت محصولات</PanelLink>}
    >
      {products.length === 0 ? (
        <EmptyState
          title="در این بازه محصولی فروش نرفته است"
          description="پس از ثبت سفارش‌های فروش، محصولات پرفروش در این بخش نمایش داده می‌شوند."
          icon={<ShoppingBag className="size-5" aria-hidden="true" />}
          className="border-dashed bg-transparent py-10"
        />
      ) : (
        <ul className="flex flex-col">
          {products.map((product, index) => (
            <li
              key={product.productId}
              className="flex items-center gap-3 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0"
            >
              <span className="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground">
                {formatNumber(index + 1)}
              </span>

              <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                {product.image ? (
                  <Image
                    src={product.image.url}
                    alt=""
                    width={40}
                    height={40}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <ProductImagePlaceholder iconClassName="size-4" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={product.href}
                  className="line-clamp-1 text-sm font-medium text-dark underline-offset-4 transition-colors hover:text-primary hover:underline motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {product.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(product.quantity)} عدد فروش
                </p>
              </div>

              <p className="shrink-0 whitespace-nowrap text-sm font-medium text-dark">
                {formatPrice(product.revenue)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}

/* -------------------------------------------------------------------------- */
/* Status breakdown                                                           */
/* -------------------------------------------------------------------------- */

async function StatusBreakdownSection({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  await resolvePeriod(searchParams);
  let rows: StatusBreakdownRow[];

  try {
    rows = await getStatusBreakdown();
  } catch (error) {
    unstable_rethrow(error);

    return (
      <DashboardPanel title="وضعیت سفارش‌ها">
        <WidgetError title="بارگذاری وضعیت سفارش‌ها ناموفق بود" />
      </DashboardPanel>
    );
  }

  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <DashboardPanel
      title="وضعیت سفارش‌ها"
      description="توزیع همهٔ سفارش‌ها بر اساس وضعیت فعلی."
      action={<PanelLink href="/admin/orders">همهٔ سفارش‌ها</PanelLink>}
    >
      {total === 0 ? (
        <EmptyState
          title="هنوز سفارشی ثبت نشده است"
          description="پس از ثبت سفارش‌های مشتریان، توزیع وضعیت‌ها در این بخش نمایش داده می‌شود."
          icon={<Package className="size-5" aria-hidden="true" />}
          className="border-dashed bg-transparent py-10"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => {
            const percent = (row.count / total) * 100;

            return (
              <li key={row.status}>
                <Link
                  href={`/admin/orders?status=${row.status}`}
                  className="group flex flex-col gap-1.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1 text-sm">
                    <span className="font-medium text-dark transition-colors group-hover:text-primary motion-reduce:transition-none">
                      {ORDER_STATUS_LABELS[row.status]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(row.count)} سفارش، {formatPercent(percent)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}

/* -------------------------------------------------------------------------- */
/* Low stock                                                                  */
/* -------------------------------------------------------------------------- */

async function LowStockSection({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  await resolvePeriod(searchParams);
  let variants: LowStockVariant[];

  try {
    variants = await getLowStock(8);
  } catch (error) {
    unstable_rethrow(error);

    return (
      <DashboardPanel title="هشدار موجودی">
        <WidgetError title="بارگذاری موجودی محصولات ناموفق بود" />
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel
      title="هشدار موجودی"
      description="واریانت‌های فعال با موجودی ۵ عدد یا کمتر."
      action={<PanelLink href="/admin/products">مدیریت موجودی</PanelLink>}
    >
      {variants.length === 0 ? (
        <EmptyState
          title="موجودی همهٔ محصولات کافی است"
          description="در حال حاضر هیچ واریانت فعالی با موجودی ۵ عدد یا کمتر وجود ندارد."
          icon={<CheckCircle2 className="size-5" aria-hidden="true" />}
          className="border-dashed bg-transparent py-10"
        />
      ) : (
        <ul className="flex flex-col">
          {variants.map((variant) => (
            <li
              key={variant.id}
              className="flex items-center gap-3 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0"
            >
              <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                {variant.image ? (
                  <Image
                    src={variant.image.url}
                    alt=""
                    width={40}
                    height={40}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <ProductImagePlaceholder iconClassName="size-4" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={variant.href}
                  className="line-clamp-1 text-sm font-medium text-dark underline-offset-4 transition-colors hover:text-primary hover:underline motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {variant.productName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {variant.color}
                  {variant.model ? ` / ${variant.model}` : ""}
                </p>
              </div>

              <span
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium",
                  variant.stock === 0
                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                )}
              >
                {variant.stock === 0
                  ? "ناموجود"
                  : `${formatNumber(variant.stock)} عدد`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}

/* -------------------------------------------------------------------------- */
/* Recent orders                                                              */
/* -------------------------------------------------------------------------- */

async function RecentOrdersSection({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  await resolvePeriod(searchParams);
  let orders: RecentOrder[];

  try {
    orders = await getRecentOrders(6);
  } catch (error) {
    unstable_rethrow(error);

    return (
      <DashboardPanel title="آخرین سفارش‌ها">
        <WidgetError title="بارگذاری سفارش‌های اخیر ناموفق بود" />
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel
      title="آخرین سفارش‌ها"
      description="شش سفارش آخر ثبت‌شده در فروشگاه."
      action={<PanelLink href="/admin/orders">همهٔ سفارش‌ها</PanelLink>}
    >
      {orders.length === 0 ? (
        <EmptyState
          title="هنوز سفارشی ثبت نشده است"
          description="سفارش‌های مشتریان پس از ثبت در این بخش نمایش داده می‌شوند."
          icon={<ShoppingBag className="size-5" aria-hidden="true" />}
          className="border-dashed bg-transparent py-10"
        />
      ) : (
        <ul className="flex flex-col">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-col gap-2 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <Link
                  href={order.href}
                  dir="ltr"
                  className="w-fit text-sm font-medium text-primary underline-offset-4 transition-colors hover:underline motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {order.orderNumber}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {order.customerName} / {formatDate(order.createdAt)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="whitespace-nowrap text-sm font-medium text-dark">
                  {formatPrice(order.total)}
                </span>
                <OrderStatusBadge status={order.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared presentation                                                        */
/* -------------------------------------------------------------------------- */

function DashboardPanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-bold text-dark">{title}</h2>
          {description ? (
            <p className="text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>

      {children}
    </section>
  );
}

function PanelLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 transition-colors hover:underline motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {children}
      <ChevronLeft className="size-3.5" aria-hidden="true" />
    </Link>
  );
}

function WidgetError({ title }: { title: string }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-10 text-center"
    >
      <AlertTriangle
        className="size-5 text-destructive"
        aria-hidden="true"
      />
      <p className="font-heading text-base font-bold text-dark">{title}</p>
      <p className="max-w-md text-xs leading-6 text-muted-foreground">
        ارتباط با سرور برقرار نشد. صفحه را دوباره بارگذاری کنید.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Skeletons                                                                  */
/* -------------------------------------------------------------------------- */

function PeriodSelectorSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      <p className="sr-only" role="status">
        در حال بارگذاری بازهٔ زمانی
      </p>
      <div
        className="h-9 w-64 animate-pulse rounded-md border border-border bg-muted/60 motion-reduce:animate-none"
        aria-hidden="true"
      />
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <p className="sr-only" role="status">
        در حال بارگذاری شاخص‌های فروش
      </p>
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-lg border border-border bg-muted/60 motion-reduce:animate-none"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function PanelSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:p-5",
        className
      )}
    >
      <p className="sr-only" role="status">
        در حال بارگذاری داشبورد
      </p>
      <div
        className="h-5 w-32 animate-pulse rounded bg-muted motion-reduce:animate-none"
        aria-hidden="true"
      />
      <div
        className="h-4 w-48 animate-pulse rounded bg-muted motion-reduce:animate-none"
        aria-hidden="true"
      />
      <div
        className="h-52 animate-pulse rounded-lg bg-muted/60 motion-reduce:animate-none"
        aria-hidden="true"
      />
    </div>
  );
}
