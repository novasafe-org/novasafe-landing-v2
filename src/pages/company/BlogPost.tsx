import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BlogShareRail } from "@/components/blog/BlogShareRail";
import { PageShell } from "@/components/site/PageShell";
import { fetchPostBySlug, recordPostView, type PublicPost } from "@/lib/blogApi";
import { renderMarkdown } from "@/lib/renderMarkdown";
import { resolveBlogShareUrl } from "@/lib/socialShare";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PublicPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchPostBySlug(slug)
      .then(({ post: p, redirectSlug }) => {
        if (redirectSlug && redirectSlug !== slug) {
          navigate(`/blog/${redirectSlug}`, { replace: true });
          return;
        }
        setPost(p);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Post not found"))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  useEffect(() => {
    if (!slug || !post) return;
    const sessionKey = `ns:blog:viewed:${slug}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");
    void recordPostView(slug);
  }, [slug, post]);

  useEffect(() => {
    if (!slug) return;
    setShareUrl(resolveBlogShareUrl(slug));
  }, [slug]);

  return (
    <PageShell>
      <section className="pb-28 pt-4">
        <div className="container">
          {/* Single column — share rail floats in the left gutter without shifting content */}
          <div className="relative mx-auto max-w-3xl">
            <Link
              to="/blog"
              className="inline-flex items-center text-sm font-medium text-ink-soft transition-colors hover:text-primary"
            >
              ← All posts
            </Link>

            {loading && <p className="mt-12 text-ink-soft">Loading…</p>}
            {error && <p className="mt-12 text-red-600">{error}</p>}

            {post && (
              <article className="relative mt-8">
                {shareUrl ? (
                  <aside
                    aria-label="Share this post"
                    className="pointer-events-none absolute inset-y-0 right-full mr-10 hidden w-10 -translate-x-10 lg:block xl:-translate-x-14"
                  >
                    <BlogShareRail
                      url={shareUrl}
                      title={post.title}
                      variant="rail"
                      className="pointer-events-auto"
                    />
                  </aside>
                ) : null}

                <header className="mb-10">
                  {post.categoryName ? (
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-primary leading-none">
                      {post.categoryName}
                    </div>
                  ) : null}
                  <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-ink">{post.title}</h1>
                  <div className="mt-4 flex gap-3 text-sm text-ink-soft">
                    <span>{post.authorName}</span>
                    <span>·</span>
                    <span>{formatDate(post.publishedAt || post.updatedAt)}</span>
                  </div>
                  {(post.excerpt || post.seoDescription) && (
                    <p className="mt-6 text-lg leading-relaxed text-ink-soft">
                      {post.excerpt || post.seoDescription}
                    </p>
                  )}
                  {shareUrl ? (
                    <BlogShareRail
                      url={shareUrl}
                      title={post.title}
                      variant="inline"
                      className="mt-8 lg:hidden"
                    />
                  ) : null}
                </header>

                {post.featuredImage && (
                  <img
                    src={post.featuredImage}
                    alt=""
                    className="mb-10 max-h-[420px] w-full rounded-2xl object-cover"
                  />
                )}

                <div className="prose-nova">{renderMarkdown(post.contentMarkdown || "")}</div>
              </article>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
