import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, SectionHead, FeatureCard, CTASection } from "@/components/site/primitives";
import { Users, Share2, GitBranch, ShieldCheck, Activity, Layers } from "lucide-react";

const Teams = () => (
  <PageShell>
    <PageHero eyebrow="For teams" title={<>Shared secrets without the <span className="text-gradient-primary">shared spreadsheet.</span></>} lede="Stop pasting credentials into Slack. Give every teammate a sealed, role-aware vault they actually want to use." />
    <Section className="!pt-0">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: Layers, title: "Shared collections", desc: "Group secrets by project, environment, or client." },
          { icon: Users, title: "Role-based access", desc: "Owner, editor, viewer — plus custom roles." },
          { icon: Share2, title: "One-click handoff", desc: "Send sealed credentials with expiry & view limits." },
          { icon: GitBranch, title: "Environment versions", desc: "Track changes to every shared secret." },
          { icon: ShieldCheck, title: "Org-wide policies", desc: "Enforce 2FA, password strength, session length." },
          { icon: Activity, title: "Activity timeline", desc: "Know exactly who accessed what, and when." },
        ].map((f) => <FeatureCard key={f.title} {...f} />)}
      </div>
    </Section>
    <CTASection title="Teams up to 250 get started in 5 minutes" primary={{ label: "Start free", to: "/pricing" }} secondary={{ label: "Compare plans", to: "/pricing" }} />
  </PageShell>
);
export default Teams;
