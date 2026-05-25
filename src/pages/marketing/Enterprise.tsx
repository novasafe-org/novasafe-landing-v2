import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, SectionHead, FeatureCard, CTASection, CheckList } from "@/components/site/primitives";
import { Building2, ShieldCheck, Users, Server, FileCheck, KeyRound } from "lucide-react";

const Enterprise = () => (
  <PageShell>
    <PageHero eyebrow="For enterprise" title={<>Secrets infrastructure for the <span className="text-gradient-primary">Fortune 5000.</span></>} lede="Trusted by 1,400+ enterprises across finance, healthcare, defense, and SaaS. Deploy in days, not quarters." />
    <Section className="!pt-0">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: KeyRound, title: "SSO & SCIM", desc: "Okta, Azure AD, Google, JumpCloud — provision & deprovision in real time." },
          { icon: ShieldCheck, title: "Zero-trust", desc: "Device posture checks, conditional access, hardware-bound keys." },
          { icon: FileCheck, title: "Audit & SIEM", desc: "Every event streamed to Splunk, Datadog, or Elastic. 7-year retention." },
          { icon: Users, title: "Role-based access", desc: "Hierarchical orgs, custom roles, JIT elevation, approval workflows." },
          { icon: Server, title: "BYO key (HSM)", desc: "Hold your own root keys in CloudHSM or on-prem HSM. We never see them." },
          { icon: Building2, title: "Private deployment", desc: "Dedicated VPC, regional residency, optional on-prem control plane." },
        ].map((f) => <FeatureCard key={f.title} {...f} />)}
      </div>
    </Section>
    <Section>
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
        <div>
          <SectionHead align="left" eyebrow="Procurement" title="Built for security & legal teams." lede="Every artifact your reviewers will ask for — already prepared." />
          <CheckList items={[
            "SOC 2 Type II + ISO 27001 reports",
            "Standard DPA, BAA, and custom MSA",
            "Penetration test summary (annual)",
            "Architecture & threat model documentation",
            "Sub-processor list with notification SLA",
            "Vendor security questionnaire pre-filled",
          ]} />
        </div>
        <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-card to-surface-1 p-8 shadow-sm">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-primary">Customer · Atlas Bank</div>
          <p className="mt-3 text-[20px] font-medium leading-relaxed text-ink">
            "We migrated 18,000 employees from legacy password managers in under three weeks. NovaSafe is the only product where our CISO, CFO, and developers all agreed."
          </p>
          <div className="mt-6 text-[13px] text-ink-soft">— Maya Chen, VP Information Security, Atlas Bank</div>
        </div>
      </div>
    </Section>
    <CTASection title="Bring NovaSafe to your enterprise" primary={{ label: "Book a demo", to: "/contact" }} secondary={{ label: "See pricing", to: "/pricing" }} />
  </PageShell>
);
export default Enterprise;
