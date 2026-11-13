"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account/orders", label: "سفارش‌ها", icon: Package },
  { href: "/account/wishlist", label: "علاقه‌مندی‌ها", icon: Heart },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="ناوبری حساب کاربری"
      className="flex gap-2 overflow-x-auto pb-1 lg:w-52 lg:shrink-0 lg:flex-col lg:overflow-visible lg:border-e lg:border-border lg:pb-0 lg:pe-5"
    >
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
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
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
