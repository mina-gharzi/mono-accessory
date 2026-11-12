import { cache } from "react";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

export const SESSION_COOKIE = "mono_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const MIN_SECRET_LENGTH = 32;

const authSecret = process.env.AUTH_SECRET;

if (!authSecret || authSecret.length < MIN_SECRET_LENGTH) {
  throw new Error(
    `AUTH_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters long.`
  );
}

const secretKey = new TextEncoder().encode(authSecret);

export type SessionUser = {
  id: string;
  name: string;
  mobile: string;
  role: Role;
  mobileVerifiedAt: Date | null;
};

export async function createSession(
  userId: string,
  role: Role
): Promise<void> {
  const token = await new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey);

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  let userId: string;

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      return null;
    }

    userId = payload.sub;
  } catch {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      mobile: true,
      role: true,
      mobileVerifiedAt: true,
    },
  });
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();

  if (!user) {
    const headerStore = await headers();
    const pathname = headerStore.get("x-pathname") ?? "/account";

    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    notFound();
  }

  return user;
}
