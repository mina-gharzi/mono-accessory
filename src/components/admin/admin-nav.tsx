"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Menu,
  MessageSquare,
  Package,
  Percent,
  ShoppingCart,
  Store,
  Tags,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "نمای کلی", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: Tags },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingCart },
  { href: "/admin/customers", label: "مشتریان", icon: Users },
  { href: "/admin/discounts", label: "تخفیف‌ها", icon: Percent, later: true },
  { href: "/admin/reviews", label: "دیدگاه‌ها", icon: MessageSquare, later: true },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function isLinkActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-1">
      {adminLinks.map((link) => {
        const active = isLinkActive(pathname, link.href, link.exact);
        const Icon = link.icon;

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors motion-reduce:transition-none",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted",
                focusRing
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span>{link.label}</span>
              {link.later ? (
                <span
                  className={cn(
                    "ms-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    active
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  به‌زودی
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminSidebar({ userName }: { userName: string }) {
  return (
    <aside className="hidden lg:block lg:w-60 lg:shrink-0">
      <div className="sticky top-6 flex flex-col gap-5 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium tracking-[0.35em] text-primary">
            MONO ADMIN
          </p>
          <p className="font-heading text-lg font-bold text-dark">پنل مدیریت</p>
          <p className="truncate text-xs text-muted-foreground">{userName}</p>
        </div>

        <nav aria-label="ناوبری پنل مدیریت">
          <AdminNavLinks />
        </nav>

        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 border-t border-border pt-4 text-xs font-medium text-muted-foreground transition-colors hover:text-primary motion-reduce:transition-none",
            focusRing
          )}
        >
          <Store className="size-4" aria-hidden="true" />
          بازگشت به فروشگاه
        </Link>
      </div>
    </aside>
  );
}

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="باز کردن منوی مدیریت"
        >
          <Menu className="size-4" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>منوی مدیریت</SheetTitle>
          <SheetDescription>بخش‌های پنل مدیریت مونو</SheetDescription>
        </SheetHeader>

        <nav aria-label="ناوبری پنل مدیریت" className="px-4">
          <AdminNavLinks onNavigate={() => setOpen(false)} />
        </nav>

        <Link
          href="/"
          onClick={() => setOpen(false)}
          className={cn(
            "mx-4 mt-auto flex items-center gap-2 border-t border-border pt-4 text-sm font-medium text-muted-foreground transition-colors hover:text-primary motion-reduce:transition-none",
            focusRing
          )}
        >
          <Store className="size-4" aria-hidden="true" />
          بازگشت به فروشگاه
        </Link>
      </SheetContent>
    </Sheet>
  );
}
