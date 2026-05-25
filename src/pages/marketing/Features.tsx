import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, FeatureCard, CTASection } from "@/components/site/primitives";
import { Link } from "react-router-dom";
import { Key, Fingerprint, Share2, Terminal, ShieldCheck, Smartphone, Lock, Building2, ScanLine } from "lucide-react";

const all = [
  { icon: Key, title: "Password Manager", desc: "Sealed credentials, autofilled everywhere.", to: "/features/password-manager", active: true },
  { icon: Fingerprint, title: "Passkeys", desc: "Phishing-resistant sign-in with WebAuthn.", active: false },
  { icon: Share2, title: "Secure Sharing", desc: "Send secrets without leaking them.", active: false },
  { icon: Terminal, title: "Secrets Management", desc: "API keys & env vars for engineering teams.", active: false },
  { icon: ScanLine, title: "Authenticator", desc: "Built-in OTP with encrypted cloud backup.", active: false },
  { icon: Smartphone, title: "Cross-platform Sync", desc: "Native apps across every device.", active: false },
  { icon: ShieldCheck, title: "Zero-knowledge", desc: "Your keys, your data, your control.", active: false },
  { icon: Building2, title: "Business Vaults", desc: "Org-wide encrypted spaces & roles.", active: false },
  { icon: Lock, title: "Emergency Access", desc: "Inheritance & recovery you can trust.", active: false },
];

const Features = () => (
  <PageShell>
    <PageHero eyebrow="The product" title={<>One vault. <span className="text-gradient-primary">Every secret.</span></>} lede="NovaSafe is a single coherent system for the most sensitive data in your digital life — designed end-to-end by cryptographers and product designers." />
    <Section className="!pt-0">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {all.map((f) => {
          const card = <FeatureCard icon={f.icon} title={f.title} desc={f.desc} comingSoon={!f.active} />;
          return f.active ? (
            <Link key={f.title} to={f.to!}>
              {card}
            </Link>
          ) : (
            <div key={f.title} className="cursor-default">
              {card}
            </div>
          );
        })}
      </div>
    </Section>
    <CTASection />
  </PageShell>
);
export default Features;
