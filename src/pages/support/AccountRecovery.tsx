import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, SectionHead, FeatureCard, CTASection } from "@/components/site/primitives";
import { KeyRound, Users, ShieldCheck } from "lucide-react";

export default () => (
  <PageShell>
    <PageHero eyebrow="Account recovery" title={<>Lose access? <span className="text-gradient-primary">Get back in — safely.</span></>} lede="Because NovaSafe is zero-knowledge, recovery must be planned in advance. Here are the four options we support." />
    <Section className="!pt-0">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard icon={KeyRound} title="Recovery codes" desc="One-time codes generated at signup. Print and store offline." />
        <FeatureCard icon={ShieldCheck} title="Hardware key" desc="Pair a YubiKey or Titan to unlock when your master password is lost." />
        <FeatureCard icon={Users} title="Emergency contacts" desc="Trusted family or teammates can request access after a wait period." />
        <FeatureCard icon={ShieldCheck} title="Org-admin recovery" desc="For business vaults, your administrator can re-issue access." />
      </div>
      <SectionHead align="left" title="What we cannot do" lede="There is no backdoor. Without one of the four recovery methods above, your vault remains encrypted forever — even to us. Set up recovery during your first 24 hours." />
    </Section>
    <CTASection title="Set up recovery now" primary={{ label: "Open vault settings", to: "/help" }} secondary={{ label: "Contact support", to: "/contact" }} />
  </PageShell>
);
