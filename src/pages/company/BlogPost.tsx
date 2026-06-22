import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageShell } from "@/components/site/PageShell";
import { Section } from "@/components/site/primitives";
import { fetchPostBySlug, type PublicPost } from "@/lib/blogApi";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function renderMarkdown(md: string) {
  return md
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, i) => {
      if (block.startsWith("# ")) return <h2 key={i} className="text-2xl font-semibold mt-8 mb-3 text-ink">{block.slice(2)}</h2>;
      if (block.startsWith("## ")) return <h3 key={i} className="text-xl font-semibold mt-6 mb-2 text-ink">{block.slice(3)}</h3>;
      if (block.startsWith("![")) {
        const m = block.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
        if (m) return <img key={i} src={m[2]} alt={m[1]} className="my-6 rounded-xl w-full" />;
      }
      return (
        <p key={i} className="text-[16px] leading-relaxed text-ink-soft mb-4 whitespace-pre-wrap">
          {block}
        </p>
      );
    });
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
