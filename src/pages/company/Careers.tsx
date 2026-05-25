import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, SectionHead } from "@/components/site/primitives";

const roles = [
  { t: "Senior Cryptography Engineer",  loc: "Bangalore · Remote (IST)", team: "Security" },
  { t: "Staff iOS Engineer",            loc: "Remote (EMEA)",            team: "Mobile" },
  { t: "Product Designer — Enterprise", loc: "Bangalore · Berlin · NYC", team: "Design" },
  { t: "Security Operations Engineer",  loc: "Bangalore · Remote",       team: "Security" },
  { t: "Developer Advocate",            loc: "Remote (Americas)",        team: "Developer Relations" },
  { t: "Compliance Program Manager",    loc: "Bangalore · Remote (EMEA)", team: "Trust & Safety" },
];

export default () => (
  <PageShell>
    <PageHero eyebrow="Careers" title={<>Build the future of <span className="text-gradient-primary">trust.</span></>} lede="We're a globally distributed team of engineers, designers, and security researchers — united by the belief that security should be elegant by default." />
    <Section className="!pt-0">
      <SectionHead align="left" title="Open roles" />
      <div className="mx-auto max-w-4xl divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card/70 backdrop-blur">
        {roles.map((r) => (
          <a key={r.t} href="#" className="flex flex-col gap-2 px-6 py-5 transition-colors hover:bg-secondary sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[15px] font-semibold text-ink">{r.t}</div>
              <div className="text-[12.5px] text-ink-soft">{r.team}</div>
            </div>
            <div className="text-[13px] text-ink-soft">{r.loc}</div>
          </a>
        ))}
      </div>
    </Section>
  </PageShell>
);
