"use client";

import Link from "next/link";
import { Heart, Package, type LucideIcon } from "lucide-react";
import { useActivePath } from "@/components/layout/nav-link";
import { cn } from "@/lib/utils";

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/account/orders", label: "سفارش‌ها", icon: Package },
  { href: "/account/wishlist", label: "علاقه‌مندی‌ها", icon: Heart },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function AccountNavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  const active = useActivePath(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium transition-colors motion-reduce:transition-none",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-muted",
        focusRing
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function AccountNav() {
  return (
    <nav
      aria-label="ناوبری حساب کاربری"
      className="flex gap-2 overflow-x-auto pb-1 lg:w-52 lg:shrink-0 lg:flex-col lg:overflow-visible lg:border-e lg:border-border lg:pb-0 lg:pe-5"
    >
      {links.map((link) => (
        <AccountNavItem key={link.href} {...link} />
      ))}
    </nav>
  );
}
