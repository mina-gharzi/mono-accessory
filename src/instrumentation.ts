export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { assertProductionEnvironment } = await import("./server/env");

  assertProductionEnvironment();
}
