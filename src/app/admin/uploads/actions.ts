"use server";

import { requireAdmin } from "@/server/auth/session";
import { saveUploadedImage, type UploadImageResult } from "@/server/uploads";

export async function uploadImageAction(
  formData: FormData
): Promise<UploadImageResult> {
  await requireAdmin();

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { ok: false, message: "تصویری انتخاب نشده است." };
  }

  return saveUploadedImage(file);
}
