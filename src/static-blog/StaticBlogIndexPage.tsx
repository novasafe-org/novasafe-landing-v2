import React from "react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section } from "@/components/site/primitives";
import type { StaticBlogManifestPost } from "./types";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export function StaticBlogIndexPage({ posts }: { posts: StaticBlogManifestPost[] }) {
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
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <a
              key={post.slug}
              href={`/blog/${post.slug}/`}
              className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur transition-all hover:border-primary/40 hover:shadow-card sm:p-6"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                {post.category || "Security"}
              </div>
              <h2 className="mt-2 line-clamp-2 min-h-[2.75rem] text-[17px] font-semibold leading-snug text-ink group-hover:text-primary">
                {post.title}
              </h2>
              <p className="mt-2 line-clamp-3 flex-1 text-[13.5px] leading-relaxed text-ink-soft">
                {post.description || ""}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/50 pt-4 text-[12px] text-ink-soft">
                <span className="truncate">{post.author || "NovaSafe Team"}</span>
                <span className="shrink-0">{formatDate(post.publishedAt)}</span>
              </div>
            </a>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
