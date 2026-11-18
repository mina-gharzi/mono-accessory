"use server";

import { requireAdmin } from "@/server/auth/session";
import {
  changeOrderStatus,
  type AdminOrderMutationResult,
} from "@/server/admin-orders";
import { invalidateProductCache } from "@/server/cache-tags";

export async function changeOrderStatusAction(
  orderId: string,
  nextStatus: string
): Promise<AdminOrderMutationResult> {
  await requireAdmin();

  const result = await changeOrderStatus(orderId, nextStatus);

  if (result.ok && result.status === "CANCELLED") {
    // Cancelling restores variant stock, which cached product cards show.
    invalidateProductCache();
  }

  return result;
}
