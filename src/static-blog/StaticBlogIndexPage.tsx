import React from "react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section } from "@/components/site/primitives";
import { cn } from "@/lib/utils";
import { BlogArticleCard } from "./BlogArticleCard";
import {
  BLOG_INDEX_PREVIEW_COUNT,
  buildCategorySections,
  categoryPagePath,
  getBlogCategories,
} from "./catalog";
import type { StaticBlogManifestPost } from "./types";

export function StaticBlogIndexPage({ posts }: { posts: StaticBlogManifestPost[] }) {
  const sections = buildCategorySections(posts);
  const categoryNav = getBlogCategories().filter((c) =>
    sections.some((s) => s.config.slug === c.slug),
  );

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

      {categoryNav.length > 1 ? (
        <Section className="!py-8 sm:!py-10">
          <nav
            className="mx-auto flex max-w-6xl flex-wrap justify-center gap-2"
            aria-label="Blog categories"
          >
            {categoryNav.map((cat) => (
              <a
                key={cat.slug}
                href={`#category-${cat.slug}`}
                className="rounded-full border border-border/80 bg-card/60 px-3.5 py-1.5 text-[12px] font-semibold text-ink-soft transition-colors hover:border-primary/30 hover:text-primary"
              >
                {cat.label}
              </a>
            ))}
          </nav>
        </Section>
      ) : null}

      {sections.map((section, index) => {
        const preview = section.posts.slice(0, BLOG_INDEX_PREVIEW_COUNT);
        const hasMore = section.posts.length > BLOG_INDEX_PREVIEW_COUNT;
        return (
          <Section
            key={section.config.slug}
            id={`category-${section.config.slug}`}
            className={cn(
              "!pt-0",
              index > 0 && "border-t border-border/40",
              index % 2 === 1 && "bg-surface-2/40",
            )}
            container={false}
          >
            <div className="container">
              <header className="mx-auto max-w-6xl text-center sm:text-left">
                <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
                  {section.config.label}
                </h2>
                {section.config.description ? (
                  <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft sm:mx-0 mx-auto">
                    {section.config.description}
                  </p>
                ) : null}
                <div className="mx-auto mt-5 h-1 w-12 rounded-full bg-primary sm:mx-0" aria-hidden />
              </header>

              <div className="mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {preview.map((post) => (
                  <BlogArticleCard
                    key={post.slug}
                    post={post}
                    featured={Boolean(post.featured)}
                  />
                ))}
              </div>

              {hasMore ? (
                <p className="mx-auto mt-10 max-w-6xl text-center sm:text-left">
                  <a
                    href={categoryPagePath(section.config.slug)}
                    className="text-[14px] font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    See all {section.config.label} articles →
                  </a>
                </p>
              ) : section.posts.length > 0 ? (
                <p className="mx-auto mt-10 max-w-6xl text-center sm:text-left">
                  <a
                    href={categoryPagePath(section.config.slug)}
                    className="text-[14px] font-semibold text-ink-soft underline-offset-4 transition-colors hover:text-primary hover:underline"
                  >
                    Browse {section.config.label} articles →
                  </a>
                </p>
              ) : null}
            </div>
          </Section>
        );
      })}
    </PageShell>
  );
}
