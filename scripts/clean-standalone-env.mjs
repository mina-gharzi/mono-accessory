import { rmSync } from "node:fs";
import path from "node:path";

// Next.js copies .env and .env.production into .next/standalone during a
// production build. The standalone server reads its environment from the
// process (or the start-standalone launcher), so the copies are unnecessary and
// must not travel with a deployment artifact.
const standaloneDirectory = path.join(process.cwd(), ".next", "standalone");

for (const envFile of [".env", ".env.production"]) {
  rmSync(path.join(standaloneDirectory, envFile), { force: true });
}
