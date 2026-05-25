import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section } from "@/components/site/primitives";

const posts = [
  { t: "What 'zero-knowledge' actually means in 2026", d: "May 22, 2026", a: "Daniel Park", c: "Engineering", e: "An honest, technical look at the threat model we promise — and what we don't." },
  { t: "Designing calm for a security product", d: "May 4, 2026", a: "Priya Menon", c: "Design", e: "How we removed 38% of the UI chrome from our 4.0 release — and made it feel safer." },
  { t: "Inside our SOC 2 Type II 2025 audit", d: "April 18, 2026", a: "Lukas Hoffmann", c: "Trust", e: "Two consecutive years of zero findings. Here's what changed in the program." },
  { t: "Passkey sharing is finally here", d: "April 2, 2026", a: "Aanya Rao", c: "Product", e: "Shared credentials that remain phishing-resistant. The cryptography behind it." },
  { t: "Why we publish a transparency log", d: "March 8, 2026", a: "Mei Watanabe", c: "Engineering", e: "Reproducible client builds + an append-only log = verifiable trust." },
  { t: "Engineering principles at NovaSafe", d: "February 14, 2026", a: "Daniel Park", c: "Culture", e: "Six principles that guide every line of code we ship." },
];

export default () => (
  <PageShell>
    <PageHero eyebrow="Blog" title={<>Engineering, design, <span className="text-gradient-primary">and research.</span></>} lede="Long-form thinking from the team building NovaSafe. No marketing fluff." />
    <Section className="!pt-0">
      <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <a key={p.t} href="#" className="group rounded-2xl border border-border/70 bg-card/70 p-6 backdrop-blur transition-all hover:border-primary/40 hover:shadow-card">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">{p.c}</div>
            <h3 className="mt-3 text-[18px] font-semibold leading-snug text-ink group-hover:text-primary">{p.t}</h3>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink-soft">{p.e}</p>
            <div className="mt-5 flex items-center justify-between text-[12px] text-ink-soft">
              <span>{p.a}</span><span>{p.d}</span>
            </div>
          </a>
        ))}
      </div>
    </Section>
  </PageShell>
);
