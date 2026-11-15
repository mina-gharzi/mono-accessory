"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  User,
  UserPlus,
} from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { useCartSheet } from "@/components/cart/cart-sheet";
import { Container } from "@/components/container";
import { NavLink } from "@/components/layout/nav-link";
import { SearchDialog } from "@/components/layout/search-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mainNavItems } from "@/lib/nav";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const countFormatter = new Intl.NumberFormat("fa-IR");

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const sheetLinkClass = cn(
  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted",
  focusRing
);

export type HeaderUser = {
  firstName: string;
  isAdmin: boolean;
};

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span
      aria-hidden="true"
      className="absolute top-1 inset-e-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background"
    >
      {count > 99 ? "+۹۹" : countFormatter.format(count)}
    </span>
  );
}

function Logo() {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.nameFa}، صفحهٔ اصلی`}
      className={cn("flex items-center gap-3 rounded-md px-1", focusRing)}
    >
      <span
        dir="ltr"
        className="font-heading text-xl font-extrabold tracking-[0.32em] text-dark"
      >
        {siteConfig.shortName}
      </span>
      <span
        aria-hidden="true"
        className="hidden h-4 w-px bg-border sm:block"
      />
      <span className="hidden text-[11px] text-muted-foreground sm:inline">
        {siteConfig.brandLabel}
      </span>
    </Link>
  );
}

export function HeaderClient({
  user,
  cartCount,
  wishlistCount,
}: {
  user: HeaderUser | null | undefined;
  cartCount: number;
  wishlistCount: number;
}) {
  const { openCart } = useCartSheet();
  const [scrolled, setScrolled] = useState(false);
  const [loggingOut, startLogout] = useTransition();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    startLogout(() => {
      void logout();
    });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-300 motion-reduce:transition-none",
        scrolled
          ? "border-border/70 bg-background/80 backdrop-blur-lg"
          : "border-transparent bg-background"
      )}
    >
      <Container
        className={cn(
          "grid grid-cols-[1fr_auto] items-center gap-2 transition-[height] duration-300 motion-reduce:transition-none lg:grid-cols-[1fr_auto_1fr]",
          scrolled ? "h-16" : "h-18"
        )}
      >
        {/* شروع: منوی موبایل + لوگو */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="باز کردن منو"
                className="lg:hidden"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-4/5 max-w-xs gap-0 p-0">
              <SheetHeader className="p-6 text-start">
                <SheetTitle>
                  <span
                    dir="ltr"
                    className="font-heading text-lg font-extrabold tracking-[0.32em] text-dark"
                  >
                    {siteConfig.shortName}
                  </span>
                </SheetTitle>
              </SheetHeader>

              <nav
                aria-label="منوی موبایل"
                className="flex flex-col gap-1 px-4"
              >
                {mainNavItems.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <NavLink
                      href={link.href}
                      className={cn(
                        "rounded-xl px-3 py-3.5 text-lg font-bold transition-colors hover:bg-muted",
                        focusRing
                      )}
                      activeClassName="bg-primary/10 text-primary"
                      inactiveClassName="text-foreground"
                    >
                      {link.label}
                    </NavLink>
                  </SheetClose>
                ))}
              </nav>

              <div className="mt-auto border-t border-border p-4">
                {user === undefined ? null : user ? (
                  <div className="flex flex-col gap-1">
                    <SheetClose asChild>
                      <Link href="/account/orders" className={sheetLinkClass}>
                        <Package className="size-4" aria-hidden="true" />
                        سفارش‌های من
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/account/wishlist" className={sheetLinkClass}>
                        <Heart className="size-4" aria-hidden="true" />
                        علاقه‌مندی‌ها
                      </Link>
                    </SheetClose>
                    {user.isAdmin ? (
                      <SheetClose asChild>
                        <Link href="/admin" className={sheetLinkClass}>
                          <LayoutDashboard
                            className="size-4"
                            aria-hidden="true"
                          />
                          پنل مدیریت
                        </Link>
                      </SheetClose>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-1 w-full justify-start gap-3 rounded-xl px-3 text-destructive hover:text-destructive"
                      disabled={loggingOut}
                      onClick={handleLogout}
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      خروج از حساب
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <SheetClose asChild>
                      <Link
                        href="/login"
                        className={buttonVariants({
                          className: "w-full rounded-full",
                        })}
                      >
                        <LogIn className="size-4" aria-hidden="true" />
                        ورود
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/register"
                        className={buttonVariants({
                          variant: "outline",
                          className: "w-full rounded-full",
                        })}
                      >
                        <UserPlus className="size-4" aria-hidden="true" />
                        ثبت‌نام
                      </Link>
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Logo />
        </div>

        {/* وسط: ناوبری دسکتاپ (واقعاً وسط‌چین) */}
        <nav
          aria-label="ناوبری اصلی"
          className="hidden items-center gap-9 lg:flex"
        >
          {mainNavItems.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              className={cn(
                "relative rounded-sm py-2 text-sm font-medium transition-colors hover:text-primary",
                "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100 motion-reduce:after:transition-none",
                focusRing
              )}
              activeClassName="text-primary after:scale-x-100"
              inactiveClassName="text-foreground/75"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* پایان: اکشن‌ها */}
        <div className="col-start-2 flex items-center justify-self-end gap-0.5 sm:gap-1 lg:col-start-3">
          <SearchDialog />

          <Button asChild variant="ghost" size="icon" className="relative">
            <Link
              href={
                user === null
                  ? "/login?next=%2Faccount%2Fwishlist"
                  : "/account/wishlist"
              }
              aria-label={
                user === null
                  ? "علاقه‌مندی‌ها، برای مشاهده وارد شوید"
                  : `علاقه‌مندی‌ها، ${countFormatter.format(wishlistCount)} مورد`
              }
            >
              <Heart className="size-5" aria-hidden="true" />
              <CountBadge count={wishlistCount} />
            </Link>
          </Button>

          {user ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative"
              onClick={openCart}
              aria-label={`سبد خرید، ${countFormatter.format(cartCount)} مورد`}
            >
              <ShoppingBag className="size-5" aria-hidden="true" />
              <CountBadge count={cartCount} />
            </Button>
          ) : (
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link
                href={user === null ? "/login?next=%2Fcart" : "/cart"}
                aria-label={
                  user === null
                    ? "سبد خرید، برای مشاهده وارد شوید"
                    : `سبد خرید، ${countFormatter.format(cartCount)} مورد`
                }
              >
                <ShoppingBag className="size-5" aria-hidden="true" />
                <CountBadge count={cartCount} />
              </Link>
            </Button>
          )}

          {user === undefined ? (
            <span className="inline-block size-10" aria-hidden="true" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-full px-2 sm:ps-1.5 sm:pe-3"
                  aria-label={`حساب کاربری ${user.firstName}`}
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="size-4" aria-hidden="true" />
                  </span>
                  <span className="hidden text-sm font-medium sm:inline">
                    {user.firstName}
                  </span>
                  <ChevronDown
                    className="hidden size-3.5 text-muted-foreground sm:inline"
                    aria-hidden="true"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {user.firstName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account/orders" className="cursor-pointer">
                    <Package className="size-4" aria-hidden="true" />
                    سفارش‌های من
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/wishlist" className="cursor-pointer">
                    <Heart className="size-4" aria-hidden="true" />
                    علاقه‌مندی‌ها
                  </Link>
                </DropdownMenuItem>
                {user.isAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <LayoutDashboard className="size-4" aria-hidden="true" />
                      پنل مدیریت
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={loggingOut}
                  onSelect={handleLogout}
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  خروج از حساب
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="icon" className="sm:hidden">
                <Link href="/login" aria-label="ورود یا ثبت‌نام">
                  <User className="size-5" aria-hidden="true" />
                </Link>
              </Button>
              <div className="hidden items-center gap-1 sm:flex">
                <Button asChild variant="ghost" size="sm" className="rounded-full">
                  <Link href="/login">ورود</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full px-4">
                  <Link href="/register">ثبت‌نام</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}