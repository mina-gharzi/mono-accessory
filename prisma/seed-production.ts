import "dotenv/config";
import { hash } from "bcryptjs";
import { normalizeMobile } from "../src/server/auth/mobile";
import { prisma } from "../src/server/db";
import {
  isPlaceholderAdminPassword,
  MIN_ADMIN_PASSWORD_LENGTH,
} from "../src/server/env";

const settings = [
  { key: "shippingCost", value: "60000" },
  { key: "freeShippingThreshold", value: "1500000" },
];

function readAdminCredentials(): { mobile: string; password: string } {
  const mobile = normalizeMobile(process.env.ADMIN_MOBILE ?? "");

  if (!mobile) {
    throw new Error(
      "ADMIN_MOBILE must be set to a valid Iranian mobile number."
    );
  }

  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error("ADMIN_PASSWORD must be set.");
  }

  if (password.trim().length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters long.`
    );
  }

  if (isPlaceholderAdminPassword(password)) {
    throw new Error(
      "ADMIN_PASSWORD is an obvious placeholder. Choose a real password."
    );
  }

  return { mobile, password };
}

async function main(): Promise<void> {
  const { mobile, password } = readAdminCredentials();
  const passwordHash = await hash(password, 12);

  await prisma.user.upsert({
    where: { mobile },
    update: {
      passwordHash,
      name: "مدیر مونو",
      role: "ADMIN",
      mobileVerifiedAt: new Date(),
    },
    create: {
      mobile,
      passwordHash,
      name: "مدیر مونو",
      role: "ADMIN",
      mobileVerifiedAt: new Date(),
    },
  });

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log(
    "Production seed complete: admin account and store settings are ready."
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Production seed failed."
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
