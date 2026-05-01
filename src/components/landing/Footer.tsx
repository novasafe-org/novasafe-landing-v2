import { Logo } from "./Logo";

const cols = [
  { t: "Product", l: ["Features", "Pricing", "Security", "Changelog", "Roadmap"] },
  { t: "Developers", l: ["CLI", "API reference", "SDKs", "Status", "Open source"] },
  { t: "Company", l: ["About", "Customers", "Careers", "Press", "Contact"] },
  { t: "Legal", l: ["Privacy", "Terms", "Refund policy", "Cookies", "Acceptable use"] },
];

export const Footer = () => (
  <footer className="border-t border-border/70 bg-surface-1/60 pt-20 pb-8">
    <div className="container">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_3fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-ink-soft">
            Your digital life — sealed with zero-knowledge encryption.
            Only you can open it.
          </p>
          <a href="mailto:support@novasafe.app" className="mt-4 inline-block font-mono text-[12.5px] text-primary hover:underline">
            support@novasafe.app
          </a>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {cols.map((c) => (
            <div key={c.t}>
              <div className="text-[11.5px] font-semibold uppercase tracking-wider text-ink">{c.t}</div>
              <ul className="mt-4 space-y-2.5">
                {c.l.map((i) => (
                  <li key={i}>
                    <a href="#" className="text-[13.5px] text-ink-soft transition-colors hover:text-primary">
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border/70 pt-6 sm:flex-row sm:items-center">
        <div className="text-[12px] text-muted-foreground">
          © 2026 NovaSafe Technologies. All rights reserved.
        </div>
        <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
            All systems operational
          </span>
          <span className="text-border">·</span>
          <span>Made with security in mind</span>
        </div>
      </div>
    </div>
  </footer>
);