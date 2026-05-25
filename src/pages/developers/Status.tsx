import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section } from "@/components/site/primitives";
import { CheckCircle2 } from "lucide-react";

const services = [
  "API (api.novasafe.app)","Sync engine","Web vault","Mobile clients","Browser extensions","Authenticator","Webhooks","SSO / SCIM","Documentation",
];
const regions = ["us-east-1","us-west-2","eu-west-1","eu-central-1","ap-south-1","ap-southeast-1"];

export default () => (
  <PageShell>
    <PageHero eyebrow="System status" title={<>All systems <span className="text-gradient-primary">operational.</span></>} lede="Live status, 90-day uptime, and full incident history. Updated every 30 seconds." />
    <Section className="!pt-0">
      <div className="mx-auto max-w-4xl space-y-4">
        {services.map((s) => (
          <div key={s} className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur">
            <div className="font-medium text-ink">{s}</div>
            <div className="flex items-center gap-2 text-[13px] font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" /> Operational · 99.99% (90d)
            </div>
          </div>
        ))}
        <div className="mt-10 rounded-2xl border border-border/70 bg-surface-1/80 p-6">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-ink-soft">Regions</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {regions.map((r) => (
              <span key={r} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-mono text-[12px] text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />{r}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Section>
  </PageShell>
);
