import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DiscountForm } from "@/components/admin/discount-form";
import { getDiscount } from "@/server/discounts";

export const metadata: Metadata = {
  title: "ویرایش کد تخفیف | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

type EditDiscountPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditDiscountPage({
  params,
}: EditDiscountPageProps) {
  const { id } = await params;
  const discount = await getDiscount(id);

  if (!discount) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="ویرایش کد تخفیف"
        description={`شرایط کد «${discount.code}» را ویرایش کنید.`}
      />
      <DiscountForm mode="edit" discount={discount} />
    </div>
  );
}
