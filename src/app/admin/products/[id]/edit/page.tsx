import type { Metadata } from "next";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InlineMessage } from "@/components/admin/inline-message";
import { ProductForm } from "@/components/admin/product-form";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  getAdminProduct,
  listProductFormOptions,
} from "@/server/admin-products";

export const metadata: Metadata = {
  title: "ویرایش محصول | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

type EditPageProps = PageProps<"/admin/products/[id]/edit">;

export default function EditProductPage({
  params,
  searchParams,
}: EditPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="ویرایش محصول"
        description="اطلاعات محصول، تصاویر، واریانت‌ها و مشخصات را ویرایش کنید."
      />

      <Suspense fallback={<ProductFormFallback />}>
        <EditProductForm params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function EditProductForm({
  params,
  searchParams,
}: {
  params: EditPageProps["params"];
  searchParams: EditPageProps["searchParams"];
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const status = typeof query.status === "string" ? query.status : null;
  const successMessage =
    status === "created"
      ? "محصول با موفقیت ایجاد شد."
      : status === "updated"
        ? "تغییرات محصول با موفقیت ذخیره شد."
        : null;

  let product;

  try {
    product = await getAdminProduct(id);
  } catch (error) {
    unstable_rethrow(error);

    return <LoadError />;
  }

  if (!product) {
    notFound();
  }

  let options;

  try {
    options = await listProductFormOptions();
  } catch (error) {
    unstable_rethrow(error);

    return <LoadError />;
  }

  return (
    <>
      <InlineMessage tone="success" message={successMessage} />
      <ProductForm mode="edit" options={options} product={product} />
    </>
  );
}

function LoadError() {
  return (
    <EmptyState
      title="بارگذاری محصول ناموفق بود"
      description="ارتباط با سرور برقرار نشد. صفحه را دوباره بارگذاری کنید."
      action={
        <Button asChild>
          <Link href="/admin/products">بازگشت به فهرست محصولات</Link>
        </Button>
      }
    />
  );
}

function ProductFormFallback() {
  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" role="status">
        در حال بارگذاری محصول
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
