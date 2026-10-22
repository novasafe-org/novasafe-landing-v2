# Static blog sync (CMS → landing site)

The marketing site blog at `/blog` is **static**: files under `content/blogs/` plus `pnpm build` (see `scripts/render-static-blogs.tsx`). Posts created in the admin CMS or via n8n only appear on the website after this content is updated and **Deploy AWS** runs.

## Local / manual

```bash
pnpm static-blog:sync
pnpm build
```

`static-blog:sync` calls `GET https://mobile-api.novasafe.io/api/v1/blog/posts` (published only) and writes:

- `content/blogs/<slug>.md`
- `content/blogs/posts.json`
- updates `content/blogs/categories.json` when the CMS uses a new category slug

## Automatic (recommended for n8n)

1. Merge the **Sync static blogs** workflow (`.github/workflows/sync-static-blogs.yml`).
2. Create a GitHub fine-grained PAT (or classic `repo` scope) for `novasafe-org/novasafe-landing-v2` with **Contents: Read and write**.
3. In n8n, after **Post a Blog** succeeds, add an **HTTP Request** node:

| Field | Value |
|--------|--------|
| Method | `POST` |
| URL | `https://api.github.com/repos/novasafe-org/novasafe-landing-v2/dispatches` |
| Authentication | Header Auth — `Authorization: Bearer <PAT>` |
| Headers | `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28` |
| Body (JSON) | `{ "event_type": "sync-static-blog", "client_payload": { "slug": "{{ $('Post a Blog').item.json.data.slug }}" } }` |

What happens:

1. GitHub Actions runs `scripts/sync-static-blogs-from-api.mjs`.
2. If `content/blogs` changed, it commits to `main`.
3. The same workflow runs **Deploy AWS** (S3 + CloudFront) when there were changes — so you do not rely on a second workflow trigger after the bot push.

Typical delay: a few minutes for sync + build + deploy.

You can also run **Sync static blogs** manually from the Actions tab (`workflow_dispatch`).

## Notes

- Only **published** posts are synced. Drafts stay in the admin UI only.
- Featured images use slug-based URLs (`/api/v1/blog-images/by-slug/<slug>`) when `featured_image` is empty; upload `{slug}.jpg` to Google Drive in n8n as you do today.
- CMS slug suffixes (e.g. `what-is-cybersecurity-...-2`) are used as-is for URLs and filenames.
