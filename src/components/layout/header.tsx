import { HeaderClient } from "@/components/layout/header-client";
import { getSession } from "@/server/auth/session";
import { getCartCount } from "@/server/cart";
import { getWishlistCount } from "@/server/wishlist";

export async function Header() {
  const user = await getSession();
  const [cartCount, wishlistCount] = user
    ? await Promise.all([getCartCount(user.id), getWishlistCount(user.id)])
    : [0, 0];

  return (
    <HeaderClient
      cartCount={cartCount}
      wishlistCount={wishlistCount}
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
