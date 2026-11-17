import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DiscountForm } from "@/components/admin/discount-form";

export const metadata: Metadata = {
  title: "کد تخفیف جدید | پنل مدیریت",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewDiscountPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="کد تخفیف جدید"
        description="کد، نوع و شرایط استفاده از تخفیف را مشخص کنید."
      />
      <DiscountForm mode="create" />
    </div>
  );
}
