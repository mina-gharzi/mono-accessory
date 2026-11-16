import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Neon's pooler cannot hold the session-level advisory lock Prisma uses
    // during migrations, so CLI commands prefer the direct connection when it
    // is configured.
    url: process.env.DIRECT_DATABASE_URL?.trim() || env("DATABASE_URL"),
  },
});
