# AWS Landing Deployment

Deploy the NovaSafe landing site to **AWS S3 + CloudFront** in parallel with the existing Docker/Nginx production deployment.

## Workflow

`.github/workflows/deploy-aws.yml` calls the reusable workflow in `novasafe-deployment`:

```
GitHub
  ↓
deploy-aws.yml (this repo)
  ↓
novasafe-deployment/deploy-frontend-aws.yml
  ↓
pnpm build (VITE_* from GitHub Environment) → runtime-config.js → OIDC → S3 sync → CloudFront invalidation
```

## Triggers

| Trigger | Status |
|---------|--------|
| `workflow_dispatch` | **Enabled** — manual deploy |
| `push` to `main` | **Disabled** — enable after AWS cutover is validated |

## Configuration

### Repository Variables

Settings → Secrets and variables → Actions → **Variables**

| Variable | Example |
|----------|---------|
| `AWS_ROLE_ARN` | `arn:aws:iam::793239449172:role/NovaSafeGitHubDeployRole` |
| `AWS_REGION` | `ap-south-1` |

### Environment Variables

Settings → Environments → **production** → **Environment variables**

| Variable | Example |
|----------|---------|
| `VITE_LANDING_URL` | `https://novasafe.io` |
| `VITE_AUTH_URL` | `https://start.novasafe.io` |
| `VITE_APP_URL` | `https://app.novasafe.io` |
| `VITE_API_URL` | `https://mobile-api.novasafe.io` |
| `VITE_APP_VERSION` | `1.1.5` (optional) |
| `PUBLIC_SITE_URL` | `https://novasafe.io` (optional — sitemap origin override) |

These are **public browser URLs** (same as `.env.example`). They are baked into the Vite build at deploy time.

### Stack outputs (in `deploy-aws.yml`)

| Field | Value |
|-------|--------|
| `s3-bucket` | `novasafe-prod-bucket-landing-793239449172` |
| `cloudfront-distribution-id` | `E3T09WYDY825ZE` |
| `generate-runtime-config` | `true` — writes `/runtime-config.js` for S3 (required for blog/status API URLs) |

## CSP / API connectivity

Blog and status pages call `https://mobile-api.novasafe.io`. CloudFront must allow that origin in `connect-src` (`https://*.novasafe.io` in `novasafe-deployment` `cloudfront-policies.ts`).

If `/blog` or `/status` show **Failed to fetch** after an infra change, redeploy the **Landing** CDK stack from `novasafe-deployment` (Deploy Infrastructure → Landing), then run **Deploy AWS** here.

## Build

- `pnpm install --frozen-lockfile`
- `pnpm run build` with `VITE_*` from the `production` environment
- Output: `dist/` (Vite)

## Existing deployment

The Docker CI pipeline (`.github/workflows/ci.yml`) is **unchanged** and remains the current production path.
