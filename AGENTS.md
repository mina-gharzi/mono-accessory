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
