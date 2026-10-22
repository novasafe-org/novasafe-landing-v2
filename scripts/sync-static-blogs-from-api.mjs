#!/usr/bin/env node
/**
 * Pull published posts from the public blog API and write `content/blogs/*.md` + `posts.json`.
 * New CMS categories are appended to `categories.json` when missing.
 *
 * Env: VITE_API_URL | API_URL (default https://mobile-api.novasafe.io)
 *      SYNC_BLOG_DRY_RUN=1 — log changes without writing files
 */

import {
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const contentDir = resolve(projectRoot, "content/blogs");
const postsJsonPath = resolve(contentDir, "posts.json");
const categoriesJsonPath = resolve(contentDir, "categories.json");

const DEFAULT_API = "https://mobile-api.novasafe.io";
const apiBase = (process.env.VITE_API_URL || process.env.API_URL || DEFAULT_API).replace(/\/$/, "");
const blogBase = `${apiBase}/api/v1/blog`;
const dryRun = process.env.SYNC_BLOG_DRY_RUN === "1" || process.env.SYNC_BLOG_DRY_RUN === "true";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertSlug(slug) {
  if (!SLUG_RE.test(slug || "")) throw new Error(`Invalid blog slug: ${slug}`);
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(path, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (dryRun) {
    console.log(`[dry-run] would write ${path}`);
    return;
  }
  writeFileSync(path, text, "utf8");
}

function writeText(path, text) {
  if (dryRun) {
    console.log(`[dry-run] would write ${path} (${text.length} bytes)`);
    return;
  }
  writeFileSync(path, text, "utf8");
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} → ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.success === false) throw new Error(`${url} → API error`);
  return json;
}

async function fetchAllPublishedPosts() {
  const posts = [];
  let page = 1;
  const perPage = 50;

  for (;;) {
    const { data, meta } = await fetchJson(`${blogBase}/posts?status=published&perPage=${perPage}&page=${page}`);
    posts.push(...(data || []));
    const totalPages = meta?.totalPages ?? 1;
    if (page >= totalPages) break;
    page += 1;
  }

  return posts.filter((p) => (p.status || "published") === "published");
}

function excerptFromPost(post) {
  const direct = post.excerpt?.trim() || post.seo_description?.trim();
  if (direct) return direct;
  const md = (post.content_markdown || "").replace(/^#+\s+.+$/m, "").trim();
  const plain = md.replace(/[#*_`[\]()]/g, "").replace(/\s+/g, " ").trim();
  if (!plain) return undefined;
  return plain.length > 200 ? `${plain.slice(0, 197)}…` : plain;
}

function markdownFileForSlug(slug) {
  return `${slug}.md`;
}

function mergeCategories(existing, apiCategories, usedSlugs) {
  const bySlug = new Map(existing.map((c) => [c.slug, c]));
  for (const cat of apiCategories) {
    const slug = cat.slug?.trim();
    if (!slug || !usedSlugs.has(slug) || bySlug.has(slug)) continue;
    bySlug.set(slug, {
      slug,
      label: cat.name?.trim() || slug.replace(/-/g, " "),
      description: cat.description?.trim() || undefined,
    });
  }
  const merged = [...existing];
  for (const cat of bySlug.values()) {
    if (!existing.some((e) => e.slug === cat.slug)) merged.push(cat);
  }
  return merged;
}

function buildManifestPost(post, categorySlug, previousBySlug) {
  const slug = post.slug;
  assertSlug(slug);
  const prev = previousBySlug.get(slug);
  const authorName =
    typeof post.author === "object" && post.author?.name
      ? post.author.name
      : typeof post.author === "string"
        ? post.author
        : prev?.author;

  return {
    slug,
    title: post.title,
    markdownFile: markdownFileForSlug(slug),
    description: excerptFromPost(post) ?? prev?.description,
    featuredImage: post.featured_image ?? prev?.featuredImage ?? null,
    tags: prev?.tags ?? [],
    categorySlug: categorySlug || prev?.categorySlug,
    author: authorName || "NovaSafe Team",
    publishedAt: post.published_at || post.created_at || prev?.publishedAt,
    updatedAt: post.updated_at || prev?.updatedAt,
    featured: prev?.featured ?? false,
    status: "published",
  };
}

function removeOrphanMarkdowns(activeMarkdownFiles) {
  const active = new Set(activeMarkdownFiles);
  for (const name of readdirSync(contentDir)) {
    if (!name.endsWith(".md")) continue;
    if (active.has(name)) continue;
    const full = resolve(contentDir, name);
    if (dryRun) {
      console.log(`[dry-run] would delete orphan ${full}`);
      continue;
    }
    unlinkSync(full);
    console.log(`removed orphan ${name}`);
  }
}

async function main() {
  mkdirSync(contentDir, { recursive: true });

  const [posts, categoriesPayload] = await Promise.all([
    fetchAllPublishedPosts(),
    fetchJson(`${blogBase}/categories`),
  ]);

  const apiCategories = categoriesPayload.data || [];
  const categoryIdToSlug = new Map(
    apiCategories.map((c) => [c.id, c.slug?.trim()]).filter(([, slug]) => slug),
  );

  const previousPosts = readJson(postsJsonPath, []);
  const previousBySlug = new Map(previousPosts.map((p) => [p.slug, p]));

  const manifest = [];
  const usedCategorySlugs = new Set();

  for (const post of posts) {
    const catSlug = post.category_id ? categoryIdToSlug.get(post.category_id) : undefined;
    if (catSlug) usedCategorySlugs.add(catSlug);
    const entry = buildManifestPost(post, catSlug, previousBySlug);
    manifest.push(entry);

    const mdPath = resolve(contentDir, entry.markdownFile);
    const body = post.content_markdown ?? "";
    if (!body.trim()) {
      console.warn(`warn: post ${post.slug} has empty content_markdown — skipping file write`);
      continue;
    }
    const normalized = body.endsWith("\n") ? body : `${body}\n`;
    writeText(mdPath, normalized);
  }

  manifest.sort((a, b) => {
    const dateA = Date.parse(a.updatedAt || a.publishedAt || "") || 0;
    const dateB = Date.parse(b.updatedAt || b.publishedAt || "") || 0;
    return dateB - dateA;
  });

  const existingCategories = readJson(categoriesJsonPath, []);
  const mergedCategories = mergeCategories(existingCategories, apiCategories, usedCategorySlugs);

  writeJson(postsJsonPath, manifest);
  writeJson(categoriesJsonPath, mergedCategories);
  removeOrphanMarkdowns(manifest.map((p) => p.markdownFile));

  console.log(
    `synced ${manifest.length} published post(s) to content/blogs (${dryRun ? "dry-run" : "written"})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
