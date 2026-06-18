# syntax=docker/dockerfile:1.7
#
# NovaSafe Landing (novasafe.io) — production image.
#
# Static SPA built by Vite, served by in-container nginx.
# Public URLs are NOT baked from GitHub secrets — production defaults are used
# at build time only (for sitemap/robots). Runtime values come from the server
# `.env` via docker-compose → entrypoint → runtime-config.js.

# -----------------------------------------------------------------------------
# Stage 1 — builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

WORKDIR /app

# Build-time defaults only — overridden at container start from server .env.
ENV NODE_ENV=production \
    VITE_LANDING_URL=https://novasafe.io \
    VITE_AUTH_URL=https://start.novasafe.io \
    VITE_APP_URL=https://app.novasafe.io \
    VITE_APP_VERSION=0.0.0

COPY package.json pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store-landing,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 2 — runner (nginx)
# -----------------------------------------------------------------------------
FROM nginx:alpine AS runner

RUN apk add --no-cache wget && rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /custom-entrypoint.sh
RUN chmod +x /custom-entrypoint.sh

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider --method=HEAD http://localhost:3100/health || exit 1

ENTRYPOINT ["/custom-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
