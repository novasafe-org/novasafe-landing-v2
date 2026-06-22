/**
 * Public blog reads via core API proxy — admin-api is never called from the browser.
 * Core: GET /api/v1/blog/posts, /posts/:slug, /categories
 */
const CORE_API = (import.meta.env.VITE_API_URL || "http://localhost:3125").replace(/\/$/, "");
const BLOG_BASE = `${CORE_API}/api/v1/blog`;

export type PublicPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentMarkdown: string;
  featuredImage: string | null;
  status: string;
  categoryName: string;
  authorName: string;
  publishedAt: string | null;
  updatedAt: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

type PostDto = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_markdown: string;
  featured_image: string | null;
  status: string;
  category_id: string | null;
  author: { name: string };
  published_at: string | null;
  updated_at: string;
  seo_title: string | null;
  seo_description: string | null;
};

type CategoryDto = { id: string; name: string; slug: string };

type ApiList<T> = { success: boolean; data: T; meta?: { total?: number } };
type ApiOne<T> = { success: boolean; data: T; meta?: { redirect_slug?: string }; message?: string };

/** Rewrite admin-api media URLs to the core blog media proxy. */
export function rewriteBlogMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/^(https?:\/\/[^/]+)\/api\/v1\/media\//, `${BLOG_BASE}/media/`);
}

function rewriteMarkdownMedia(md: string): string {
  return md.replace(
    /(\]\()(https?:\/\/[^/]+\/api\/v1\/media\/[^)]+)(\))/g,
    (_m, pre, url, post) => `${pre}${rewriteBlogMediaUrl(url)}${post}`,
  );
}

function mapPost(dto: PostDto, categoryName: string): PublicPost {
  return {
    id: dto.id,
    title: dto.title,
    slug: dto.slug,
    excerpt: dto.excerpt,
    contentMarkdown: rewriteMarkdownMedia(dto.content_markdown || ""),
    featuredImage: rewriteBlogMediaUrl(dto.featured_image),
    status: dto.status,
    categoryName,
    authorName: dto.author?.name || "NovaSafe",
    publishedAt: dto.published_at,
    updatedAt: dto.updated_at,
    seoTitle: dto.seo_title,
    seoDescription: dto.seo_description,
  };
}

export async function fetchPublishedPosts(): Promise<PublicPost[]> {
  const [postsRes, categories] = await Promise.all([
    fetch(`${BLOG_BASE}/posts?perPage=50`, { headers: { Accept: "application/json" } }).then(
      (r) => r.json(),
    ) as Promise<ApiList<PostDto[]>>,
    fetch(`${BLOG_BASE}/categories`, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .catch(() => ({ data: [] as CategoryDto[] })) as Promise<ApiList<CategoryDto[]>>,
  ]);
  const catMap = new Map((categories.data || []).map((c) => [c.id, c.name]));
  return (postsRes.data || []).map((p) =>
    mapPost(p, p.category_id ? catMap.get(p.category_id) ?? "" : ""),
  );
}

export async function fetchPostBySlug(slug: string): Promise<{ post: PublicPost; redirectSlug?: string }> {
  const res = await fetch(`${BLOG_BASE}/posts/${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" },
  });
  const json = (await res.json()) as ApiOne<PostDto>;
  if (!res.ok) throw new Error(json?.message || "Post not found");

  let categoryName = "";
  if (json.data.category_id) {
    try {
      const cats = (await fetch(`${BLOG_BASE}/categories`).then((r) => r.json())) as ApiList<CategoryDto[]>;
      categoryName = cats.data?.find((c) => c.id === json.data.category_id)?.name ?? "";
    } catch {
      categoryName = "";
    }
  }

  return {
    post: mapPost(json.data, categoryName),
    redirectSlug: json.meta?.redirect_slug,
  };
}
