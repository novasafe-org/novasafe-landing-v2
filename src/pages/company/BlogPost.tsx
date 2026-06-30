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
      <section className="border-b border-border/60 pb-10 pt-4">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <Link
              to="/blog"
              className="inline-flex items-center text-sm font-medium text-ink-soft transition-colors hover:text-primary"
            >
              ← All posts
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-28 pt-10">
        <div className="container">
          {loading && <p className="mx-auto max-w-3xl text-ink-soft">Loading…</p>}
          {error && <p className="mx-auto max-w-3xl text-red-600">{error}</p>}

          {post && (
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[56px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[72px_minmax(0,1fr)]">
              {shareUrl ? (
                <BlogShareRail
                  url={shareUrl}
                  title={post.title}
                  variant="rail"
                  className="hidden lg:block"
                />
              ) : null}

              <article className="min-w-0 max-w-3xl">
                <header className="mb-10">
                  {post.categoryName ? (
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
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
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
