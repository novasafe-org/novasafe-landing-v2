import { ReactNode } from "react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, SectionHead, FeatureCard, CTASection, CheckList } from "@/components/site/primitives";

export type FeatureBenefit = { icon: any; title: string; desc: string };

export const FeaturePage = ({
  eyebrow, title, lede, benefits, deepDiveTitle, deepDiveLede, deepDivePoints, codeSample, codeLang,
}: {
  eyebrow: string; title: ReactNode; lede: string;
  benefits: FeatureBenefit[];
  deepDiveTitle?: string; deepDiveLede?: string; deepDivePoints?: string[];
  codeSample?: string; codeLang?: string;
}) => (
  <PageShell>
    <PageHero eyebrow={eyebrow} title={title} lede={lede} />
    <Section className="!pt-0">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((b) => <FeatureCard key={b.title} {...b} />)}
      </div>
    </Section>
    {(deepDiveTitle || codeSample) && (
      <Section>
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-start">
          {deepDiveTitle && (
            <div>
              <SectionHead align="left" title={deepDiveTitle} lede={deepDiveLede} />
              {deepDivePoints && <CheckList items={deepDivePoints} />}
            </div>
          )}
          {codeSample && (
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/70 backdrop-blur shadow-card">
              <div className="flex items-center justify-between border-b border-border/70 px-4 py-2 font-mono text-[11.5px] uppercase tracking-wider text-ink-soft">
                <span>{codeLang || "shell"}</span>
                <span className="text-muted-foreground">novasafe</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-ink">{codeSample}</pre>
            </div>
          )}
        </div>
      </Section>
    )}
    <CTASection />
  </PageShell>
);
