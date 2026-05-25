import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, FeatureCard } from "@/components/site/primitives";
import { BookOpen, Smartphone, Key, Building2, Wrench, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

const groups = [
  { icon: BookOpen, t: "Getting started", d: "Set up your first vault.", to: "/docs/getting-started" },
  { icon: Smartphone, t: "Apps & sync", d: "Install on every device.", to: "/features/cross-platform-sync" },
  { icon: Key, t: "Passwords & passkeys", d: "Save, autofill, share.", to: "/features/password-manager" },
  { icon: Building2, t: "Teams & orgs", d: "Invite, roles, policies.", to: "/teams" },
  { icon: Wrench, t: "Account recovery", d: "Restore access safely.", to: "/account-recovery" },
  { icon: ShieldAlert, t: "Security & trust", d: "How encryption works.", to: "/security" },
];

export default () => (
  <PageShell>
    <PageHero eyebrow="Help center" title={<>How can we <span className="text-gradient-primary">help?</span></>} lede="Search articles, browse categories, or contact support. Most answers in under 30 seconds." />
    <Section className="!pt-0">
      <div className="mx-auto mb-10 max-w-2xl">
        <input className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-[15px] text-ink shadow-sm outline-none transition-all placeholder:text-ink-soft focus:border-primary focus:ring-4 focus:ring-primary/15" placeholder="Search the help center…" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <Link key={g.t} to={g.to}><FeatureCard icon={g.icon} title={g.t} desc={g.d} /></Link>
        ))}
      </div>
    </Section>
  </PageShell>
);
