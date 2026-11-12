"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { login, type AuthActionState } from "../actions";
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

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);
  const mobileId = useId();
  const passwordId = useId();
  const mobileErrorId = `${mobileId}-error`;
  const passwordErrorId = `${passwordId}-error`;
  const mobileError = state.fieldErrors.mobile;
  const passwordError = state.fieldErrors.password;

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
          autoComplete="current-password"
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
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "در حال ورود..." : "ورود"}
      </Button>

      <p className="text-center text-sm leading-7 text-muted-foreground">
        حساب ندارید؟{" "}
        <Link
          href={`/register?next=${encodeURIComponent(next)}`}
          className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          ثبت‌نام کنید
        </Link>
      </p>
    </form>
  );
}
