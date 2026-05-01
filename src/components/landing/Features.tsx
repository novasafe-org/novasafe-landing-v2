import { useState } from "react";
import { Sparkles, Share2, Users, Activity, Check, ArrowRight, Eye, EyeOff, Globe, Github, Slack } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "autofill", label: "Smart autofill", icon: Sparkles },
  { id: "share", label: "Secret sharing", icon: Share2 },
  { id: "access", label: "Access control", icon: Users },
  { id: "audit", label: "Live audit", icon: Activity },
];

const Demo = ({ tab }: { tab: string }) => {
  if (tab === "autofill") {
    return (
      <div className="relative h-full p-6">
        <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
            <Globe className="h-3 w-3" /> github.com / login
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Email</label>
              <div className="mt-1 flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 ring-2 ring-primary/15">
                <span className="text-[13px] text-ink">team@novasafe.app</span>
                <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Autofilled</span>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Password</label>
              <div className="mt-1 flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 ring-2 ring-primary/15">
                <span className="font-mono text-[13px] tracking-widest text-ink">••••••••••••</span>
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <button className="w-full rounded-lg bg-ink py-2 text-[12px] font-semibold text-background">Sign in</button>
          </div>
        </div>
        <div className="absolute right-4 top-4 animate-float rounded-xl border border-border bg-card p-2.5 shadow-card">
          <div className="flex items-center gap-2 text-[11px] font-medium text-success">
            <Check className="h-3 w-3" /> Filled by NovaSafe
          </div>
        </div>
      </div>
    );
  }
  if (tab === "share") {
    return (
      <div className="space-y-3 p-6">
        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="text-[11px] font-mono text-muted-foreground">Sharing · AWS Production</div>
          <div className="mt-3 space-y-2">
            {[
              { name: "Anya Patel", role: "Owner", color: "from-rose-400 to-pink-500" },
              { name: "Ravi Mehta", role: "Can edit", color: "from-amber-400 to-orange-500" },
              { name: "Lin Wei", role: "View only", color: "from-emerald-400 to-teal-500" },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-3 rounded-lg bg-secondary/60 px-2.5 py-2">
                <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${p.color}`} />
                <div className="flex-1 text-[12px] font-medium text-ink">{p.name}</div>
                <span className="text-[10.5px] text-muted-foreground">{p.role}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 text-[11px] text-ink-soft">
          🔒 End-to-end encrypted share · expires in 24h · revoke anytime
        </div>
      </div>
    );
  }
  if (tab === "access") {
    return (
      <div className="space-y-2 p-6 font-mono text-[11.5px]">
        {[
          { rule: "engineering/*", scope: "prod-secrets", allow: true },
          { rule: "marketing/*", scope: "prod-secrets", allow: false },
          { rule: "ops/sre", scope: "ssh-keys", allow: true },
          { rule: "contractors/*", scope: "billing", allow: false },
        ].map((r) => (
          <div key={r.rule} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
            <span className="text-ink">
              <span className="text-muted-foreground">grant</span> {r.rule}{" "}
              <span className="text-muted-foreground">→</span> {r.scope}
            </span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-bold",
                r.allow ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
              )}
            >
              {r.allow ? "ALLOW" : "DENY"}
            </span>
          </div>
        ))}
        <div className="pt-2 text-[10.5px] text-muted-foreground">policies.yaml · 4 rules · 0 conflicts</div>
      </div>
    );
  }
  return (
    <div className="space-y-1.5 p-6 font-mono text-[11px]">
      {[
        { t: "12:04:33", e: "vault.unlock", a: "you", s: "ok" },
        { t: "12:05:01", e: "secret.read · stripe_live", a: "ravi@", s: "ok" },
        { t: "12:07:18", e: "share.create · aws-prod", a: "you", s: "ok" },
        { t: "12:11:42", e: "login.attempt", a: "unknown ip", s: "blocked" },
        { t: "12:12:00", e: "policy.update", a: "anya@", s: "ok" },
      ].map((l, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md bg-background/80 px-2.5 py-1.5">
          <span className="text-muted-foreground">{l.t}</span>
          <span className="flex-1 text-ink">{l.e}</span>
          <span className="text-muted-foreground">{l.a}</span>
          <span className={l.s === "ok" ? "text-success" : "text-destructive font-semibold"}>{l.s}</span>
        </div>
      ))}
    </div>
  );
};

export const Features = () => {
  const [active, setActive] = useState("autofill");
  return (
    <section id="features" className="relative bg-surface-1/60 py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" /> Product
          </span>
          <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            A vault that works the way you do.
          </h2>
          <p className="mt-5 text-lg text-ink-soft">
            Built for the moments that matter — fast, intentional, invisible.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-1.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                  active === t.id
                    ? "border-primary/40 bg-card shadow-card"
                    : "border-transparent bg-transparent hover:border-border hover:bg-card/60",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                    active === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-ink-soft",
                  )}
                >
                  <t.icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-[14px] font-semibold text-ink">{t.label}</span>
                <ArrowRight
                  className={cn(
                    "h-3.5 w-3.5 transition-all",
                    active === t.id ? "translate-x-0 text-primary opacity-100" : "-translate-x-1 opacity-0",
                  )}
                />
              </button>
            ))}
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-border bg-card shadow-elevated">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-primary-glow/5" />
            <Demo tab={active} key={active} />
          </div>
        </div>
      </div>
    </section>
  );
};