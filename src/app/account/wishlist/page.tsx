import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ProductGrid } from "@/components/shop/product-grid";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import { getWishlistProducts } from "@/server/wishlist";

export const instant = false;

export const metadata: Metadata = {
  title: "علاقه‌مندی‌ها | مونو اکسسوری",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function WishlistPage() {
  const user = await requireUser();
  const products = await getWishlistProducts(user.id);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-heading text-xl font-bold text-dark sm:text-2xl">
          علاقه‌مندی‌ها
        </h2>
        <p className="text-sm leading-7 text-muted-foreground">
          {products.length > 0
            ? `${formatNumber(products.length)} قطعه در فهرست علاقه‌مندی‌های شماست.`
            : "قطعه‌هایی که دوست دارید را اینجا نگه دارید."}
        </p>
      </header>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <EmptyState
          icon={<Heart className="size-5" />}
          title="فهرست علاقه‌مندی‌ها خالی است"
          description="با زدن قلب روی هر محصول، آن را برای بعد ذخیره کنید."
          action={
            <Button asChild>
              <Link href="/shop">رفتن به فروشگاه</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
