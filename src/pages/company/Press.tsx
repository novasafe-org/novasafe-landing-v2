import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, SectionHead } from "@/components/site/primitives";
import { Download } from "lucide-react";

const items = [
  { t: "NovaSafe Brand Pack", d: "Logos, wordmarks, color tokens. SVG + PNG.", s: "12 MB" },
  { t: "Press Kit 2026", d: "Company facts, leadership bios, screenshots.", s: "48 MB" },
  { t: "Founder photography", d: "High-resolution headshots, editorial use.", s: "84 MB" },
];

export default () => (
  <PageShell>
    <PageHero eyebrow="Press" title="Press & media" lede="Everything you need to write about NovaSafe — already prepared, freely licensed for editorial use." />
    <Section className="!pt-0">
      <div className="mx-auto max-w-3xl space-y-4">
        {items.map((i) => (
          <div key={i.t} className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/70 p-6 backdrop-blur">
            <div>
              <div className="text-[15px] font-semibold text-ink">{i.t}</div>
              <p className="mt-1 text-[13.5px] text-ink-soft">{i.d}</p>
            </div>
            <a href="#" className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[13px] font-semibold text-ink hover:bg-secondary">
              <Download className="h-4 w-4" /> {i.s}
            </a>
          </div>
        ))}
      </div>
      <SectionHead align="left" title="Media inquiries" lede="press@novasafe.app · we reply within one business day." />
    </Section>
  </PageShell>
);
