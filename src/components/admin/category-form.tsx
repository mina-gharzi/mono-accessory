"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryFormState,
} from "@/app/admin/categories/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "./form-field";
import { ImageUploader } from "./image-uploader";
import { InlineMessage } from "./inline-message";
import { SubmitButton } from "./submit-button";

type CategoryFormProps = {
  mode: "create" | "edit";
  category?: {
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
    image: string;
  };
};

export function CategoryForm({ mode, category }: CategoryFormProps) {
  const nameId = useId();
  const slugId = useId();
  const sortOrderId = useId();

  const initialState: CategoryFormState = {
    status: "idle",
    message: null,
    fieldErrors: {},
    values: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      sortOrder: category ? String(category.sortOrder) : "0",
      image: category?.image ?? "",
    },
  };

  const action =
    mode === "edit" && category
      ? updateCategoryAction.bind(null, category.id)
      : createCategoryAction;

  const [state, formAction] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      noValidate
      className="flex max-w-2xl flex-col gap-5 rounded-lg border border-border bg-card p-5 sm:p-6"
    >
      <InlineMessage tone="error" message={state.message} />

      <FormField
        id={nameId}
        label="نام دسته‌بندی"
        error={state.fieldErrors.name}
      >
        {(props) => (
          <Input
            {...props}
            name="name"
            defaultValue={state.values.name}
            autoComplete="off"
            required
          />
        )}
      </FormField>

      <FormField
        id={slugId}
        label="اسلاگ"
        error={state.fieldErrors.slug}
        hint="فقط حروف کوچک انگلیسی، رقم و خط تیره؛ مثل rings"
      >
        {(props) => (
          <Input
            {...props}
            name="slug"
            dir="ltr"
            placeholder="rings"
            defaultValue={state.values.slug}
            autoComplete="off"
            required
          />
        )}
      </FormField>

      <FormField
        id={sortOrderId}
        label="ترتیب نمایش"
        error={state.fieldErrors.sortOrder}
        hint="عدد صحیح؛ عدد کمتر بالاتر نمایش داده می‌شود."
      >
        {(props) => (
          <Input
            {...props}
            name="sortOrder"
            type="number"
            inputMode="numeric"
            dir="ltr"
            min={0}
            max={9999}
            step={1}
            defaultValue={state.values.sortOrder}
            required
          />
        )}
      </FormField>

      <ImageUploader
        name="image"
        label="تصویر دسته‌بندی"
        defaultValue={state.values.image ? [state.values.image] : []}
        error={state.fieldErrors.image}
      />

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
        <SubmitButton>
          {mode === "create" ? "ایجاد دسته‌بندی" : "ذخیرهٔ تغییرات"}
        </SubmitButton>
        <Button asChild variant="outline">
          <Link href="/admin/categories">انصراف</Link>
        </Button>
      </div>
    </form>
  );
}
