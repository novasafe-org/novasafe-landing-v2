import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, SectionHead, CTASection } from "@/components/site/primitives";

const logos = ["Atlas Bank","Nordic Air","Lumen Health","Vertex Robotics","Helix Labs","Praxis Legal","Orbital","Northwind","Cobalt Studios","Meridian"];
const quotes = [
  { q: "NovaSafe is the only security tool our 18,000 employees actually want to use.", a: "Maya Chen", r: "VP Security, Atlas Bank" },
  { q: "We replaced three legacy products with NovaSafe in a single quarter.", a: "Jonas Berg", r: "CTO, Nordic Air" },
  { q: "The compliance pack alone saved our team three months of procurement work.", a: "Renee Adler", r: "DPO, Lumen Health" },
];

export default () => (
  <PageShell>
    <PageHero eyebrow="Customers" title={<>Trusted by 12,400+ <span className="text-gradient-primary">modern organizations.</span></>} lede="From regulated banks to ten-person startups — NovaSafe scales with how teams actually work." />
    <Section className="!pt-0">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-5">
        {logos.map((l) => (
          <div key={l} className="flex h-16 items-center justify-center rounded-xl border border-border/70 bg-card/70 text-[13px] font-semibold tracking-tight text-ink-soft backdrop-blur">{l}</div>
        ))}
      </div>
    </Section>
    <Section>
      <SectionHead title="What customers say" />
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
        {quotes.map((q) => (
          <div key={q.a} className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-surface-1 p-7 backdrop-blur">
            <p className="text-[17px] leading-relaxed text-ink">"{q.q}"</p>
            <div className="mt-6 text-[13px] text-ink-soft"><span className="font-semibold text-ink">{q.a}</span> · {q.r}</div>
          </div>
        ))}
      </div>
    </Section>
    <CTASection title="Join 12,400+ organizations on NovaSafe" />
  </PageShell>
);
