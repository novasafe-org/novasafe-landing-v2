import { Lock, Globe, Github, CreditCard, Key, Shield, Check, Wifi, Plus, Search } from "lucide-react";

const entries = [
  { icon: Github, name: "GitHub Enterprise", user: "team@novasafe.app", tag: "Work", color: "from-slate-700 to-slate-900" },
  { icon: Globe, name: "Cloudflare", user: "ops@novasafe.app", tag: "Infra", color: "from-orange-400 to-amber-600" },
  { icon: CreditCard, name: "Stripe Live Keys", user: "sk_live_••••4f2a", tag: "API", color: "from-indigo-500 to-violet-600" },
  { icon: Key, name: "Production SSH", user: "deploy@prod-eu-1", tag: "Server", color: "from-emerald-500 to-teal-600" },
];

export const VaultPreview = () => {
  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      {/* Glow */}
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/30 via-primary-glow/20 to-transparent blur-3xl" />

      {/* Main vault card */}
      <div className="glass-strong relative overflow-hidden rounded-[1.75rem] border border-border/70 shadow-elevated">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-border/60 bg-surface-1/60 px-5 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-secondary/70 px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
            <Lock className="h-3 w-3 text-success" />
            vault.novasafe.app
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Wifi className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="grid grid-cols-12">
          {/* Sidebar */}
          <aside className="col-span-4 hidden border-r border-border/60 bg-surface-1/40 p-4 sm:block">
            <div className="flex items-center gap-2 rounded-lg bg-background/80 px-2.5 py-2 text-[12px] text-muted-foreground ring-1 ring-border">
              <Search className="h-3.5 w-3.5" /> Search vault…
            </div>
            <nav className="mt-4 space-y-0.5 text-[12.5px]">
              {[
                { label: "All items", count: 142, active: true },
                { label: "Logins", count: 86 },
                { label: "Secrets", count: 31 },
                { label: "Cards", count: 7 },
                { label: "Notes", count: 18 },
              ].map((i) => (
                <div
                  key={i.label}
                  className={`flex items-center justify-between rounded-md px-2.5 py-1.5 ${
                    i.active ? "bg-primary/10 text-primary" : "text-ink-soft hover:bg-secondary/60"
                  }`}
                >
                  <span className="font-medium">{i.label}</span>
                  <span className="text-[10.5px] opacity-70">{i.count}</span>
                </div>
              ))}
            </nav>
            <div className="mt-5 rounded-lg border border-border/70 bg-background/60 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-success">
                <Shield className="h-3.5 w-3.5" /> Vault healthy
              </div>
              <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground">
                0 weak · 0 reused · 2 alerts resolved
              </p>
            </div>
          </aside>

          {/* Main list */}
          <main className="col-span-12 p-4 sm:col-span-8">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-semibold tracking-tight text-ink">All items</h3>
                <p className="text-[11px] text-muted-foreground">Encrypted on this device</p>
              </div>
              <button className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm">
                <Plus className="h-3 w-3" /> New
              </button>
            </div>

            <ul className="space-y-1.5">
              {entries.map((e, i) => (
                <li
                  key={e.name}
                  className="group flex items-center gap-3 rounded-lg border border-transparent bg-background/50 p-2.5 ring-1 ring-border/60 transition-all hover:border-primary/40 hover:shadow-sm"
                  style={{ animation: `fade-up 0.6s ${0.1 + i * 0.08}s both` }}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br ${e.color} text-white shadow-sm`}>
                    <e.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[12.5px] font-semibold text-ink">{e.name}</span>
                      <span className="rounded bg-secondary px-1.5 py-px text-[9.5px] font-medium text-muted-foreground">
                        {e.tag}
                      </span>
                    </div>
                    <div className="truncate font-mono text-[10.5px] text-muted-foreground">{e.user}</div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-success">
                    <Check className="h-3 w-3" /> AES-256
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between rounded-lg border border-dashed border-border/80 px-3 py-2 text-[11px] text-muted-foreground">
              <span className="font-mono">end-to-end encrypted · zero-knowledge</span>
              <span className="text-success font-medium">● synced</span>
            </div>
          </main>
        </div>
      </div>

      {/* Floating decorative cards */}
      <div className="animate-float pointer-events-none absolute -left-10 -top-8 hidden w-[210px] rotate-[-6deg] glass rounded-2xl border border-border/70 p-3 shadow-card sm:block">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <Key className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold text-ink">Master key</div>
            <div className="font-mono text-[10px] text-muted-foreground">derived · argon2id</div>
          </div>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-primary to-primary-glow" />
        </div>
        <div className="mt-1 text-right text-[9.5px] font-medium text-success">Strength: Excellent</div>
      </div>

      <div className="animate-float-slow pointer-events-none absolute -right-8 top-24 hidden w-[195px] rotate-[5deg] glass rounded-2xl border border-border/70 p-3 shadow-card md:block">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Encryption</span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
        </div>
        <div className="mt-1.5 font-mono text-[10.5px] leading-relaxed text-ink-soft">
          <div><span className="text-muted-foreground">algo</span> = <span className="text-primary">XChaCha20</span></div>
          <div><span className="text-muted-foreground">kdf</span> = <span className="text-primary">argon2id</span></div>
          <div><span className="text-muted-foreground">scope</span> = <span className="text-success">device-only</span></div>
        </div>
      </div>

      <div className="animate-float pointer-events-none absolute -bottom-6 left-12 hidden w-[230px] rotate-[3deg] glass rounded-2xl border border-border/70 p-3 shadow-card sm:block" style={{ animationDelay: "1s" }}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-success/15 text-success">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold text-ink">Zero-knowledge proof</div>
            <div className="text-[10px] text-muted-foreground">Verified just now · server can't read</div>
          </div>
        </div>
      </div>
    </div>
  );
};