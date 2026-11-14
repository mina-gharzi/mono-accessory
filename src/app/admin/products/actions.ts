"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import {
  createProduct,
  deleteProduct,
  setProductActive,
  updateProduct,
  type ProductDeleteResult,
  type ProductFieldErrors,
  type ProductInput,
  type ProductStatusResult,
  type ProductVariantErrors,
} from "@/server/admin-products";
import { toEnglishDigits } from "@/server/products";

export type ProductFormState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: ProductFieldErrors;
  variantErrors: ProductVariantErrors;
};

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function readFields(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string");
}

function toInteger(value: string): number {
  const normalized = toEnglishDigits(value).trim();

  if (normalized === "") return Number.NaN;

  const number = Number(normalized);

  return Number.isFinite(number) ? number : Number.NaN;
}

function toOptionalInteger(value: string): number | null {
  const normalized = toEnglishDigits(value).trim();

  if (normalized === "") return null;

  const number = Number(normalized);

  return Number.isFinite(number) ? number : Number.NaN;
}

function readProductInput(formData: FormData): ProductInput {
  const urls = readFields(formData, "images");
  const alts = readFields(formData, "imageAlt");
  const images = urls.map((url, index) => ({
    url,
    alt: alts[index] ?? "",
  }));

  const variantIds = readFields(formData, "variantId");
  const colors = readFields(formData, "variantColor");
  const models = readFields(formData, "variantModel");
  const skus = readFields(formData, "variantSku");
  const stocks = readFields(formData, "variantStock");
  const variantCount = Math.max(
    variantIds.length,
    colors.length,
    models.length,
    skus.length,
    stocks.length
  );
  const variants = Array.from({ length: variantCount }, (_, index) => ({
    id: (variantIds[index] ?? "").trim() || null,
    color: colors[index] ?? "",
    model: models[index] ?? "",
    sku: skus[index] ?? "",
    stock: toInteger(stocks[index] ?? ""),
  }));

  const specKeys = readFields(formData, "specKey");
  const specValues = readFields(formData, "specValue");
  const specs = specKeys
    .map((key, index) => ({ key, value: specValues[index] ?? "" }))
    .filter((spec) => spec.key.trim() !== "" || spec.value.trim() !== "");

  return {
    name: readField(formData, "name"),
    slug: readField(formData, "slug"),
    description: readField(formData, "description"),
    categoryId: readField(formData, "categoryId"),
    collectionIds: readFields(formData, "collectionIds"),
    isFeatured: formData.get("isFeatured") === "1",
    isActive: formData.get("isActive") === "1",
    price: toInteger(readField(formData, "price")),
    compareAtPrice: toOptionalInteger(readField(formData, "compareAtPrice")),
    images,
    variants,
    specs,
  };
}

export async function createProductAction(
  _previousState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();

  const result = await createProduct(readProductInput(formData));

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
      variantErrors: result.variantErrors,
    };
  }

  redirect(`/admin/products/${result.id}/edit?status=created`);
}

export async function updateProductAction(
  id: string,
  _previousState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();

  const result = await updateProduct(id, readProductInput(formData));

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
      variantErrors: result.variantErrors,
    };
  }

  redirect(`/admin/products/${id}/edit?status=updated`);
}

export async function setProductActiveAction(
  id: string,
  isActive: boolean
): Promise<ProductStatusResult> {
  await requireAdmin();

  return setProductActive(id, isActive);
}

export async function deleteProductAction(
  id: string
): Promise<ProductDeleteResult> {
  await requireAdmin();

  return deleteProduct(id);
}
