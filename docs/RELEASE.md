# Release workflow

Releases are automated when a PR merges to `main`:

1. `.github/workflows/release-on-merge.yml` calls the reusable workflow in `novasafe-org/novasafe-deployment`.
2. Version bump is derived from ticket labels on the PR (`type:fix` → patch, `type:feature` → minor).
3. A `chore(release): vX.Y.Z [skip release]` commit, tag, and GitHub Release are created.

**Note:** Re-running a failed release job does not re-fetch an updated reusable workflow. Merge a new PR (or merge the deployment workflow fix first) to retry.
