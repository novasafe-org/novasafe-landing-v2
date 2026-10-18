import staticBlogManifest from "../../../content/blogs/posts.json";
import { StaticBlogIndexPage } from "@/static-blog/StaticBlogIndexPage";

/**
 * Client-side fallback when /blog is served through the SPA router.
 * Production page loads use dist/blog/index.html generated at build time.
 */
export default function Blog() {
  return <StaticBlogIndexPage posts={staticBlogManifest} />;
}
