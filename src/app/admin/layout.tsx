import type { ReactNode } from "react";
import { requireAdmin } from "@/server/auth/session";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return <>{children}</>;
}
