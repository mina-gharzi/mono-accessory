"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/safe-redirect";
import { getSession, requireUser } from "@/server/auth/session";
import {
  addToCart as addToCartService,
  getCart,
  removeItem as removeItemService,
  updateQuantity as updateQuantityService,
  type Cart,
  type CartMutationResult,
} from "@/server/cart";

function revalidateCart() {
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

const nextPathSchema = z.string().trim().max(2048).optional();

export async function addToCart(
  variantId: string,
  quantity: number,
  nextPath?: string
): Promise<CartMutationResult> {
  const user = await getSession();

  if (!user) {
    const parsedNextPath = nextPathSchema.safeParse(nextPath);

    redirect(
      `/login?next=${encodeURIComponent(
        safeNextPath(
          parsedNextPath.success ? parsedNextPath.data : undefined,
          "/cart"
        )
      )}`
    );
  }

  const result = await addToCartService(user.id, variantId, quantity);

  if (result.ok) {
    revalidateCart();
  }

  return result;
}

export async function updateCartQuantity(
  itemId: string,
  quantity: number
): Promise<CartMutationResult> {
  const user = await requireUser();
  const result = await updateQuantityService(user.id, itemId, quantity);

  if (result.ok) {
    revalidateCart();
  }

  return result;
}

export async function removeCartItem(
  itemId: string
): Promise<CartMutationResult> {
  const user = await requireUser();
  const result = await removeItemService(user.id, itemId);

  if (result.ok) {
    revalidateCart();
  }

  return result;
}

export async function getCartAction(): Promise<Cart> {
  const user = await requireUser();

  return getCart(user.id);
}
