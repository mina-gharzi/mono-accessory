"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import {
  cancelPendingOrder,
  type OrderMutationResult,
} from "@/server/orders";

const inputSchema = z.object({
  orderId: z.string().trim().min(1).max(64),
  orderNumber: z
    .string()
    .trim()
    .regex(/^MN-\d{6}-\d{5}$/),
});

export async function cancelOrder(
  orderId: string,
  orderNumber: string
): Promise<OrderMutationResult> {
  const parsed = inputSchema.safeParse({ orderId, orderNumber });

  if (!parsed.success) {
    return { ok: false, message: "درخواست نامعتبر است." };
  }

  const user = await requireUser();
  const result = await cancelPendingOrder(parsed.data.orderId, user.id);

  if (result.ok) {
    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${parsed.data.orderNumber}`);
  }

  return result;
}
