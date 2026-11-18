#!/usr/bin/env bash
#
# Restore PostgreSQL and the uploads volume from files created by backup.sh.
#
#   bash deploy/restore.sh /var/backups/mono-accessory/db-20260101T030000Z.sql.gz \
#                          /var/backups/mono-accessory/uploads-20260101T030000Z.tar.gz
#
# The restore is destructive: the database objects are dropped by the dump and
# the uploads directory is emptied before extraction. The script stops the app
# and asks for explicit confirmation before touching anything.
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE=(docker compose --env-file .env.production)

step() { printf '\n==> %s\n' "$*"; }
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

usage() {
  printf 'Usage: %s <database-dump.sql.gz> <uploads.tar.gz>\n' "$0" >&2
  exit 2
}

[ "$#" -eq 2 ] || usage

DUMP_FILE="$1"
UPLOADS_FILE="$2"

[ -f "$DUMP_FILE" ] || fail "Database dump not found: $DUMP_FILE"
[ -f "$UPLOADS_FILE" ] || fail "Uploads archive not found: $UPLOADS_FILE"
case "$DUMP_FILE" in
  *.sql.gz) ;;
  *) fail "The database dump must be a .sql.gz file." ;;
esac
case "$UPLOADS_FILE" in
  *.tar.gz) ;;
  *) fail "The uploads archive must be a .tar.gz file." ;;
esac
[ -f .env.production ] || fail ".env.production is missing."

printf 'This will REPLACE the current database and uploads:\n'
printf '  database: %s\n' "$DUMP_FILE"
printf '  uploads:  %s\n' "$UPLOADS_FILE"
printf 'Type RESTORE to continue: '
read -r answer
[ "$answer" = "RESTORE" ] || fail "Restore cancelled."

step "Stopping the app"
"${COMPOSE[@]}" stop app

step "Restoring the database"
gunzip -c "$DUMP_FILE" | "${COMPOSE[@]}" exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'

step "Restoring uploads"
"${COMPOSE[@]}" run --rm --no-deps -T app sh -c 'find /data/uploads -mindepth 1 -delete && tar -xzf - -C /data/uploads' < "$UPLOADS_FILE"

step "Starting the app"
"${COMPOSE[@]}" start app

step "Waiting for /api/health"
for attempt in $(seq 1 40); do
  if curl -fsS --max-time 5 http://127.0.0.1:3000/api/health 2>/dev/null | grep -q '"status":"ok"'; then
    printf 'Restore complete and the app is healthy.\n'
    exit 0
  fi
  sleep 2
done

"${COMPOSE[@]}" logs --tail=100 app
fail "The restore finished but the app did not become healthy. Check the logs above."
