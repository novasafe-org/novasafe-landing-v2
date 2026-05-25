import { ReactNode } from "react";
import { PageShell } from "./PageShell";
import { Eyebrow } from "./primitives";

export type Section = { id: string; title: string; body: ReactNode };

export const LegalLayout = ({
  title, updated, intro, sections,
}: { title: string; updated: string; intro: ReactNode; sections: Section[] }) => (
  <PageShell>
    <section className="relative pb-10 pt-8">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-50" />
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <Eyebrow>Legal</Eyebrow>
          <h1 className="mt-4 text-balance text-[36px] font-semibold tracking-tight text-ink sm:text-5xl">{title}</h1>
          <p className="mt-3 font-mono text-[12.5px] text-muted-foreground">Last updated · {updated}</p>
          <p className="mt-6 text-[16px] leading-relaxed text-ink-soft">{intro}</p>
        </div>
      </div>
    </section>

    <section className="pb-28">
      <div className="container">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[240px_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Contents</div>
            <nav className="mt-3 space-y-1.5">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="block rounded-lg px-3 py-1.5 text-[13.5px] text-ink-soft transition-colors hover:bg-secondary hover:text-ink">
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>
          <article className="prose-content max-w-3xl">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-32 border-b border-border/60 py-10 first:pt-0 last:border-0">
                <h2 className="text-[22px] font-semibold tracking-tight text-ink sm:text-2xl">{s.title}</h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink-soft">{s.body}</div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </section>
  </PageShell>
);
