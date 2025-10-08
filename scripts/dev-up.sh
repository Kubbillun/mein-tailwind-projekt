#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$ROOT/.env.local}"

echo "▶ ensuring Docker Desktop…"
open -a Docker || true

echo "▶ starting supabase…"
supabase start

echo "▶ (re)starting edge runtime…"
docker rm -f supabase_edge_runtime_quickstart-crew 2>/dev/null || true
nohup supabase functions serve --env-file "$ENV_FILE" --no-verify-jwt >/tmp/edge-serve.out 2>&1 &
echo $! >/tmp/edge-serve.pid
sleep 5

echo "▶ waiting for functions to respond…"
AUTH="$(grep '^VITE_SUPABASE_ANON_KEY=' "$ENV_FILE" | cut -d= -f2-)"
URL="http://127.0.0.1:54321/functions/v1/mock-feed"
for i in {1..30}; do
  code="$(curl -s -o /dev/null -w '%{http_code}' -H "apikey: $AUTH" -H "Authorization: Bearer $AUTH" "$URL" || true)"
  [[ "$code" == "200" ]] && break
  sleep 1
done

echo "▶ health check…"
scripts/health.sh "$ENV_FILE"

echo "▶ smoke test…"
scripts/smoke.sh "$ENV_FILE"

echo "✅ dev-up ready. Start UI: npm run dev"
