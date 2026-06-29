import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageShell } from "@/components/site/PageShell";
import { Section } from "@/components/site/primitives";
import { fetchPostBySlug, recordPostView, type PublicPost } from "@/lib/blogApi";
import { renderMarkdown } from "@/lib/renderMarkdown";

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

  return (
    <PageShell>
      <Section className="!pt-12">
        <article className="mx-auto max-w-3xl">
          <Link to="/blog" className="text-sm text-ink-soft hover:text-primary">
            ← All posts
          </Link>

          {loading && <p className="mt-12 text-ink-soft">Loading…</p>}
          {error && <p className="mt-12 text-red-600">{error}</p>}

          {post && (
            <>
              <header className="mt-8 mb-10">
                {post.categoryName ? (
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">{post.categoryName}</div>
                ) : null}
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink text-balance">{post.title}</h1>
                <div className="mt-4 flex gap-3 text-sm text-ink-soft">
                  <span>{post.authorName}</span>
                  <span>·</span>
                  <span>{formatDate(post.publishedAt || post.updatedAt)}</span>
                </div>
                {(post.excerpt || post.seoDescription) && (
                  <p className="mt-6 text-lg text-ink-soft leading-relaxed">{post.excerpt || post.seoDescription}</p>
                )}
              </header>

              {post.featuredImage && (
                <img src={post.featuredImage} alt="" className="w-full rounded-2xl mb-10 object-cover max-h-[420px]" />
              )}

              <div className="prose-nova">{renderMarkdown(post.contentMarkdown || "")}</div>
            </>
          )}
        </article>
      </Section>
    </PageShell>
  );
}
