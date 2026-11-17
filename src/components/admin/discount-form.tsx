"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import {
  createDiscountAction,
  updateDiscountAction,
  type DiscountFormState,
} from "@/app/admin/discounts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminDiscount } from "@/server/discounts";
import { FormField } from "./form-field";
import { InlineMessage } from "./inline-message";
import { SubmitButton } from "./submit-button";

type DiscountFormProps = {
  mode: "create" | "edit";
  discount?: AdminDiscount;
};

const typeLabels = {
  PERCENT: "درصدی",
  FIXED: "مبلغ ثابت",
} as const;

export function DiscountForm({ mode, discount }: DiscountFormProps) {
  const codeId = useId();
  const typeId = useId();
  const valueId = useId();
  const minOrderId = useId();
  const maxDiscountAmountId = useId();
  const usageLimitId = useId();
  const expiresAtId = useId();
  const isActiveId = useId();

  const initialState: DiscountFormState = {
    status: "idle",
    message: null,
    fieldErrors: {},
    values: {
      code: discount?.code ?? "",
      type: discount?.type ?? "PERCENT",
      value: discount ? String(discount.value) : "",
      minOrder: discount ? String(discount.minOrder) : "0",
      maxDiscountAmount:
        discount?.maxDiscountAmount != null
          ? String(discount.maxDiscountAmount)
          : "",
      usageLimit:
        discount?.usageLimit != null ? String(discount.usageLimit) : "",
      expiresAt: discount?.expiresAtInput ?? "",
      isActive: discount ? (discount.isActive ? "true" : "") : "true",
    },
  };

  const action =
    mode === "edit" && discount
      ? updateDiscountAction.bind(null, discount.id)
      : createDiscountAction;

  const [state, formAction] = useActionState(action, initialState);
  const [type, setType] = useState(initialState.values.type);

  const isPercent = type === "PERCENT";

  return (
    <form
      action={formAction}
      noValidate
      className="flex max-w-2xl flex-col gap-5 rounded-lg border border-border bg-card p-5 sm:p-6"
    >
      <InlineMessage tone="error" message={state.message} />

      <FormField
        id={codeId}
        label="کد تخفیف"
        error={state.fieldErrors.code}
        hint="۳ تا ۲۰ نویسه؛ فقط حروف انگلیسی و رقم. به حروف بزرگ تبدیل می‌شود."
      >
        {(props) => (
          <Input
            {...props}
            name="code"
            dir="ltr"
            placeholder="SUMMER20"
            defaultValue={state.values.code}
            autoComplete="off"
            required
          />
        )}
      </FormField>

      <FormField
        id={typeId}
        label="نوع تخفیف"
        error={state.fieldErrors.type}
      >
        {(props) => (
          <>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger
                {...props}
                className="h-11 w-full rounded-md border-input bg-card"
              >
                <SelectValue placeholder="نوع تخفیف" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="PERCENT">{typeLabels.PERCENT}</SelectItem>
                <SelectItem value="FIXED">{typeLabels.FIXED}</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="type" value={type} />
          </>
        )}
      </FormField>

      <FormField
        id={valueId}
        label={isPercent ? "درصد تخفیف" : "مبلغ تخفیف (تومان)"}
        error={state.fieldErrors.value}
        hint={
          isPercent
            ? "عدد صحیح بین ۱ تا ۹۰."
            : "مبلغ ثابت به تومان؛ باید بیشتر از صفر باشد."
        }
      >
        {(props) => (
          <Input
            {...props}
            name="value"
            type="number"
            inputMode="numeric"
            dir="ltr"
            min={1}
            max={isPercent ? 90 : 100_000_000}
            step={1}
            defaultValue={state.values.value}
            required
          />
        )}
      </FormField>

      <FormField
        id={minOrderId}
        label="حداقل مبلغ سفارش (تومان)"
        error={state.fieldErrors.minOrder}
        hint="با خالی گذاشتن، حداقلی اعمال نمی‌شود."
      >
        {(props) => (
          <Input
            {...props}
            name="minOrder"
            type="number"
            inputMode="numeric"
            dir="ltr"
            min={0}
            step={1}
            defaultValue={state.values.minOrder}
          />
        )}
      </FormField>

      {isPercent ? (
        <FormField
          id={maxDiscountAmountId}
          label="سقف تخفیف (تومان)"
          error={state.fieldErrors.maxDiscountAmount}
          hint="اختیاری؛ سقف مبلغ تخفیف درصدی را محدود می‌کند."
        >
          {(props) => (
            <Input
              {...props}
              name="maxDiscountAmount"
              type="number"
              inputMode="numeric"
              dir="ltr"
              min={1}
              step={1}
              defaultValue={state.values.maxDiscountAmount}
            />
          )}
        </FormField>
      ) : null}

      <FormField
        id={usageLimitId}
        label="محدودیت تعداد استفاده"
        error={state.fieldErrors.usageLimit}
        hint="اختیاری؛ با خالی گذاشتن، تعداد استفاده محدود نمی‌شود."
      >
        {(props) => (
          <Input
            {...props}
            name="usageLimit"
            type="number"
            inputMode="numeric"
            dir="ltr"
            min={1}
            step={1}
            defaultValue={state.values.usageLimit}
          />
        )}
      </FormField>

      <FormField
        id={expiresAtId}
        label="تاریخ انقضا"
        error={state.fieldErrors.expiresAt}
        hint="اختیاری؛ پایان همان روز به وقت تهران اعمال می‌شود."
      >
        {(props) => (
          <Input
            {...props}
            name="expiresAt"
            type="date"
            dir="ltr"
            defaultValue={state.values.expiresAt}
          />
        )}
      </FormField>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            id={isActiveId}
            name="isActive"
            type="checkbox"
            value="true"
            defaultChecked={state.values.isActive === "true"}
            className="size-4 rounded border-input accent-primary"
          />
          <label htmlFor={isActiveId} className="text-sm font-medium text-dark">
            کد تخفیف فعال باشد
          </label>
        </div>
        {state.fieldErrors.isActive ? (
          <p className="text-xs leading-5 text-destructive">
            {state.fieldErrors.isActive}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
        <SubmitButton>
          {mode === "create" ? "ایجاد کد تخفیف" : "ذخیرهٔ تغییرات"}
        </SubmitButton>
        <Button asChild variant="outline">
          <Link href="/admin/discounts">انصراف</Link>
        </Button>
      </div>
    </form>
  );
}
