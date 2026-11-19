# Deployment guide

MONO Accessory runs as a Docker Compose stack on a single Linux VPS:

```
Internet -> Nginx (host, HTTPS) -> app container (127.0.0.1:3000)
                                   -> PostgreSQL container (db, internal network)
                                   -> uploads named volume (/data/uploads)
```

PostgreSQL is not exposed to the internet. Only Nginx is public. The app image
contains the standalone Next.js server, and uploads live in a named volume so
they survive rebuilds. For the environment variables themselves see
[`.env.production.example`](../.env.production.example).

All commands below run from the repository root, for example
`/opt/mono-accessory`. The `--env-file .env.production` flag is required: it
provides the values Compose uses for substitution (`POSTGRES_*`, build args).
`deploy/deploy.sh` adds the flag for you.

## 1. Server prerequisites

- Ubuntu 22.04 or 24.04 LTS, 2 vCPU, 2 GB RAM and 20 GB disk. The image build
  is the memory peak; on a 2 GB machine add 2 GB of swap first.
- Docker Engine and the Compose plugin. Follow the official instructions at
  `docs.docker.com/engine/install/ubuntu/`. If that site or Docker Hub is
  blocked, install the Ubuntu packages instead
  (`sudo apt install docker.io docker-compose-v2`) and use mirrors (below).
- `curl`, `git`, `nginx`, and `certbot` (see section 2).
- Compose v2.24 or newer for the local override file. `docker compose version`
  shows the installed version.

If Docker Hub or the npm registry is blocked, the build supports both mirrors:

```dotenv
# in .env.production
BASE_IMAGE="docker.mirror.example/node:24-bookworm-slim"
NPM_REGISTRY="https://registry.npmmirror.com"
```

`BASE_IMAGE` must be a Node LTS image based on Debian (glibc) so the prebuilt
Sharp binary works. `NPM_REGISTRY` is applied with `npm config set registry`
inside the build. Both can also be exported in the shell for a single build.

## 2. DNS and TLS

1. Point an `A` (and `AAAA` if you use IPv6) record for `shop.example.com` at
   the server's public IP and wait for propagation.
2. Install Nginx and certbot:

   ```bash
   sudo apt update
   sudo apt install nginx certbot python3-certbot-nginx
   ```

3. Either let certbot edit the Nginx config (`sudo certbot --nginx -d
   shop.example.com`) or obtain the certificate with the webroot method and
   install the example config yourself:

   ```bash
   sudo mkdir -p /var/www/certbot
   sudo certbot certonly --webroot -w /var/www/certbot -d shop.example.com
   sudo cp deploy/nginx.example.conf /etc/nginx/sites-available/mono-accessory
   sudo ln -s /etc/nginx/sites-available/mono-accessory /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

   Replace `shop.example.com` and the certificate paths in the config. If your
   provider issues the certificate, copy the full-chain and key files and point
   `ssl_certificate`/`ssl_certificate_key` at them. The package installs a
   renewal timer; check it with `sudo certbot renew --dry-run`.

The example config redirects HTTP to HTTPS, sets `client_max_body_size 8m` for
admin uploads, caches `/_next/static` for a year, and **overwrites**
`X-Forwarded-For` with the address Nginx sees. That is why the compose file
sets `TRUST_PROXY=true` for the app. Do not switch it to
`$proxy_add_x_forwarded_for`.

## 3. Get the code

```bash
sudo mkdir -p /opt/mono-accessory
sudo chown "$USER":"$USER" /opt/mono-accessory
git clone <repository-url> /opt/mono-accessory
cd /opt/mono-accessory
```

`git pull` is enough for updates. Never commit `.env` or `.env.production`.

## 4. Configure .env.production

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Replace every value:

| Variable | Notes |
| --- | --- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credentials for the database container. `POSTGRES_PASSWORD` must match the password inside `DATABASE_URL`. Use a URL-safe password (letters, digits, `-`, `_`) or percent-encode it in the URL. |
| `DATABASE_URL` | The host URL (`127.0.0.1:5432`) used by the build and by a standalone installation. Compose replaces the host with the `db` service for the containers. |
| `AUTH_SECRET` | Generate with `openssl rand -base64 48`. Template words (`generate`, `change`, `example`, `your-`, `random-secret`, `secret-of`) are rejected at startup. |
| `NEXT_PUBLIC_SITE_URL` | The public HTTPS origin. Next.js inlines it at build time, so changing it requires a rebuild. |
| `ADMIN_MOBILE`, `ADMIN_PASSWORD` | Used by the production seed. The password must be at least 10 characters and must not be a placeholder; startup also rejects a placeholder when the variable is present. |
| `PAYMENT_PROVIDER` | Keep `mock` until a real gateway is implemented. |
| `IMAGE_STORAGE` | Only `local` is implemented. |
| `UPLOAD_DIR` | The standalone value. Compose overrides it with `/data/uploads` (the uploads volume). |
| `TRUST_PROXY` | Keep `false` in the file; compose sets it to `true` for the Nginx deployment. |

`next build` also reads `.env.production`. On a developer machine use
`.env.production.local` for local production tests so the file is never
committed.

## 5. First deploy

```bash
cd /opt/mono-accessory
bash deploy/deploy.sh
```

The script performs five steps:

1. Start the `db` service and wait until `pg_isready` succeeds.
2. Apply migrations with the `migrate` image
   (`docker compose run --rm migrate npx prisma migrate deploy`).
3. Build the app image. Storefront pages use `use cache` and are prerendered,
   so the build queries PostgreSQL. On Linux the build uses host networking
   (set in `docker-compose.yml`) and the `DATABASE_URL` from `.env.production`
   points at `127.0.0.1:5432`, where Compose publishes the database. The
   `DATABASE_URL` build argument exists only in the builder stage. The builder
   also sets a fixed dummy `AUTH_SECRET`, because page-data collection imports
   the session module; the runner stage does not inherit it and the real secret
   comes from `.env.production` at runtime.
4. Start the app container.
5. Poll `http://127.0.0.1:3000/api/health` until it returns
   `{"status":"ok"}`, or print the app logs and fail.

