import { compare, hash } from "bcryptjs";
import { z } from "zod";

const BCRYPT_COST = 12;

export const passwordSchema = z
  .string()
  .min(8, "رمز عبور باید حداقل ۸ نویسه باشد.")
  .max(72, "رمز عبور نباید بیشتر از ۷۲ نویسه باشد.")
  .regex(/\p{L}/u, "رمز عبور باید حداقل یک حرف داشته باشد.")
  .regex(/\p{Nd}/u, "رمز عبور باید حداقل یک عدد داشته باشد.");

export function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST);
}

export function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return compare(password, passwordHash);
}
