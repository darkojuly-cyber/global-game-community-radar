#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL to the managed PostgreSQL connection string}"
: "${RADAR_USER:?Set RADAR_USER for private access}"
: "${RADAR_PASSWORD:?Set a strong RADAR_PASSWORD for private access}"
npm run db:push
exec ./node_modules/.bin/next start --hostname 0.0.0.0 --port "${PORT:-3000}"