Create the admin account once (re-running updates its password):

```bash
docker compose --env-file .env.production run --rm migrate npm run db:seed:production
```

The seed refuses a missing, short or placeholder `ADMIN_PASSWORD`.

## 6. Verify

```bash
curl -fsS http://127.0.0.1:3000/api/health          # {"status":"ok"}
curl -fsS -o /dev/null -w '%{http_code}\n' https://shop.example.com
docker compose --env-file .env.production ps        # db and app healthy
```

Then, in a browser over HTTPS:

1. Sign in at `/login` with `ADMIN_MOBILE`/`ADMIN_PASSWORD` and open `/admin`.
   If the session cookie is not stored, see "Cookies are not set" below.
2. Upload an image on a product. Confirm it appears on the storefront after a
   reload; this proves the uploads volume is mounted and writable.
3. Place a test order from the storefront through the mock payment page and
   confirm it in the admin order list. Mock payments do not charge anyone.

## 7. Update

```bash
cd /opt/mono-accessory
git pull --ff-only
bash deploy/deploy.sh
```

Migrations run before the new image is built, and the app container is
recreated after the build. Uploads and database data stay in their volumes.

## 8. Rollback

The app image is tagged `mono-accessory:latest`; `deploy.sh` also tags the
previous image as `mono-accessory:previous` before rebuilding (when it exists).
To return to the previous image:

```bash
cd /opt/mono-accessory
IMAGE_TAG=previous docker compose --env-file .env.production up -d --no-build app
```

Or revert the code and rebuild:

```bash
git revert <commit>
bash deploy/deploy.sh
```

If the rollback predates a database migration, the old code may not understand
the current schema. In that case restore the database backup taken before the
upgrade (section 9) as well. Test a rollback once on a staging copy.

## 9. Backups

`deploy/backup.sh` writes two timestamped files to `BACKUP_DIR`:

- `db-<timestamp>.sql.gz` — `pg_dump` from the `db` container.
- `uploads-<timestamp>.tar.gz` — the `/data/uploads` volume from the app
  container.

Retention is `BACKUP_RETENTION_DAYS` (default 14). The script exits non-zero,
removes partial files and prints a clear message on any failure. It never reads
database credentials itself; `pg_dump` uses the container environment.

```bash
sudo mkdir -p /var/backups/mono-accessory
sudo chown "$USER":"$USER" /var/backups/mono-accessory
BACKUP_DIR=/var/backups/mono-accessory BACKUP_RETENTION_DAYS=14 bash deploy/backup.sh
```

Cron example (daily at 03:17, log kept outside the repository):

```cron
17 3 * * * cd /opt/mono-accessory && BACKUP_DIR=/var/backups/mono-accessory BACKUP_RETENTION_DAYS=14 /bin/bash deploy/backup.sh >> /var/log/mono-backup.log 2>&1
```

A backup on the same disk is not a backup. Copy it off the server with an SSH
key (not a password) and keep at least one copy outside the provider:

```bash
rsync -av /var/backups/mono-accessory/ backup-host:/backups/mono-accessory/
```

Restore drill (do this before launch and after every schema change):

1. Pick the newest `db-*.sql.gz` and `uploads-*.tar.gz`.
2. On a staging server (or after taking a fresh backup), run:

   ```bash
   bash deploy/restore.sh /var/backups/mono-accessory/db-<timestamp>.sql.gz \
                          /var/backups/mono-accessory/uploads-<timestamp>.tar.gz
   ```

3. Type `RESTORE` at the confirmation prompt. The script stops the app, loads
   the dump, replaces the uploads directory, starts the app and waits for
   `/api/health`.
4. Check a product image, an order and the admin login.

The database volume is `mono-accessory_db-data`; the uploads volume is
`mono-accessory_uploads`. `docker compose down -v` deletes both — never run it
on production.

