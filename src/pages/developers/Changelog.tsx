import { useEffect, useMemo, useRef, useState } from "react";
import { Rss } from "lucide-react";

import { PageShell } from "@/components/site/PageShell";
import { GhostButton, PageHero, Section } from "@/components/site/primitives";
import { fetchPublishedChangelog, type PublicChangelogRelease } from "@/lib/changelogApi";
import { renderMarkdown } from "@/lib/renderMarkdown";
import { cn } from "@/lib/utils";

type Release = {
  v: string;
  date: string;
  displayDate: string;
  title: string;
  summary: string;
  notes: string[];
  contentMarkdown: string;
};

function toRelease(r: PublicChangelogRelease): Release {
  const date = (r.publishedAt || new Date().toISOString()).slice(0, 10);
  return {
    v: r.version,
    date,
    displayDate: new Date(date).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    title: r.title,
    summary: r.summary?.trim() || "",
    notes: r.notes.length ? r.notes : r.summary ? [r.summary] : [],
    contentMarkdown: r.contentMarkdown?.trim() || "",
  };
}

function groupByYear(data: Release[]): { year: string; items: Release[] }[] {
  const map = new Map<string, Release[]>();
  for (const release of data) {
    const year = release.date.slice(0, 4);
    const bucket = map.get(year) ?? [];
    bucket.push(release);
    map.set(year, bucket);
  }
  return [...map.entries()]
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, items]) => ({ year, items }));
}

function useRevealOnScroll() {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function TimelineRelease({ release }: { release: Release }) {
  const { ref, visible } = useRevealOnScroll();

  return (
    <article
      ref={ref}
      className={cn(
        "relative grid grid-cols-[1fr] gap-4 transition-all duration-700 ease-out sm:grid-cols-[140px_20px_minmax(0,700px)] sm:gap-x-0 pb-24 sm:pb-28",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
      )}
    >
      <time
        dateTime={release.date}
        className="shrink-0 pt-0.5 text-[14px] font-medium tabular-nums leading-snug text-ink-soft sm:text-right sm:pr-8"
      >
        {release.displayDate}
      </time>

      <div className="relative hidden sm:block">
        <span
          className="relative z-10 mx-auto mt-2 block size-[7px] rounded-full bg-primary ring-[5px] ring-background"
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 sm:pl-10">
        <div className="mb-4 flex items-center gap-3 sm:hidden">
          <span className="block size-[7px] shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wide text-primary">
            v{release.v}
          </span>
        </div>

        <span className="hidden sm:inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wide text-primary">
          v{release.v}
        </span>

        <h2 className="mt-3 text-[24px] font-semibold leading-snug tracking-tight text-ink">{release.title}</h2>

        {release.contentMarkdown ? (
          <div className="mt-5">{renderMarkdown(release.contentMarkdown)}</div>
        ) : (
          <ul className="mt-5 space-y-2.5">
            {release.notes.map((note) => (
              <li key={note} className="flex gap-3 text-[16px] leading-relaxed text-ink-soft">
                <span className="mt-[10px] size-1 shrink-0 rounded-full bg-ink/20" aria-hidden="true" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export default function ChangelogPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublishedChangelog()
      .then((items) => setReleases(items.map(toRelease)))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load changelog"))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => groupByYear(releases), [releases]);

  return (
    <PageShell>
      <PageHero
        eyebrow="Changelog"
        title={
          <>
            What&apos;s new in <span className="text-gradient-primary">NovaSafe.</span>
          </>
        }
        lede="Every feature, improvement, and bug fix shipped to NovaSafe. Subscribe via RSS for release updates."
      >
        <GhostButton href="/changelog/rss.xml" className="gap-2">
          <Rss className="size-4" />
          RSS Feed
        </GhostButton>
      </PageHero>

      <Section className="!pt-0">
        <div className="mx-auto max-w-[900px]">
          {loading && <p className="py-16 text-center text-ink-soft">Loading releases…</p>}
          {error && <p className="py-16 text-center text-red-600">{error}</p>}
          {!loading && !error && releases.length === 0 && (
            <p className="py-16 text-center text-ink-soft">No releases published yet.</p>
          )}

          {grouped.map(({ year, items }, groupIndex) => (
            <div key={year}>
              <div
                className={cn(
                  "mb-12 flex items-baseline gap-6 sm:grid sm:grid-cols-[140px_20px_minmax(0,700px)] sm:gap-x-0",
                  groupIndex > 0 && "mt-4",
                )}
              >
                <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-ink-soft/70 sm:col-start-3 sm:pl-10">
                  {year}
                </p>
              </div>

              <div className="relative">
                <div
                  className="pointer-events-none absolute bottom-0 left-[150px] top-0 hidden w-px bg-primary/20 sm:block"
                  aria-hidden="true"
                />

                {items.map((release) => (
                  <TimelineRelease key={`${release.v}-${release.date}`} release={release} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
