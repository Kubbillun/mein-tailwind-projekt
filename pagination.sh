#!/usr/bin/env bash
set -euo pipefail

# --- ENV auto-load (vor Var-Checks) ---
if [ -z "${PROJECT_REF:-}" ] || [ -z "${SB_ANON_KEY:-}" ]; then
  if [ -f "${BASH_SOURCE%/*}/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    . "${BASH_SOURCE%/*}/.env"
    set +a
  elif [ -f "./.env" ]; then
    set -a
    # shellcheck disable=SC1091
    . ./.env
    set +a
  fi
fi

: "${PROJECT_REF:?PROJECT_REF fehlt}"
: "${SB_ANON_KEY:?SB_ANON_KEY fehlt}"

curl_base="https://${PROJECT_REF}.supabase.co/rest/v1/feed_items_public"
hdr_apikey="apikey: ${SB_ANON_KEY}"
hdr_auth="Authorization: Bearer ${SB_ANON_KEY}"

# --- helpers for app-integrated diagnostics ---
diagnose() {
  echo "== diagnose =="
  echo "PROJECT_REF=${PROJECT_REF}"
  # decode JWT payload (base64url)
  local payload
  payload="$(printf '%s' "${SB_ANON_KEY}" | awk -F. '{print $2}' | tr '_-' '/+' | sed -E 's/[^=]{0,2}$/&&/' | base64 -D 2>/dev/null || true)"
  echo "JWT.payload=${payload:-<decode-failed>}"
  # extract "ref" if present and compare
  local ref_in_token
  ref_in_token="$(printf '%s' "$payload" | jq -r '.ref // empty' 2>/dev/null || true)"
  if [ -n "$ref_in_token" ] && [ "$ref_in_token" != "$PROJECT_REF" ]; then
    echo "WARN: ref in token ($ref_in_token) != PROJECT_REF ($PROJECT_REF)" >&2
  fi
  # quick API probe
  local status
  status="$(curl -s -o /dev/null -w '%{http_code}' "https://${PROJECT_REF}.supabase.co/rest/v1/" -H "$hdr_apikey" -H "$hdr_auth" || true)"
  echo "REST probe status=${status}"
  echo "== /diagnose =="
}
# only bash supports `export -f`; guard to avoid zsh failing under `set -e`
if [ -n "${BASH_VERSION:-}" ]; then
  export -f diagnose
fi

ping_rest() {
  curl -fsS --compressed -I "https://${PROJECT_REF}.supabase.co/rest/v1/" \
    -H "$hdr_apikey" -H "$hdr_auth"
}

smoke() {
  # minimal end-to-end probe with auth headers
  local url="${curl_base}?select=id&limit=1"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' "$url" -H "$hdr_apikey" -H "$hdr_auth" || true)
  echo "SMOKE http_code=${code} url=$url"
  case "$code" in
    200|206) return 0 ;;
    401) echo "HINT: 401 -> SB_ANON_KEY/PROJECT_REF falsch oder falscher Projekt-Ref im Token" >&2 ; return 1 ;;
    404) echo "HINT: 404 -> Tabelle/Schema-Name stimmt nicht (feed_items_public?)" >&2 ; return 1 ;;
    000) echo "HINT: 000 -> Netzwerk/DNS/Proxy Problem" >&2 ; return 1 ;;
    *) echo "HINT: Unerwarteter Status ${code}" >&2 ; return 1 ;;
  esac
}
# --- end helpers ---

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "tool fehlt: $1" >&2; exit 1; }
}
require curl
require jq

fetch_first() {
  local LIMIT="${1:-10}"
  local f; f="$(mktemp)"
  curl -fsS --compressed \
    "${curl_base}?select=*&order=inserted_at.desc,id.desc&limit=${LIMIT}" \
    -H "$hdr_apikey" -H "$hdr_auth" \
  | tee "$f" | jq
  export LAST_TS LAST_ID
  LAST_TS="$(jq -r '.[-1].inserted_at // empty' "$f")"
  LAST_ID="$(jq -r '.[-1].id // empty'          "$f")"
  rm -f "$f"
  >&2 echo "LAST_TS=${LAST_TS}"
  >&2 echo "LAST_ID=${LAST_ID}"
}

fetch_page() {
  local LAST_TS="$1"; local LAST_ID="$2"; local LIMIT="${3:-10}"
  local TS_ENC="${LAST_TS//+/%2B}"
  curl -fsS --compressed \
    "${curl_base}?select=*&order=inserted_at.desc,id.desc&limit=${LIMIT}&and=(inserted_at.lt.${TS_ENC},id.lt.${LAST_ID})" \
    -H "$hdr_apikey" -H "$hdr_auth" \
  | jq
}

fetch_all() {
  local LIMIT="${1:-100}"
  local f; f="$(mktemp)"

  curl -fsS --compressed \
    "${curl_base}?select=*&order=inserted_at.desc,id.desc&limit=${LIMIT}" \
    -H "$hdr_apikey" -H "$hdr_auth" \
  | tee "$f" | jq

  export LAST_TS LAST_ID
  LAST_TS="$(jq -r '.[-1].inserted_at // empty' "$f")"
  LAST_ID="$(jq -r '.[-1].id // empty'          "$f")"

  while [[ -n "$LAST_TS" && -n "$LAST_ID" && "$(jq 'length' "$f")" -gt 0 ]]; do
    local TS_ENC="${LAST_TS//+/%2B}"
    curl -fsS --compressed \
      "${curl_base}?select=*&order=inserted_at.desc,id.desc&limit=${LIMIT}&and=(inserted_at.lt.${TS_ENC},id.lt.${LAST_ID})" \
      -H "$hdr_apikey" -H "$hdr_auth" \
    | tee "$f" | jq

    LAST_TS="$(jq -r '.[-1].inserted_at // empty' "$f")"
    LAST_ID="$(jq -r '.[-1].id // empty'          "$f")"
  done

  rm -f "$f"
}