import { isBlogImageFileId } from "./blog-image-file-id";
import type { StaticBlogManifestPost } from "./types";

const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readApiBase(): string {
  const fromProcess =
    typeof process !== "undefined" && process.env?.VITE_API_URL
      ? process.env.VITE_API_URL
      : undefined;
  const fromImportMeta =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
      ? String(import.meta.env.VITE_API_URL)
      : undefined;
  return (fromProcess || fromImportMeta || "https://mobile-api.novasafe.io").replace(/\/$/, "");
}

/** Public URL — admin-api resolves `{slug}.png` (etc.) in Google Drive when the page loads. */
export function blogFeaturedImageUrlForSlug(slug: string): string | null {
  const normalized = slug.trim().toLowerCase();
  if (!BLOG_SLUG_PATTERN.test(normalized)) return null;
  return `${readApiBase()}/api/v1/blog-images/by-slug/${encodeURIComponent(normalized)}`;
}

export function blogImageProxyUrl(fileId: string): string {
  const id = fileId.trim();
  if (!isBlogImageFileId(id)) {
    throw new Error(`Invalid featuredImageDriveId: ${fileId}`);
  }
  return `${readApiBase()}/api/v1/blog-images/${encodeURIComponent(id)}`;
}

/**
 * Featured image URL baked into static HTML at build time.
 * Default: slug-based Drive lookup (upload `{slug}.png` to the blog images folder).
 */
export function resolveBlogFeaturedImageUrl(
  post: StaticBlogManifestPost,
  landingOrigin?: string,
): string | null {
  const driveId = post.featuredImageDriveId?.trim();
  if (driveId) {
    try {
      return blogImageProxyUrl(driveId);
    } catch {
      return null;
    }
  }

  const direct = post.featuredImage?.trim();
  if (direct) {
    try {
      const base = landingOrigin?.replace(/\/$/, "") || "https://novasafe.io";
      return new URL(direct, base).toString();
    } catch {
      return null;
    }
  }

  return blogFeaturedImageUrlForSlug(post.slug);
}
