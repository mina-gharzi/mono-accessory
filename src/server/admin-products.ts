import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "./auth/session";
import { prisma } from "./db";
import { normalizeSearchTerm, toEnglishDigits } from "./products";
import { removeStoredImage } from "./uploads";

export const ADMIN_PRODUCTS_PAGE_SIZE = 15;
export const LOW_STOCK_MAX = 5;

export const ADMIN_PRODUCT_STATUSES = [
  "all",
  "active",
  "inactive",
  "out-of-stock",
  "low-stock",
] as const;

export type AdminProductStatus = (typeof ADMIN_PRODUCT_STATUSES)[number];

const idSchema = z.string().trim().min(1).max(64);

const INVALID_REQUEST = "درخواست نامعتبر است.";
const PRODUCT_NOT_FOUND = "محصول پیدا نشد.";
const DUPLICATE_SLUG =
  "این اسلاگ قبلاً برای محصول دیگری استفاده شده است. اسلاگ دیگری انتخاب کنید.";
const DUPLICATE_SKU = "این SKU قبلاً برای محصول دیگری ثبت شده است.";
const SAVE_FAILED = "ذخیرهٔ محصول ناموفق بود. لطفاً دوباره تلاش کنید.";
const DELETE_FAILED = "حذف محصول ناموفق بود. لطفاً دوباره تلاش کنید.";
const PRODUCT_HAS_ORDERS =
  "این محصول در سفارش‌های ثبت‌شده استفاده شده است و قابل حذف نیست. برای پنهان کردن آن از فروشگاه، محصول را غیرفعال کنید.";
const ACTIVE_NEEDS_VARIANT =
  "برای فعال کردن محصول، حداقل یک واریانت لازم است.";

/* -------------------------------------------------------------------------- */
/* Query params                                                               */
/* -------------------------------------------------------------------------- */

const optionalText = (maxLength: number) =>
  z
    .preprocess(
      (value) => {
        if (typeof value !== "string") return undefined;
        const text = value.trim();
        return text ? text.slice(0, maxLength) : undefined;
      },
      z.string().optional()
    )
    .catch(undefined);

const optionalPage = z
  .preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const number = Number(toEnglishDigits(value).trim());
      return Number.isSafeInteger(number) ? number : undefined;
    },
    z.number().int().min(1).max(1000).optional()
  )
  .catch(undefined);

const adminProductsQuerySchema = z.object({
  q: optionalText(80),
  categoryId: optionalText(64),
  status: z
    .preprocess(
      (value) => (typeof value === "string" ? value : undefined),
      z.enum(ADMIN_PRODUCT_STATUSES).optional()
    )
    .catch(undefined),
  page: optionalPage,
});

export type AdminProductsQuery = {
  q: string | null;
  categoryId: string | null;
  status: AdminProductStatus;
  page: number;
};

export type AdminProductsSearchParams = Record<
  string,
  string | string[] | undefined
>;

export function parseAdminProductsQuery(
  raw: AdminProductsSearchParams
): AdminProductsQuery {
  const parsed = adminProductsQuerySchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};

  return {
    q: data.q ? normalizeSearchTerm(data.q) || null : null,
    categoryId: data.categoryId ?? null,
    status: data.status ?? "all",
    page: data.page ?? 1,
  };
}

export function buildAdminProductsHref(
  query: AdminProductsQuery,
  overrides: Partial<AdminProductsQuery> = {}
): string {
  const next = { ...query, ...overrides };

  if (!("page" in overrides)) {
    next.page = 1;
  }

  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.categoryId) params.set("categoryId", next.categoryId);
  if (next.status !== "all") params.set("status", next.status);
  if (next.page > 1) params.set("page", String(next.page));

  const search = params.toString();
  return search ? `/admin/products?${search}` : "/admin/products";
}

/* -------------------------------------------------------------------------- */
/* List                                                                       */
/* -------------------------------------------------------------------------- */

export type ProductOption = {
  id: string;
  name: string;
};

export type ProductFormOptions = {
  categories: ProductOption[];
  collections: ProductOption[];
};

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  image: { url: string; alt: string } | null;
  category: { id: string; name: string };
  price: number;
  totalStock: number;
  variantCount: number;
  isActive: boolean;
  isFeatured: boolean;
};

export type AdminProductsResult = {
  items: AdminProductListItem[];
  total: number;
  totalPages: number;
  page: number;
};

const adminProductListSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  isActive: true,
  isFeatured: true,
  category: { select: { id: true, name: true } },
  images: {
    orderBy: { sortOrder: "asc" },
    take: 1,
    select: { url: true, alt: true },
  },
  variants: { select: { stock: true } },
} satisfies Prisma.ProductSelect;

type AdminProductListRow = Prisma.ProductGetPayload<{
  select: typeof adminProductListSelect;
}>;

function matchesStatus(
  item: Pick<AdminProductListItem, "isActive" | "totalStock">,
  status: AdminProductStatus
): boolean {
  switch (status) {
    case "active":
      return item.isActive;
    case "inactive":
      return !item.isActive;
    case "out-of-stock":
      return item.totalStock === 0;
    case "low-stock":
      return item.totalStock > 0 && item.totalStock <= LOW_STOCK_MAX;
    default:
      return true;
  }
}

function toAdminProductListItem(
  row: AdminProductListRow
): AdminProductListItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: row.images[0] ?? null,
    category: row.category,
    price: row.price,
    totalStock: row.variants.reduce((total, variant) => total + variant.stock, 0),
    variantCount: row.variants.length,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
  };
}

export async function listAdminProducts(
  query: AdminProductsQuery
): Promise<AdminProductsResult> {
  await requireAdmin();

  const where: Prisma.ProductWhereInput = {};

  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { slug: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.product.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: adminProductListSelect,
  });

  const filtered = rows
    .map(toAdminProductListItem)
    .filter((item) => matchesStatus(item, query.status));

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PRODUCTS_PAGE_SIZE));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * ADMIN_PRODUCTS_PAGE_SIZE;

  return {
    items: filtered.slice(start, start + ADMIN_PRODUCTS_PAGE_SIZE),
    total,
    totalPages,
    page,
  };
}

export async function listProductFormOptions(): Promise<ProductFormOptions> {
  await requireAdmin();

  const [categories, collections] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.collection.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return { categories, collections };
}

/* -------------------------------------------------------------------------- */
/* Detail                                                                     */
/* -------------------------------------------------------------------------- */

export type AdminProductVariant = {
  id: string;
  color: string;
  model: string | null;
  sku: string;
  stock: number;
};

export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  specs: ProductInputSpec[];
  price: number;
  compareAtPrice: number | null;
  categoryId: string;
  category: ProductOption;
  isFeatured: boolean;
  isActive: boolean;
  images: ProductInputImage[];
  variants: AdminProductVariant[];
  collectionIds: string[];
};

const adminProductDetailSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  specs: true,
  price: true,
  compareAtPrice: true,
  categoryId: true,
  category: { select: { id: true, name: true } },
  isFeatured: true,
  isActive: true,
  images: {
    orderBy: { sortOrder: "asc" },
    select: { url: true, alt: true },
  },
  variants: {
    orderBy: [{ color: "asc" }, { model: "asc" }, { sku: "asc" }],
    select: {
      id: true,
      color: true,
      model: true,
      sku: true,
      stock: true,
    },
  },
  collections: { select: { id: true } },
} satisfies Prisma.ProductSelect;

type AdminProductDetailRow = Prisma.ProductGetPayload<{
  select: typeof adminProductDetailSelect;
}>;

const storedSpecsSchema = z.record(z.string(), z.unknown());

function parseStoredSpecs(value: Prisma.JsonValue): ProductInputSpec[] {
  const parsed = storedSpecsSchema.safeParse(value);

  if (!parsed.success) return [];

  return Object.entries(parsed.data)
    .map(([key, rawValue]) => ({
      key: key.trim(),
      value:
        typeof rawValue === "string" ||
        typeof rawValue === "number" ||
        typeof rawValue === "boolean"
          ? String(rawValue).trim()
          : "",
    }))
    .filter((spec) => spec.key.length > 0 && spec.value.length > 0);
}

function toAdminProductDetail(row: AdminProductDetailRow): AdminProductDetail {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    specs: parseStoredSpecs(row.specs),
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    categoryId: row.categoryId,
    category: row.category,
    isFeatured: row.isFeatured,
    isActive: row.isActive,
    images: row.images,
    variants: row.variants,
    collectionIds: row.collections.map((collection) => collection.id),
  };
}

