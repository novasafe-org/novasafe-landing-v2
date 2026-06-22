#!/bin/sh
# Generate runtime-config.js from container env (server .env via docker-compose).
set -e

LANDING_URL="${VITE_LANDING_URL:-https://novasafe.io}"
AUTH_URL="${VITE_AUTH_URL:-https://start.novasafe.io}"
APP_URL="${VITE_APP_URL:-https://app.novasafe.io}"
API_URL="${VITE_API_URL:-https://mobile-api.novasafe.io}"
APP_VERSION="${VITE_APP_VERSION:-0.0.0}"

escape_js() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__NS_PUBLIC_ENV__={
  "VITE_LANDING_URL":"$(escape_js "$LANDING_URL")",
  "VITE_AUTH_URL":"$(escape_js "$AUTH_URL")",
  "VITE_APP_URL":"$(escape_js "$APP_URL")",
  "VITE_API_URL":"$(escape_js "$API_URL")",
  "VITE_APP_VERSION":"$(escape_js "$APP_VERSION")"
};
EOF

exec /docker-entrypoint.sh "$@"
