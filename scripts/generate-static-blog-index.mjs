#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const manifest = JSON.parse(readFileSync(resolve(root, "content/blogs/posts.json"), "utf8"));
const origin = new URL(process.env.PUBLIC_SITE_URL || process.env.VITE_LANDING_URL || "https://novasafe.io").origin;
const esc = (value = "") => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const cards = manifest.map((post) => {
  const markdown = readFileSync(resolve(root, "content/blogs", post.markdownFile), "utf8");
  const excerpt = post.description || markdown.replace(/^#+\s.*$/gm, "").replace(/[>*_`#]/g, "").replace(/\s+/g, " ").trim().slice(0, 190);
  const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) : "";
  return '<a class="card" href="/blog/' + esc(post.slug) + '/"><span class="category">' + esc(post.category || "SECURITY") + '</span><h2>' + esc(post.title) + '</h2><p>' + esc(excerpt) + '</p><div class="meta"><span>' + esc(post.author || "NovaSafe Team") + '</span><span>' + esc(date) + '</span></div></a>';
}).join("\n");
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NovaSafe Blog — Engineering, Design, and Research</title>
<meta name="description" content="Long-form thinking from the team building NovaSafe. Read about password security, zero-knowledge encryption, privacy, and engineering.">
<link rel="canonical" href="${origin}/blog/">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:site_name" content="NovaSafe">
<meta property="og:title" content="NovaSafe Blog — Engineering, Design, and Research">
<meta property="og:description" content="Long-form thinking from the team building NovaSafe. No marketing fluff.">
<meta property="og:url" content="${origin}/blog/"><meta name="twitter:card" content="summary">
<style>
*{box-sizing:border-box}body{margin:0;background:#f9fafb;color:#111827;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.6}
a{color:inherit;text-decoration:none}.top{height:32px;background:#ff6257;color:white;text-align:center;font-size:11px;font-weight:700;letter-spacing:.04em;padding:6px 12px}
nav{max-width:1120px;margin:auto;padding:24px;display:flex;justify-content:space-between;align-items:center}.brand{font-size:18px;font-weight:800;color:#101828}.navlinks{display:flex;gap:26px;font-size:13px;font-weight:600}.navlinks a{color:#253047}
.hero{text-align:center;padding:86px 24px 72px}.eyebrow{display:inline-block;border:1px solid #e5eaf1;border-radius:999px;padding:3px 14px;color:#315efb;font-size:11px;font-weight:750;letter-spacing:.08em}.hero h1{font-size:clamp(2.5rem,6vw,3.8rem);line-height:1.05;letter-spacing:-.05em;max-width:780px;margin:22px auto}.hero h1 span{color:#3975f6}.hero p{color:#344054;font-size:17px;margin:20px auto 0;max-width:650px}
.grid{max-width:1020px;margin:0 auto;padding:0 24px 96px;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}.card{background:#fff;border:1px solid #e6eaf0;border-radius:17px;padding:22px;display:flex;flex-direction:column;min-height:215px;transition:border-color .15s,box-shadow .15s}.card:hover{border-color:#9ab6ff;box-shadow:0 8px 24px #1018280d}.category{font-size:10px;font-weight:750;letter-spacing:.08em;color:#315efb}.card h2{font-size:16px;line-height:1.4;margin:8px 0 14px}.card p{font-size:13px;line-height:1.65;color:#344054;margin:0 0 18px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.meta{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #edf0f4;padding-top:14px;margin-top:auto;font-size:11px;color:#475467}.footer{border-top:1px solid #e5eaf1;padding:36px 24px;color:#344054;font-size:13px}
@media(max-width:600px){nav{padding:18px}.navlinks{gap:12px}.hero{padding:55px 20px 48px}.grid{padding:0 18px 64px}}
</style></head><body><div class="top">FEATURED ON PRODUCT HUNT · LOVE NOVASAFE? HELP US GROW WITH A REVIEW.</div>
<header><nav><a class="brand" href="/">◉ NovaSafe</a><div class="navlinks"><a href="/">Home</a><a href="/blog/">Blog</a><a href="/pricing">Pricing</a><a href="/contact">Contact</a></div></nav></header>
<main><section class="hero"><span class="eyebrow">● BLOG</span><h1>Engineering, design,<br><span>and research.</span></h1><p>Long-form thinking from the team building NovaSafe. No marketing fluff.</p></section>
<section class="grid" aria-label="Blog articles">${cards}</section></main><footer class="footer">© ${new Date().getUTCFullYear()} NovaSafe. Your digital life — sealed with zero-knowledge.</footer></body></html>\n`;
writeFileSync(resolve(root, "dist/blog/index.html"), html, "utf8");
console.log("[static-blog-index] generated dist/blog/index.html with " + manifest.length + " articles");
