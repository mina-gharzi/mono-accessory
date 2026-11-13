import type { ReactNode } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { Container } from "@/components/container";
import { requireUser } from "@/server/auth/session";

export const instant = false;

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 sm:py-14">
      <header className="flex flex-col gap-1">
        <p className="text-[11px] font-medium tracking-[0.35em] text-primary">
          MONO ACCOUNT
        </p>
        <h1 className="font-heading text-2xl font-bold text-dark sm:text-3xl">
          {user.name}
        </h1>
        <p className="text-sm text-muted-foreground" dir="ltr">
          {user.mobile}
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <AccountNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </Container>
  );
}
