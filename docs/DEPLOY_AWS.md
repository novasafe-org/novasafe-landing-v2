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
OIDC → S3 sync → CloudFront invalidation
```

## Triggers

| Trigger | Status |
|---------|--------|
| `workflow_dispatch` | **Enabled** — manual deploy with environment selection |
| `push` to `main` | **Disabled** — enable after AWS cutover is validated |

## Configuration (TODO)

Replace placeholders in `deploy-aws.yml` with CDK stack outputs after infrastructure deploy:

| Placeholder | Source |
|-------------|--------|
| `TODO_LANDING_S3_BUCKET` | `LandingStack` output `BucketName` |
| `TODO_CLOUDFRONT_DISTRIBUTION_ID` | `LandingStack` output `DistributionId` |
| `TODO_AWS_DEPLOY_ROLE_ARN` | `GitHubOidcStack` output `GitHubActionsDeployRoleArn` |

Deploy the CDK stacks from `novasafe-org/novasafe-deployment`:

```bash
cd infra-aws/cdk
npm run synth -- -c env=development
# cdk deploy novasafe-dev-landing novasafe-dev-github-oidc
```

## Build

- `npm ci`
- `npm run build`
- Output: `dist/` (Vite)

## Existing deployment

The Docker CI pipeline (`.github/workflows/ci.yml`) is **unchanged** and remains the current production path.
