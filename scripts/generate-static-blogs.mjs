#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = resolve(root, "content/blogs");
const outputDir = resolve(root, "dist/blog");
const origin = getOrigin(process.env.PUBLIC_SITE_URL || process.env.VITE_LANDING_URL || "https://novasafe.io");

function getOrigin(value) { try { return new URL(value).origin; } catch { return "https://novasafe.io"; } }
function esc(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function slugCheck(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || "")) throw new Error("Invalid blog slug: " + slug);
}
function inline(text) {
  let value = esc(text);
  value = value.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
  value = value.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  value = value.replace(/\*(.+?)\*/g, "<em>$1</em>");
  value = value.replace(/&#96;([^&#]+)&#96;/g, "<code>$1</code>");
  return value;
}
function renderMarkdown(markdown) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [], list = [], listTag = "", quote = [];
  function flushP() { if (paragraph.length) { html.push("<p>" + paragraph.map(inline).join(" ") + "</p>"); paragraph = []; } }
  function flushL() { if (listTag) { html.push("<" + listTag + ">" + list.map(x => "<li>" + inline(x) + "</li>").join("") + "</" + listTag + ">"); list = []; listTag = ""; } }
  function flushQ() { if (quote.length) { html.push("<blockquote><p>" + quote.map(inline).join(" ") + "</p></blockquote>"); quote = []; } }
  for (const raw of lines) {
    const line = raw.trim();
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const bullet = line.match(/^[-*+]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (!line) { flushP(); flushL(); flushQ(); continue; }
    if (heading) { flushP(); flushL(); flushQ(); const n = heading[1].length; html.push("<h" + n + ">" + inline(heading[2]) + "</h" + n + ">"); continue; }
    if (line.startsWith(">")) { flushP(); flushL(); quote.push(line.replace(/^>\s?/, "")); continue; }
    if (bullet || numbered) { flushP(); flushQ(); const tag = bullet ? "ul" : "ol"; if (listTag && listTag !== tag) flushL(); listTag = tag; list.push((bullet || numbered)[1]); continue; }
    flushL(); flushQ(); paragraph.push(line);
  }
  flushP(); flushL(); flushQ();
  return html.join("\n");
}
function renderPage(post, markdown, posts) {
  const title = esc(post.title);
  const description = esc(post.description || markdown.replace(/[#>*_]/g, "").replace(/\s+/g, " ").slice(0, 155));
  const canonical = origin + "/blog/" + post.slug + "/";
  const imageMeta = post.featuredImage ? '<meta property="og:image" content="' + esc(new URL(post.featuredImage, origin).toString()) + '">' : "";
  const image = post.featuredImage ? '<img class="featured" src="' + esc(post.featuredImage) + '" alt="' + title + '">' : "";
  const tags = (post.tags || []).map(t => '<span class="tag">' + esc(t) + "</span>").join("");
  const date = post.publishedAt ? new Date(post.publishedAt).toISOString() : "";
  const dateHtml = date ? '<time datetime="' + date + '">' + new Date(date).toLocaleDateString("en-US", {year:"numeric",month:"long",day:"numeric",timeZone:"UTC"}) + "</time> · " : "";
  const schema = JSON.stringify({
    "@context":"https://schema.org", "@type":"BlogPosting", headline:post.title,
    description:post.description || undefined, mainEntityOfPage:canonical, url:canonical,
    image:post.featuredImage ? new URL(post.featuredImage, origin).toString() : undefined,
    datePublished:date || undefined, dateModified:post.updatedAt ? new Date(post.updatedAt).toISOString() : date || undefined,
    author:{"@type":"Organization",name:"NovaSafe",url:origin},
    publisher:{"@type":"Organization",name:"NovaSafe",url:origin}, keywords:(post.tags || []).join(", ") || undefined
  }).replace(/</g, "\\u003c");
  const related = posts.filter(p => p.slug !== post.slug).slice(0, 3).map(p => '<li><a href="/blog/' + p.slug + '/">' + esc(p.title) + "</a></li>").join("");
  return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>' + title + ' | NovaSafe Blog</title><meta name="description" content="' + description + '">' +
  '<meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="' + canonical + '">' +
  '<meta property="og:type" content="article"><meta property="og:site_name" content="NovaSafe"><meta property="og:title" content="' + title + '">' +
  '<meta property="og:description" content="' + description + '"><meta property="og:url" content="' + canonical + '">' + imageMeta +
  '<meta name="twitter:card" content="' + (post.featuredImage ? "summary_large_image" : "summary") + '">' +
  '<meta name="twitter:title" content="' + title + '"><meta name="twitter:description" content="' + description + '">' +
  '<script type="application/ld+json">' + schema + '</script>' +
  '<style>:root{color-scheme:light;--ink:#111827;--muted:#596579;--line:#e5eaf1;--blue:#315efb}*{box-sizing:border-box}body{margin:0;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.75}a{color:var(--blue);text-decoration:none}a:hover{text-decoration:underline}.top{border-bottom:1px solid var(--line)}nav{max-width:1120px;margin:auto;padding:20px 24px;display:flex;justify-content:space-between}.brand{font-size:20px;font-weight:800;color:var(--ink)}.links{display:flex;gap:22px;font-size:14px;font-weight:600}.links a{color:var(--muted)}main{max-width:820px;margin:auto;padding:48px 24px 80px}.back{font-size:14px;font-weight:650}.eyebrow{margin:28px 0 8px;color:var(--blue);font-size:12px;font-weight:750;letter-spacing:.12em;text-transform:uppercase}h1{font-size:clamp(2.1rem,5vw,3.25rem);line-height:1.13;letter-spacing:-.045em;margin:0 0 18px}.meta{color:var(--muted);font-size:14px;margin-bottom:26px}.tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px}.tag{font-size:12px;border:1px solid var(--line);border-radius:999px;padding:3px 10px;color:var(--muted)}.featured{width:100%;max-height:440px;object-fit:cover;border-radius:18px;margin:24px 0 38px}.content{font-size:17px;line-height:1.85;overflow-wrap:anywhere}.content h1{font-size:2rem;margin:2.3em 0 .65em}.content h2{font-size:1.65rem;line-height:1.3;letter-spacing:-.025em;margin:2.1em 0 .65em}.content h3{font-size:1.25rem;line-height:1.4;margin:1.8em 0 .5em}.content p{margin:0 0 1.25em}.content ul,.content ol{padding-left:1.5rem;margin:.2em 0 1.4em}.content li{margin:.3em 0}.content blockquote{margin:1.6em 0;padding:4px 0 4px 20px;border-left:3px solid var(--blue);font-weight:650}.content code{font-size:.9em;background:#f1f5f9;padding:.15em .35em;border-radius:5px}.more{border-top:1px solid var(--line);margin-top:48px;padding-top:28px;color:var(--muted);font-size:14px}.more h2{font-size:18px;color:var(--ink)}footer{border-top:1px solid var(--line);padding:26px 24px;text-align:center;color:var(--muted);font-size:13px}@media(max-width:560px){nav{padding:16px 18px}.links{gap:12px;font-size:13px}main{padding:34px 20px 56px}.content{font-size:16px}}</style>' +
  '</head><body><header class="top"><nav aria-label="Main navigation"><a class="brand" href="/">NovaSafe</a><div class="links"><a href="/">Home</a><a href="/blog/">Blog</a></div></nav></header><main>' +
  '<a class="back" href="/blog/">← All articles</a><p class="eyebrow">NovaSafe Blog</p><h1>' + title + '</h1><div class="meta">' + dateHtml + 'NovaSafe</div>' +
  (tags ? '<div class="tags" aria-label="Article tags">' + tags + '</div>' : "") + image +
  '<article class="content">' + renderMarkdown(markdown) + '</article><section class="more"><h2>Explore more</h2><p>Read more security and engineering articles on the <a href="/blog/">NovaSafe Blog</a>, or <a href="/">learn more about NovaSafe</a>.</p>' +
  (related ? '<h2>Related articles</h2><ul>' + related + '</ul>' : "") + '</section></main><footer>© ' + new Date().getUTCFullYear() + ' NovaSafe. Your data belongs to you.</footer></body></html>\n';
}
function main() {
  const manifest = JSON.parse(readFileSync(resolve(sourceDir, "posts.json"), "utf8"));
  if (!Array.isArray(manifest)) throw new Error("content/blogs/posts.json must be an array.");
  const seen = new Set();
  for (const post of manifest) {
    slugCheck(post.slug);
    if (seen.has(post.slug)) throw new Error("Duplicate blog slug: " + post.slug);
    seen.add(post.slug);
    if (!post.title || !post.markdownFile || post.markdownFile.includes("/") || post.markdownFile.includes("..")) throw new Error("Invalid metadata for blog " + post.slug);
  }
  mkdirSync(outputDir, {recursive:true});
  for (const post of manifest) {
    const markdown = readFileSync(resolve(sourceDir, post.markdownFile), "utf8");
    const target = resolve(outputDir, post.slug);
    mkdirSync(target, {recursive:true});
    writeFileSync(join(target, "index.html"), renderPage(post, markdown, manifest), "utf8");
    console.log("[static-blog] wrote dist/blog/" + post.slug + "/index.html");
  }
  const sitemapPath = resolve(root, "dist/sitemap.xml");
  let sitemap = readFileSync(sitemapPath, "utf8").replace(/\s*<\/urlset>\s*$/, "");
  const today = new Date().toISOString().slice(0,10);
  const urls = manifest.map(p => '  <url><loc>' + esc(origin + "/blog/" + p.slug + "/") + '</loc><lastmod>' + today + '</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>').join("\n");
  writeFileSync(sitemapPath, sitemap + "\n" + urls + "\n</urlset>\n", "utf8");
  console.log("[static-blog] generated " + manifest.length + " HTML pages and updated dist/sitemap.xml");
}
try { main(); } catch (error) { console.error("[static-blog] generation failed:", error); process.exit(1); }
