import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, FeatureCard, CTASection } from "@/components/site/primitives";
import { Github, Shield, BookOpen, Code } from "lucide-react";

export default () => (
  <PageShell>
    <PageHero eyebrow="Open source & research" title={<>Transparency is <span className="text-gradient-primary">part of the contract.</span></>} lede="Our cryptographic primitives, client builds, and security research are public. Audit us. Fork us. Verify us." />
    <Section className="!pt-0">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard icon={Github} title="novasafe/crypto" desc="Audited Rust library for AES-GCM, Argon2id, X25519 primitives." />
        <FeatureCard icon={Code} title="novasafe/sdk-js" desc="Official TypeScript SDK. MIT licensed." />
        <FeatureCard icon={Code} title="novasafe/cli" desc="The CLI you install. Reproducible builds." />
        <FeatureCard icon={Shield} title="Audit reports" desc="Trail of Bits 2024, Cure53 2025, NCC Group 2026." />
        <FeatureCard icon={BookOpen} title="Whitepapers" desc="Threat model, architecture, transparency log spec." />
        <FeatureCard icon={Github} title="Bug bounty" desc="Up to $50,000 per vulnerability via HackerOne." />
      </div>
    </Section>
    <CTASection title="Report a vulnerability" lede="We respond within 24 hours. Safe-harbor guarantee." primary={{ label: "Responsible disclosure", to: "/legal/responsible-disclosure" }} secondary={{ label: "View on GitHub", to: "/open-source" }} />
  </PageShell>
);
