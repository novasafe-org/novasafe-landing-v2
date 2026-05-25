import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { PageShell } from "./PageShell";
import { cn } from "@/lib/utils";

export type DocsNavGroup = { label: string; items: { label: string; href: string }[] };

export const DocsLayout = ({
  nav, title, lede, children,
}: { nav: DocsNavGroup[]; title: string; lede?: string; children: ReactNode }) => {
  const { pathname } = useLocation();
  return (
    <PageShell>
      <div className="container">
        <div className="grid gap-10 py-12 lg:grid-cols-[240px_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="space-y-6">
              {nav.map((g) => (
                <div key={g.label}>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{g.label}</div>
                  <nav className="mt-2 space-y-1">
                    {g.items.map((i) => (
                      <Link
                        key={i.href}
                        to={i.href}
                        className={cn(
                          "block rounded-lg px-3 py-1.5 text-[13.5px] transition-colors",
                          pathname === i.href ? "bg-primary/10 text-primary" : "text-ink-soft hover:bg-secondary hover:text-ink"
                        )}
                      >
                        {i.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
          </aside>
          <article className="min-w-0">
            <h1 className="text-[34px] font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
            {lede && <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">{lede}</p>}
            <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-ink-soft">{children}</div>
          </article>
        </div>
      </div>
    </PageShell>
  );
};

export const CodeBlock = ({ lang = "bash", code }: { lang?: string; code: string }) => (
  <div className="overflow-hidden rounded-xl border border-border/70 bg-surface-2/80 shadow-sm">
    <div className="flex items-center justify-between border-b border-border/70 px-4 py-2 font-mono text-[11.5px] uppercase tracking-wider text-ink-soft">
      <span>{lang}</span>
      <span className="text-muted-foreground">Copy</span>
    </div>
    <pre className="overflow-x-auto p-4 font-mono text-[13px] text-ink"><code>{code}</code></pre>
  </div>
);
