"use client";

import { useActionState, useId, useState } from "react";
import {
  placeOrderAction,
  type CheckoutState,
} from "@/app/checkout/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IRAN_PROVINCES } from "@/lib/iran-provinces";
import type { ShippingInput } from "@/server/orders";
import { cn } from "@/lib/utils";

type ShippingFormProps = {
  defaults: ShippingInput;
  className?: string;
};

const textareaClass =
  "flex min-h-24 w-full rounded-md border border-input bg-card px-3.5 py-3 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm";

export function ShippingForm({ defaults, className }: ShippingFormProps) {
  const initialState: CheckoutState = {
    status: "idle",
    message: null,
    fieldErrors: {},
    values: defaults,
  };
  const [state, formAction, pending] = useActionState(
    placeOrderAction,
    initialState
  );
  const [province, setProvince] = useState(defaults.province);

  const recipientNameId = useId();
  const mobileId = useId();
  const provinceId = useId();
  const cityId = useId();
  const addressId = useId();
  const postalCodeId = useId();

  const recipientNameError = state.fieldErrors.recipientName;
  const mobileError = state.fieldErrors.mobile;
  const provinceError = state.fieldErrors.province;
  const cityError = state.fieldErrors.city;
  const addressError = state.fieldErrors.address;
  const postalCodeError = state.fieldErrors.postalCode;

  return (
    <form action={formAction} className={cn("flex flex-col gap-5", className)} noValidate>
      <div aria-live="polite" aria-atomic="true">
        {state.message ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm leading-6 text-destructive"
          >
            {state.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={recipientNameId}>نام گیرنده</Label>
          <Input
            id={recipientNameId}
            name="recipientName"
            type="text"
            autoComplete="name"
            defaultValue={state.values.recipientName}
            required
            aria-invalid={recipientNameError ? true : undefined}
            aria-describedby={
              recipientNameError ? `${recipientNameId}-error` : undefined
            }
          />
          {recipientNameError ? (
            <p
              id={`${recipientNameId}-error`}
              className="text-xs leading-5 text-destructive"
            >
              {recipientNameError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={mobileId}>شماره موبایل</Label>
          <Input
            id={mobileId}
            name="mobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder="09xxxxxxxxx"
            defaultValue={state.values.mobile}
            required
            aria-invalid={mobileError ? true : undefined}
            aria-describedby={mobileError ? `${mobileId}-error` : undefined}
          />
          {mobileError ? (
            <p
              id={`${mobileId}-error`}
              className="text-xs leading-5 text-destructive"
            >
              {mobileError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={provinceId}>استان</Label>
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger
              id={provinceId}
              className="h-11 w-full rounded-md border-input bg-card"
              aria-invalid={provinceError ? true : undefined}
              aria-describedby={
                provinceError ? `${provinceId}-error` : undefined
              }
            >
              <SelectValue placeholder="انتخاب استان" />
            </SelectTrigger>
            <SelectContent position="popper">
              {IRAN_PROVINCES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="province" value={province} />
          {provinceError ? (
            <p
              id={`${provinceId}-error`}
              className="text-xs leading-5 text-destructive"
            >
              {provinceError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={cityId}>شهر</Label>
          <Input
            id={cityId}
            name="city"
            type="text"
            autoComplete="address-level2"
            defaultValue={state.values.city}
            required
            aria-invalid={cityError ? true : undefined}
            aria-describedby={cityError ? `${cityId}-error` : undefined}
          />
          {cityError ? (
            <p
              id={`${cityId}-error`}
              className="text-xs leading-5 text-destructive"
            >
              {cityError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor={addressId}>نشانی</Label>
          <textarea
            id={addressId}
            name="address"
            rows={3}
            autoComplete="street-address"
            defaultValue={state.values.address}
            required
            aria-invalid={addressError ? true : undefined}
            aria-describedby={addressError ? `${addressId}-error` : undefined}
            className={textareaClass}
          />
          {addressError ? (
            <p
              id={`${addressId}-error`}
              className="text-xs leading-5 text-destructive"
            >
              {addressError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={postalCodeId}>کد پستی</Label>
          <Input
            id={postalCodeId}
            name="postalCode"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            dir="ltr"
            placeholder="xxxxxxxxxx"
            defaultValue={state.values.postalCode}
            required
            aria-invalid={postalCodeError ? true : undefined}
            aria-describedby={
              postalCodeError ? `${postalCodeId}-error` : undefined
            }
          />
          {postalCodeError ? (
            <p
              id={`${postalCodeId}-error`}
              className="text-xs leading-5 text-destructive"
            >
              {postalCodeError}
            </p>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              ۱۰ رقم، بدون خط تیره.
            </p>
          )}
        </div>
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "در حال ثبت سفارش..." : "ثبت سفارش و پرداخت"}
      </Button>
    </form>
  );
}
