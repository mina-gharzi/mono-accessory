#!/usr/bin/env bash
#
# Back up PostgreSQL and the uploads volume.
#
#   BACKUP_DIR=/var/backups/mono-accessory BACKUP_RETENTION_DAYS=14 bash deploy/backup.sh
#
# BACKUP_DIR defaults to /var/backups/mono-accessory; retention defaults to 14
# days. The database password is never read by this script: pg_dump runs inside
# the db container and uses its own environment. Copy the resulting files off
# the server; a backup on the same disk does not protect against disk failure.
set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-/var/backups/mono-accessory}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
COMPOSE=(docker compose --env-file .env.production)
DB_FILE="$BACKUP_DIR/db-$STAMP.sql.gz"
UPLOADS_FILE="$BACKUP_DIR/uploads-$STAMP.tar.gz"

step() { printf '\n==> %s\n' "$*"; }
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

trap 'rm -f "${DB_FILE:-}" "${UPLOADS_FILE:-}"; printf "ERROR: backup failed; partial files were removed.\n" >&2' ERR

[ -f .env.production ] || fail ".env.production is missing."
case "$RETENTION_DAYS" in
  ''|*[!0-9]*) fail "BACKUP_RETENTION_DAYS must be a whole number of days." ;;
esac

mkdir -p "$BACKUP_DIR" || fail "Cannot create $BACKUP_DIR."

"${COMPOSE[@]}" ps --status running --services | grep -qx 'db' || fail "The db container is not running. Start the stack first."
"${COMPOSE[@]}" ps --status running --services | grep -qx 'app' || fail "The app container is not running. Start the stack first."

step "Dumping PostgreSQL to $DB_FILE"
"${COMPOSE[@]}" exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-privileges' | gzip -9 > "$DB_FILE"
[ -s "$DB_FILE" ] || fail "The database dump is empty."

step "Archiving uploads to $UPLOADS_FILE"
"${COMPOSE[@]}" exec -T app tar -czf - -C /data/uploads . > "$UPLOADS_FILE"
[ -s "$UPLOADS_FILE" ] || fail "The uploads archive is empty."

step "Removing backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db-*.sql.gz' -o -name 'uploads-*.tar.gz' \) -mtime +"$RETENTION_DAYS" -delete

step "Backup complete"
printf '  %s\n  %s\n' "$DB_FILE" "$UPLOADS_FILE"
