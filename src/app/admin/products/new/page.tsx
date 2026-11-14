import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductForm } from "@/components/admin/product-form";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { listProductFormOptions } from "@/server/admin-products";

export const metadata: Metadata = {
  title: "محصول جدید | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="محصول جدید"
        description="اطلاعات پایه، قیمت، تصاویر، واریانت‌ها و مشخصات محصول را وارد کنید."
      />

      <Suspense fallback={<ProductFormFallback />}>
        <NewProductForm />
      </Suspense>
    </div>
  );
}

async function NewProductForm() {
  let options;

  try {
    options = await listProductFormOptions();
  } catch (error) {
    unstable_rethrow(error);

    return (
      <EmptyState
        title="بارگذاری فرم محصول ناموفق بود"
        description="ارتباط با سرور برقرار نشد. صفحه را دوباره بارگذاری کنید."
        action={
          <Button asChild>
            <Link href="/admin/products/new">تلاش دوباره</Link>
          </Button>
        }
      />
    );
  }

  return <ProductForm mode="create" options={options} />;
}

function ProductFormFallback() {
  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" role="status">
        در حال بارگذاری فرم محصول
      </p>
      <div
        className="h-96 animate-pulse rounded-lg border border-border bg-muted/60 motion-reduce:animate-none"
        aria-hidden="true"
      />
      <div
        className="h-40 animate-pulse rounded-lg border border-border bg-muted/60 motion-reduce:animate-none"
        aria-hidden="true"
      />
    </div>
  );
}
