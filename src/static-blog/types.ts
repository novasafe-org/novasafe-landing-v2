export type StaticBlogManifestPost = {
  slug: string;
  title: string;
  markdownFile: string;
  description?: string;
  featuredImage?: string | null;
  tags?: string[];
  category?: string;
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
};
