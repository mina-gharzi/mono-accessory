import { cpSync, existsSync, mkdirSync, readdirSync, symlinkSync } from "node:fs";
import path from "node:path";

// Turbopack rewrites external imports to hashed aliases such as
// @prisma/client-2c3a283f134fdcb6 and keeps a junction/symlink for them in
// .next/node_modules. The generated server chunks require the alias, but the
// standalone output does not always include it, so the production server fails
// with "Cannot find module @prisma/client-<hash>/runtime/client".
//
// Mirror every alias from .next/node_modules into
// .next/standalone/.next/node_modules, pointing at the real package that was
// traced into .next/standalone/node_modules. Aliases already copied by Next.js
// are left untouched.
const projectRoot = process.cwd();
const aliasRoot = path.join(projectRoot, ".next", "node_modules");
const standaloneRoot = path.join(projectRoot, ".next", "standalone");

if (!existsSync(standaloneRoot)) {
  process.exit(0);
}

const aliasPattern = /^(.+)-[0-9a-f]{16}$/;

function linkAlias(aliasName, realRelativePath) {
  const linkPath = path.join(standaloneRoot, ".next", "node_modules", aliasName);
  const realPath = path.join(standaloneRoot, "node_modules", realRelativePath);

  if (existsSync(linkPath) || !existsSync(realPath)) {
    return;
  }

  mkdirSync(path.dirname(linkPath), { recursive: true });

  const target = path.relative(path.dirname(linkPath), realPath);

  try {
    symlinkSync(target, linkPath, "dir");
  } catch (error) {
    // Windows needs Developer Mode or elevation for symlinks. Copying keeps the
    // local build usable; the Docker/Linux build takes the symlink path.
    if (error.code !== "EPERM" && error.code !== "EACCES") {
      throw error;
    }
    cpSync(realPath, linkPath, { recursive: true });
  }
}

function handleEntry(entryName, parentRelativePath) {
  const match = aliasPattern.exec(entryName);
  if (!match) {
    return;
  }

  const realRelativePath = path.join(parentRelativePath, match[1]);
  const aliasRelativePath = path.join(parentRelativePath, entryName);

  linkAlias(aliasRelativePath, realRelativePath);
}

for (const entry of readdirSync(aliasRoot, { withFileTypes: true })) {
  if (entry.name.startsWith("@")) {
    for (const scoped of readdirSync(path.join(aliasRoot, entry.name), {
      withFileTypes: true,
    })) {
      handleEntry(scoped.name, entry.name);
    }
  } else {
    handleEntry(entry.name, "");
  }
}
