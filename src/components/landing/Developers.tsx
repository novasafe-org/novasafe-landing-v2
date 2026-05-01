import { Terminal as TerminalIcon, Code2, KeyRound, Workflow } from "lucide-react";

export const Developers = () => {
  return (
    <section id="developers" className="relative py-28">
      <div className="container">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
              <Code2 className="h-3 w-3" /> For developers
            </span>
            <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">
              Secrets, scoped.
              <br />
              Shipped from the terminal.
            </h2>
            <p className="mt-5 text-lg text-ink-soft">
              Pull production secrets into any process without ever writing them to disk.
              Rotate, revoke and audit — without a dashboard tab open.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: TerminalIcon, t: "First-class CLI", d: "novasafe run — inject secrets as env vars at runtime." },
                { icon: KeyRound, t: "Per-environment scopes", d: "dev, staging, prod — isolated by policy." },
                { icon: Workflow, t: "CI/CD native", d: "GitHub Actions, GitLab, CircleCI, Buildkite." },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[14.5px] font-semibold text-ink">{f.t}</div>
                    <div className="text-[13.5px] text-ink-soft">{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/20 to-primary-glow/15 blur-3xl" />
            <div className="overflow-hidden rounded-2xl border border-ink/90 bg-[#0b0f1a] shadow-elevated">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="font-mono text-[11px] text-white/40">~/app · novasafe</span>
                <span />
              </div>
              <div className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-white/80">
                <Line prompt><Cmd>novasafe</Cmd> login --sso</Line>
                <Ok>✓ Authenticated as anya@novasafe.app</Ok>
                <div className="h-3" />
                <Line prompt><Cmd>novasafe</Cmd> secrets list --env prod</Line>
                <div className="text-white/50">NAME{spaces(18)}ROTATED{spaces(6)}ACCESS</div>
                <div>STRIPE_LIVE_KEY{spaces(7)}2d ago{spaces(7)}deploy, billing</div>
                <div>DATABASE_URL{spaces(10)}14d ago{spaces(6)}api, workers</div>
                <div>JWT_SIGNING_KEY{spaces(7)}6h ago{spaces(7)}api</div>
                <div>SENTRY_DSN{spaces(12)}never{spaces(8)}all</div>
                <div className="h-3" />
                <Line prompt><Cmd>novasafe</Cmd> run --env prod -- node server.js</Line>
                <Ok>✓ 4 secrets injected (memory only)</Ok>
                <Ok>✓ Audit event recorded #ax-9f2c</Ok>
                <div className="text-primary-glow">→ server listening on :8080</div>
                <div className="mt-1 inline-flex items-center gap-1 text-white/60">
                  <span className="inline-block h-3.5 w-1.5 animate-pulse bg-primary-glow" />
                </div>
              </div>
            </div>

            <div className="absolute -right-4 -top-4 hidden rounded-xl border border-border bg-card px-3 py-2 shadow-card sm:flex sm:items-center sm:gap-2">
              <span className="flex h-2 w-2 rounded-full bg-success animate-pulse-glow" />
              <span className="text-[11.5px] font-semibold text-ink">No secrets on disk</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const spaces = (n: number) => "\u00a0".repeat(n);
const Cmd = ({ children }: { children: React.ReactNode }) => (
  <span className="text-primary-glow">{children}</span>
);
const Line = ({ children, prompt }: { children: React.ReactNode; prompt?: boolean }) => (
  <div>
    {prompt && <span className="text-white/40">$ </span>}
    {children}
  </div>
);
const Ok = ({ children }: { children: React.ReactNode }) => (
  <div className="text-success">{children}</div>
);