export async function getAdminProduct(
  id: string
): Promise<AdminProductDetail | null> {
  await requireAdmin();

  const parsed = idSchema.safeParse(id);

  if (!parsed.success) return null;

  const row = await prisma.product.findUnique({
    where: { id: parsed.data },
    select: adminProductDetailSelect,
  });

  return row ? toAdminProductDetail(row) : null;
}

/* -------------------------------------------------------------------------- */
/* Input                                                                      */
/* -------------------------------------------------------------------------- */

export type ProductField =
  | "name"
  | "slug"
  | "description"
  | "price"
  | "compareAtPrice"
  | "categoryId"
  | "collections"
  | "images"
  | "variants"
  | "specs";

export type ProductVariantField = "color" | "model" | "sku" | "stock";

export type ProductFieldErrors = Partial<Record<ProductField, string>>;

export type ProductVariantErrors = Record<
  number,
  Partial<Record<ProductVariantField, string>>
>;

export type ProductInputImage = {
  url: string;
  alt: string;
};

export type ProductInputVariant = {
  id: string | null;
  color: string;
  model: string;
  sku: string;
  stock: number;
};

export type ProductInputSpec = {
  key: string;
  value: string;
};

export type ProductInput = {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  collectionIds: string[];
  isFeatured: boolean;
  isActive: boolean;
  price: number;
  compareAtPrice: number | null;
  images: ProductInputImage[];
  variants: ProductInputVariant[];
  specs: ProductInputSpec[];
};

export type ProductMutationResult =
  | { ok: true; id: string }
  | {
      ok: false;
      message: string;
      fieldErrors: ProductFieldErrors;
      variantErrors: ProductVariantErrors;
    };

export type ProductStatusResult =
  | { ok: true }
  | { ok: false; message: string };

export type ProductDeleteResult =
  | { ok: true }
  | { ok: false; message: string };

const slugSchema = z
  .string()
  .trim()
  .min(1, "اسلاگ را وارد کنید.")
  .max(120, "اسلاگ نباید بیشتر از ۱۲۰ نویسه باشد.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "اسلاگ فقط می‌تواند شامل حروف کوچک انگلیسی، رقم و خط تیره باشد."
  );

const productVariantSchema = z.object({
  id: z.string().trim().max(64).nullable(),
  color: z
    .string()
    .trim()
    .min(1, "رنگ واریانت را وارد کنید.")
    .max(40, "رنگ واریانت نباید بیشتر از ۴۰ نویسه باشد."),
  model: z
    .string()
    .trim()
    .max(60, "مدل واریانت نباید بیشتر از ۶۰ نویسه باشد."),
  sku: z.string().trim().max(64, "SKU نباید بیشتر از ۶۴ نویسه باشد."),
  stock: z
    .number({ message: "موجودی باید عدد صحیح باشد." })
    .int("موجودی باید عدد صحیح باشد.")
    .min(0, "موجودی نمی‌تواند منفی باشد.")
    .max(1_000_000, "موجودی بیش از حد مجاز است."),
});

const productInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "نام محصول باید حداقل ۲ نویسه باشد.")
      .max(120, "نام محصول نباید بیشتر از ۱۲۰ نویسه باشد."),
    slug: slugSchema,
    description: z
      .string()
      .trim()
      .min(10, "توضیحات محصول باید حداقل ۱۰ نویسه باشد.")
      .max(5000, "توضیحات محصول نباید بیشتر از ۵۰۰۰ نویسه باشد."),
    categoryId: z
      .string()
      .trim()
      .min(1, "دسته‌بندی را انتخاب کنید.")
      .max(64, "دسته‌بندی نامعتبر است."),
    collectionIds: z
      .array(z.string().trim().min(1).max(64))
      .max(30, "تعداد کالکشن‌های انتخاب‌شده بیش از حد مجاز است."),
    isFeatured: z.boolean(),
    isActive: z.boolean(),
    price: z
      .number({ message: "قیمت باید عدد صحیح باشد." })
      .int("قیمت باید عدد صحیح باشد.")
      .min(0, "قیمت نمی‌تواند منفی باشد.")
      .max(1_000_000_000, "قیمت بیش از حد مجاز است."),
    compareAtPrice: z
      .number({ message: "قیمت قبل از تخفیف باید عدد صحیح باشد." })
      .int("قیمت قبل از تخفیف باید عدد صحیح باشد.")
      .min(0, "قیمت قبل از تخفیف نمی‌تواند منفی باشد.")
      .max(1_000_000_000, "قیمت قبل از تخفیف بیش از حد مجاز است.")
      .nullable(),
    images: z
      .array(
        z.object({
          url: z
            .string()
            .trim()
            .min(1, "آدرس تصویر نامعتبر است.")
            .max(300, "آدرس تصویر نامعتبر است.")
            .refine(
              (value) => value.startsWith("/") && !value.startsWith("//"),
              "آدرس تصویر نامعتبر است."
            ),
          alt: z
            .string()
            .trim()
            .max(160, "متن جایگزین تصویر نباید بیشتر از ۱۶۰ نویسه باشد."),
        })
      )
      .max(8, "حداکثر ۸ تصویر می‌توانید برای محصول ثبت کنید."),
    variants: z
      .array(productVariantSchema)
      .max(100, "تعداد واریانت‌ها بیش از حد مجاز است."),
    specs: z
      .array(
        z.object({
          key: z
            .string()
            .trim()
            .min(1, "کلید مشخصه را وارد کنید.")
            .max(60, "کلید مشخصه نباید بیشتر از ۶۰ نویسه باشد."),
          value: z
            .string()
            .trim()
            .min(1, "مقدار مشخصه را وارد کنید.")
            .max(200, "مقدار مشخصه نباید بیشتر از ۲۰۰ نویسه باشد."),
        })
      )
      .max(30, "تعداد مشخصات بیش از حد مجاز است."),
  })
  .superRefine((value, ctx) => {
    if (
      value.compareAtPrice !== null &&
      value.compareAtPrice <= value.price
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["compareAtPrice"],
        message: "قیمت قبل از تخفیف باید بیشتر از قیمت فعلی باشد.",
      });
    }

    if (value.isActive && value.variants.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["variants"],
        message: ACTIVE_NEEDS_VARIANT,
      });
    }

    const combos = new Map<string, number>();
    const skus = new Map<string, number>();

    value.variants.forEach((variant, index) => {
      const combo = `${variant.color.toLowerCase()}|${variant.model.toLowerCase()}`;
      const comboIndex = combos.get(combo);

      if (comboIndex !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index, "color"],
          message: "این ترکیب رنگ و مدل قبلاً در همین محصول ثبت شده است.",
        });
      } else {
        combos.set(combo, index);
      }

      const sku = variant.sku.toLowerCase();

      if (!sku) return;

      const skuIndex = skus.get(sku);

      if (skuIndex !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index, "sku"],
          message: "این SKU در همین محصول تکراری است.",
        });
      } else {
        skus.set(sku, index);
      }
    });
  });

function emptyVariantErrors(): ProductVariantErrors {
  return {};
}

function failure(
  message: string,
  fieldErrors: ProductFieldErrors = {},
  variantErrors: ProductVariantErrors = emptyVariantErrors()
): ProductMutationResult {
  return { ok: false, message, fieldErrors, variantErrors };
}

function toProductErrors(error: z.ZodError): {
  fieldErrors: ProductFieldErrors;
  variantErrors: ProductVariantErrors;
} {
  const fieldErrors: ProductFieldErrors = {};
  const variantErrors: ProductVariantErrors = {};

  for (const issue of error.issues) {
    const [field, index, variantField] = issue.path;

    if (
      field === "variants" &&
      typeof index === "number" &&
      typeof variantField === "string"
    ) {
      const key = variantField as ProductVariantField;

      if (
        key === "color" ||
        key === "model" ||
        key === "sku" ||
        key === "stock"
      ) {
        variantErrors[index] = {
          ...variantErrors[index],
          [key]: issue.message,
        };
        continue;
      }
    }

    if (typeof field === "string" && !fieldErrors[field as ProductField]) {
      fieldErrors[field as ProductField] = issue.message;
    }
  }

  return { fieldErrors, variantErrors };
}

