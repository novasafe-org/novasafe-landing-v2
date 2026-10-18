import React from "react";
import { BlogShareRail } from "@/components/blog/BlogShareRail";
import { PageShell } from "@/components/site/PageShell";
import { renderMarkdown } from "@/lib/renderMarkdown";
import { resolveCategoryLabel } from "./catalog";
import { stripDuplicateMarkdownTitle } from "./markdown";
import type { StaticBlogManifestPost } from "./types";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function resolveFeaturedImage(origin: string, value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    return new URL(value, origin).toString();
  } catch {
    return null;
  }
}

export function StaticBlogArticlePage({
  post,
  markdown,
  shareUrl,
  related,
}: {
  post: StaticBlogManifestPost;
  markdown: string;
  shareUrl: string;
  related: StaticBlogManifestPost[];
}) {
  const body = stripDuplicateMarkdownTitle(markdown, post.title);
  const featured = resolveFeaturedImage(new URL(shareUrl).origin, post.featuredImage);

  return (
    <PageShell>
      <section className="pb-28 pt-4">
        <div className="container">
          <div className="relative mx-auto max-w-3xl">
            <a
              href="/blog/"
              className="inline-flex items-center text-sm font-medium text-ink-soft transition-colors hover:text-primary"
            >
              ← All posts
            </a>

            <article className="relative mt-8">
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

              <header className="mb-10">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-primary leading-none">
                  {resolveCategoryLabel(post)}
                </div>
                <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-ink">{post.title}</h1>
                <div className="mt-4 flex gap-3 text-sm text-ink-soft">
                  <span>{post.author || "NovaSafe Team"}</span>
                  {post.publishedAt ? (
                    <>
                      <span>·</span>
                      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                    </>
                  ) : null}
                </div>
                {post.description ? (
                  <p className="mt-6 text-lg leading-relaxed text-ink-soft">{post.description}</p>
                ) : null}
                <BlogShareRail url={shareUrl} title={post.title} variant="inline" className="mt-8 lg:hidden" />
              </header>

              {featured ? (
                <img
                  src={featured}
                  alt=""
                  className="mb-10 max-h-[420px] w-full rounded-2xl object-cover"
                />
              ) : null}

              <div className="prose-nova">{renderMarkdown(body)}</div>

              {related.length > 0 ? (
                <section className="mt-16 border-t border-border/60 pt-10" aria-labelledby="related-posts">
                  <h2 id="related-posts" className="text-lg font-semibold text-ink">Related articles</h2>
                  <ul className="mt-4 space-y-3">
                    {related.map((item) => (
                      <li key={item.slug}>
                        <a
                          href={`/blog/${item.slug}/`}
                          className="text-[15px] font-medium text-primary hover:underline"
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </article>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
