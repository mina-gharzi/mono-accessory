"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import {
  createDiscount,
  deleteDiscount,
  setDiscountActive,
  updateDiscount,
  type DiscountActiveResult,
  type DiscountDeleteResult,
  type DiscountField,
  type DiscountValues,
} from "@/server/discounts";

export type DiscountFormState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Partial<Record<DiscountField, string>>;
  values: DiscountValues;
};

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function readValues(formData: FormData): DiscountValues {
  return {
    code: readField(formData, "code"),
    type: readField(formData, "type"),
    value: readField(formData, "value"),
    minOrder: readField(formData, "minOrder"),
    maxDiscountAmount: readField(formData, "maxDiscountAmount"),
    usageLimit: readField(formData, "usageLimit"),
    expiresAt: readField(formData, "expiresAt"),
    isActive: readField(formData, "isActive"),
  };
}

export async function createDiscountAction(
  _previousState: DiscountFormState,
  formData: FormData
): Promise<DiscountFormState> {
  await requireAdmin();

  const values = readValues(formData);
  const result = await createDiscount(values);

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
      values,
    };
  }

  redirect("/admin/discounts?status=created");
}

export async function updateDiscountAction(
  id: string,
  _previousState: DiscountFormState,
  formData: FormData
): Promise<DiscountFormState> {
  await requireAdmin();

  const values = readValues(formData);
  const result = await updateDiscount(id, values);

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
      values,
    };
  }

  redirect("/admin/discounts?status=updated");
}

export async function deleteDiscountAction(
  id: string
): Promise<DiscountDeleteResult> {
  await requireAdmin();

  return deleteDiscount(id);
}

export async function setDiscountActiveAction(
  id: string,
  isActive: boolean
): Promise<DiscountActiveResult> {
  await requireAdmin();

  return setDiscountActive(id, isActive);
}
