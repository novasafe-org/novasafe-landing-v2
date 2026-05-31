import { useEffect, useMemo, useRef, useState } from "react";
import { Rss } from "lucide-react";

import { PageShell } from "@/components/site/PageShell";
import { GhostButton, PageHero, Section } from "@/components/site/primitives";
import { cn } from "@/lib/utils";

type Release = {
  v: string;
  date: string;
  displayDate: string;
  title: string;
  notes: string[];
};

const releases: Release[] = [
  {
    v: "2026.6.2",
    date: "2026-05-30",
    displayDate: "May 30, 2026",
    title: "Extension autofill and inline credential suggestions",
    notes: [
      "Browser extension now detects login forms and credential fields (username, email, password) on websites you visit.",
      "Matched logins are resolved locally from your synced vault — no extra API calls at autofill time.",
      "Inline suggestion popup appears when you focus a login field; choose a credential before anything is filled.",
      "Even a single matching login requires explicit selection, matching modern password manager behavior.",
      "Keyboard support: Arrow Up/Down to navigate, Enter to fill, Escape to dismiss.",
      "Suggestion UI supports light and dark themes with NovaSafe styling; passwords are never shown in the list.",
    ],
  },
  {
    v: "2026.6.1",
    date: "2026-05-28",
    displayDate: "May 28, 2026",
    title: "Brand logo unification and vault detail polish",
    notes: [
      "Moved web logo source to landing (`/logo.svg`) and wired auth + app to consume it.",
      "Refined vault detail layout: title bar stays full-width while field content remains centered.",
      "Increased responsive side spacing for detail fields on large screens.",
      "Fixed view-mode hover flicker by reserving action-icon space for copy/reveal controls.",
    ],
  },
  {
    v: "2026.6",
    date: "2026-05-28",
    displayDate: "May 28, 2026",
    title: "Faster vault UX and stricter session handling",
    notes: [
      "Removed dummy-data flashes and added first-load skeletons in Vault.",
      "Improved item creation UX: save button now shows loading and is disabled while API is pending.",
      "Auth routes are now guest-only when already signed in (redirect to app).",
      "Web sessions now expire after 30 minutes with forced logout redirect.",
      "Prevented cross-account data flashes by clearing persisted vault state on logout/user switch.",
    ],
  },
  {
    v: "2025.34",
    date: "2025-05-28",
    displayDate: "May 28, 2026",
    title: "Faster vault UX and stricter session handling",
    notes: [
      "Removed dummy-data flashes and added first-load skeletons in Vault.",
      "Improved item creation UX: save button now shows loading and is disabled while API is pending.",
      "Auth routes are now guest-only when already signed in (redirect to app).",
      "Web sessions now expire after 30 minutes with forced logout redirect.",
      "Prevented cross-account data flashes by clearing persisted vault state on logout/user switch.",
    ],
  }
];

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
      {/* Date */}
      <time
        dateTime={release.date}
        className="shrink-0 pt-0.5 text-[14px] font-medium tabular-nums leading-snug text-ink-soft sm:text-right sm:pr-8"
      >
        {release.displayDate}
      </time>

      {/* Timeline rail — dot sits on the shared spine */}
      <div className="relative hidden sm:block">
        <span
          className="relative z-10 mx-auto mt-2 block size-[7px] rounded-full bg-primary ring-[5px] ring-background"
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="min-w-0 sm:pl-10">
        <div className="mb-4 flex items-center gap-3 sm:hidden">
          <span
            className="block size-[7px] shrink-0 rounded-full bg-primary"
            aria-hidden="true"
          />
          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wide text-primary">
            v{release.v}
          </span>
        </div>

        <span className="hidden sm:inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wide text-primary">
          v{release.v}
        </span>

        <h2 className="mt-3 text-[24px] font-semibold leading-snug tracking-tight text-ink">
          {release.title}
        </h2>

        <ul className="mt-5 space-y-2.5">
          {release.notes.map((note) => (
            <li key={note} className="flex gap-3 text-[16px] leading-relaxed text-ink-soft">
              <span className="mt-[10px] size-1 shrink-0 rounded-full bg-ink/20" aria-hidden="true" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function ChangelogPage() {
  const grouped = useMemo(() => groupByYear(releases), []);

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
                  {/* Continuous spine behind timeline column */}
                  <div
                    className="pointer-events-none absolute bottom-0 left-[150px] top-0 hidden w-px bg-primary/20 sm:block"
                    aria-hidden="true"
                  />

                  {items.map((release) => (
                    <TimelineRelease key={release.v} release={release} />
                  ))}
                </div>
              </div>
            ))}
          </div>
      </Section>
    </PageShell>
  );
}
