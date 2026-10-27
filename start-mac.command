#!/bin/bash
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo 'Please install Node.js 24 from https://nodejs.org/ then launch again.'
  read -r -p 'Press Enter to close...'
  exit 1
fi
node scripts/local.mjs
status=$?
if [ "$status" -ne 0 ]; then read -r -p 'Press Enter to close...'; fi
exit "$status"
