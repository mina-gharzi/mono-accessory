"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildShopHref,
  isSortValue,
  SORT_LABELS,
  SORT_VALUES,
  type ShopQuery,
} from "@/lib/shop-params";

type SortSelectProps = {
  pathname: string;
  query: ShopQuery;
};

export function SortSelect({ pathname, query }: SortSelectProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">
        مرتب‌سازی:
      </span>
      <Select
        value={query.sort}
        onValueChange={(value) => {
          if (isSortValue(value)) {
            router.push(buildShopHref(pathname, query, { sort: value }));
          }
        }}
      >
        <SelectTrigger className="h-10 min-w-36" aria-label="مرتب‌سازی محصولات">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {SORT_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {SORT_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