If you are migrating an existing standalone installation, copy the old
`public/uploads` and `UPLOAD_DIR` files into the volume once, for example:

```bash
docker run --rm -v mono-accessory_uploads:/data -v "$PWD/public/uploads":/legacy:ro \
  alpine sh -c 'cp -a /legacy/. /data/'
```

## 10. Logs and troubleshooting

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f app
docker compose --env-file .env.production logs --tail=200 db
```

- **`/api/health` returns 503.** The app cannot run `SELECT 1`. Check that `db`
  is healthy (`docker compose ps`), that `POSTGRES_*` and the password inside
  `DATABASE_URL` match, and that migrations ran. The app only listens after its
  startup checks pass; look for `Production configuration error` in the logs.
- **The container restarts at startup.** A missing or placeholder
  `AUTH_SECRET`, a missing/non-HTTPS `NEXT_PUBLIC_SITE_URL`, a missing
  `DATABASE_URL`, or a placeholder `ADMIN_PASSWORD` stops the process. The log
  line names the variable.
- **Login works but the cookie is not stored.** Session cookies are `Secure`,
  so the site must be opened over HTTPS. Check the certificate, the
  HTTP-to-HTTPS redirect and that Nginx sends `X-Forwarded-Proto: https`.
- **Uploaded images are missing after a deploy.** The app writes to
  `/data/uploads`; check that the `uploads` volume is mounted and that the
  container was not recreated with a new anonymous volume. If the directory was
  created by root, fix ownership:
  `docker compose --env-file .env.production exec -u root app chown -R nextjs:nodejs /data/uploads`.
- **The build cannot reach PostgreSQL.** `db` must be running and healthy
  before `deploy.sh` builds. On Docker Desktop the Linux host-network build is
  not available; use the override file and `host.docker.internal` (section 11).
- **`npm ci` or `npm install` is blocked.** Set `NPM_REGISTRY` in
  `.env.production` (or the shell) and rebuild.
- **Disk full.** `docker system df` shows images, volumes and build cache. Prune
  unused images/build cache, but never remove `mono-accessory_db-data` or
  `mono-accessory_uploads`.

## 11. Local simulation on Windows (PowerShell)

The scripts target Linux. To try the same stack with Docker Desktop:

```powershell
Copy-Item docker-compose.override.example.yml docker-compose.override.yml

# The build container cannot reach the host loopback; use the Docker Desktop
# host name and the database published by the override file.
$env:BUILD_DATABASE_URL = "postgresql://USER:PASSWORD@host.docker.internal:5432/DATABASE?sslmode=disable"

docker compose --env-file .env.production up -d db
docker compose --env-file .env.production run --rm migrate npx prisma migrate deploy
docker compose --env-file .env.production run --rm migrate npm run db:seed:production
docker compose --env-file .env.production build app
docker compose --env-file .env.production up -d app

Invoke-WebRequest http://127.0.0.1:3000/api/health -UseBasicParsing
```

Use a temporary `.env.production` for this, and delete it together with the
override file and the volumes when you are done:

```powershell
docker compose --env-file .env.production down -v
Remove-Item docker-compose.override.yml, .env.production
```

The override publishes PostgreSQL on every interface so the build container can
reach it. That is acceptable on a local machine only; never use it on a public
server.

`deploy/backup.sh` and `deploy/restore.sh` also run from Git Bash. Point
`BACKUP_DIR` at a writable directory inside the project; the Linux default
`/var/backups/mono-accessory` does not exist on Windows. Both scripts call the
container-side paths through `sh -c` so Git Bash does not rewrite them.

## 12. Before accepting real orders

- [ ] Replace `PAYMENT_PROVIDER=mock` with a real Iranian gateway that
      implements `PaymentProvider` (create, verify, refund). Test a real payment
      and a failed payment.
- [ ] Add OTP verification for the mobile number and a password reset flow.
- [ ] Review the terms, privacy and shipping/returns pages with a lawyer; make
      sure they match Iranian e-commerce rules.
- [ ] Replace every `SAMPLE` value in `src/lib/site-config.ts` (phone, email,
      address, Instagram handle, tagline, support hours).
- [ ] Use real product photos with the correct licenses; remove stock images.
- [ ] Confirm the shipping cost and free-shipping threshold in the store
      settings, and that discount codes have sensible limits and expiry.
- [ ] Add the order-expiry job for unpaid `PENDING` orders so stock is released.
- [ ] Set up monitoring: uptime check on `/api/health`, disk space, container
      restarts and backup success. Test that alerts reach you.
- [ ] Take a backup, copy it off the server, and complete a restore drill.
- [ ] Keep HTTPS enabled and `TRUST_PROXY=true` only behind Nginx; verify the
      session cookie is `Secure`, `HttpOnly` and `SameSite=Lax`.
- [ ] Change the seeded admin password and, if you do not plan to re-seed,
      remove `ADMIN_PASSWORD` from the app environment.
- [ ] Add email/SMS notifications for orders if the business needs them (not
      implemented yet).
