import {
  WishlistSeedClient,
} from "@/components/wishlist/wishlist-provider";
import { getSession } from "@/server/auth/session";
import { getWishlistProductIds } from "@/server/wishlist";

/**
 * Streams the session's wishlisted product ids into the client provider.
 * It reads the session, so it must stay inside a Suspense boundary.
 */
export async function WishlistSeed() {
  const user = await getSession();
  const ids = user ? await getWishlistProductIds(user.id) : [];

  return <WishlistSeedClient ids={ids} />;
}
