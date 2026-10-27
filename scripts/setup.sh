#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export npm_config_cache=/workspace/.npm-cache
export NODE_USE_ENV_PROXY=1
if [[ ! -f .env ]]; then cp .env.example .env; fi
npm ci
npm run db:generate
mkdir -p .local
radar_database_pid=''
cleanup() {
  if [[ -n "$radar_database_pid" ]]; then
    kill -TERM "$radar_database_pid" 2>/dev/null || true
    wait "$radar_database_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT
if ! node --env-file=.env scripts/check-database.mjs; then
  node --env-file=.env -e 'const u=new URL(process.env.DATABASE_URL); if(u.hostname!=="127.0.0.1"||u.port!=="55432") {console.error("Configured database is unavailable; refusing to substitute a local database.");process.exit(1)}'
  # Launch the direct runner, so its lifecycle remains attached to this script.
  node --import tsx scripts/database.ts > .local/setup-postgres.log 2>&1 &
  radar_database_pid=$!
  for attempt in {1..30}; do
    if node --env-file=.env scripts/check-database.mjs; then break; fi
    sleep 1
  done
  node --env-file=.env scripts/check-database.mjs
fi
npm run db:push
npm run lint
npm test
npm run build
