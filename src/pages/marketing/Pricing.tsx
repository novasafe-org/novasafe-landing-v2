import { useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, SectionHead, PrimaryButton, GhostButton, CTASection, FAQ, CheckList } from "@/components/site/primitives";
import { Check, Minus, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildSignupUrl, buildSignupProUrl } from "@/config";

type Cycle = "monthly" | "yearly";

const proPrice = {
  monthly: { amt: "$3.99", per: "/month", sub: "Billed monthly" },
  yearly:  { amt: "$49.99", per: "/year",  sub: "$4.16/mo · save 16%" },
};

const freeFeatures = [
  "Up to 50 passwords & passkeys",
  "Single device",
  "Built-in authenticator",
  "Zero-knowledge encryption",
  "Browser extension",
];

const proFeatures = [
  "Unlimited passwords, passkeys & notes",
  "Sync across every device",
  "Secure sharing — end-to-end encrypted",
  "Encrypted file attachments",
  "Priority support",
  "Early access to new features",
];

type Row = { label: string; free: boolean | string; pro: boolean | string };
const matrix: Row[] = [
  { label: "Unlimited passwords", free: false, pro: true },
  { label: "Passkeys", free: true, pro: true },
  { label: "Secure notes", free: true, pro: true },
  { label: "Device sync", free: "1 device", pro: "Unlimited" },
  { label: "Authenticator", free: true, pro: true },
  { label: "Secure sharing", free: false, pro: true },
  { label: "End-to-end encryption", free: true, pro: true },
  { label: "Cross-platform access", free: true, pro: true },
  { label: "Priority support", free: false, pro: true },
];

const faqs = [
  { q: "Is there a free plan?", a: "Yes. NovaSafe Free includes zero-knowledge encryption, passkeys, and the authenticator on a single device — forever, no credit card required." },
  { q: "Can I cancel anytime?", a: "Anytime, from your account settings. Yearly subscriptions are fully refundable within the first 30 days." },
  { q: "What happens to my data if I downgrade?", a: "Your vault stays intact and encrypted. You simply lose access to Pro-only features like unlimited sync and secure sharing." },
  { q: "Do you offer student discounts?", a: "Yes — 50% off Pro for verified students. Email students@novasafe.app from your school address." },
];

const Cell = ({ v }: { v: boolean | string }) =>
  typeof v === "string"
    ? <span className="text-[13.5px] text-ink-soft">{v}</span>
    : v
      ? <Check className="mx-auto h-4 w-4 text-primary" />
      : <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" />;

const Pricing = () => {
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const p = proPrice[cycle];

  return (
    <PageShell>
      <PageHero
        eyebrow="Pricing"
        title={<>Simple pricing. <span className="text-gradient-primary">Sealed by default.</span></>}
        lede="Start free. Upgrade when you need unlimited everything. Zero-knowledge encryption included on every plan."
      >
        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
          {(["monthly","yearly"] as Cycle[]).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={cn(
                "rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-all",
                cycle === c ? "bg-ink text-background shadow-sm" : "text-ink-soft hover:text-ink"
              )}
            >
              {c === "monthly" ? "Monthly" : "Yearly · save 16%"}
            </button>
          ))}
        </div>
      </PageHero>

      <Section className="!pt-0">
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          {/* Free */}
          <div className="relative rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
            <div className="flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wider text-ink-soft">
              <Sparkles className="h-3.5 w-3.5" /> Free
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <div className="text-[40px] font-semibold tracking-tight text-ink">$0</div>
              <div className="text-[13px] text-ink-soft">/forever</div>
            </div>
            <div className="text-[13px] text-ink-soft">For getting started</div>
            <GhostButton href={buildSignupUrl({ ref: "pricing_free" })} className="mt-6 w-full justify-center">Create free account</GhostButton>
            <div className="mt-8 h-px bg-border/60" />
            <div className="mt-6"><CheckList items={freeFeatures} /></div>
          </div>
          {/* Pro */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-primary/60 bg-gradient-to-b from-card to-surface-1 p-8 shadow-card">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-primary-foreground">Recommended</div>
            <div className="relative">
              <div className="flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wider text-primary">
                <Shield className="h-3.5 w-3.5" /> Pro
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <div className="text-[44px] font-semibold tracking-tight text-ink">{p.amt}</div>
                <div className="text-[13px] text-ink-soft">{p.per}</div>
              </div>
              <div className="text-[13px] text-ink-soft">{p.sub}</div>
              <PrimaryButton href={buildSignupProUrl({ ref: "pricing_pro" })} className="mt-6 w-full justify-center">Start with Pro</PrimaryButton>
              <div className="mt-8 h-px bg-border/60" />
              <div className="mt-6"><CheckList items={proFeatures} /></div>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-border/60 bg-surface-1/60 p-4 text-center text-[12.5px] text-ink-soft">
          AES-256-GCM end-to-end encryption · 30-day refund · Cancel anytime
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHead title="Compare plans" lede="Everything included, nothing buried." />
        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/70 bg-card">
          <div className="grid grid-cols-[1.6fr_1fr_1fr] border-b border-border/70 bg-surface-1/60 px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-ink-soft">
            <div>Feature</div>
            <div className="text-center">Free</div>
            <div className="text-center text-primary">Pro</div>
          </div>
          {matrix.map((r, i) => (
            <div
              key={r.label}
              className={cn(
                "grid grid-cols-[1.6fr_1fr_1fr] items-center px-6 py-4 text-[14px] text-ink",
                i !== matrix.length - 1 && "border-b border-border/60"
              )}
            >
              <div className="font-medium">{r.label}</div>
              <div className="text-center"><Cell v={r.free} /></div>
              <div className="text-center"><Cell v={r.pro} /></div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHead title="Frequently asked" />
        <FAQ items={faqs} />
      </Section>

      <CTASection />
    </PageShell>
  );
};

export default Pricing;
