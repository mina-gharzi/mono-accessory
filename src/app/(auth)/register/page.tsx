import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/safe-redirect";
import { getSession } from "@/server/auth/session";
import { RegisterForm } from "./register-form";

export const instant = false;

export const metadata: Metadata = {
  title: "ثبت‌نام | مونو اکسسوری",
  description: "ساخت حساب کاربری در مونو اکسسوری.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RegisterPage({
  searchParams,
}: PageProps<"/register">) {
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
          ساخت حساب
        </h1>
        <p className="text-sm leading-7 text-muted-foreground">
          با شماره موبایل و رمز عبور حساب بسازید و خریدهای خود را پیگیری کنید.
        </p>
      </header>
      <RegisterForm next={next} />
    </div>
  );
}
