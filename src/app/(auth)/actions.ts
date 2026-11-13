"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/safe-redirect";
import {
  loginWithPassword,
  registerWithPassword,
} from "@/server/auth/credentials";
import { mobileSchema } from "@/server/auth/mobile";
import { passwordSchema } from "@/server/auth/password";
import { loginLimiter } from "@/server/auth/rate-limit";
import { createSession, destroySession } from "@/server/auth/session";

export type AuthActionState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: {
    name?: string;
    mobile?: string;
    password?: string;
    confirm?: string;
  };
  values: {
    name: string;
    mobile: string;
  };
};

const loginSchema = z.object({
  mobile: mobileSchema,
  password: z.string().min(1, "رمز عبور را وارد کنید."),
});

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "نام باید حداقل ۲ نویسه باشد.")
      .max(60, "نام نباید بیشتر از ۶۰ نویسه باشد."),
    mobile: mobileSchema,
    password: passwordSchema,
    confirm: z.string().min(1, "تکرار رمز عبور را وارد کنید."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirm) {
      ctx.addIssue({
        code: "custom",
        path: ["confirm"],
        message: "تکرار رمز عبور مطابقت ندارد.",
      });
    }
  });

const GENERIC_LOGIN_ERROR = "شماره موبایل یا رمز عبور اشتباه است.";
const LIMIT_ERROR =
  "تلاش‌های ناموفق زیاد است. لطفاً ۱۵ دقیقه بعد دوباره تلاش کنید.";
const UNEXPECTED_ERROR = "خطایی رخ داد. لطفاً دوباره تلاش کنید.";

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function readNext(formData: FormData): string {
  return safeNextPath(readField(formData, "next"));
}

function getFieldErrors(
  error: z.ZodError
): AuthActionState["fieldErrors"] {
  const fieldErrors: AuthActionState["fieldErrors"] = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (
      (field === "name" ||
        field === "mobile" ||
        field === "password" ||
        field === "confirm") &&
      !fieldErrors[field]
    ) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

function getErrorState(
  error: z.ZodError,
  values: AuthActionState["values"],
  message = "لطفاً خطاهای فرم را بررسی کنید."
): AuthActionState {
  return {
    status: "error",
    message,
    fieldErrors: getFieldErrors(error),
    values,
  };
}

async function getClientIp(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");

  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();

    if (first) {
      return first;
    }
  }

  return headerStore.get("x-real-ip") ?? "unknown";
}

export async function register(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const values = {
    name: readField(formData, "name"),
    mobile: readField(formData, "mobile"),
  };

  const result = registerSchema.safeParse({
    name: values.name,
    mobile: values.mobile,
    password: readField(formData, "password"),
    confirm: readField(formData, "confirm"),
  });

  if (!result.success) {
    return getErrorState(result.error, values);
  }

  let registered: Awaited<ReturnType<typeof registerWithPassword>>;

  try {
    registered = await registerWithPassword({
      name: result.data.name,
      mobile: result.data.mobile,
      password: result.data.password,
    });
  } catch {
    return {
      status: "error",
      message: UNEXPECTED_ERROR,
      fieldErrors: {},
      values,
    };
  }

  if (!registered.ok) {
    return {
      status: "error",
      message:
        "این شماره موبایل قبلاً ثبت شده است. وارد شوید یا شمارهٔ دیگری استفاده کنید.",
      fieldErrors: {
        mobile: "این شماره موبایل قبلاً ثبت شده است.",
      },
      values,
    };
  }

  await createSession(registered.user.id, registered.user.role);
  revalidatePath("/", "layout");
  redirect(readNext(formData));
}

export async function login(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const values = {
    name: "",
    mobile: readField(formData, "mobile"),
  };

  const result = loginSchema.safeParse({
    mobile: values.mobile,
    password: readField(formData, "password"),
  });

  if (!result.success) {
    return getErrorState(result.error, values);
  }

  const ipKey = `ip:${await getClientIp()}`;
  const mobileKey = `mobile:${result.data.mobile}`;
  const ipLimit = loginLimiter.check(ipKey);
  const mobileLimit = loginLimiter.check(mobileKey);

  if (!ipLimit.allowed || !mobileLimit.allowed) {
    return {
      status: "error",
      message: LIMIT_ERROR,
      fieldErrors: {},
      values,
    };
  }

  let user: Awaited<ReturnType<typeof loginWithPassword>>;

  try {
    user = await loginWithPassword({
      mobile: result.data.mobile,
      password: result.data.password,
    });
  } catch {
    return {
      status: "error",
      message: UNEXPECTED_ERROR,
      fieldErrors: {},
      values,
    };
  }

  if (!user) {
    loginLimiter.recordFailure(ipKey);
    loginLimiter.recordFailure(mobileKey);

    return {
      status: "error",
      message: GENERIC_LOGIN_ERROR,
      fieldErrors: {},
      values,
    };
  }

  loginLimiter.clear(ipKey);
  loginLimiter.clear(mobileKey);
  await createSession(user.id, user.role);
  revalidatePath("/", "layout");
  redirect(readNext(formData));
}

export async function logout(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}