function toSpecsObject(specs: ProductInputSpec[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (const spec of specs) {
    result[spec.key] = spec.value;
  }

  return result;
}

function randomSkuSuffix(): string {
  return randomUUID().replace(/-/g, "").slice(0, 6);
}

function withGeneratedSkus(
  variants: ProductInputVariant[],
  slug: string
): ProductInputVariant[] {
  const used = new Set(
    variants
      .map((variant) => variant.sku.trim().toLowerCase())
      .filter(Boolean)
  );

  return variants.map((variant) => {
    const sku = variant.sku.trim();

    if (sku) {
      return { ...variant, sku };
    }

    const base = slug.slice(0, 40).replace(/-+$/, "") || "sku";
    let generated = "";

    do {
      generated = `${base}-${randomSkuSuffix()}`;
    } while (used.has(generated.toLowerCase()));

    used.add(generated.toLowerCase());

    return { ...variant, sku: generated };
  });
}

async function findSkuConflicts(
  variants: ProductInputVariant[],
  ownProductId?: string
): Promise<ProductVariantErrors> {
  const skus = variants.map((variant) => variant.sku);

  if (skus.length === 0) return {};

  const existing = await prisma.productVariant.findMany({
    where: {
      sku: { in: skus },
      ...(ownProductId ? { productId: { not: ownProductId } } : {}),
    },
    select: { sku: true },
  });

  if (existing.length === 0) return {};

  const taken = new Set(existing.map((variant) => variant.sku.toLowerCase()));
  const errors: ProductVariantErrors = {};

  variants.forEach((variant, index) => {
    if (taken.has(variant.sku.toLowerCase())) {
      errors[index] = { sku: DUPLICATE_SKU };
    }
  });

  return errors;
}

type PreparedProduct = {
  data: z.infer<typeof productInputSchema>;
  collectionIds: string[];
  collectionSlugs: string[];
};

type PrepareResult =
  | { ok: true; prepared: PreparedProduct }
  | { ok: false; result: ProductMutationResult };

async function prepareProductInput(
  input: ProductInput,
  ownProductId?: string
): Promise<PrepareResult> {
  const parsed = productInputSchema.safeParse(input);

  if (!parsed.success) {
    const { fieldErrors, variantErrors } = toProductErrors(parsed.error);

    return {
      ok: false,
      result: failure(INVALID_REQUEST, fieldErrors, variantErrors),
    };
  }

  const data = {
    ...parsed.data,
    variants: withGeneratedSkus(parsed.data.variants, parsed.data.slug),
  };

  const fieldErrors: ProductFieldErrors = {};
  const variantErrors: ProductVariantErrors = {};

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
    select: { id: true },
  });

  if (!category) {
    fieldErrors.categoryId = "دسته‌بندی انتخاب‌شده معتبر نیست.";
  }

  const collectionIds = [...new Set(data.collectionIds)];
  let collectionSlugs: string[] = [];

  if (collectionIds.length > 0) {
    const collections = await prisma.collection.findMany({
      where: { id: { in: collectionIds } },
      select: { id: true, slug: true },
    });

    if (collections.length !== collectionIds.length) {
      fieldErrors.collections = "یکی از کالکشن‌های انتخاب‌شده معتبر نیست.";
    } else {
      collectionSlugs = collections.map((collection) => collection.slug);
    }
  }

  const duplicateSlug = await prisma.product.findFirst({
    where: {
      slug: data.slug,
      ...(ownProductId ? { NOT: { id: ownProductId } } : {}),
    },
    select: { id: true },
  });

  if (duplicateSlug) {
    fieldErrors.slug = DUPLICATE_SLUG;
  }

  const skuErrors = await findSkuConflicts(data.variants, ownProductId);

  for (const [index, errors] of Object.entries(skuErrors)) {
    variantErrors[Number(index)] = {
      ...variantErrors[Number(index)],
      ...errors,
    };
  }

  if (ownProductId) {
    const existing = await prisma.productVariant.findMany({
      where: { productId: ownProductId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((variant) => variant.id));
    const seenIds = new Set<string>();

    data.variants.forEach((variant, index) => {
      if (!variant.id) return;

      if (!existingIds.has(variant.id) || seenIds.has(variant.id)) {
        variantErrors[index] = {
          ...variantErrors[index],
          sku: "واریانت انتخاب‌شده معتبر نیست.",
        };
      }

      seenIds.add(variant.id);
    });
  }

  if (
    Object.keys(fieldErrors).length > 0 ||
    Object.keys(variantErrors).length > 0
  ) {
    return {
      ok: false,
      result: failure(INVALID_REQUEST, fieldErrors, variantErrors),
    };
  }

  return {
    ok: true,
    prepared: { data, collectionIds, collectionSlugs },
  };
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                  */
/* -------------------------------------------------------------------------- */

function revalidateProductPaths({
  productSlugs,
  collectionSlugs,
}: {
  productSlugs: string[];
  collectionSlugs: string[];
}) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/collections");
  revalidatePath("/admin/products");

  for (const slug of new Set(productSlugs)) {
    revalidatePath(`/product/${slug}`);
  }

  for (const slug of new Set(collectionSlugs)) {
    revalidatePath(`/collections/${slug}`);
  }
}

async function removeUnusedImageFiles(urls: string[]): Promise<void> {
  for (const url of new Set(urls)) {
    if (!url) continue;

    try {
      const [productImages, categories, collections] = await Promise.all([
        prisma.productImage.count({ where: { url } }),
        prisma.category.count({ where: { image: url } }),
        prisma.collection.count({ where: { image: url } }),
      ]);

      if (productImages + categories + collections === 0) {
        await removeStoredImage(url);
      }
    } catch {
      // The database change already succeeded; file cleanup is best effort.
    }
  }
}

function uniqueTarget(error: unknown): string[] {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = error.meta?.target;

    if (Array.isArray(target)) return target.map(String);
    if (typeof target === "string") return [target];
  }

  return [];
}

function isForeignKeyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}

export async function createProduct(
  input: ProductInput
): Promise<ProductMutationResult> {
  await requireAdmin();

  const preparedResult = await prepareProductInput(input);

  if (!preparedResult.ok) return preparedResult.result;

  const { data, collectionIds, collectionSlugs } = preparedResult.prepared;

  try {
    const created = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        specs: toSpecsObject(data.specs),
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        categoryId: data.categoryId,
        isFeatured: data.isFeatured,
        isActive: data.isActive,
        images: {
          create: data.images.map((image, index) => ({
            url: image.url,
            alt: image.alt,
            sortOrder: index,
          })),
        },
        variants: {
          create: data.variants.map((variant) => ({
            color: variant.color,
            model: variant.model || null,
            sku: variant.sku,
            stock: variant.stock,
          })),
        },
        ...(collectionIds.length > 0
          ? { collections: { connect: collectionIds.map((id) => ({ id })) } }
          : {}),
      },
      select: { id: true, slug: true },
    });

    revalidateProductPaths({
      productSlugs: [created.slug],
      collectionSlugs,
    });

    return { ok: true, id: created.id };
  } catch (error) {
    const target = uniqueTarget(error);

    if (target.includes("slug")) {
      return failure(DUPLICATE_SLUG, { slug: DUPLICATE_SLUG });
    }

    if (target.includes("sku")) {
      return failure(
        DUPLICATE_SKU,
        { variants: DUPLICATE_SKU },
        {}
      );
    }

    return failure(SAVE_FAILED);
  }
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<ProductMutationResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);

  if (!parsedId.success) {
    return failure(INVALID_REQUEST);
  }

  const existing = await prisma.product.findUnique({
    where: { id: parsedId.data },
    select: {
      id: true,
      slug: true,
      images: { select: { url: true } },
      variants: { select: { id: true, color: true, model: true } },
      collections: { select: { slug: true } },
    },
  });

  if (!existing) {
    return failure(PRODUCT_NOT_FOUND);
  }

  const preparedResult = await prepareProductInput(input, existing.id);

  if (!preparedResult.ok) return preparedResult.result;

  const { data, collectionIds, collectionSlugs } = preparedResult.prepared;

  const submittedVariantIds = new Set(
    data.variants
      .map((variant) => variant.id)
      .filter((variantId): variantId is string => Boolean(variantId))
  );
  const removedVariants = existing.variants.filter(
    (variant) => !submittedVariantIds.has(variant.id)
  );
  const removedVariantIds = removedVariants.map((variant) => variant.id);

  if (removedVariantIds.length > 0) {
    const referenced = await prisma.orderItem.findMany({
      where: { variantId: { in: removedVariantIds } },
      select: { variantId: true },
      distinct: ["variantId"],
    });

    if (referenced.length > 0) {
      const referencedIds = new Set(referenced.map((item) => item.variantId));
      const labels = removedVariants
        .filter((variant) => referencedIds.has(variant.id))
        .map((variant) =>
          variant.model ? `${variant.color} - ${variant.model}` : variant.color
        );
      const message = `واریانت «${labels.join(
        "، "
      )}» در سفارش‌های ثبت‌شده استفاده شده است و قابل حذف نیست. برای توقف فروش آن، موجودی را صفر کنید.`;

      return failure(message, { variants: message });
    }
  }

  const removedImageUrls = existing.images
    .map((image) => image.url)
    .filter((url) => !data.images.some((image) => image.url === url));

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          specs: toSpecsObject(data.specs),
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          categoryId: data.categoryId,
          isFeatured: data.isFeatured,
          isActive: data.isActive,
          images: {
            deleteMany: {},
            create: data.images.map((image, index) => ({
              url: image.url,
              alt: image.alt,
              sortOrder: index,
            })),
          },
          collections: {
            set: collectionIds.map((collectionId) => ({ id: collectionId })),
          },
        },
      });

      if (removedVariantIds.length > 0) {
        await tx.cartItem.deleteMany({
          where: { variantId: { in: removedVariantIds } },
        });
        await tx.productVariant.deleteMany({
          where: { id: { in: removedVariantIds } },
        });
      }

      for (const variant of data.variants) {
        const values = {
          color: variant.color,
          model: variant.model || null,
          sku: variant.sku,
          stock: variant.stock,
        };

        if (variant.id) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: values,
          });
        } else {
          await tx.productVariant.create({
            data: { ...values, productId: existing.id },
          });
        }
      }
    });
  } catch (error) {
    if (isForeignKeyError(error)) {
      const message =
        "یکی از واریانت‌های حذف‌شده در سفارش‌های ثبت‌شده استفاده شده است. برای توقف فروش آن، موجودی را صفر کنید.";

      return failure(message, { variants: message });
    }

    const target = uniqueTarget(error);

    if (target.includes("slug")) {
      return failure(DUPLICATE_SLUG, { slug: DUPLICATE_SLUG });
    }

    if (target.includes("sku")) {
      return failure(DUPLICATE_SKU, { variants: DUPLICATE_SKU });
    }

    return failure(SAVE_FAILED);
  }

  await removeUnusedImageFiles(removedImageUrls);

  revalidateProductPaths({
    productSlugs: [existing.slug, data.slug],
    collectionSlugs: [
      ...existing.collections.map((collection) => collection.slug),
      ...collectionSlugs,
    ],
  });

  return { ok: true, id: existing.id };
}

