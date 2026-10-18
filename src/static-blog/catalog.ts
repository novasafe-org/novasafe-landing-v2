import categoriesConfig from "../../content/blogs/categories.json";
import type { BlogCategoryConfig, BlogCategorySection, StaticBlogManifestPost } from "./types";

export const BLOG_INDEX_PREVIEW_COUNT = 4;
export const DEFAULT_CATEGORY_SLUG = "general";

const categoryBySlug = new Map(
  (categoriesConfig as BlogCategoryConfig[]).map((c) => [c.slug, c] as const),
);

export function getBlogCategories(): BlogCategoryConfig[] {
  return categoriesConfig as BlogCategoryConfig[];
}

export function resolveCategorySlug(post: StaticBlogManifestPost): string {
  if (post.categorySlug?.trim()) return post.categorySlug.trim();
  return DEFAULT_CATEGORY_SLUG;
}

export function resolveCategoryLabel(post: StaticBlogManifestPost): string {
  const slug = resolveCategorySlug(post);
  const fromConfig = categoryBySlug.get(slug);
  if (fromConfig) return fromConfig.label;
  if (post.category?.trim()) return post.category.trim();
  return "General";
}

export function getCategoryConfig(slug: string): BlogCategoryConfig | undefined {
  return categoryBySlug.get(slug);
}

export function isPublished(post: StaticBlogManifestPost): boolean {
  return (post.status ?? "published") === "published";
}

function sortPosts(posts: StaticBlogManifestPost[]): StaticBlogManifestPost[] {
  return [...posts].sort((a, b) => {
    const featuredDelta = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    if (featuredDelta !== 0) return featuredDelta;
    const dateA = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const dateB = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    if (dateB !== dateA) return dateB - dateA;
    return a.title.localeCompare(b.title);
  });
}

/** Group published posts into category sections in configured order; append unknown categories at the end. */
export function buildCategorySections(posts: StaticBlogManifestPost[]): BlogCategorySection[] {
  const published = posts.filter(isPublished);
  const buckets = new Map<string, StaticBlogManifestPost[]>();

  for (const post of published) {
    const slug = resolveCategorySlug(post);
    const list = buckets.get(slug) ?? [];
    list.push(post);
    buckets.set(slug, list);
  }

  const sections: BlogCategorySection[] = [];
  const seen = new Set<string>();

  for (const config of getBlogCategories()) {
    const bucket = buckets.get(config.slug);
    if (!bucket?.length) continue;
    seen.add(config.slug);
    sections.push({ config, posts: sortPosts(bucket) });
  }

  for (const [slug, bucket] of buckets) {
    if (seen.has(slug) || !bucket.length) continue;
    sections.push({
      config: {
        slug,
        label: bucket[0].category?.trim() || slug.replace(/-/g, " "),
      },
      posts: sortPosts(bucket),
    });
  }

  return sections;
}

export function categoryPagePath(slug: string): string {
  return `/blog/category/${slug}/`;
}
