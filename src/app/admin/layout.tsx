import type { ReactNode } from "react";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/admin-nav";
import { Container } from "@/components/container";
import { requireAdmin } from "@/server/auth/session";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col bg-background">
      <Container className="flex flex-1 flex-col gap-6 py-6 sm:py-10 lg:flex-row lg:items-start lg:gap-8">
        <AdminSidebar userName={user.name} />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-4 lg:hidden">
            <div className="flex flex-col">
              <p className="text-[11px] font-medium tracking-[0.35em] text-primary">
                MONO ADMIN
              </p>
              <p className="font-heading text-lg font-bold text-dark">
                پنل مدیریت
              </p>
            </div>
            <AdminMobileNav />
          </div>

          {children}
        </div>
      </Container>
    </div>
  );
}
