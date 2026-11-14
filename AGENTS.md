Read PROJECT.md before each task. Rules:
- No emojis in UI. No system default fonts. No `any`.
- Zod validation on every server input.
- Prices and totals are always computed on the server, never trusted from the client.
- Admin and ownership checks only on the server.
- Business logic in src/server/*, UI separate from data access.
- Avoid unnecessary files and abstractions. Do not add features outside the current task.
- Respect prefers-reduced-motion. Every list/page has loading, empty and error states.
- UI must be RTL-correct.
- After each task run typecheck, lint and build; fix failures; report only failures and the list of files changed.
- Admin and account list pages are a synchronous page shell (heading, actions) plus an async
  child that awaits data and searchParams inside `<Suspense>` with a skeleton fallback (see
  `src/app/admin/categories/page.tsx`). Never await data or searchParams at a page's top level.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
