import { Prisma, type Role } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { hashPassword, verifyPassword } from "./password";

// A valid bcrypt hash used only to keep login timing similar when the mobile
// number does not exist. The plain value is irrelevant and not used anywhere.
const DUMMY_PASSWORD_HASH =
  "$2b$12$EVY8/sARBByaiibkUd8pOOW7YjsFMriM.5Dzb6e2mP0iJW3JtQoUe";

type CredentialUser = {
  id: string;
  role: Role;
};

export async function registerWithPassword(input: {
  name: string;
  mobile: string;
  password: string;
}): Promise<
  { ok: true; user: CredentialUser } | { ok: false; reason: "duplicate-mobile" }
> {
  const existing = await prisma.user.findUnique({
    where: { mobile: input.mobile },
    select: { id: true },
  });

  if (existing) {
    return { ok: false, reason: "duplicate-mobile" };
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        mobile: input.mobile,
        passwordHash,
      },
      select: {
        id: true,
        role: true,
      },
    });

    return { ok: true, user };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, reason: "duplicate-mobile" };
    }

    throw error;
  }
}

export async function loginWithPassword(input: {
  mobile: string;
  password: string;
}): Promise<CredentialUser | null> {
  const user = await prisma.user.findUnique({
    where: { mobile: input.mobile },
    select: {
      id: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user) {
    await verifyPassword(input.password, DUMMY_PASSWORD_HASH);
    return null;
  }

  const valid = await verifyPassword(input.password, user.passwordHash);

  if (!valid) {
    return null;
  }

  return { id: user.id, role: user.role };
}