export async function setProductActive(
  id: string,
  isActive: boolean
): Promise<ProductStatusResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  const parsedActive = z.boolean().safeParse(isActive);

  if (!parsedId.success || !parsedActive.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsedId.data },
    select: {
      id: true,
      slug: true,
      collections: { select: { slug: true } },
      _count: { select: { variants: true } },
    },
  });

  if (!product) {
    return { ok: false, message: PRODUCT_NOT_FOUND };
  }

  if (parsedActive.data && product._count.variants === 0) {
    return { ok: false, message: ACTIVE_NEEDS_VARIANT };
  }

  try {
    await prisma.product.update({
      where: { id: product.id },
      data: { isActive: parsedActive.data },
    });
  } catch {
    return { ok: false, message: SAVE_FAILED };
  }

  revalidateProductPaths({
    productSlugs: [product.slug],
    collectionSlugs: product.collections.map((collection) => collection.slug),
  });

  return { ok: true };
}

export async function deleteProduct(
  id: string
): Promise<ProductDeleteResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);

  if (!parsedId.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsedId.data },
    select: {
      id: true,
      slug: true,
      images: { select: { url: true } },
      variants: { select: { id: true } },
      collections: { select: { slug: true } },
    },
  });

  if (!product) {
    return { ok: false, message: PRODUCT_NOT_FOUND };
  }

  if (product.variants.length > 0) {
    const orderItems = await prisma.orderItem.count({
      where: {
        variantId: { in: product.variants.map((variant) => variant.id) },
      },
    });

    if (orderItems > 0) {
      return { ok: false, message: PRODUCT_HAS_ORDERS };
    }
  }

  try {
    await prisma.product.delete({ where: { id: product.id } });
  } catch (error) {
    if (isForeignKeyError(error)) {
      return { ok: false, message: PRODUCT_HAS_ORDERS };
    }

    return { ok: false, message: DELETE_FAILED };
  }

  await removeUnusedImageFiles(product.images.map((image) => image.url));

  revalidateProductPaths({
    productSlugs: [product.slug],
    collectionSlugs: product.collections.map((collection) => collection.slug),
  });

  return { ok: true };
}
