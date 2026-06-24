import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section } from "@/components/site/primitives";
import { fetchPublishedPosts, type PublicPost } from "@/lib/blogApi";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export default function Blog() {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublishedPosts()
      .then(setPosts)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load blog"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <PageHero
        eyebrow="Blog"
        title={
          <>
            Engineering, design, <span className="text-gradient-primary">and research.</span>
          </>
        }
        lede="Long-form thinking from the team building NovaSafe. No marketing fluff."
      />
      <Section className="!pt-0">
        {loading && <p className="text-center text-ink-soft py-16">Loading posts…</p>}
        {error && <p className="text-center text-red-600 py-16">{error}</p>}
        {!loading && !error && posts.length === 0 && (
          <p className="text-center text-ink-soft py-16">No published posts yet. Check back soon.</p>
        )}
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              to={`/blog/${p.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur transition-all hover:border-primary/40 hover:shadow-card sm:p-6"
            >
              {p.categoryName ? (
                <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">{p.categoryName}</div>
              ) : null}
              <h3 className="mt-2 line-clamp-2 min-h-[2.75rem] text-[17px] font-semibold leading-snug text-ink group-hover:text-primary">
                {p.title}
              </h3>
              <p className="mt-2 line-clamp-3 flex-1 text-[13.5px] leading-relaxed text-ink-soft">
                {p.excerpt || p.seoDescription || ""}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/50 pt-4 text-[12px] text-ink-soft">
                <span className="truncate">{p.authorName}</span>
                <span className="shrink-0">{formatDate(p.publishedAt || p.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
