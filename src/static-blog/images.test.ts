import { describe, expect, it } from "vitest";

import { blogFeaturedImageUrlForSlug, blogImageProxyUrl, resolveBlogFeaturedImageUrl } from "./images";
import type { StaticBlogManifestPost } from "./types";

describe("resolveBlogFeaturedImageUrl", () => {
  const basePost: StaticBlogManifestPost = {
    slug: "what-is-zero-knowledge-encryption",
    title: "Sample",
    markdownFile: "sample.md",
  };

  it("uses slug-based API URL by default (no manifest fields)", () => {
    process.env.VITE_API_URL = "https://mobile-api.novasafe.io";
    const url = resolveBlogFeaturedImageUrl(basePost);
    expect(url).toBe(
      "https://mobile-api.novasafe.io/api/v1/blog-images/by-slug/what-is-zero-knowledge-encryption",
    );
  });

  it("builds mobile-api proxy URLs from Drive file ids when set", () => {
    process.env.VITE_API_URL = "https://mobile-api.novasafe.io";
    const url = resolveBlogFeaturedImageUrl({
      ...basePost,
      featuredImageDriveId: "1a2B3c4D5e6F7g8H9i0J_k-l",
    });
    expect(url).toBe(
      "https://mobile-api.novasafe.io/api/v1/blog-images/1a2B3c4D5e6F7g8H9i0J_k-l",
    );
  });

  it("prefers Drive id over slug URL", () => {
    process.env.VITE_API_URL = "https://mobile-api.novasafe.io";
    const url = resolveBlogFeaturedImageUrl({
      ...basePost,
      featuredImageDriveId: "abcdefghijklmnop",
    });
    expect(url).toContain("/api/v1/blog-images/abcdefghijklmnop");
  });

  it("resolves relative featuredImage against landing origin", () => {
    const url = resolveBlogFeaturedImageUrl(
      { ...basePost, featuredImage: "/images/blog/cover.png" },
      "https://novasafe.io",
    );
    expect(url).toBe("https://novasafe.io/images/blog/cover.png");
  });

  it("returns null for invalid Drive ids", () => {
    expect(
      resolveBlogFeaturedImageUrl({ ...basePost, featuredImageDriveId: "bad" }),
    ).toBeNull();
  });
});

describe("blogFeaturedImageUrlForSlug", () => {
  it("returns null for invalid slugs", () => {
    expect(blogFeaturedImageUrlForSlug("Bad Slug!")).toBeNull();
  });
});

describe("blogImageProxyUrl", () => {
  it("throws on invalid ids", () => {
    expect(() => blogImageProxyUrl("tiny")).toThrow(/Invalid featuredImageDriveId/);
  });
});
