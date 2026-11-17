import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { DiscountType } from "@/generated/prisma/client";
import { formatPrice } from "@/lib/format";
import { toEnglishDigits } from "./auth/mobile";
import { requireAdmin } from "./auth/session";
import { prisma } from "./db";
import { normalizeSearchTerm } from "./products";

export const ADMIN_DISCOUNTS_PAGE_SIZE = 15;

const INVALID_REQUEST = "درخواست نامعتبر است.";
const DISCOUNT_NOT_FOUND = "کد تخفیف پیدا نشد.";
const DISCOUNT_INACTIVE = "این کد تخفیف غیرفعال است.";
const DISCOUNT_EXPIRED = "این کد تخفیف منقضی شده است.";
const DISCOUNT_USAGE_LIMIT =
  "ظرفیت استفاده از این کد تخفیف تکمیل شده است.";
const DISCOUNT_INVALID_VALUE = "این کد تخفیف معتبر نیست.";
const DUPLICATE_CODE = "این کد تخفیف قبلاً ثبت شده است. کد دیگری انتخاب کنید.";
const CODE_LOCKED =
  "این کد تخفیف استفاده شده است و کد آن قابل تغییر نیست؛ برای کد جدید یک تخفیف تازه بسازید.";
const SAVE_FAILED = "ذخیرهٔ کد تخفیف ناموفق بود. لطفاً دوباره تلاش کنید.";
const DELETE_FAILED = "حذف کد تخفیف ناموفق بود. لطفاً دوباره تلاش کنید.";
const DISCOUNT_IN_USE =
  "این کد تخفیف در سفارش‌ها استفاده شده است و قابل حذف نیست؛ می‌توانید آن را غیرفعال کنید.";

/* -------------------------------------------------------------------------- */
/* Pure rules                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Codes are stored and compared in one canonical form: trimmed, uppercase and
 * with Persian/Arabic digits converted to English digits.
 */
export function normalizeCode(value: string): string {
  return toEnglishDigits(value).trim().toUpperCase();
}

export type DiscountRule = {
  type: DiscountType;
  value: number;
  maxDiscountAmount: number | null;
};

export type DiscountCalculation =
  | { ok: true; amount: number }
  | { ok: false; message: string };

