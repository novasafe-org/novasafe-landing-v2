import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, SectionHead, FeatureCard, CTASection } from "@/components/site/primitives";
import { Link } from "react-router-dom";
import { Key, Fingerprint, Share2, Terminal, ShieldCheck, Smartphone, Lock, Building2, ScanLine } from "lucide-react";

const all = [
  { icon: Key, title: "Password Manager", desc: "Sealed credentials, autofilled everywhere.", to: "/features/password-manager" },
  { icon: Fingerprint, title: "Passkeys", desc: "Phishing-resistant sign-in with WebAuthn.", to: "/features/passkeys" },
  { icon: Share2, title: "Secure Sharing", desc: "Send secrets without leaking them.", to: "/features/secure-sharing" },
  { icon: Terminal, title: "Secrets Management", desc: "API keys & env vars for engineering teams.", to: "/features/secrets-management" },
  { icon: ScanLine, title: "Authenticator", desc: "Built-in OTP with encrypted cloud backup.", to: "/features/authenticator" },
  { icon: Smartphone, title: "Cross-platform Sync", desc: "Native apps across every device.", to: "/features/cross-platform-sync" },
  { icon: ShieldCheck, title: "Zero-knowledge", desc: "Your keys, your data, your control.", to: "/features/zero-knowledge" },
  { icon: Building2, title: "Business Vaults", desc: "Org-wide encrypted spaces & roles.", to: "/features/business-vaults" },
  { icon: Lock, title: "Emergency Access", desc: "Inheritance & recovery you can trust.", to: "/features/zero-knowledge" },
];

const Features = () => (
  <PageShell>
    <PageHero eyebrow="The product" title={<>One vault. <span className="text-gradient-primary">Every secret.</span></>} lede="NovaSafe is a single coherent system for the most sensitive data in your digital life — designed end-to-end by cryptographers and product designers." />
    <Section className="!pt-0">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {all.map((f) => (
          <Link key={f.title} to={f.to}>
            <FeatureCard icon={f.icon} title={f.title} desc={f.desc} />
          </Link>
        ))}
      </div>
    </Section>
    <CTASection />
  </PageShell>
);
export default Features;
