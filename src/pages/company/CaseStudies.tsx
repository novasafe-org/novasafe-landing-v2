import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section } from "@/components/site/primitives";

const cases = [
  { co: "Atlas Bank", i: "Finance", m: "18,000 seats migrated in 21 days", e: "A regulated retail bank consolidated three legacy password managers onto NovaSafe with zero downtime." },
  { co: "Nordic Air", i: "Aviation", m: "94% reduction in credential incidents", e: "Pilots and ground crews now use passkeys for every operational system." },
  { co: "Lumen Health", i: "Healthcare", m: "HIPAA-compliant in 3 weeks", e: "A 4,200-employee hospital network replaced shared spreadsheets with role-aware vaults." },
  { co: "Vertex Robotics", i: "Manufacturing", m: "Secrets rotation, 6× faster", e: "An industrial robotics company rotates AWS keys across 240 services with one command." },
];

export default () => (
  <PageShell>
    <PageHero eyebrow="Case studies" title={<>Real teams. <span className="text-gradient-primary">Real outcomes.</span></>} lede="Deep dives into how organizations deploy NovaSafe at scale." />
    <Section className="!pt-0">
      <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2">
        {cases.map((c) => (
          <a key={c.co} href="#" className="group rounded-3xl border border-border/70 bg-card/70 p-8 backdrop-blur transition-all hover:border-primary/40 hover:shadow-card">
            <div className="text-[11.5px] font-semibold uppercase tracking-wider text-primary">{c.i}</div>
            <div className="mt-3 text-[22px] font-semibold text-ink">{c.co}</div>
            <div className="mt-2 text-[15px] font-medium text-ink-soft">{c.m}</div>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-soft">{c.e}</p>
            <div className="mt-6 text-[13px] font-semibold text-primary group-hover:underline">Read the story →</div>
          </a>
        ))}
      </div>
    </Section>
  </PageShell>
);