function safeSubtotal(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export function calculateDiscount(
  discount: DiscountRule,
  subtotal: number
): DiscountCalculation {
  const safeTotal = safeSubtotal(subtotal);

  if (discount.type === "PERCENT") {
    if (
      !Number.isInteger(discount.value) ||
      discount.value < 1 ||
      discount.value > 90
    ) {
      return {
        ok: false,
        message: "درصد تخفیف باید بین ۱ تا ۹۰ باشد.",
      };
    }

    let amount = Math.floor((safeTotal * discount.value) / 100);

    if (
      discount.maxDiscountAmount !== null &&
      discount.maxDiscountAmount > 0
    ) {
      amount = Math.min(amount, Math.trunc(discount.maxDiscountAmount));
    }

    return { ok: true, amount: Math.min(amount, safeTotal) };
  }

  if (!Number.isInteger(discount.value) || discount.value <= 0) {
    return {
      ok: false,
      message: "مبلغ تخفیف باید بیشتر از صفر باشد.",
    };
  }

  return { ok: true, amount: Math.min(Math.trunc(discount.value), safeTotal) };
}

/* -------------------------------------------------------------------------- */
/* Database validation                                                        */
/* -------------------------------------------------------------------------- */

export type ValidatedDiscount = {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  amount: number;
};

export type DiscountValidation =
  | { ok: true; discount: ValidatedDiscount }
  | { ok: false; message: string };

type DiscountReader = Pick<Prisma.TransactionClient, "discount">;

const discountRuleSelect = {
  id: true,
  code: true,
  type: true,
  value: true,
  minOrder: true,
  maxDiscountAmount: true,
  usageLimit: true,
  usedCount: true,
  expiresAt: true,
  isActive: true,
} satisfies Prisma.DiscountSelect;

type DiscountRuleRow = Prisma.DiscountGetPayload<{
  select: typeof discountRuleSelect;
}>;

function validateRow(
  row: DiscountRuleRow,
  subtotal: number,
  now: Date
): DiscountValidation {
  if (!row.isActive) {
    return { ok: false, message: DISCOUNT_INACTIVE };
  }

  if (row.expiresAt && row.expiresAt.getTime() < now.getTime()) {
    return { ok: false, message: DISCOUNT_EXPIRED };
  }

  if (row.minOrder > subtotal) {
    return {
      ok: false,
      message: `حداقل مبلغ سفارش برای استفاده از این کد ${formatPrice(
        row.minOrder
      )} است؛ ${formatPrice(
        row.minOrder - subtotal
      )} دیگر به سبد خرید اضافه کنید.`,
    };
  }

  if (row.usageLimit !== null && row.usedCount >= row.usageLimit) {
    return { ok: false, message: DISCOUNT_USAGE_LIMIT };
  }

  const calculated = calculateDiscount(row, subtotal);

  if (!calculated.ok) {
    return { ok: false, message: DISCOUNT_INVALID_VALUE };
  }

  return {
    ok: true,
    discount: {
      id: row.id,
      code: row.code,
      type: row.type,
      value: row.value,
      maxDiscountAmount: row.maxDiscountAmount,
      usageLimit: row.usageLimit,
      usedCount: row.usedCount,
      amount: calculated.amount,
    },
  };
}

/**
 * Shared by the checkout preview and the order transaction. The caller passes
 * the transaction client when the check must see uncommitted stock changes.
 */
export async function findDiscountForSubtotal(
  client: DiscountReader,
  code: string,
  subtotal: number,
  now = new Date()
): Promise<DiscountValidation> {
  const parsed = z.string().trim().max(40).safeParse(code);

  if (!parsed.success) {
    return { ok: false, message: DISCOUNT_NOT_FOUND };
  }

  const normalized = normalizeCode(parsed.data);

  if (!normalized) {
    return { ok: false, message: DISCOUNT_NOT_FOUND };
  }

  const row = await client.discount.findUnique({
    where: { code: normalized },
    select: discountRuleSelect,
  });

  if (!row) {
    return { ok: false, message: DISCOUNT_NOT_FOUND };
  }

  return validateRow(row, safeSubtotal(subtotal), now);
}

export async function validateDiscountForSubtotal(
  code: string,
  subtotal: number,
  now = new Date()
): Promise<DiscountValidation> {
  return findDiscountForSubtotal(prisma, code, subtotal, now);
}

export { DISCOUNT_USAGE_LIMIT };

/* -------------------------------------------------------------------------- */
/* Admin queries                                                              */
/* -------------------------------------------------------------------------- */

const discountListQuerySchema = z.object({
  q: z.string().trim().max(40).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).optional().catch(undefined),
});

export type AdminDiscountsQuery = {
  q: string | null;
  page: number;
};

export type AdminDiscountsSearchParams = Record<
  string,
  string | string[] | undefined
>;

export function parseAdminDiscountsQuery(
  raw: AdminDiscountsSearchParams
): AdminDiscountsQuery {
  const parsed = discountListQuerySchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};

  return {
    q: data.q ? normalizeSearchTerm(data.q) || null : null,
    page: data.page ?? 1,
  };
}

export function buildAdminDiscountsHref(
  query: AdminDiscountsQuery,
  overrides: Partial<AdminDiscountsQuery> = {}
): string {
  const next = { ...query, ...overrides };

  if (!("page" in overrides)) {
    next.page = 1;
  }

  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.page > 1) params.set("page", String(next.page));

  const search = params.toString();
  return search ? `/admin/discounts?${search}` : "/admin/discounts";
}

export type DiscountStatus = "active" | "inactive" | "expired" | "exhausted";

export function getDiscountStatus(
  discount: {
    isActive: boolean;
    expiresAt: Date | null;
    usageLimit: number | null;
    usedCount: number;
  },
  now = new Date()
): DiscountStatus {
  if (!discount.isActive) return "inactive";
  if (discount.expiresAt && discount.expiresAt.getTime() < now.getTime()) {
    return "expired";
  }
  if (
    discount.usageLimit !== null &&
    discount.usedCount >= discount.usageLimit
  ) {
    return "exhausted";
  }

  return "active";
}

export type AdminDiscount = {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minOrder: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: Date | null;
  expiresAtInput: string;
  isActive: boolean;
  orderCount: number;
  status: DiscountStatus;
};

export type AdminDiscountsResult = {
  items: AdminDiscount[];
  total: number;
  totalPages: number;
  page: number;
};

