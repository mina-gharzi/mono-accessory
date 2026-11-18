# syntax=docker/dockerfile:1

# Node LTS on Debian slim. Sharp ships prebuilt glibc binaries, so keep the
# Debian base. Override BASE_IMAGE to use a registry mirror, for example:
#   BASE_IMAGE=docker.mirror.example/node:24-bookworm-slim
ARG BASE_IMAGE=node:24-bookworm-slim

FROM ${BASE_IMAGE} AS base

# Optional npm registry mirror. Applied with `npm config set` so every later
# stage that installs packages inherits it.
ARG NPM_REGISTRY=
ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false
WORKDIR /app
RUN if [ -n "${NPM_REGISTRY}" ]; then npm config set registry "${NPM_REGISTRY}"; fi

# ---------------------------------------------------------------------------
# deps: the full dependency tree. The builder needs Next.js and the migrate
# target needs the Prisma CLI and tsx, so development dependencies stay.
# `--ignore-scripts` skips the Prisma postinstall; the client is generated
# explicitly after the sources are copied.
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ---------------------------------------------------------------------------
# builder: compile the standalone server.
#
# DATABASE_URL and NEXT_PUBLIC_SITE_URL are build-time only:
#   * `use cache` storefront pages are prerendered and query PostgreSQL;
#   * NEXT_PUBLIC_* values are inlined by Next.js.
# Both are ARG/ENV of this stage only and never reach the runner image. Build
# with host networking on Linux so DATABASE_URL can use 127.0.0.1:5432.
# ---------------------------------------------------------------------------
FROM base AS builder
ARG NEXT_PUBLIC_SITE_URL
ARG DATABASE_URL
ENV NODE_ENV=production \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    DATABASE_URL=${DATABASE_URL}

COPY --from=deps /app/node_modules ./node_modules
# Only files needed for the build are copied. Tests and local env files are
# excluded by .dockerignore and are not required (or wanted) here.
# package.json is required by `npm run build` (and by its postbuild script).
COPY package.json next.config.ts tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src
COPY public ./public

RUN test -n "${NEXT_PUBLIC_SITE_URL}" || (echo "NEXT_PUBLIC_SITE_URL build arg is required." >&2; exit 1)
RUN test -n "${DATABASE_URL}" || (echo "DATABASE_URL build arg is required." >&2; exit 1)
RUN npx prisma generate
RUN npm run build

# ---------------------------------------------------------------------------
# migrate: full node_modules, Prisma CLI, schema/migrations and the seed
# script. Used on demand for `prisma migrate deploy` and
# `npm run db:seed:production`; never started as part of the app stack.
# ---------------------------------------------------------------------------
FROM base AS migrate
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
# package.json is required by `npm run db:seed:production`.
COPY package.json tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
# prisma.config.ts reads DATABASE_URL while it loads, so `prisma generate`
# needs a value. It does not connect; compose replaces this dummy value when
# the container runs.
RUN DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?sslmode=disable" npx prisma generate

CMD ["npx", "prisma", "migrate", "deploy"]

# ---------------------------------------------------------------------------
# runner: minimal standalone server. No build args, no secrets, non-root.
# The uploads directory is a volume mount point owned by the app user.
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/data/uploads

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs \
    && mkdir -p /data/uploads \
    && chown -R nextjs:nodejs /data

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
