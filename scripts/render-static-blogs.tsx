/**
 * Renders blog listing + article pages with the same React layout as the SPA (PageShell, header, footer).
 * Run after `vite build` so generated HTML links to /assets/*.css from the production bundle.
 */
import "./static-blog-env.ts";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { StaticBlogArticlePage } from "../src/static-blog/StaticBlogArticlePage";
import { StaticBlogIndexPage } from "../src/static-blog/StaticBlogIndexPage";
import { StaticBlogSSR } from "../src/static-blog/StaticBlogSSR";
import type { StaticBlogManifestPost } from "../src/static-blog/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = resolve(root, "content/blogs");
const distDir = resolve(root, "dist");
const blogOut = resolve(distDir, "blog");

const origin = getOrigin(process.env.PUBLIC_SITE_URL || process.env.VITE_LANDING_URL || "https://novasafe.io");

function getOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return "https://novasafe.io";
  }
}

function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugCheck(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || "")) throw new Error(`Invalid blog slug: ${slug}`);
}

function readDistAssets() {
  const indexHtml = readFileSync(resolve(distDir, "index.html"), "utf8");
  const styles = [...indexHtml.matchAll(/href="(\/assets\/[^"]+\.css)"/g)].map((m) => m[1]);
  if (!styles.length) throw new Error("Could not find /assets/*.css in dist/index.html — run vite build first");
  return { styles };
}

const FONT_LINK =
  '<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />';

const FAVICON_LINKS = `
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
`.trim();

function renderBody(location: string, children: React.ReactNode) {
  return renderToStaticMarkup(
    <StaticBlogSSR location={location}>{children}</StaticBlogSSR>,
  );
}

type HeadMeta = {
  title: string;
  description: string;
  canonical: string;
  ogType: "website" | "article";
  ogImage?: string | null;
  jsonLd?: Record<string, unknown>;
};

function buildDocument(meta: HeadMeta, body: string, styles: string[]) {
  const styleTags = styles.map((href) => `<link rel="stylesheet" crossorigin href="${href}" />`).join("\n");
  const imageTags = meta.ogImage
    ? `<meta property="og:image" content="${esc(meta.ogImage)}" /><meta name="twitter:image" content="${esc(meta.ogImage)}" />`
    : "";
  const twitterCard = meta.ogImage ? "summary_large_image" : "summary";
  const jsonLd = meta.jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c")}</script>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}" />
<meta name="robots" content="index,follow,max-image-preview:large" />
<link rel="canonical" href="${esc(meta.canonical)}" />
<meta property="og:type" content="${meta.ogType}" />
<meta property="og:site_name" content="NovaSafe" />
<meta property="og:title" content="${esc(meta.title)}" />
<meta property="og:description" content="${esc(meta.description)}" />
<meta property="og:url" content="${esc(meta.canonical)}" />
${imageTags}
<meta name="twitter:card" content="${twitterCard}" />
<meta name="twitter:title" content="${esc(meta.title)}" />
<meta name="twitter:description" content="${esc(meta.description)}" />
${FAVICON_LINKS}
${FONT_LINK}
${styleTags}
${jsonLd}
</head>
<body>
${body}
</body>
</html>
`;
}

function validateManifest(posts: StaticBlogManifestPost[]) {
  if (!Array.isArray(posts)) throw new Error("content/blogs/posts.json must be an array.");
  const seen = new Set<string>();
  for (const post of posts) {
    slugCheck(post.slug);
    if (seen.has(post.slug)) throw new Error(`Duplicate blog slug: ${post.slug}`);
    seen.add(post.slug);
    if (!post.title || !post.markdownFile || post.markdownFile.includes("/") || post.markdownFile.includes("..")) {
      throw new Error(`Invalid metadata for blog ${post.slug}`);
    }
  }
}

export function runStaticBlogRender() {
  const posts = JSON.parse(
    readFileSync(resolve(sourceDir, "posts.json"), "utf8"),
  ) as StaticBlogManifestPost[];
  validateManifest(posts);
  const { styles } = readDistAssets();

  mkdirSync(blogOut, { recursive: true });

  const indexBody = renderBody("/blog/", <StaticBlogIndexPage posts={posts} />);
  const indexHtml = buildDocument(
    {
      title: "NovaSafe Blog — Engineering, Design, and Research",
      description:
        "Long-form thinking from the team building NovaSafe. Read about password security, zero-knowledge encryption, privacy, and engineering.",
      canonical: `${origin}/blog/`,
      ogType: "website",
    },
    indexBody,
    styles,
  );
  writeFileSync(join(blogOut, "index.html"), indexHtml, "utf8");
  console.log("[static-blog] wrote dist/blog/index.html");

  for (const post of posts) {
    const markdown = readFileSync(resolve(sourceDir, post.markdownFile), "utf8");
    const canonical = `${origin}/blog/${post.slug}/`;
    const shareUrl = canonical;
    const related = posts.filter((p) => p.slug !== post.slug).slice(0, 3);
    const description =
      post.description?.trim() ||
      markdown.replace(/[#>*_`[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 155);

    const body = renderBody(
      `/blog/${post.slug}/`,
      <StaticBlogArticlePage post={post} markdown={markdown} shareUrl={shareUrl} related={related} />,
    );

    const published = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined;
    const modified = post.updatedAt ? new Date(post.updatedAt).toISOString() : published;
    const ogImage = post.featuredImage ? new URL(post.featuredImage, origin).toString() : null;

    const html = buildDocument(
      {
        title: `${post.title} | NovaSafe Blog`,
        description,
        canonical,
        ogType: "article",
        ogImage,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description,
          mainEntityOfPage: canonical,
          url: canonical,
          image: ogImage || undefined,
          datePublished: published,
          dateModified: modified,
          author: { "@type": "Organization", name: post.author || "NovaSafe", url: origin },
          publisher: { "@type": "Organization", name: "NovaSafe", url: origin },
          keywords: post.tags?.length ? post.tags.join(", ") : undefined,
        },
      },
      body,
      styles,
    );

    const target = resolve(blogOut, post.slug);
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, "index.html"), html, "utf8");
    console.log(`[static-blog] wrote dist/blog/${post.slug}/index.html`);
  }

  const sitemapPath = resolve(distDir, "sitemap.xml");
  let sitemap = readFileSync(sitemapPath, "utf8").replace(/\s*<\/urlset>\s*$/, "");
  const today = new Date().toISOString().slice(0, 10);
  const articleUrls = posts
    .map(
      (p) =>
        `  <url><loc>${esc(`${origin}/blog/${p.slug}/`)}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
    )
    .join("\n");
  if (!sitemap.includes(`${origin}/blog/`)) {
    sitemap += `\n  <url><loc>${esc(`${origin}/blog/`)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>`;
  }
  writeFileSync(sitemapPath, `${sitemap}\n${articleUrls}\n</urlset>\n`, "utf8");
  console.log(`[static-blog] updated dist/sitemap.xml (${posts.length} articles)`);
}

