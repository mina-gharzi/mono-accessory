import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "./auth/session";
import { prisma } from "./db";
import { removeStoredImage } from "./uploads";

const idSchema = z.string().trim().min(1).max(64);

const INVALID_REQUEST = "درخواست نامعتبر است.";
const CATEGORY_NOT_FOUND = "دسته‌بندی پیدا نشد.";
const DUPLICATE_SLUG =
  "این اسلاگ قبلاً استفاده شده است. اسلاگ دیگری انتخاب کنید.";
const CATEGORY_HAS_PRODUCTS =
  "این دسته‌بندی دارای محصول است و تا زمانی که محصولات آن جابه‌جا یا حذف نشوند قابل حذف نیست.";
const SAVE_FAILED = "ذخیرهٔ دسته‌بندی ناموفق بود. لطفاً دوباره تلاش کنید.";
const DELETE_FAILED = "حذف دسته‌بندی ناموفق بود. لطفاً دوباره تلاش کنید.";

export type CategoryField = "name" | "slug" | "sortOrder" | "image";

export type CategoryValues = {
  name: string;
  slug: string;
  sortOrder: string;
  image: string;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  image: string;
  sortOrder: number;
  productCount: number;
};

export type CategoryMutationResult =
  | { ok: true; id: string }
  | {
      ok: false;
      message: string;
      fieldErrors: Partial<Record<CategoryField, string>>;
    };

export type CategoryDeleteResult = { ok: true } | { ok: false; message: string };

export const categoryInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "نام دسته‌بندی باید حداقل ۲ نویسه باشد.")
    .max(60, "نام دسته‌بندی نباید بیشتر از ۶۰ نویسه باشد."),
  slug: z
    .string()
    .trim()
    .min(1, "اسلاگ را وارد کنید.")
    .max(60, "اسلاگ نباید بیشتر از ۶۰ نویسه باشد.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "اسلاگ فقط می‌تواند شامل حروف کوچک انگلیسی، رقم و خط تیره باشد."
    ),
  sortOrder: z
    .string()
    .trim()
    .min(1, "ترتیب نمایش را وارد کنید.")
    .transform((value, ctx) => {
      const number = Number(value);

      if (!Number.isInteger(number)) {
        ctx.addIssue({
          code: "custom",
          message: "ترتیب نمایش باید عدد صحیح باشد.",
        });

        return z.NEVER;
      }

      if (number < 0 || number > 9999) {
        ctx.addIssue({
          code: "custom",
          message: "ترتیب نمایش باید بین ۰ و ۹۹۹۹ باشد.",
        });

        return z.NEVER;
      }

      return number;
    }),
  image: z
    .string()
    .trim()
    .max(300, "مسیر تصویر نامعتبر است.")
    .refine(
      (value) =>
        value === "" || (value.startsWith("/") && !value.startsWith("//")),
      "مسیر تصویر نامعتبر است."
    ),
});

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  image: true,
  sortOrder: true,
  _count: {
    select: { products: true },
  },
} satisfies Prisma.CategorySelect;

type CategoryRow = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;

function toAdminCategory(row: CategoryRow): AdminCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: row.image,
    sortOrder: row.sortOrder,
    productCount: row._count.products,
  };
}

function toFieldErrors(
  error: z.ZodError
): Partial<Record<CategoryField, string>> {
  const fieldErrors: Partial<Record<CategoryField, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (
      (field === "name" ||
        field === "slug" ||
        field === "sortOrder" ||
        field === "image") &&
      !fieldErrors[field]
    ) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isForeignKeyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}

function revalidateCategoryPaths() {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/categories");
}

/**
 * Admin data functions authorize themselves. The admin layout and the proxy
 * are not security boundaries, so every entry point calls requireAdmin().
 */
export async function listCategories(): Promise<AdminCategory[]> {
  await requireAdmin();

  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: categorySelect,
  });

  return rows.map(toAdminCategory);
}

export async function getCategory(id: string): Promise<AdminCategory | null> {
  await requireAdmin();

  const parsed = idSchema.safeParse(id);

  if (!parsed.success) {
    return null;
  }

  const row = await prisma.category.findUnique({
    where: { id: parsed.data },
    select: categorySelect,
  });

  return row ? toAdminCategory(row) : null;
}

export async function createCategory(
  input: CategoryValues
): Promise<CategoryMutationResult> {
  await requireAdmin();

  const parsed = categoryInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: INVALID_REQUEST,
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const duplicate = await prisma.category.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });

  if (duplicate) {
    return {
      ok: false,
      message: DUPLICATE_SLUG,
      fieldErrors: { slug: DUPLICATE_SLUG },
    };
  }

  try {
    const created = await prisma.category.create({
      data: parsed.data,
      select: { id: true },
    });

    revalidateCategoryPaths();

    return { ok: true, id: created.id };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: DUPLICATE_SLUG,
        fieldErrors: { slug: DUPLICATE_SLUG },
      };
    }

    return { ok: false, message: SAVE_FAILED, fieldErrors: {} };
  }
}

export async function updateCategory(
  id: string,
  input: CategoryValues
): Promise<CategoryMutationResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  const parsed = categoryInputSchema.safeParse(input);

  if (!parsedId.success) {
    return { ok: false, message: INVALID_REQUEST, fieldErrors: {} };
  }

  if (!parsed.success) {
    return {
      ok: false,
      message: INVALID_REQUEST,
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const existing = await prisma.category.findUnique({
    where: { id: parsedId.data },
    select: { id: true },
  });

  if (!existing) {
    return { ok: false, message: CATEGORY_NOT_FOUND, fieldErrors: {} };
  }

  const duplicate = await prisma.category.findFirst({
    where: {
      slug: parsed.data.slug,
      NOT: { id: parsedId.data },
    },
    select: { id: true },
  });

  if (duplicate) {
    return {
      ok: false,
      message: DUPLICATE_SLUG,
      fieldErrors: { slug: DUPLICATE_SLUG },
    };
  }

  try {
    await prisma.category.update({
      where: { id: parsedId.data },
      data: parsed.data,
    });

    revalidateCategoryPaths();

    return { ok: true, id: parsedId.data };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: DUPLICATE_SLUG,
        fieldErrors: { slug: DUPLICATE_SLUG },
      };
    }

    return { ok: false, message: SAVE_FAILED, fieldErrors: {} };
  }
}

export async function deleteCategory(
  id: string
): Promise<CategoryDeleteResult> {
  await requireAdmin();

  const parsed = idSchema.safeParse(id);

  if (!parsed.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data },
    select: {
      id: true,
      image: true,
      _count: { select: { products: true } },
    },
  });

  if (!category) {
    return { ok: false, message: CATEGORY_NOT_FOUND };
  }

  if (category._count.products > 0) {
    return { ok: false, message: CATEGORY_HAS_PRODUCTS };
  }

  try {
    await prisma.category.delete({ where: { id: category.id } });
  } catch (error) {
    if (isForeignKeyError(error)) {
      return { ok: false, message: CATEGORY_HAS_PRODUCTS };
    }

    return { ok: false, message: DELETE_FAILED };
  }

  try {
    await removeStoredImage(category.image);
  } catch {
    // The category is already deleted; a missing or locked file is not fatal.
  }

  revalidateCategoryPaths();

  return { ok: true };
}
