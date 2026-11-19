import { rmSync } from "node:fs";
import type { FullConfig } from "@playwright/test";

// Removes the temporary UPLOAD_DIR configured in playwright.config.ts. Runs in
// a separate process, so the path travels through config.metadata.
export default function globalTeardown(config: FullConfig): void {
  const uploadDir = config.metadata.uploadDir;

  if (typeof uploadDir !== "string") {
    return;
  }

  rmSync(uploadDir, { recursive: true, force: true });
}
