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
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/shop", label: "فروشگاه" },
  { href: "/collections", label: "کالکشن‌ها" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس" },
];

const countFormatter = new Intl.NumberFormat("fa-IR");
const wishlistCount = 0;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const sheetLinkClass = cn(
  "flex items-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted",
  focusRing
);

export type HeaderUser = {
  firstName: string;
  isAdmin: boolean;
};

export function HeaderClient({
  user,
  cartCount,
}: {
  user: HeaderUser | null | undefined;
  cartCount: number;
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
          ? "border-border bg-background/90 backdrop-blur-md"
          : "border-transparent bg-background"
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-2">
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
            <SheetContent side="right" className="w-4/5 max-w-xs p-0">
              <SheetHeader className="border-b border-border p-6 text-start">
                <SheetTitle>
                  <span
                    dir="ltr"
                    className="font-heading text-lg font-extrabold tracking-[0.32em] text-dark"
                  >
                    MONO
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav
                aria-label="منوی موبایل"
                className="flex flex-col gap-1 p-4"
              >
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "rounded-md px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted",
                        focusRing
                      )}
                    >
                      {link.label}
                    </Link>
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
                      className="mt-1 w-full justify-start gap-2 px-3 text-destructive hover:text-destructive"
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
                        className={buttonVariants({ className: "w-full" })}
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
                          className: "w-full",
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

          <Link
            href="/"
            aria-label="مونو اکسسوری، صفحهٔ اصلی"
            className={cn(
              "flex items-baseline gap-2 rounded-md px-1",
              focusRing
            )}
          >
            <span
              dir="ltr"
              className="font-heading text-xl font-extrabold tracking-[0.32em] text-dark"
            >
              MONO
            </span>
            <span className="hidden text-[10px] tracking-[0.18em] text-muted-foreground sm:inline">
              اکسسوری
            </span>
          </Link>
        </div>

        <nav
          aria-label="ناوبری اصلی"
          className="hidden items-center gap-7 lg:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md text-sm font-medium text-foreground/80 transition-colors hover:text-primary",
                focusRing
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <SearchDialog />

          <Button asChild variant="ghost" size="icon" className="relative">
            <Link
              href="/wishlist"
              aria-label={`علاقه‌مندی‌ها، ${countFormatter.format(wishlistCount)} مورد`}
            >
              <Heart className="size-5" aria-hidden="true" />
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
              >
                {countFormatter.format(wishlistCount)}
              </span>
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
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
              >
                {countFormatter.format(cartCount)}
              </span>
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
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                >
                  {countFormatter.format(cartCount)}
                </span>
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
                  className="gap-1.5 px-2"
                  aria-label={`حساب کاربری ${user.firstName}`}
                >
                  <User className="size-5" aria-hidden="true" />
                  <span className="hidden text-sm font-medium sm:inline">
                    {user.firstName}
                  </span>
                  <ChevronDown
                    className="hidden size-4 text-muted-foreground sm:inline"
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
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">ورود</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
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
