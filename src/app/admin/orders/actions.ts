"use server";

import { requireAdmin } from "@/server/auth/session";
import {
  changeOrderStatus,
  type AdminOrderMutationResult,
} from "@/server/admin-orders";

export async function changeOrderStatusAction(
  orderId: string,
  nextStatus: string
): Promise<AdminOrderMutationResult> {
  await requireAdmin();

  return changeOrderStatus(orderId, nextStatus);
}
