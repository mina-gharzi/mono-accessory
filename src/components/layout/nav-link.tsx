"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  forwardRef,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

const getSnapshot = () => true;

const getServerSnapshot = () => false;

/**
 * True only after the client has hydrated. Server HTML and the first client
 * render therefore always agree on the inactive markup.
 */
function useHydrated() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useActivePath(href: string, exact = false): boolean {
  const pathname = usePathname();
  const hydrated = useHydrated();

  return hydrated && isActivePath(pathname, href, exact);
}

type NavLinkProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  "href" | "className" | "children"
> & {
  href: string;
  className: string;
  activeClassName?: string;
  inactiveClassName?: string;
  exact?: boolean;
  children?: ReactNode;
};

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLink(
    {
      href,
      className,
      activeClassName,
      inactiveClassName,
      exact,
      children,
      ...props
    },
    ref
  ) {
    const active = useActivePath(href, exact);

    return (
      <Link
        {...props}
        ref={ref}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          className,
          active ? activeClassName : inactiveClassName
        )}
      >
        {children}
      </Link>
    );
  }
);
