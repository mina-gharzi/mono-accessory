"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { register, type AuthActionState } from "../actions";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  values: {
    name: "",
    mobile: "",
  },
};

export function RegisterForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(register, initialState);
  const nameId = useId();
  const mobileId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const nameErrorId = `${nameId}-error`;
  const mobileErrorId = `${mobileId}-error`;
  const passwordErrorId = `${passwordId}-error`;
  const confirmErrorId = `${confirmId}-error`;
  const nameError = state.fieldErrors.name;
  const mobileError = state.fieldErrors.mobile;
  const passwordError = state.fieldErrors.password;
  const confirmError = state.fieldErrors.confirm;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={next} />

      <div aria-live="polite" aria-atomic="true">
        {state.message ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm leading-6 text-destructive">
            {state.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId}>نام و نام خانوادگی</Label>
        <Input
          id={nameId}
          name="name"
          type="text"
          autoComplete="name"
          defaultValue={state.values.name}
          required
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? nameErrorId : undefined}
        />
        {nameError ? (
          <p id={nameErrorId} className="text-xs leading-5 text-destructive">
            {nameError}
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
          aria-describedby={mobileError ? mobileErrorId : undefined}
        />
        {mobileError ? (
          <p id={mobileErrorId} className="text-xs leading-5 text-destructive">
            {mobileError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={passwordId}>رمز عبور</Label>
        <PasswordInput
          id={passwordId}
          name="password"
          autoComplete="new-password"
          required
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? passwordErrorId : undefined}
        />
        {passwordError ? (
          <p
            id={passwordErrorId}
            className="text-xs leading-5 text-destructive"
          >
            {passwordError}
          </p>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">
            حداقل ۸ نویسه، شامل یک حرف و یک عدد.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={confirmId}>تکرار رمز عبور</Label>
        <PasswordInput
          id={confirmId}
          name="confirm"
          autoComplete="new-password"
          required
          aria-invalid={confirmError ? true : undefined}
          aria-describedby={confirmError ? confirmErrorId : undefined}
        />
        {confirmError ? (
          <p
            id={confirmErrorId}
            className="text-xs leading-5 text-destructive"
          >
            {confirmError}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "در حال ایجاد حساب..." : "ایجاد حساب"}
      </Button>

      <p className="text-center text-sm leading-7 text-muted-foreground">
        حساب دارید؟{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          وارد شوید
        </Link>
      </p>
    </form>
  );
}
