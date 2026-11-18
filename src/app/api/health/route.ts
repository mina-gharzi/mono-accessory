import { prisma } from "@/server/db";

const HEALTH_TIMEOUT_MS = 3000;

async function databaseIsHealthy(): Promise<boolean> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Health check timed out.")),
          HEALTH_TIMEOUT_MS
        );
      }),
    ]);

    return true;
  } catch {
    return false;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function GET(): Promise<Response> {
  const healthy = await databaseIsHealthy();

  return Response.json(
    { status: healthy ? "ok" : "unavailable" },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
