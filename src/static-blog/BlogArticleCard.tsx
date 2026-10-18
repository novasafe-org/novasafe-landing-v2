import React from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveCategoryLabel } from "./catalog";
import { resolveBlogFeaturedImageUrl } from "./images";
import type { StaticBlogManifestPost } from "./types";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function BlogArticleCard({
  post,
  featured = false,
  className,
}: {
  post: StaticBlogManifestPost;
  featured?: boolean;
  className?: string;
}) {
  const showFeatured = featured || Boolean(post.featured);
  const href = `/blog/${post.slug}/`;
  const categoryLabel = resolveCategoryLabel(post);
  const featuredImage = resolveBlogFeaturedImageUrl(post);

  return (
    <a
      href={href}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/80 backdrop-blur transition-all hover:border-primary/40 hover:shadow-card",
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2">
        {featuredImage ? (
          <img
            src={featuredImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-surface-2 to-primary-glow/10"
            aria-hidden
          >
            <FileText className="h-10 w-10 text-primary/35" strokeWidth={1.5} />
          </div>
        )}
        {showFeatured ? (
          <span
            className="absolute left-3 top-3 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm"
          >
            Featured
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">{categoryLabel}</div>
        <h3 className="mt-2 line-clamp-2 text-[17px] font-semibold leading-snug text-ink group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-[13.5px] leading-relaxed text-ink-soft">
          {post.description || ""}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/50 pt-4 text-[12px] text-ink-soft">
          <span className="truncate">{post.author || "NovaSafe Team"}</span>
          <span className="shrink-0">{formatDate(post.publishedAt)}</span>
        </div>
      </div>
    </a>
  );
}
