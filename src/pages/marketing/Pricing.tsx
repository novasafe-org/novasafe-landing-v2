import { useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, SectionHead, PrimaryButton, GhostButton, CTASection, FAQ, CheckList } from "@/components/site/primitives";
import { Check, Globe, Shield, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Region = "global" | "india";
type Cycle = "monthly" | "yearly";

const price = {
  india:  { monthly: { amt: "₹149",     per: "/month", sub: "billed monthly" }, yearly: { amt: "₹999",   per: "/year",  sub: "₹83/mo · save 44%" } },
  global: { monthly: { amt: "$3.99",    per: "/month", sub: "billed monthly" }, yearly: { amt: "$49.99", per: "/year",  sub: "$4.16/mo · save 16%" } },
};

const features = [
  "Unlimited passwords, passkeys, notes & cards",
  "Cross-device sync — macOS, iOS, Windows, Android, Linux, Web",
  "Built-in authenticator with encrypted OTP backup",
  "Secure sharing with end-to-end encryption",
  "Emergency access & inheritance",
  "Dark web breach monitoring",
  "Priority email & in-app support",
];

const enterprise = [
  "Everything in Premium",
  "Org-wide vaults & role-based permissions",
  "SCIM provisioning + SAML / OIDC SSO",
  "Detailed audit logs & SIEM integration",
  "Dedicated customer success & SLA",
  "Optional self-hosted key management (HSM)",
];

const faqs = [
  { q: "Is there a free trial?", a: "Yes — all Premium and Business features are free for 14 days, no card required. Personal accounts include a generous free tier forever." },
  { q: "How does billing work in my country?", a: "We auto-detect region and bill in local currency where supported. You can switch the region selector above to see pricing in INR or USD." },
  { q: "Can I cancel anytime?", a: "Anytime. Yearly subscriptions are refundable within 30 days, no questions asked." },
  { q: "What happens to my data if I downgrade?", a: "Everything stays encrypted and accessible. You'll lose access to premium-only features but never lose data." },
  { q: "Do you offer discounts for students or non-profits?", a: "Yes — 50% off Premium for verified students, and free Business for registered non-profits with up to 25 seats." },
];

const Pricing = () => {
  const [region, setRegion] = useState<Region>("global");
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const p = price[region][cycle];

  return (
    <PageShell>
      <PageHero
        eyebrow="Pricing"
        title={<>Premium security, <span className="text-gradient-primary">honest pricing.</span></>}
        lede="One subscription. Every device. Zero-knowledge encryption included by default. No hidden fees, no upsells, no surveillance."
      >
        <div className="flex items-center gap-1 rounded-full border border-border bg-card/70 p-1 backdrop-blur">
          {(["global","india"] as Region[]).map((r) => (
            <button key={r} onClick={() => setRegion(r)} className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all", region === r ? "bg-ink text-background shadow-sm" : "text-ink-soft hover:text-ink")}>
              <Globe className="h-3.5 w-3.5" />
              {r === "global" ? "Global · USD" : "India · INR"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border bg-card/70 p-1 backdrop-blur">
          {(["monthly","yearly"] as Cycle[]).map((c) => (
            <button key={c} onClick={() => setCycle(c)} className={cn("rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all", cycle === c ? "bg-primary text-primary-foreground shadow-sm" : "text-ink-soft hover:text-ink")}>
              {c === "monthly" ? "Monthly" : "Yearly · save up to 44%"}
            </button>
          ))}
        </div>
      </PageHero>

      <Section className="!pt-0">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          {/* Free */}
          <div className="relative rounded-3xl border border-border/70 bg-card/70 p-8 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wider text-ink-soft"><Sparkles className="h-3.5 w-3.5" /> Personal</div>
            <div className="mt-4 text-[40px] font-semibold tracking-tight text-ink">Free</div>
            <div className="text-[13px] text-ink-soft">For individuals getting started</div>
            <GhostButton to="/contact" className="mt-6 w-full justify-center">Create free account</GhostButton>
            <div className="mt-8 h-px bg-border/60" />
            <CheckList items={["Unlimited devices","Up to 50 passwords & passkeys","Built-in authenticator","Zero-knowledge encryption","Browser extensions + mobile apps"]} />
          </div>
          {/* Premium */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-primary/60 bg-gradient-to-b from-card to-surface-1 p-8 shadow-card">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-primary-foreground">Most popular</div>
            <div className="relative">
              <div className="flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wider text-primary"><Shield className="h-3.5 w-3.5" /> Premium</div>
              <div className="mt-4 flex items-baseline gap-1">
                <div className="text-[44px] font-semibold tracking-tight text-ink">{p.amt}</div>
                <div className="text-[13px] text-ink-soft">{p.per}</div>
              </div>
              <div className="text-[13px] text-ink-soft">{p.sub}</div>
              <PrimaryButton to="/contact" className="mt-6 w-full justify-center">Start 14-day free trial</PrimaryButton>
              <div className="mt-8 h-px bg-border/60" />
              <CheckList items={features} />
            </div>
          </div>
          {/* Business */}
          <div className="relative rounded-3xl border border-border/70 bg-card/70 p-8 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wider text-ink-soft"><Users className="h-3.5 w-3.5" /> Business · Enterprise</div>
            <div className="mt-4 text-[40px] font-semibold tracking-tight text-ink">Custom</div>
            <div className="text-[13px] text-ink-soft">For teams of 25 and beyond</div>
            <GhostButton to="/contact" className="mt-6 w-full justify-center">Talk to sales</GhostButton>
            <div className="mt-8 h-px bg-border/60" />
            <CheckList items={enterprise} />
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-6xl rounded-2xl border border-border/60 bg-surface-1/60 p-4 text-center text-[12.5px] text-ink-soft">
          All plans include AES-256-GCM end-to-end encryption · 30-day refund policy · No surveillance, ever.
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Why NovaSafe" title="Built for trust. Priced for everyone." lede="The same architecture that secures Fortune 500 vaults — affordable enough for every person on earth." />
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
          {[
            { t: "Zero-knowledge", d: "Your master key never leaves your device. We literally cannot read your data." },
            { t: "SOC 2 & ISO 27001", d: "Independently audited every year. Reports available on request." },
            { t: "Open & verifiable", d: "Core cryptography is open-source. Reproducible client builds." },
          ].map((b) => (
            <div key={b.t} className="rounded-2xl border border-border/70 bg-card/70 p-6 backdrop-blur">
              <div className="text-[15px] font-semibold text-ink">{b.t}</div>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{b.d}</p>
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
