#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.local}"

# --- ENV laden wie health.sh ---
SUPABASE_URL=""
ANON=""
if [[ -f "$ENV_FILE" ]]; then
  SUPABASE_URL="$(grep -E '^VITE_SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2- || true)"
  ANON="$(grep -E '^VITE_SUPABASE_ANON_KEY=' "$ENV_FILE" | cut -d= -f2- || true)"
fi
SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"

echo "▶ smoke: running health..."
scripts/health.sh "$ENV_FILE" >/dev/null

echo "▶ smoke: trigger ops-dispatcher..."
resp="$(curl -sS -X POST \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  "${SUPABASE_URL}/functions/v1/ops-dispatcher" || true)"

echo "ops-dispatcher -> ${resp}"
case "$resp" in
  ✅\ OK:*) exit 0 ;;
  *) echo "❌ smoke failed"; exit 1 ;;
esac
