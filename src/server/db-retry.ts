import { Prisma } from "../generated/prisma/client";

const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [150, 400];

const CONNECTION_ERROR_CODES = new Set(["P1001", "P1002", "P1017"]);

const CONNECTION_ERROR_PATTERNS = [/connection terminated/i];

const MAX_CAUSE_DEPTH = 5;

export function isRetryableConnectionError(error: unknown): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth += 1) {
    if (!current) return false;

    if (
      current instanceof Prisma.PrismaClientKnownRequestError &&
      CONNECTION_ERROR_CODES.has(current.code)
    ) {
      return true;
    }

    if (!(current instanceof Error)) return false;

    const error = current;

    if (
      CONNECTION_ERROR_PATTERNS.some((pattern) => pattern.test(error.message))
    ) {
      return true;
    }

    current = error.cause;
  }

  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an idempotent read when the database connection drops.
 * Never use this for writes, transactions, carts, orders, auth or admin
 * mutations. The original error is rethrown once the retries are exhausted.
 */
export async function withReadRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= MAX_RETRIES || !isRetryableConnectionError(error)) {
        throw error;
      }

      console.warn(
        `[db] read failed with a connection error, retry ${attempt + 1}/${MAX_RETRIES}`
      );

      await delay(RETRY_DELAYS_MS[attempt] ?? 400);
    }
  }
}
