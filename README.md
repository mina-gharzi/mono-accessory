# MONO Accessory

A full-stack store for steel jewelry, glasses and fashion accessories, built for
a Persian-speaking audience in Iran. The storefront is fully RTL, prices are in
Toman and dates are displayed in the Jalali calendar. The project is a portfolio
piece that is structured to be able to run as a real business: server-computed
pricing, transactional stock, role-based admin access and replaceable payment
and image-storage providers.

## Screenshots

| Home | Shop | Product | Admin |
| --- | --- | --- | --- |
| `docs/screenshots/home.png` | `docs/screenshots/shop.png` | `docs/screenshots/product.png` | `docs/screenshots/admin.png` |

## Features

- **Storefront** — editorial home page (hero, collections, new arrivals,
  bestsellers, recommendations, offers), shop with category, price, stock,
  sort and search filters, product detail with gallery, color/model variants,
  stock state, specs and similar products, collection pages, about, contact,
  FAQ, terms, shipping and returns, and a custom 404.
- **Accounts** — mobile number and password authentication, cart, wishlist,
  checkout, order history and order details.
- **Orders** — add/remove/change quantity, server-side totals, fixed shipping
  cost with a free-shipping threshold stored in settings, discount codes applied
  at checkout, mock payment behind a provider interface, and variant stock
  decremented inside a transaction.
- **Admin** — categories, products with images, variants and stock, discount
  codes with usage limits and expiry, orders and status transitions, customers
  and a sales dashboard. All authorization is enforced on the server.
- **Experience** — Persian RTL layout, local Pinar font, loading, empty and
  error states on every list, reduced-motion support and SEO metadata,
  sitemap and robots.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4, customized shadcn/ui, motion |
| Database | PostgreSQL (Neon), Prisma 7 |
| Validation | Zod on every server input |
| Auth | `jose` JWT session in an httpOnly cookie, `bcryptjs` hashing |
| Testing | Vitest (unit and integration), Playwright (Chromium E2E) |

## Architecture

```
src/
  app/          routes, layouts, server actions and route handlers
  components/   UI grouped by feature (home, shop, cart, admin, ui, ...)
  lib/          pure helpers: formatting, order status, shop params, redirects
  server/       data access and business logic, never imported by client code
  generated/    Prisma client output
prisma/         schema, migrations and seed
tests/          unit, integration and e2e suites
```

- **Server/UI separation.** `src/server/*` owns Prisma access, pricing, auth,
  uploads and payment. Pages and server actions validate their input with Zod,
  call those modules and render the result. Client components never compute
  prices or totals; prices and totals always come from the server.
- **Authorization.** `requireUser` and `requireAdmin` live in
  `src/server/auth/session.ts`. Every admin server action and admin data
  function calls `requireAdmin` itself; the admin layout is not a security
  boundary. Ownership checks (orders, wishlist) also run on the server.
- **Auth ready for OTP.** Authentication is split into `mobile.ts`, `password.ts`,
  `credentials.ts`, `rate-limit.ts` and `session.ts`. The `User` model already
  has `mobileVerifiedAt`, so an OTP step can be added without changing the
  session or route structure.
- **Payment provider.** `PaymentProvider` (`src/server/payment/types.ts`)
  exposes `createPayment` and `verifyPayment`. `getPaymentProvider` selects the
  implementation from `PAYMENT_PROVIDER`; the current `mock` provider redirects
  to a local confirmation page. A real Iranian gateway only needs to implement
  the interface and be registered there.
- **Image storage.** `ImageStorage` (`src/server/uploads.ts`) exposes `save`
  and `remove`. The local driver writes optimized WebP files under
  `public/uploads/<year>-<month>/`. A cloud driver can be added by implementing
  the interface and returning it from `createImageStorage`.
- **Stock and transactions.** `placeOrder` runs in a single Prisma transaction:
  it re-reads cart lines, validates variant stock, decrements stock, revalidates
  any discount code, increments its usage counter with a conditional update,
  creates the order and clears the cart. Insufficient stock or an exhausted
  discount rolls the whole transaction back. Paid callbacks are idempotent, and
  cancelling restores stock and discount usage exactly once.
- **Streaming pages.** Admin and account pages are a synchronous page shell
  (heading, actions) plus an async child that awaits data and `searchParams`
  inside `<Suspense>` with a skeleton fallback. Data is never awaited at a
  page's top level, which keeps the shell usable with PPR and streaming.

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm
- A PostgreSQL database (Neon is the intended provider)
- Chromium for E2E: `npx playwright install chromium`

### Install

```bash
npm install
cp .env.example .env
```

Fill in `.env` as described below.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled PostgreSQL connection string used by the app. |
| `DIRECT_DATABASE_URL` | Migrations | Unpooled connection string used by Prisma CLI for migrations. Falls back to `DATABASE_URL` when unset. |
| `TEST_DATABASE_URL` | Tests | Disposable database for integration and E2E tests. Must differ from `DATABASE_URL`, and its host or database name must contain `test`. |
| `ADMIN_MOBILE` | Seed | Mobile number of the admin account created by the seed. |
| `ADMIN_PASSWORD` | Seed | Password of the seeded admin account. |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public site URL used for canonical URLs, Open Graph metadata, sitemap and robots. |
| `AUTH_SECRET` | Yes | Secret used to sign session JWTs. At least 32 characters. |
| `PAYMENT_PROVIDER` | No | Payment provider id. Only `mock` is implemented; defaults to `mock`. |
| `IMAGE_STORAGE` | No | Image storage driver. Only `local` is implemented; defaults to `local`. |
| `E2E_BASE_URL` | No | Base URL for Playwright. Defaults to `http://localhost:3000`. |

