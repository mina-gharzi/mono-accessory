"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from "@/app/admin/products/actions";
import type {
  AdminProductDetail,
  ProductFormOptions,
} from "@/server/admin-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FormField } from "./form-field";
import { ImageUploader } from "./image-uploader";
import { InlineMessage } from "./inline-message";
import { SubmitButton } from "./submit-button";

type ProductFormProps = {
  mode: "create" | "edit";
  options: ProductFormOptions;
  product?: AdminProductDetail;
};

type VariantRow = {
  key: string;
  id: string | null;
  color: string;
  model: string;
  sku: string;
  stock: string;
};

type SpecRow = {
  key: string;
  specKey: string;
  value: string;
};

function createRowKey(): string {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function initialVariants(product?: AdminProductDetail): VariantRow[] {
  if (!product || product.variants.length === 0) {
    return [
      {
        key: createRowKey(),
        id: null,
        color: "",
        model: "",
        sku: "",
        stock: "0",
      },
    ];
  }

  return product.variants.map((variant) => ({
    key: createRowKey(),
    id: variant.id,
    color: variant.color,
    model: variant.model ?? "",
    sku: variant.sku,
    stock: String(variant.stock),
  }));
}

function initialSpecs(product?: AdminProductDetail): SpecRow[] {
  return (
    product?.specs.map((spec) => ({
      key: createRowKey(),
      specKey: spec.key,
      value: spec.value,
    })) ?? []
  );
}

function stockBadge(stock: string): { label: string; className: string } | null {
  if (stock.trim() === "") return null;

  const value = Number(stock);

  if (!Number.isFinite(value) || value < 0) return null;

  if (value === 0) {
    return {
      label: "ناموجود",
      className: "border-destructive/30 bg-destructive/5 text-destructive",
    };
  }

  if (value <= 5) {
    return {
      label: "کم‌موجود",
      className: "border-amber-500/30 bg-amber-500/10 text-amber-700",
    };
  }

  return {
    label: "موجود",
    className: "border-primary/20 bg-secondary text-primary",
  };
}

const sectionClass =
  "flex flex-col gap-5 rounded-lg border border-border bg-card p-5 sm:p-6";
const sectionTitleClass = "font-heading text-lg font-bold text-dark";

export function ProductForm({ mode, options, product }: ProductFormProps) {
  const baseId = useId();
  const nameId = `${baseId}-name`;
  const slugId = `${baseId}-slug`;
  const descriptionId = `${baseId}-description`;
  const categoryId = `${baseId}-category`;
  const priceId = `${baseId}-price`;
  const compareAtPriceId = `${baseId}-compare-at`;

  const [variants, setVariants] = useState<VariantRow[]>(() =>
    initialVariants(product)
  );
  const [specs, setSpecs] = useState<SpecRow[]>(() => initialSpecs(product));
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [compareAtPrice, setCompareAtPrice] = useState(
    product?.compareAtPrice ? String(product.compareAtPrice) : ""
  );

  const initialState: ProductFormState = {
    status: "idle",
    message: null,
    fieldErrors: {},
    variantErrors: {},
  };

  const action =
    mode === "edit" && product
      ? updateProductAction.bind(null, product.id)
      : createProductAction;

  const [state, formAction] = useActionState(action, initialState);

  const priceNumber = Number(price);
  const compareNumber = Number(compareAtPrice);
  const discountPercent =
    compareAtPrice.trim() !== "" &&
    Number.isFinite(priceNumber) &&
    Number.isFinite(compareNumber) &&
    compareNumber > priceNumber
      ? Math.round((1 - priceNumber / compareNumber) * 100)
      : null;

  function updateVariant(key: string, patch: Partial<VariantRow>) {
    setVariants((current) =>
      current.map((variant) =>
        variant.key === key ? { ...variant, ...patch } : variant
      )
    );
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      {
        key: createRowKey(),
        id: null,
        color: "",
        model: "",
        sku: "",
        stock: "0",
      },
    ]);
  }

  function removeVariant(key: string) {
    setVariants((current) => current.filter((variant) => variant.key !== key));
  }

  function updateSpec(key: string, patch: Partial<SpecRow>) {
    setSpecs((current) =>
      current.map((spec) => (spec.key === key ? { ...spec, ...patch } : spec))
    );
  }

  function addSpec() {
    setSpecs((current) => [
      ...current,
      { key: createRowKey(), specKey: "", value: "" },
    ]);
  }

  function removeSpec(key: string) {
    setSpecs((current) => current.filter((spec) => spec.key !== key));
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <InlineMessage tone="error" message={state.message} />

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>اطلاعات پایه</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id={nameId} label="نام محصول" error={state.fieldErrors.name}>
            {(props) => (
              <Input
                {...props}
                name="name"
                defaultValue={product?.name ?? ""}
                autoComplete="off"
                required
              />
            )}
          </FormField>

          <FormField
            id={slugId}
            label="اسلاگ"
            error={state.fieldErrors.slug}
            hint="فقط حروف کوچک انگلیسی، رقم و خط تیره؛ مثل gold-necklace"
          >
            {(props) => (
              <Input
                {...props}
                name="slug"
                dir="ltr"
                placeholder="gold-necklace"
                defaultValue={product?.slug ?? ""}
                autoComplete="off"
                required
              />
            )}
          </FormField>

          <FormField
            id={descriptionId}
            label="توضیحات"
            error={state.fieldErrors.description}
            className="sm:col-span-2"
          >
            {(props) => (
              <textarea
                {...props}
                name="description"
                defaultValue={product?.description ?? ""}
                rows={5}
                required
                className="min-h-32 w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
              />
            )}
          </FormField>

          <FormField
            id={categoryId}
            label="دسته‌بندی"
            error={state.fieldErrors.categoryId}
          >
            {(props) => (
              <select
                {...props}
                name="categoryId"
                defaultValue={product?.categoryId ?? ""}
                required
                className="h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive"
              >
                <option value="" disabled>
                  انتخاب دسته‌بندی
                </option>
                {options.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <div className="flex flex-col justify-center gap-3 rounded-md border border-border bg-background px-4 py-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                name="isActive"
                value="1"
                defaultChecked={product?.isActive ?? true}
                className="size-4 accent-primary"
              />
              محصول فعال باشد
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                name="isFeatured"
                value="1"
                defaultChecked={product?.isFeatured ?? false}
                className="size-4 accent-primary"
              />
              محصول ویژه باشد
            </label>
            <p className="text-xs leading-5 text-muted-foreground">
              محصول غیرفعال در فروشگاه نمایش داده نمی‌شود.
            </p>
          </div>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-dark">کالکشن‌ها</legend>
          {options.collections.length === 0 ? (
            <p className="text-xs leading-5 text-muted-foreground">
              هنوز کالکشنی تعریف نشده است.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {options.collections.map((collection) => (
                <label
                  key={collection.id}
                  className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    name="collectionIds"
                    value={collection.id}
                    defaultChecked={product?.collectionIds.includes(
                      collection.id
                    )}
                    className="size-4 accent-primary"
                  />
                  {collection.name}
                </label>
              ))}
            </div>
          )}
          {state.fieldErrors.collections ? (
            <p role="alert" className="text-xs leading-5 text-destructive">
              {state.fieldErrors.collections}
            </p>
          ) : null}
        </fieldset>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>قیمت‌گذاری</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id={priceId}
            label="قیمت (تومان)"
            error={state.fieldErrors.price}
            hint="عدد صحیح و بدون اعشار."
          >
            {(props) => (
              <Input
                {...props}
                name="price"
                type="number"
                inputMode="numeric"
                dir="ltr"
                min={0}
                step={1}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
              />
            )}
          </FormField>

          <FormField
            id={compareAtPriceId}
            label="قیمت قبل از تخفیف (اختیاری)"
            error={state.fieldErrors.compareAtPrice}
            hint="در صورت وارد کردن، باید بیشتر از قیمت فعلی باشد."
          >
            {(props) => (
              <Input
                {...props}
                name="compareAtPrice"
                type="number"
                inputMode="numeric"
                dir="ltr"
                min={0}
                step={1}
                value={compareAtPrice}
                onChange={(event) => setCompareAtPrice(event.target.value)}
                placeholder="اختیاری"
              />
            )}
          </FormField>
        </div>

        <div aria-live="polite" aria-atomic="true">
          {discountPercent !== null ? (
            <p
              role="status"
              className="inline-flex items-center rounded-full border border-primary/20 bg-secondary px-3 py-1 text-xs font-medium text-primary"
            >
              تخفیف نمایش‌داده‌شده: {formatNumber(discountPercent)}٪
            </p>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              برای نمایش تخفیف، قیمت قبل از تخفیف را بیشتر از قیمت فعلی وارد
              کنید.
            </p>
          )}
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>تصاویر</h2>
        <ImageUploader
          name="images"
          altName="imageAlt"
          label="تصاویر محصول"
          multiple
          maxFiles={8}
          reorderable
          defaultValue={product?.images ?? []}
          error={state.fieldErrors.images}
        />
        <p className="text-xs leading-5 text-muted-foreground">
          حداکثر ۸ تصویر. اولین تصویر، تصویر اصلی محصول است. با دکمه‌های بالا و
          پایین ترتیب را تغییر دهید.
        </p>
      </section>

      <section className={sectionClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={sectionTitleClass}>واریانت‌ها</h2>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus className="size-4" aria-hidden="true" />
            افزودن واریانت
          </Button>
        </div>

        {state.fieldErrors.variants ? (
          <p role="alert" className="text-xs leading-5 text-destructive">
            {state.fieldErrors.variants}
          </p>
        ) : null}

        {variants.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
            هیچ واریانتی ثبت نشده است. برای فعال بودن محصول حداقل یک واریانت
            لازم است.
          </p>
        ) : null}

        <div className="flex flex-col gap-4">
          {variants.map((variant, index) => {
            const errors = state.variantErrors[index] ?? {};
            const badge = stockBadge(variant.stock);

            return (
              <div
                key={variant.key}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-dark">
                    واریانت {formatNumber(index + 1)}
                  </p>
                  <div className="flex items-center gap-2">
                    {badge ? (
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          badge.className
                        )}
                      >
                        {badge.label}
                      </span>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`حذف واریانت ${index + 1}`}
                      onClick={() => removeVariant(variant.key)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <input
                  type="hidden"
                  name="variantId"
                  value={variant.id ?? ""}
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FormField
                    id={`${baseId}-variant-${index}-color`}
                    label="رنگ"
                    error={errors.color}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        name="variantColor"
                        value={variant.color}
                        onChange={(event) =>
                          updateVariant(variant.key, {
                            color: event.target.value,
                          })
                        }
                        autoComplete="off"
                        required
                      />
                    )}
                  </FormField>

                  <FormField
                    id={`${baseId}-variant-${index}-model`}
                    label="مدل (اختیاری)"
                    error={errors.model}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        name="variantModel"
                        value={variant.model}
                        onChange={(event) =>
                          updateVariant(variant.key, {
                            model: event.target.value,
                          })
                        }
                        autoComplete="off"
                      />
                    )}
                  </FormField>

                  <FormField
                    id={`${baseId}-variant-${index}-sku`}
                    label="SKU"
                    error={errors.sku}
                    hint="خالی بگذارید تا خودکار ساخته شود."
                  >
                    {(props) => (
                      <Input
                        {...props}
                        name="variantSku"
                        dir="ltr"
                        value={variant.sku}
                        onChange={(event) =>
                          updateVariant(variant.key, {
                            sku: event.target.value,
                          })
                        }
                        placeholder="خودکار"
                        autoComplete="off"
                      />
                    )}
                  </FormField>

                  <FormField
                    id={`${baseId}-variant-${index}-stock`}
                    label="موجودی"
                    error={errors.stock}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        name="variantStock"
                        type="number"
                        inputMode="numeric"
                        dir="ltr"
                        min={0}
                        step={1}
                        value={variant.stock}
                        onChange={(event) =>
                          updateVariant(variant.key, {
                            stock: event.target.value,
                          })
                        }
                        required
                      />
                    )}
                  </FormField>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={sectionClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={sectionTitleClass}>مشخصات</h2>
          <Button type="button" variant="outline" size="sm" onClick={addSpec}>
            <Plus className="size-4" aria-hidden="true" />
            افزودن مشخصه
          </Button>
        </div>

        {state.fieldErrors.specs ? (
          <p role="alert" className="text-xs leading-5 text-destructive">
            {state.fieldErrors.specs}
          </p>
        ) : null}

        {specs.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
            مشخصه‌ای ثبت نشده است. می‌توانید مواردی مثل جنس و اندازه را اضافه
            کنید.
          </p>
        ) : null}

        <div className="flex flex-col gap-4">
          {specs.map((spec, index) => (
            <div
              key={spec.key}
              className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-start"
            >
              <FormField
                id={`${baseId}-spec-${index}-key`}
                label="کلید"
                className="flex-1"
              >
                {(props) => (
                  <Input
                    {...props}
                    name="specKey"
                    value={spec.specKey}
                    onChange={(event) =>
                      updateSpec(spec.key, { specKey: event.target.value })
                    }
                    placeholder="مثلاً جنس"
                    autoComplete="off"
                  />
                )}
              </FormField>

              <FormField
                id={`${baseId}-spec-${index}-value`}
                label="مقدار"
                className="flex-1"
              >
                {(props) => (
                  <Input
                    {...props}
                    name="specValue"
                    value={spec.value}
                    onChange={(event) =>
                      updateSpec(spec.key, { value: event.target.value })
                    }
                    placeholder="مثلاً فولاد ضدزنگ"
                    autoComplete="off"
                  />
                )}
              </FormField>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`حذف مشخصه ${index + 1}`}
                onClick={() => removeSpec(spec.key)}
                className="text-destructive hover:text-destructive sm:mt-6"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 border-t border-border bg-background/95 py-4 backdrop-blur">
        <SubmitButton>
          {mode === "create" ? "ایجاد محصول" : "ذخیرهٔ تغییرات"}
        </SubmitButton>
        <Button asChild variant="outline">
          <Link href="/admin/products">انصراف</Link>
        </Button>
        {mode === "edit" && product ? (
          <Button asChild variant="ghost" className="ms-auto">
            <Link href={`/product/${product.slug}`} target="_blank">
              مشاهده در فروشگاه
            </Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
