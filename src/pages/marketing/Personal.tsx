import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, FeatureCard, CTASection } from "@/components/site/primitives";
import { Heart, Smartphone, Eye, Bell, Users, Lock } from "lucide-react";

const Personal = () => (
  <PageShell>
    <PageHero eyebrow="For individuals & families" title={<>The vault for everything <span className="text-gradient-primary">that's just yours.</span></>} lede="Passwords. Passkeys. Bank cards. Recovery codes. Family secrets. NovaSafe keeps it all sealed — and effortless to use." />
    <Section className="!pt-0">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: Smartphone, title: "On every device", desc: "Native apps for iOS, Android, macOS, Windows, Linux, and the web." },
          { icon: Eye, title: "Breach monitoring", desc: "We watch the dark web for you. Get alerted within minutes." },
          { icon: Lock, title: "Travel mode", desc: "Temporarily hide sensitive items when crossing borders." },
          { icon: Users, title: "Up to 6 family members", desc: "Each with their own private vault + shared family collections." },
          { icon: Heart, title: "Inheritance", desc: "Designate trusted contacts who can recover your vault if needed." },
          { icon: Bell, title: "Privacy alerts", desc: "Reused passwords, weak ones, leaked accounts — surfaced calmly." },
        ].map((f) => <FeatureCard key={f.title} {...f} />)}
      </div>
    </Section>
    <CTASection />
  </PageShell>
);
export default Personal;
