"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Menu, ShoppingBag, User } from "lucide-react";
import { Container } from "@/components/container";
import { SearchDialog } from "@/components/layout/search-dialog";
import { Button } from "@/components/ui/button";
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
const cartCount = 0;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
                <SheetClose asChild>
                  <Link
                    href="/account"
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted",
                      focusRing
                    )}
                  >
                    <User className="size-4" aria-hidden="true" />
                    حساب کاربری
                  </Link>
                </SheetClose>
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

          <Button asChild variant="ghost" size="icon" className="relative">
            <Link
              href="/cart"
              aria-label={`سبد خرید، ${countFormatter.format(cartCount)} مورد`}
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

          <Button asChild variant="ghost" size="icon">
            <Link href="/account" aria-label="حساب کاربری">
              <User className="size-5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
