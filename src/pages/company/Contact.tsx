import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section } from "@/components/site/primitives";
import { Mail, MessageSquare, Building2, ShieldAlert } from "lucide-react";

const channels = [
  { icon: Mail, t: "General", d: "hello@novasafe.app", l: "mailto:hello@novasafe.app" },
  { icon: Building2, t: "Sales", d: "sales@novasafe.app", l: "mailto:sales@novasafe.app" },
  { icon: MessageSquare, t: "Support", d: "support@novasafe.app", l: "mailto:support@novasafe.app" },
  { icon: ShieldAlert, t: "Security", d: "security@novasafe.app", l: "mailto:security@novasafe.app" },
];

export default () => (
  <PageShell>
    <PageHero eyebrow="Contact" title={<>Let's <span className="text-gradient-primary">talk.</span></>} lede="Sales, support, security, press — we'll route your message to a real person within one business day." />
    <Section className="!pt-0">
      <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
        {channels.map((c) => (
          <a key={c.t} href={c.l} className="rounded-2xl border border-border/70 bg-card/70 p-6 backdrop-blur transition-colors hover:border-primary/40">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><c.icon className="h-5 w-5" /></div>
            <div className="mt-4 text-[15px] font-semibold text-ink">{c.t}</div>
            <div className="mt-1 font-mono text-[13px] text-primary">{c.d}</div>
          </a>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-border/70 bg-surface-1/60 p-8 backdrop-blur">
        <div className="grid gap-2 text-[14px] text-ink-soft sm:grid-cols-3">
          <div><div className="text-[11.5px] font-semibold uppercase tracking-wider text-ink">Bangalore HQ</div><p className="mt-2">42 Indiranagar 100ft Rd, Bengaluru, KA 560038</p></div>
          <div><div className="text-[11.5px] font-semibold uppercase tracking-wider text-ink">Berlin · EU</div><p className="mt-2">Friedrichstraße 68, 10117 Berlin, Germany</p></div>
          <div><div className="text-[11.5px] font-semibold uppercase tracking-wider text-ink">New York · Americas</div><p className="mt-2">300 Lafayette St, New York, NY 10012</p></div>
        </div>
      </div>
    </Section>
  </PageShell>
);
