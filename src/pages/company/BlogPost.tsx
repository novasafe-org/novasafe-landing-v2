import { Link } from "react-router-dom";
import { PageShell } from "@/components/site/PageShell";

/**
 * Published article URLs must be served from dist/blog/<slug>/index.html.
 * This warning makes SPA fallback / routing mistakes visible during verification.
 */
export default function BlogPostPage() {
  return (
    <PageShell>
      <section className="pb-28 pt-4">
        <div className="container mx-auto max-w-3xl">
          <Link
            to="/blog"
            className="inline-flex items-center text-sm font-medium text-ink-soft transition-colors hover:text-primary"
          >
            ← All posts
          </Link>
          <div className="mt-12 rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
            <h1 className="text-xl font-semibold">Static blog page was not served</h1>
            <p className="mt-2 text-sm leading-relaxed">
              This URL reached the React application instead of the generated HTML file. Check the production build
              output and S3/CloudFront routing for this blog path.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
