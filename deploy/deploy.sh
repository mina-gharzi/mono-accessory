#!/usr/bin/env bash
#
# Build and deploy the production stack.
#
#   bash deploy/deploy.sh
#
# Requires Docker Engine with Compose v2.24+ and curl. Run it on the server
# after .env.production is in place; see docs/DEPLOY.md.
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE=(docker compose --env-file .env.production)

step() { printf '\n==> %s\n' "$*"; }
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

# Read a single value from .env.production without sourcing the file: values
# may contain shell metacharacters. Quotes around the value are stripped and a
# Windows CR is removed in case the file was edited locally.
read_env() {
  local key="$1"
  sed -n "s/^${key}=//p" .env.production | tail -n 1 | tr -d '\r' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

[ -f .env.production ] || fail ".env.production is missing. Copy .env.production.example and fill it in (see docs/DEPLOY.md)."

DATABASE_URL="$(read_env DATABASE_URL)"
NEXT_PUBLIC_SITE_URL="$(read_env NEXT_PUBLIC_SITE_URL)"
[ -n "$DATABASE_URL" ] || fail "DATABASE_URL is missing from .env.production."
[ -n "$NEXT_PUBLIC_SITE_URL" ] || fail "NEXT_PUBLIC_SITE_URL is missing from .env.production."

step "1/5 Starting PostgreSQL"
"${COMPOSE[@]}" up -d db

step "Waiting for PostgreSQL to accept connections"
for attempt in $(seq 1 60); do
  if "${COMPOSE[@]}" exec -T db sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; then
    printf 'PostgreSQL is ready.\n'
    break
  fi
  if [ "$attempt" -eq 60 ]; then
    "${COMPOSE[@]}" logs --tail=50 db
    fail "PostgreSQL did not become ready in time."
  fi
  sleep 2
done

step "2/5 Applying database migrations"
"${COMPOSE[@]}" run --rm migrate npx prisma migrate deploy

step "3/5 Building the app image"
# `use cache` pages are prerendered, so the build queries PostgreSQL. On Linux
# the build uses host networking (docker-compose.yml) and the .env.production
# DATABASE_URL points at 127.0.0.1:5432, where compose publishes the database.
# On Docker Desktop use docker-compose.override.example.yml and a
# host.docker.internal BUILD_DATABASE_URL instead.
if docker image inspect mono-accessory:latest >/dev/null 2>&1; then
  docker tag mono-accessory:latest mono-accessory:previous
  printf 'Tagged the current image as mono-accessory:previous for rollback.\n'
fi
export BUILD_DATABASE_URL="$DATABASE_URL"
"${COMPOSE[@]}" build app

step "4/5 Starting the app"
"${COMPOSE[@]}" up -d app

step "5/5 Waiting for /api/health"
for attempt in $(seq 1 40); do
  if curl -fsS --max-time 5 http://127.0.0.1:3000/api/health 2>/dev/null | grep -q '"status":"ok"'; then
    printf 'The app is healthy.\n'
    printf '\nDeploy complete. If this is the first deploy, create the admin account:\n'
    printf '  docker compose --env-file .env.production run --rm migrate npm run db:seed:production\n'
    exit 0
  fi
  sleep 2
done

"${COMPOSE[@]}" logs --tail=100 app
fail "The app did not become healthy. Check the logs above and docs/DEPLOY.md."
