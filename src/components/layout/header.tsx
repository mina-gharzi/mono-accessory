import { HeaderClient } from "@/components/layout/header-client";
import { getSession } from "@/server/auth/session";
import { getCartCount } from "@/server/cart";

export async function Header() {
  const user = await getSession();
  const cartCount = user ? await getCartCount(user.id) : 0;

  return (
    <HeaderClient
      cartCount={cartCount}
      user={
        user
          ? {
              firstName: user.name.trim().split(/\s+/)[0] || user.name,
              isAdmin: user.role === "ADMIN",
            }
          : null
      }
    />
  );
}
