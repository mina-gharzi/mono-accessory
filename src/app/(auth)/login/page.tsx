import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/safe-redirect";
import { getSession } from "@/server/auth/session";
import { LoginForm } from "./login-form";

export const instant = false;

export const metadata: Metadata = {
  title: "ورود | مونو اکسسوری",
  description: "ورود به حساب کاربری مونو اکسسوری.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = safeNextPath(nextParam);
  const user = await getSession();

  if (user) {
    redirect(next);
  }

  return (
    <div className="rounded-lg border border-border border-t-2 border-t-primary bg-card p-6 shadow-sm sm:p-8">
      <header className="mb-6 flex flex-col gap-2 text-center">
        <p className="text-[11px] font-medium tracking-[0.35em] text-primary">
          MONO ACCOUNT
        </p>
        <h1 className="font-heading text-2xl font-extrabold text-dark">
          ورود به حساب
        </h1>
        <p className="text-sm leading-7 text-muted-foreground">
          برای پیگیری سفارش‌ها و ذخیرهٔ علاقه‌مندی‌ها وارد شوید.
        </p>
      </header>
      <LoginForm next={next} />
    </div>
  );
}
