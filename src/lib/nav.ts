export type MainNavItem = {
  href: string;
  label: string;
};

export const mainNavItems: MainNavItem[] = [
  { href: "/shop", label: "فروشگاه" },
  { href: "/collections", label: "کالکشن‌ها" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس" },
];

export function isActivePath(
  pathname: string,
  href: string,
  exact = false
): boolean {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
