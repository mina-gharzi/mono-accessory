"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import {
  cancelPendingOrder,
  getOrderForUser,
  markOrderPaid,
} from "@/server/orders";
import { getPaymentProvider } from "@/server/payment";

const orderNumberSchema = z
  .string()
  .trim()
  .regex(/^MN-\d{6}-\d{5}$/);

const referenceSchema = z.string().trim().min(1).max(200);

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function revalidateOrder(orderNumber: string) {
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderNumber}`);
  revalidatePath(`/payment/mock/${orderNumber}`);
}

export async function payMockOrder(formData: FormData): Promise<void> {
  const parsed = z
    .object({
      orderNumber: orderNumberSchema,
      reference: referenceSchema,
    })
    .safeParse({
      orderNumber: readField(formData, "orderNumber"),
      reference: readField(formData, "reference"),
    });

  if (!parsed.success) {
    redirect("/account/orders");
  }

  const user = await requireUser();
  const order = await getOrderForUser(parsed.data.orderNumber, user.id);

  if (!order) {
    redirect("/account/orders");
  }

  if (order.status !== "PENDING" || order.paymentStatus !== "PENDING") {
    redirect(`/account/orders/${order.orderNumber}`);
  }

  const provider = getPaymentProvider();
  const verification = await provider.verifyPayment(
    { orderNumber: order.orderNumber, amount: order.total },
    parsed.data.reference
  );

  if (!verification.ok) {
    redirect(`/account/orders/${order.orderNumber}?payment=error`);
  }

  const result = await markOrderPaid(
    order.id,
    user.id,
    verification.reference
  );

  if (!result.ok) {
    redirect(`/account/orders/${order.orderNumber}?payment=error`);
  }

  revalidateOrder(order.orderNumber);
  redirect(`/account/orders/${order.orderNumber}?payment=success`);
}

export async function cancelMockOrder(formData: FormData): Promise<void> {
  const parsed = z
    .object({ orderNumber: orderNumberSchema })
    .safeParse({ orderNumber: readField(formData, "orderNumber") });

  if (!parsed.success) {
    redirect("/account/orders");
  }

  const user = await requireUser();
  const order = await getOrderForUser(parsed.data.orderNumber, user.id);

  if (!order) {
    redirect("/account/orders");
  }

  const result = await cancelPendingOrder(order.id, user.id);

  if (!result.ok) {
    redirect(`/account/orders/${order.orderNumber}?payment=error`);
  }

  revalidateOrder(order.orderNumber);
  redirect(`/account/orders/${order.orderNumber}`);
}
