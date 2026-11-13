"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/safe-redirect";
import { getSession } from "@/server/auth/session";
import {
  toggleWishlist,
  type WishlistMutationResult,
} from "@/server/wishlist";

const productIdSchema = z.string().trim().min(1).max(64);
const nextPathSchema = z.string().trim().max(2048).optional();

export async function toggleWishlistAction(
  productId: string,
  nextPath?: string
): Promise<WishlistMutationResult> {
  const parsedProduct = productIdSchema.safeParse(productId);

  if (!parsedProduct.success) {
    return { ok: false, message: "درخواست نامعتبر است." };
  }

  const user = await getSession();

  if (!user) {
    const parsedNextPath = nextPathSchema.safeParse(nextPath);

    redirect(
      `/login?next=${encodeURIComponent(
        safeNextPath(
          parsedNextPath.success ? parsedNextPath.data : undefined,
          "/account/wishlist"
        )
      )}`
    );
  }

  const result = await toggleWishlist(user.id, parsedProduct.data);

  if (result.ok) {
    revalidatePath("/account/wishlist");
    revalidatePath("/", "layout");
  }

  return result;
}
