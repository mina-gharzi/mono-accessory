import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import {
  formatDateShort,
  formatNumber,
  formatPrice,
} from "@/lib/format";
import type {
  DashboardPeriod,
  SalesSeries,
} from "@/server/admin-stats";

const WIDTH = 720;
const HEIGHT = 260;
const PADDING = { top: 16, right: 92, bottom: 42, left: 12 };
const CHART_WIDTH = WIDTH - PADDING.left - PADDING.right;
const CHART_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

const axisFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 1,
});

const periodLabels: Record<DashboardPeriod, string> = {
  "7d": "۷ روز اخیر",
  "30d": "۳۰ روز اخیر",
  "90d": "۹۰ روز اخیر",
  all: "کل دوره",
};

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) {
    return `${axisFormatter.format(value / 1_000_000)} میلیون`;
  }

  if (value >= 1_000) {
    return `${axisFormatter.format(value / 1_000)} هزار`;
  }

  return formatNumber(value);
}

function getTickIndices(count: number, maxTicks: number): number[] {
  if (count <= maxTicks) {
    return Array.from({ length: count }, (_, index) => index);
  }

  const indices = new Set<number>();

  for (let index = 0; index < maxTicks; index += 1) {
    indices.add(Math.round((index * (count - 1)) / (maxTicks - 1)));
  }

  return [...indices].sort((a, b) => a - b);
}

export function SalesChart({
  series,
  period,
}: {
  series: SalesSeries;
  period: DashboardPeriod;
}) {
  const { points, granularity, totalOrders, totalRevenue } = series;

  if (totalOrders === 0) {
    return (
      <EmptyState
        title="در این بازه فروشی ثبت نشده است"
        description="با ثبت سفارش‌های جدید، نمودار درآمد و تعداد سفارش‌ها در این بخش نمایش داده می‌شود."
        icon={<BarChart3 className="size-5" aria-hidden="true" />}
        className="border-dashed bg-transparent py-10"
      />
    );
  }

  const maxRevenue = Math.max(1, ...points.map((point) => point.revenue));
  const slot = CHART_WIDTH / points.length;
  const barWidth = Math.max(2, Math.min(slot * 0.6, 22));
  const tickIndices = getTickIndices(points.length, 5);
  const granularityLabel = granularity === "day" ? "روزانه" : "هفتگی";

  const summary = `نمودار فروش ${periodLabels[period]}، ${granularityLabel}. ${formatNumber(totalOrders)} سفارش و ${formatPrice(totalRevenue)} درآمد. محور زمان از راست به چپ است: قدیمی‌ترین بازه در سمت راست و جدیدترین بازه در سمت چپ قرار دارد.`;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={summary}
          className="h-auto w-full min-w-[640px]"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = PADDING.top + CHART_HEIGHT - fraction * CHART_HEIGHT;
            const value = maxRevenue * fraction;

            return (
              <g key={fraction}>
                <line
                  x1={PADDING.left}
                  x2={PADDING.left + CHART_WIDTH}
                  y1={y}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                />
                <text
                  x={WIDTH - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill="var(--color-muted-foreground)"
                >
                  {formatAxisValue(value)}
                </text>
              </g>
            );
          })}

          {points.map((point, index) => {
            const barHeight = (point.revenue / maxRevenue) * CHART_HEIGHT;
            const x =
              PADDING.left +
              CHART_WIDTH -
              (index + 1) * slot +
              (slot - barWidth) / 2;
            const y = PADDING.top + CHART_HEIGHT - barHeight;

            return (
              <rect
                key={point.key}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={2}
                fill="var(--color-chart-1)"
              >
                <title>
                  {`${formatDateShort(point.date)}: ${formatPrice(point.revenue)}، ${formatNumber(point.orders)} سفارش`}
                </title>
              </rect>
            );
          })}

          {tickIndices.map((index) => {
            const point = points[index];
            const x =
              PADDING.left + CHART_WIDTH - (index + 0.5) * slot;

            return (
              <text
                key={point.key}
                x={x}
                y={HEIGHT - 14}
                textAnchor="middle"
                fontSize={11}
                fill="var(--color-muted-foreground)"
              >
                {formatDateShort(point.date)}
              </text>
            );
          })}
        </svg>
      </div>

      <p className="text-xs text-muted-foreground">
        محور زمان از راست (قدیمی‌تر) به چپ (جدیدتر) خوانده می‌شود. مقادیر محور
        عمودی به تومان است.
      </p>

      <table className="sr-only">
        <caption>داده‌های نمودار فروش</caption>
        <thead>
          <tr>
            <th scope="col">بازه</th>
            <th scope="col">تعداد سفارش</th>
            <th scope="col">درآمد</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.key}>
              <td>{formatDateShort(point.date)}</td>
              <td>{formatNumber(point.orders)}</td>
              <td>{formatPrice(point.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
