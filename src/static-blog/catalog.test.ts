import { describe, expect, it } from "vitest";

import { buildCategorySections, isPublished, resolveCategorySlug } from "./catalog";
import type { StaticBlogManifestPost } from "./types";

const base = (overrides: Partial<StaticBlogManifestPost>): StaticBlogManifestPost => ({
  slug: "sample",
  title: "Sample",
  markdownFile: "sample.md",
  status: "published",
  ...overrides,
});

describe("buildCategorySections", () => {
  it("groups published posts by category slug in config order", () => {
    const posts = [
      base({ slug: "a", categorySlug: "password-security", title: "A" }),
      base({ slug: "b", categorySlug: "privacy-encryption", title: "B", featured: true }),
    ];
    const sections = buildCategorySections(posts);
    expect(sections.map((s) => s.config.slug)).toEqual(["privacy-encryption", "password-security"]);
    expect(sections[0].posts[0].slug).toBe("b");
  });

  it("excludes drafts", () => {
    const posts = [base({ slug: "draft", status: "draft", categorySlug: "privacy-encryption" })];
    expect(buildCategorySections(posts)).toHaveLength(0);
  });

  it("does not duplicate posts within a category", () => {
    const posts = [base({ slug: "one", categorySlug: "privacy-encryption" })];
    const sections = buildCategorySections(posts);
    expect(sections[0].posts).toHaveLength(1);
  });
});

describe("resolveCategorySlug", () => {
  it("defaults unknown posts to general", () => {
    expect(resolveCategorySlug(base({}))).toBe("general");
  });
});

describe("isPublished", () => {
  it("treats missing status as published", () => {
    expect(isPublished(base({ status: undefined }))).toBe(true);
  });
});
