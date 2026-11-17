"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { getCart } from "@/server/cart";
import { normalizeCode, validateDiscountForSubtotal } from "@/server/discounts";
import {
  placeOrder,
  type ShippingField,
  type ShippingInput,
} from "@/server/orders";
import { getPaymentProvider } from "@/server/payment";
import { calculateTotals, getShippingSettings } from "@/server/pricing";

export type CheckoutState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Partial<Record<ShippingField, string>>;
  values: ShippingInput;
};

export type DiscountPreviewState =
  | {
      ok: true;
      code: string;
      subtotal: number;
      discountAmount: number;
      shippingCost: number;
      total: number;
      amountToFreeShipping: number;
    }
  | { ok: false; message: string };

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function applyDiscountAction(
  formData: FormData
): Promise<DiscountPreviewState> {
  const user = await requireUser();
  const code = normalizeCode(readField(formData, "code"));

  if (!code) {
    return { ok: false, message: "کد تخفیف را وارد کنید." };
  }

  const [cart, settings] = await Promise.all([
    getCart(user.id),
    getShippingSettings(),
  ]);

  if (cart.lines.length === 0 || cart.lines.some((line) => line.status !== "ok")) {
    return {
      ok: false,
      message: "برای اعمال کد تخفیف، سبد خرید باید قابل ثبت باشد.",
    };
  }

  const validation = await validateDiscountForSubtotal(
    code,
    cart.totals.subtotal
  );

  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  const totals = calculateTotals({
    subtotal: cart.totals.subtotal,
    discountAmount: validation.discount.amount,
    ...settings,
  });

  return {
    ok: true,
    code: validation.discount.code,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    shippingCost: totals.shippingCost,
    total: totals.total,
    amountToFreeShipping: totals.amountToFreeShipping,
  };
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
  const discountCode = readField(formData, "discountCode");

  const result = await placeOrder(user.id, values, discountCode || null);

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
