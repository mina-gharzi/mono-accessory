import type { ReactNode } from "react";
import { requireUser } from "@/server/auth/session";

export const instant = false;

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser();

  return <>{children}</>;
}
