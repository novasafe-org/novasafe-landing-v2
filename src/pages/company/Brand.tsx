import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, SectionHead } from "@/components/site/primitives";
import { Logo } from "@/components/landing/Logo";

const palette = [
  { name: "Primary", hex: "#0178E5", token: "--primary" },
  { name: "Primary glow", hex: "#3D9CFF", token: "--primary-glow" },
  { name: "Ink", hex: "#0B1220", token: "--ink" },
  { name: "Surface", hex: "#F7FAFC", token: "--surface-1" },
];

export default () => (
  <PageShell>
    <PageHero eyebrow="Brand" title="Brand guidelines" lede="Use NovaSafe marks freely in editorial contexts. Do not modify the wordmark or imply partnership without permission." />
    <Section className="!pt-0">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
        <div className="rounded-3xl border border-border/70 bg-card/70 p-10 backdrop-blur">
          <div className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft">Logo</div>
          <div className="mt-8 flex items-center justify-center py-10"><Logo /></div>
          <div className="mt-6 text-[13.5px] text-ink-soft">Always preserve clear space equal to the height of the shield icon. Do not recolor, rotate, or distort.</div>
        </div>
        <div className="rounded-3xl border border-border/70 bg-card/70 p-10 backdrop-blur">
          <div className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft">Color</div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {palette.map((c) => (
              <div key={c.name} className="overflow-hidden rounded-xl border border-border">
                <div className="h-16" style={{ background: c.hex }} />
                <div className="p-3">
                  <div className="text-[13px] font-semibold text-ink">{c.name}</div>
                  <div className="font-mono text-[11.5px] text-ink-soft">{c.hex} · {c.token}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SectionHead align="left" title="Typography" lede="Inter for body, JetBrains Mono for technical. Headlines: tracking -0.02em, weight 600." />
    </Section>
  </PageShell>
);
