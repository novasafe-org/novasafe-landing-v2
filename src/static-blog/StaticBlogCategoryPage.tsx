import React from "react";
import { PageShell } from "@/components/site/PageShell";
import { Section } from "@/components/site/primitives";
import { BlogArticleCard } from "./BlogArticleCard";
import type { BlogCategoryConfig, StaticBlogManifestPost } from "./types";

export function StaticBlogCategoryPage({
  category,
  posts,
}: {
  category: BlogCategoryConfig;
  posts: StaticBlogManifestPost[];
}) {
  return (
    <PageShell>
      <Section className="!pb-8 !pt-12 sm:!pt-16">
        <div className="mx-auto max-w-6xl">
          <a
            href="/blog/"
            className="inline-flex items-center text-sm font-medium text-ink-soft transition-colors hover:text-primary"
          >
            ← All blog topics
          </a>
          <header className="mt-8 max-w-3xl">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {category.label}
            </h1>
            {category.description ? (
              <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">{category.description}</p>
            ) : null}
            <div className="mt-6 h-1 w-14 rounded-full bg-primary" aria-hidden />
          </header>
        </div>
      </Section>
      <Section className="!pt-0">
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogArticleCard key={post.slug} post={post} />
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
