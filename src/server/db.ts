import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Order transactions touch several rows over multiple statements. Prisma's
// default 5s timeout is tight for a remote database, so give them explicit
// room while still failing quickly.
export const ORDER_TRANSACTION_OPTIONS = {
  maxWait: 10_000,
  timeout: 20_000,
};

const DEFAULT_POOL_MAX = 10;
const CONNECTION_TIMEOUT_MS = 10_000;
const IDLE_TIMEOUT_MS = 30_000;
const QUERY_TIMEOUT_MS = 30_000;
const KEEP_ALIVE_DELAY_MS = 10_000;

function resolvePoolMax(): number {
  const raw = process.env.DB_POOL_MAX?.trim();

  if (!raw) return DEFAULT_POOL_MAX;

  const parsed = Number(raw);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_POOL_MAX;
}

// Idle-client errors are usually transient (the pool discards the dead client
// itself). Log the first one for visibility without flooding the logs or
// crashing the process.
let poolErrorLogged = false;

function handlePoolError(error: Error): void {
  if (poolErrorLogged) return;

  poolErrorLogged = true;
  console.error("[db] idle database client error:", error.message);
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg(
    {
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
      idleTimeoutMillis: IDLE_TIMEOUT_MS,
      max: resolvePoolMax(),
      keepAlive: true,
      keepAliveInitialDelayMillis: KEEP_ALIVE_DELAY_MS,
      statement_timeout: QUERY_TIMEOUT_MS,
      query_timeout: QUERY_TIMEOUT_MS,
    },
    { onPoolError: handlePoolError }
  );

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
