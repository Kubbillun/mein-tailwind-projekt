#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.local}"

SUPABASE_URL=""
ANON=""

if [[ -f "$ENV_FILE" ]]; then
  SUPABASE_URL="$(grep -E '^VITE_SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2- || true)"
  ANON="$(grep -E '^VITE_SUPABASE_ANON_KEY=' "$ENV_FILE" | cut -d= -f2- || true)"
fi
SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
ANON="${ANON:-}"

pass=0
fail=0
ok()  { echo "✅ $*"; pass=$((pass+1)); return 0; }
bad() { echo "❌ $*"; fail=$((fail+1)); return 0; }

http_code() {
  local method="${1:-GET}" url="${2}" data="${3:-}"
  if [[ "$method" == "GET" ]]; then
    curl -sS -o /dev/null -w "%{http_code}" \
      -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
      "$url" || echo "000"
  else
    curl -sS -o /dev/null -w "%{http_code}" -X "$method" \
      -H "content-type: application/json" \
      -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
      -d "${data}" "$url" || echo "000"
  fi
}

# 1) Edge: mock-feed (GET -> 200)
c="$(http_code GET "${SUPABASE_URL}/functions/v1/mock-feed")"
[[ "$c" == "200" ]] && ok "functions/mock-feed -> 200" || bad "functions/mock-feed -> $c (erwartet 200)"

# 2) Edge: fetch-feeds (POST -> 2xx)
c="$(http_code POST "${SUPABASE_URL}/functions/v1/fetch-feeds" '{}')"
[[ "$c" =~ ^2[0-9]{2}$ ]] && ok "functions/fetch-feeds -> $c" || bad "functions/fetch-feeds -> $c (erwartet 2xx)"

# 3) PostgREST (GET -> 200)
c="$(http_code GET "${SUPABASE_URL}/rest/v1/feed_items?select=id&limit=1")"
[[ "$c" == "200" ]] && ok "rest/feed_items -> 200" || bad "rest/feed_items -> $c (erwartet 200)"

echo
echo "Summary: ${pass} OK, ${fail} FAIL"
exit $(( fail > 0 ))
