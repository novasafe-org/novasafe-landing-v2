import { Link } from "react-router-dom";
import { PageShell } from "@/components/site/PageShell";

/**
 * Diagnostic fallback only. Published blog URLs must be served by the generated
 * static HTML files in dist/blog, not rendered by the React SPA or fetched from an API.
 */
export default function BlogPostPage() {
  return (
    <PageShell>
      <section className="pb-28 pt-4">
        <div className="container mx-auto max-w-3xl">
          <Link
            to="/blog/"
            className="inline-flex items-center text-sm font-medium text-ink-soft transition-colors hover:text-primary"
          >
            ← All posts
          </Link>
          <div className="mt-12 rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
            <h1 className="text-xl font-semibold">Static blog page was not served</h1>
            <p className="mt-2 text-sm leading-relaxed">
              This URL reached the React application instead of its generated HTML file.
              Check the production build output and S3/CloudFront routing for this blog path.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
