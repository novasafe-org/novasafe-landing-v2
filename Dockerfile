# syntax=docker/dockerfile:1.7
#
# NovaSafe Landing (novasafe.io) — production image.
#
# The landing surface is a fully static SPA built by Vite: there is no
# SSR, no server functions, and no need for Node at runtime. We build the
# bundle with pnpm and copy `dist/` into a tiny `nginx:alpine` image.
#
# Build-time `VITE_*` envs are baked into the JS bundle. CI passes them
# as `--build-arg` from GitHub Actions secrets.

# -----------------------------------------------------------------------------
# Stage 1 — builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

# Pin to the same pnpm major/minor that generated `pnpm-lock.yaml`. Using
# `@latest` here previously pulled pnpm 11+, which (a) silently bypasses
# the legacy `package.json#pnpm` block and (b) ships a stricter default
# `minimumReleaseAge` than the lockfile-generation environment, both of
# which break a frozen-lockfile install.
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

WORKDIR /app

# Public URLs the landing site links to. These are NOT secrets — they're
# the marketing site, the auth subdomain, and the app subdomain, all of
# which a browser DevTools panel would show anyway. Hardcoding them here
# means:
#   - No GitHub Actions secret dance for a new server.
#   - One single place to update if a domain ever changes (this file +
#     a `git push` triggers a rebuild via the workflow).
#   - The compose file stays declarative-only (no build-args to plumb).
#
# Compose's `environment:` block cannot override these — Vite inlines
# `VITE_*` values into the JS bundle at build time, so they must be set
# in the build environment (here), not the runtime container.
ARG VITE_APP_VERSION=0.0.0

ENV NODE_ENV=production \
    VITE_LANDING_URL=https://novasafe.io \
    VITE_AUTH_URL=https://start.novasafe.io \
    VITE_APP_URL=https://app.novasafe.io \
    VITE_APP_VERSION=${VITE_APP_VERSION}

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

# Port 3100 is the cluster-wide convention for this service: the shared
# nginx reverse-proxy uses `proxy_pass http://landing:3100;` and the
# docker-compose maps the same port through to the host
# (127.0.0.1:3100) for on-box debugging.
EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider --method=HEAD http://localhost:3100/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
