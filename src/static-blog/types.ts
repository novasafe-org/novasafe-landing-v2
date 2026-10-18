export type BlogCategoryConfig = {
  slug: string;
  label: string;
  description?: string;
};

export type StaticBlogManifestPost = {
  slug: string;
  title: string;
  markdownFile: string;
  description?: string;
  featuredImage?: string | null;
  tags?: string[];
  /** Primary category slug — must match `content/blogs/categories.json` when set. */
  categorySlug?: string;
  /** Legacy display label; ignored when `categorySlug` resolves via categories config. */
  category?: string;
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  featured?: boolean;
  status?: "draft" | "published";
};

export type BlogCategorySection = {
  config: BlogCategoryConfig;
  posts: StaticBlogManifestPost[];
};
