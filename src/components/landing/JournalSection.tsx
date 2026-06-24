import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";

import { inkCtaButtonClass, InkCtaArrow } from "@/components/site/primitives";
import { LANDING_ROUTES } from "@/config";
import { JOURNAL_POSTS } from "@/data/journal-posts";
import { cn } from "@/lib/utils";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function JournalSection() {
  const posts = JOURNAL_POSTS.slice(0, 3);

  return (
    <section
      id="journal"
      className="relative bg-background py-24 sm:py-32"
      aria-labelledby="journal-heading"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid bg-grid-fade opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[360px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/10 via-primary-glow/5 to-transparent blur-3xl" />

      <div className="container">
        <header className="mx-auto max-w-2xl text-center">
          <p className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary shadow-sm">
              <BookOpen className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              From the journal
            </span>
          </p>
          <h2
            id="journal-heading"
            className="mt-5 text-balance text-[32px] font-semibold tracking-tight text-ink sm:text-4xl lg:text-[44px]"
          >
            Engineering, security{" "}
            <span className="text-gradient-primary">and research.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-[15px] leading-relaxed text-ink-soft sm:text-[17px]">
            Insights on password security, passkeys, encryption, digital identity protection and the
            technology behind NovaSafe.
          </p>
        </header>

        <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <motion.article
              key={post.slug}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={cardVariants}
              className="h-full"
            >
              <Link
                to={`${LANDING_ROUTES.blog}/${post.slug}`}
                className={cn(
                  "group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-6 shadow-sm",
                  "transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md hover:shadow-primary/[0.06]",
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {post.category}
                </p>
                <h3 className="mt-3 line-clamp-3 text-[18px] font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-primary sm:text-[19px]">
                  {post.title}
                </h3>
                <p className="mt-3 line-clamp-3 flex-1 text-[14px] leading-relaxed text-ink-soft">
                  {post.excerpt}
                </p>
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                  <span className="text-[12.5px] font-medium text-ink-soft">
                    {post.readingTimeMinutes} min read
                  </span>
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition-all group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary"
                    aria-hidden
                  >
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link to={LANDING_ROUTES.blog} className={inkCtaButtonClass("px-5 py-2.5 text-[14px]")}>
            View all articles
            <InkCtaArrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default JournalSection;
