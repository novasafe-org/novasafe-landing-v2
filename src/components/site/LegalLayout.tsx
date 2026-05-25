import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "./PageShell";

export type Section = { id: string; title: string; body: ReactNode };

export const LegalLayout = ({
  title, updated, intro, sections,
}: { title: string; updated: string; intro: ReactNode; sections: Section[] }) => (
  <PageShell>
    <section className="border-b border-border/60 pb-10 pt-4">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to NovaSafe
          </Link>
          <div className="mt-8 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-primary">Legal</div>
          <h1 className="mt-3 text-balance text-[36px] font-semibold leading-tight tracking-tight text-ink sm:text-[44px]">
            {title}
          </h1>
          <p className="mt-4 font-mono text-[12.5px] text-muted-foreground">Effective · {updated}</p>
          <p className="mt-6 text-[16px] leading-[1.75] text-ink-soft">{intro}</p>
        </div>
      </div>
    </section>

    <section className="pb-28 pt-12">
      <div className="container">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block lg:sticky lg:top-28 lg:self-start">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Contents</div>
            <nav className="mt-3 space-y-0.5 border-l border-border/60 pl-3">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block rounded px-2 py-1.5 text-[13px] text-ink-soft transition-colors hover:text-primary"
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>
          <article className="max-w-3xl">
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                className="scroll-mt-32 border-b border-border/60 py-10 first:pt-0 last:border-0 last:pb-0"
              >
                <div className="text-[12px] font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</div>
                <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-ink sm:text-[26px]">
                  {s.title}
                </h2>
                <div className="mt-5 space-y-4">{s.body}</div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </section>
  </PageShell>
);