const adminDiscountSelect = {
  id: true,
  code: true,
  type: true,
  value: true,
  minOrder: true,
  maxDiscountAmount: true,
  usageLimit: true,
  usedCount: true,
  expiresAt: true,
  isActive: true,
} satisfies Prisma.DiscountSelect;

type AdminDiscountRow = Prisma.DiscountGetPayload<{
  select: typeof adminDiscountSelect;
}>;

const tehranDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tehran",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toTehranDateInput(value: Date): string {
  return tehranDateFormatter.format(value);
}

function toAdminDiscount(
  row: AdminDiscountRow,
  orderCount: number,
  now = new Date()
): AdminDiscount {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value,
    minOrder: row.minOrder,
    maxDiscountAmount: row.maxDiscountAmount,
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
    expiresAt: row.expiresAt,
    expiresAtInput: row.expiresAt ? toTehranDateInput(row.expiresAt) : "",
    isActive: row.isActive,
    orderCount,
    status: getDiscountStatus(row, now),
  };
}

async function countOrdersByCode(
  codes: string[]
): Promise<Map<string, number>> {
  if (codes.length === 0) {
    return new Map();
  }

  const grouped = await prisma.order.groupBy({
    by: ["discountCode"],
    where: { discountCode: { in: codes } },
    _count: { _all: true },
  });

  return new Map(
    grouped
      .filter(
        (row): row is typeof row & { discountCode: string } =>
          typeof row.discountCode === "string"
      )
      .map((row) => [row.discountCode, row._count._all])
  );
}

export async function listAdminDiscounts(
  query: AdminDiscountsQuery
): Promise<AdminDiscountsResult> {
  await requireAdmin();

  const where: Prisma.DiscountWhereInput = {};

  if (query.q) {
    where.code = { contains: query.q.toUpperCase(), mode: "insensitive" };
  }

  const total = await prisma.discount.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_DISCOUNTS_PAGE_SIZE));
  const page = Math.min(query.page, totalPages);

  const rows = await prisma.discount.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * ADMIN_DISCOUNTS_PAGE_SIZE,
    take: ADMIN_DISCOUNTS_PAGE_SIZE,
    select: adminDiscountSelect,
  });

  const orderCounts = await countOrdersByCode(rows.map((row) => row.code));
  const now = new Date();

  return {
    items: rows.map((row) =>
      toAdminDiscount(row, orderCounts.get(row.code) ?? 0, now)
    ),
    total,
    totalPages,
    page,
  };
}

export async function getDiscount(
  id: string
): Promise<AdminDiscount | null> {
  await requireAdmin();

  const parsed = z.string().trim().min(1).max(64).safeParse(id);

  if (!parsed.success) {
    return null;
  }

  const row = await prisma.discount.findUnique({
    where: { id: parsed.data },
    select: adminDiscountSelect,
  });

  if (!row) {
    return null;
  }

  const orderCounts = await countOrdersByCode([row.code]);

  return toAdminDiscount(row, orderCounts.get(row.code) ?? 0);
}

/* -------------------------------------------------------------------------- */
/* Admin mutations                                                            */
/* -------------------------------------------------------------------------- */

export type DiscountField =
  | "code"
  | "type"
  | "value"
  | "minOrder"
  | "maxDiscountAmount"
  | "usageLimit"
  | "expiresAt"
  | "isActive";

export type DiscountValues = {
  code: string;
  type: string;
  value: string;
  minOrder: string;
  maxDiscountAmount: string;
  usageLimit: string;
  expiresAt: string;
  isActive: string;
};

export type DiscountMutationResult =
  | { ok: true; id: string }
  | {
      ok: false;
      message: string;
      fieldErrors: Partial<Record<DiscountField, string>>;
    };

export type DiscountDeleteResult =
  | { ok: true }
  | { ok: false; message: string };

export type DiscountActiveResult =
  | { ok: true }
  | { ok: false; message: string };

