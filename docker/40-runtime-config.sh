#!/bin/sh
# Writes /config.js from an allowlist of environment variables when the container starts.
# The app reads window.__APP_CONFIG__ before falling back to build-time VITE_* values.
# Everything here is public (it is served to browsers): never add secrets to this list.
set -eu

OUT="${RUNTIME_CONFIG_PATH:-/usr/share/nginx/html/config.js}"
ALLOWED="NASA_API_KEY APP_ENV FIREWEAVE_BROWSER_KEY FIREWEAVE_URL OO_SITE OO_ORG OO_APP_ID OO_CLIENT_TOKEN"

entries=""
for name in $ALLOWED; do
  eval "value=\${$name:-}"
  [ -z "$value" ] && continue
  # Keys, ids, hosts and URLs only: refuse anything that could break out of the JS string.
  if ! printf '%s' "$value" | grep -Eq '^[A-Za-z0-9_.:/@-]+$'; then
    echo "runtime-config: ignoring $name (unexpected characters)" >&2
    continue
  fi
  entries="${entries}  \"${name}\": \"${value}\",
"
done

{
  echo "// Generated at container start by 40-runtime-config.sh. Do not edit."
  echo "window.__APP_CONFIG__ = {"
  printf '%s' "$entries"
  echo "};"
} > "$OUT"

echo "runtime-config: wrote $OUT ($(printf '%s' "$entries" | grep -c '"' || true) values)" >&2
