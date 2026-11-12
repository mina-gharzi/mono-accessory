"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import {
  placeOrder,
  type ShippingField,
  type ShippingInput,
} from "@/server/orders";
import { getPaymentProvider } from "@/server/payment";

export type CheckoutState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Partial<Record<ShippingField, string>>;
  values: ShippingInput;
};

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function placeOrderAction(
  _previousState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const user = await requireUser();

  const values: ShippingInput = {
    recipientName: readField(formData, "recipientName"),
    mobile: readField(formData, "mobile"),
    province: readField(formData, "province"),
    city: readField(formData, "city"),
    address: readField(formData, "address"),
    postalCode: readField(formData, "postalCode"),
  };

  const result = await placeOrder(user.id, values);

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
      values,
    };
  }

  const payment = await getPaymentProvider().createPayment({
    orderNumber: result.orderNumber,
    amount: result.total,
  });

  redirect(payment.redirectPath);
}
