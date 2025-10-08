#!/usr/bin/env bash
set -euo pipefail

echo "▶ stopping edge serve…"
if [[ -f /tmp/edge-serve.pid ]]; then
  kill "$(cat /tmp/edge-serve.pid)" 2>/dev/null || true
  rm -f /tmp/edge-serve.pid
fi
docker rm -f supabase_edge_runtime_quickstart-crew 2>/dev/null || true

echo "▶ stopping supabase (containers stay available via 'supabase stop' if needed)…"
# Optional: komplett stoppen (inkl. DB/Studio). Auskommentiert lassen, falls du DB anlassen willst.
# supabase stop

echo "▶ killing vite on 5173…"
kill-port 5173 || true

echo "✅ dev-down done."
