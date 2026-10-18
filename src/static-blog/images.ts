import { isBlogImageFileId } from "./blog-image-file-id";
import type { StaticBlogManifestPost } from "./types";

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

export function blogImageProxyUrl(fileId: string): string {
  const id = fileId.trim();
  if (!isBlogImageFileId(id)) {
    throw new Error(`Invalid featuredImageDriveId: ${fileId}`);
  }
  return `${readApiBase()}/api/v1/blog-images/${encodeURIComponent(id)}`;
}

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
  if (!direct) return null;

  try {
    const base = landingOrigin?.replace(/\/$/, "") || "https://novasafe.io";
    return new URL(direct, base).toString();
  } catch {
    return null;
  }
}