function integerField({
  required,
  min,
  max,
  requiredMessage,
  invalidMessage,
  rangeMessage,
}: {
  required: boolean;
  min: number;
  max: number;
  requiredMessage: string;
  invalidMessage: string;
  rangeMessage: string;
}) {
  return z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") {
        if (required) {
          ctx.addIssue({ code: "custom", message: requiredMessage });
          return z.NEVER;
        }

        return null;
      }

      const digits = toEnglishDigits(value);

      if (!/^\d+$/.test(digits)) {
        ctx.addIssue({ code: "custom", message: invalidMessage });
        return z.NEVER;
      }

      const number = Number(digits);

      if (!Number.isSafeInteger(number) || number < min || number > max) {
        ctx.addIssue({ code: "custom", message: rangeMessage });
        return z.NEVER;
      }

      return number;
    });
}

function parseTehranEndOfDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T23:59:59.999+03:30`);

  if (Number.isNaN(date.getTime()) || toTehranDateInput(date) !== value) {
    return null;
  }

  return date;
}

const discountInputSchema = z
  .object({
    code: z
      .string()
      .transform((value) => normalizeCode(value))
      .pipe(
        z
          .string()
          .min(3, "کد تخفیف باید حداقل ۳ نویسه باشد.")
          .max(20, "کد تخفیف نباید بیشتر از ۲۰ نویسه باشد.")
          .regex(
            /^[A-Z0-9]+$/,
            "کد تخفیف فقط می‌تواند شامل حروف انگلیسی و رقم باشد."
          )
      ),
    type: z.enum(["PERCENT", "FIXED"], {
      message: "نوع تخفیف را انتخاب کنید.",
    }),
    value: integerField({
      required: true,
      min: 1,
      max: 100_000_000,
      requiredMessage: "مقدار تخفیف را وارد کنید.",
      invalidMessage: "مقدار تخفیف باید عدد صحیح باشد.",
      rangeMessage: "مقدار تخفیف معتبر نیست.",
    }),
    minOrder: integerField({
      required: false,
      min: 0,
      max: 100_000_000,
      requiredMessage: "حداقل مبلغ سفارش را وارد کنید.",
      invalidMessage: "حداقل مبلغ سفارش باید عدد صحیح باشد.",
      rangeMessage: "حداقل مبلغ سفارش معتبر نیست.",
    }),
    maxDiscountAmount: integerField({
      required: false,
      min: 1,
      max: 100_000_000,
      requiredMessage: "سقف تخفیف را وارد کنید.",
      invalidMessage: "سقف تخفیف باید عدد صحیح باشد.",
      rangeMessage: "سقف تخفیف معتبر نیست.",
    }),
    usageLimit: integerField({
      required: false,
      min: 1,
      max: 1_000_000,
      requiredMessage: "محدودیت استفاده را وارد کنید.",
      invalidMessage: "محدودیت استفاده باید عدد صحیح باشد.",
      rangeMessage: "محدودیت استفاده معتبر نیست.",
    }),
    expiresAt: z
      .string()
      .trim()
      .transform((value, ctx) => {
        if (value === "") {
          return null;
        }

        const date = parseTehranEndOfDay(value);

        if (!date) {
          ctx.addIssue({ code: "custom", message: "تاریخ انقضا معتبر نیست." });
          return z.NEVER;
        }

        return date;
      }),
    isActive: z
      .string()
      .optional()
      .transform((value) => value === "true" || value === "on"),
  })
  .superRefine((data, ctx) => {
    if (
      data.type === "PERCENT" &&
      (data.value === null || data.value < 1 || data.value > 90)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "درصد تخفیف باید بین ۱ تا ۹۰ باشد.",
      });
    }

    if (data.type === "FIXED" && data.maxDiscountAmount !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["maxDiscountAmount"],
        message: "سقف تخفیف فقط برای تخفیف درصدی است.",
      });
    }
  });

type ParsedDiscountInput = z.output<typeof discountInputSchema>;

function toFieldErrors(
  error: z.ZodError
): Partial<Record<DiscountField, string>> {
  const fieldErrors: Partial<Record<DiscountField, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (
      (field === "code" ||
        field === "type" ||
        field === "value" ||
        field === "minOrder" ||
        field === "maxDiscountAmount" ||
        field === "usageLimit" ||
        field === "expiresAt" ||
        field === "isActive") &&
      !fieldErrors[field]
    ) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

function toCreateData(
  input: ParsedDiscountInput
): Prisma.DiscountCreateInput {
  return {
    code: input.code,
    type: input.type,
    value: input.value as number,
    minOrder: input.minOrder ?? 0,
    maxDiscountAmount:
      input.type === "PERCENT" ? input.maxDiscountAmount : null,
    usageLimit: input.usageLimit,
    expiresAt: input.expiresAt,
    isActive: input.isActive,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function revalidateDiscountPaths() {
  revalidatePath("/admin/discounts");
}

export async function createDiscount(
  input: DiscountValues
): Promise<DiscountMutationResult> {
  await requireAdmin();

  const parsed = discountInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: INVALID_REQUEST,
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const duplicate = await prisma.discount.findUnique({
    where: { code: parsed.data.code },
    select: { id: true },
  });

  if (duplicate) {
    return {
      ok: false,
      message: DUPLICATE_CODE,
      fieldErrors: { code: DUPLICATE_CODE },
    };
  }

  try {
    const created = await prisma.discount.create({
      data: toCreateData(parsed.data),
      select: { id: true },
    });

    revalidateDiscountPaths();

    return { ok: true, id: created.id };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: DUPLICATE_CODE,
        fieldErrors: { code: DUPLICATE_CODE },
      };
    }

    return { ok: false, message: SAVE_FAILED, fieldErrors: {} };
  }
}

export async function updateDiscount(
  id: string,
  input: DiscountValues
): Promise<DiscountMutationResult> {
  await requireAdmin();

  const parsedId = z.string().trim().min(1).max(64).safeParse(id);
  const parsed = discountInputSchema.safeParse(input);

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

  const existing = await prisma.discount.findUnique({
    where: { id: parsedId.data },
    select: { id: true, code: true, usedCount: true },
  });

  if (!existing) {
    return { ok: false, message: DISCOUNT_NOT_FOUND, fieldErrors: {} };
  }

  if (existing.usedCount > 0 && parsed.data.code !== existing.code) {
    return {
      ok: false,
      message: CODE_LOCKED,
      fieldErrors: { code: CODE_LOCKED },
    };
  }

  const duplicate = await prisma.discount.findFirst({
    where: {
      code: parsed.data.code,
      NOT: { id: parsedId.data },
    },
    select: { id: true },
  });

  if (duplicate) {
    return {
      ok: false,
      message: DUPLICATE_CODE,
      fieldErrors: { code: DUPLICATE_CODE },
    };
  }

  try {
    await prisma.discount.update({
      where: { id: parsedId.data },
      data: toCreateData(parsed.data),
    });

    revalidateDiscountPaths();

    return { ok: true, id: parsedId.data };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: DUPLICATE_CODE,
        fieldErrors: { code: DUPLICATE_CODE },
      };
    }

    return { ok: false, message: SAVE_FAILED, fieldErrors: {} };
  }
}

export async function deleteDiscount(
  id: string
): Promise<DiscountDeleteResult> {
  await requireAdmin();

  const parsed = z.string().trim().min(1).max(64).safeParse(id);

  if (!parsed.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  const discount = await prisma.discount.findUnique({
    where: { id: parsed.data },
    select: { id: true, code: true, usedCount: true },
  });

  if (!discount) {
    return { ok: false, message: DISCOUNT_NOT_FOUND };
  }

  if (discount.usedCount > 0) {
    return { ok: false, message: DISCOUNT_IN_USE };
  }

  const orderCount = await prisma.order.count({
    where: { discountCode: discount.code },
  });

  if (orderCount > 0) {
    return { ok: false, message: DISCOUNT_IN_USE };
  }

  try {
    await prisma.discount.delete({ where: { id: discount.id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false, message: DISCOUNT_IN_USE };
    }

    return { ok: false, message: DELETE_FAILED };
  }

  revalidateDiscountPaths();

  return { ok: true };
}

export async function setDiscountActive(
  id: string,
  isActive: boolean
): Promise<DiscountActiveResult> {
  await requireAdmin();

  const parsed = z
    .object({
      id: z.string().trim().min(1).max(64),
      isActive: z.boolean(),
    })
    .safeParse({ id, isActive });

  if (!parsed.success) {
    return { ok: false, message: INVALID_REQUEST };
  }

  const updated = await prisma.discount.updateMany({
    where: { id: parsed.data.id },
    data: { isActive: parsed.data.isActive },
  });

  if (updated.count === 0) {
    return { ok: false, message: DISCOUNT_NOT_FOUND };
  }

  revalidateDiscountPaths();

  return { ok: true };
}
