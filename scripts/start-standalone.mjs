import { spawn } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const standaloneDirectory = path.join(projectRoot, ".next", "standalone");
const serverFile = path.join(standaloneDirectory, "server.js");

if (!existsSync(serverFile)) {
  console.error(
    "[start:standalone] .next/standalone/server.js is missing. Run `npm run build` first."
  );
  process.exit(1);
}

// Next.js does not copy these into the standalone output, but the server needs
// them to serve the client bundle and public assets.
for (const [source, destination] of [
  [path.join(projectRoot, ".next", "static"), path.join(standaloneDirectory, ".next", "static")],
  [path.join(projectRoot, "public"), path.join(standaloneDirectory, "public")],
]) {
  if (existsSync(source)) {
    cpSync(source, destination, { recursive: true });
  }
}

// `next build` copies .env/.env.production into the standalone output. They
// must not travel with a deployment artifact: this launcher loads the project
// env files (without overriding real environment variables) or inherits the
// environment provided by systemd/a process manager.
for (const envFile of [".env", ".env.production"]) {
  rmSync(path.join(standaloneDirectory, envFile), { force: true });
}

// `next start` loads .env files automatically; the standalone server does not.
// Use the same precedence as Next.js in production: the first file that defines
// a variable wins, and real environment variables (systemd, a process manager,
// a container) always take precedence.
try {
  const { config } = await import("dotenv");

  for (const envFile of [
    ".env.production.local",
    ".env.local",
    ".env.production",
    ".env",
  ]) {
    config({
      path: path.join(projectRoot, envFile),
      override: false,
      quiet: true,
    });
  }
} catch {
  // dotenv is a development dependency. Production provides env vars directly.
}

const uploadDirectory = path.resolve(
  projectRoot,
  process.env.UPLOAD_DIR?.trim() || "uploads"
);

const child = spawn(process.execPath, [serverFile], {
  stdio: "inherit",
  env: {
    ...process.env,
    // The standalone server may change its working directory, so pass an
    // absolute path that always points at persistent project storage.
    UPLOAD_DIR: uploadDirectory,
  },
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