### Database setup

1. Create a Neon project. Copy the pooled connection string into
   `DATABASE_URL` for the app and the direct (unpooled) connection string into
   `DIRECT_DATABASE_URL` for migrations. Keep `sslmode=require`. The direct
   host is the same host without the `-pooler` marker.
2. Create a second database (a second Neon project or another database on the
   same project) and put its connection string in `TEST_DATABASE_URL`. The name
   or host must contain `test`, for example `mono_test`.
3. Apply migrations:

   ```bash
   npm run db:migrate
   ```

   On an existing environment use `npx prisma migrate deploy` instead.
4. Seed the catalog, settings and admin account:

   ```bash
   npm run db:seed
   ```

   The admin account is created from `ADMIN_MOBILE` and `ADMIN_PASSWORD`. Sign
   in with those credentials at `/login` to reach `/admin`.

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Start the production server. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript without emitting. |
| `npm test` | Run unit and integration tests. |
| `npm run test:unit` | Run unit tests only (no database). |
| `npm run test:integration` | Run integration tests against `TEST_DATABASE_URL`. |
| `npm run test:e2e` | Migrate, seed, build, start and run the Playwright suite. |
| `npm run test:e2e:db` | Migrate and seed the test database only. |
| `npm run db:generate` | Regenerate the Prisma client. |
| `npm run db:migrate` | Create and apply a migration in development. |
| `npm run db:seed` | Seed the database. |
| `npm run db:studio` | Open Prisma Studio. |

## Tests

The suite is intentionally small and covers the parts where bugs are expensive.

- **Unit** (`tests/unit`) — mobile number normalization, password rules and the
  safe redirect helper, `calculateTotals`, discount code normalization and
  calculation, order status transitions and shop search/parameter parsing. No
  database is used.
- **Integration** (`tests/integration`) — real Prisma against
  `TEST_DATABASE_URL`: server-computed totals with stock decrement and rollback,
  idempotent payment callbacks with cross-user rejection, stock restoration on
  customer and admin cancellation, and atomic discount usage limits. Each test
  creates uniquely named fixtures and removes them afterwards.
- **E2E** (`tests/e2e`) — Chromium only, run against a production build:
  a customer purchase from registration to a paid order (cart empty, stock
  reduced), access control for anonymous and customer users, and an admin
  moving a paid order to processing with only the allowed next steps visible.

Safety guard: the integration and E2E setup throws when `TEST_DATABASE_URL` is
missing, when it equals `DATABASE_URL`, or when its host and database name do
not contain `test`. Prisma is pointed at the test database only inside the test
process.

Apply migrations to the test database once before the first integration run.
`npm run test:e2e:db` does that and also seeds the catalog used by E2E.

```bash
npm test          # unit + integration
npm run test:e2e  # Playwright; requires port 3000 to be free
```

E2E requires `ADMIN_MOBILE` and `ADMIN_PASSWORD` in `.env`, because the admin
scenario signs in with the seeded account.

## Deployment

- Build with `npm run build` and serve with `npm run start`. Set every required
  environment variable in the hosting provider.
- Run `npx prisma migrate deploy` as part of the release step.
- Set `NEXT_PUBLIC_SITE_URL` to the public HTTPS origin so canonical URLs,
  Open Graph tags, the sitemap and robots point at the right host.
- Generate a random `AUTH_SECRET` of at least 32 characters. Changing it
  invalidates every existing session.
- `DATABASE_URL` should be the pooled connection string and
  `DIRECT_DATABASE_URL` the unpooled one. Sessions are signed with
  `AUTH_SECRET`; serve the app over HTTPS so the production cookie is sent
  securely.
- The local image driver writes to `public/uploads`, which is ephemeral on
  serverless hosts. Implement the `ImageStorage` interface for a cloud bucket
  before deploying to production.
- `PAYMENT_PROVIDER=mock` is for development only. Never enable it on a live
  store.

## Known limitations and roadmap

- **Payments** are mocked. The next step is a real Iranian gateway
  implementation of `PaymentProvider`, including verification and refunds.
- **OTP** is not enabled yet. The auth modules and `mobileVerifiedAt` field are
  ready for a verification step.
- **Abandoned orders.** A `PENDING` order reserves stock until it is paid or
  cancelled. A scheduled job that expires unpaid orders and releases stock is
  planned.
- **Reviews.** Approved reviews are displayed, but customers cannot submit new
  reviews and admins have no moderation screen yet.
- **Notifications.** There are no email or SMS notifications for orders.
- **Roadmap** — real gateway, OTP verification, review submission and
  moderation, order-expiry job, cloud image storage, and production monitoring.
