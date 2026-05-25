import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, SectionHead, CTASection } from "@/components/site/primitives";

const team = [
  { n: "Aanya Rao", r: "Co-founder & CEO", b: "Previously security lead, Stripe Identity." },
  { n: "Daniel Park", r: "Co-founder & CTO", b: "Cryptographer. Ex-Signal protocol team." },
  { n: "Mei Watanabe", r: "VP Engineering", b: "Built sync infra at Notion & Linear." },
  { n: "Lukas Hoffmann", r: "Head of Security", b: "Former OffSec instructor; CIS contributor." },
  { n: "Priya Menon", r: "Head of Design", b: "Design systems at Figma & Arc." },
  { n: "Marcus Owen", r: "Head of Sales", b: "Enterprise GTM at 1Password & Okta." },
];

export default () => (
  <PageShell>
    <PageHero eyebrow="About NovaSafe" title={<>We're building the trust layer for <span className="text-gradient-primary">the next internet.</span></>} lede="NovaSafe was founded in 2023 by cryptographers and product designers who believed security software should feel calm, not alarming." />
    <Section className="!pt-0">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-3">
        {[
          { t: "12,400+", d: "Organizations protected" },
          { t: "4.8M", d: "Active users worldwide" },
          { t: "99.99%", d: "Uptime over 24 months" },
        ].map((s) => (
          <div key={s.t} className="text-center">
            <div className="text-[44px] font-semibold tracking-tight text-ink">{s.t}</div>
            <div className="mt-1 text-[14px] text-ink-soft">{s.d}</div>
          </div>
        ))}
      </div>
    </Section>
    <Section>
      <SectionHead eyebrow="Team" title="People building NovaSafe" />
      <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((p) => (
          <div key={p.n} className="rounded-2xl border border-border/70 bg-card/70 p-6 backdrop-blur">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-[16px] font-semibold text-primary-foreground">
              {p.n.split(" ").map((x) => x[0]).join("")}
            </div>
            <div className="mt-4 text-[15px] font-semibold text-ink">{p.n}</div>
            <div className="text-[12.5px] text-primary">{p.r}</div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{p.b}</p>
          </div>
        ))}
      </div>
    </Section>
    <CTASection title="Join us" primary={{ label: "Open roles", to: "/careers" }} secondary={{ label: "Read the blog", to: "/blog" }} />
  </PageShell>
);
