import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, FeatureCard, CTASection } from "@/components/site/primitives";
import { FileCheck, Shield, Globe, Lock } from "lucide-react";

export default () => (
  <PageShell>
    <PageHero eyebrow="Compliance" title={<>Certified, audited, <span className="text-gradient-primary">accountable.</span></>} lede="Independent assurance for every regulated framework that matters. Reports available under NDA in minutes." />
    <Section className="!pt-0">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureCard icon={FileCheck} title="SOC 2 Type II" desc="Audited annually. Zero findings 2024 & 2025." />
        <FeatureCard icon={Shield} title="ISO/IEC 27001" desc="Certified ISMS, scope: global." />
        <FeatureCard icon={Globe} title="GDPR / UK GDPR" desc="EU-resident processing, standard SCCs." />
        <FeatureCard icon={Lock} title="HIPAA" desc="BAA available for covered entities." />
        <FeatureCard icon={FileCheck} title="ISO/IEC 27017" desc="Cloud-services controls." />
        <FeatureCard icon={FileCheck} title="ISO/IEC 27018" desc="Cloud personal-data protection." />
        <FeatureCard icon={Shield} title="PCI DSS SAQ-D" desc="Card data handling controls." />
        <FeatureCard icon={Globe} title="CCPA / CPRA" desc="California consumer rights honored." />
      </div>
    </Section>
    <CTASection title="Request our compliance pack" lede="SOC 2, ISO, DPA, pen-test summary, sub-processor list — bundled for your security review." primary={{ label: "Request access", to: "/contact" }} secondary={{ label: "Read security policy", to: "/legal/security" }} />
  </PageShell>
);
