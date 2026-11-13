"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CategoryDeleteResult,
  type CategoryField,
  type CategoryValues,
} from "@/server/categories";

export type CategoryFormState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Partial<Record<CategoryField, string>>;
  values: CategoryValues;
};

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function readValues(formData: FormData): CategoryValues {
  return {
    name: readField(formData, "name"),
    slug: readField(formData, "slug"),
    sortOrder: readField(formData, "sortOrder"),
    image: readField(formData, "image"),
  };
}

export async function createCategoryAction(
  _previousState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireAdmin();

  const values = readValues(formData);
  const result = await createCategory(values);

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
      values,
    };
  }

  redirect("/admin/categories?status=created");
}

export async function updateCategoryAction(
  id: string,
  _previousState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireAdmin();

  const values = readValues(formData);
  const result = await updateCategory(id, values);

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
      values,
    };
  }

  redirect("/admin/categories?status=updated");
}

export async function deleteCategoryAction(
  id: string
): Promise<CategoryDeleteResult> {
  await requireAdmin();

  return deleteCategory(id);
}
