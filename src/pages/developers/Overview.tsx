import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, FeatureCard, CTASection } from "@/components/site/primitives";
import { Terminal, Code, Webhook, Plug, Activity, Github } from "lucide-react";
import { Link } from "react-router-dom";

const cards = [
  { icon: Code, title: "API Reference", desc: "REST + GraphQL, OpenAPI-described.", to: "/developers/api" },
  { icon: Terminal, title: "CLI", desc: "Vault, secrets, run-with-env, in your terminal.", to: "/developers/cli" },
  { icon: Plug, title: "SDKs", desc: "TypeScript, Python, Go, Rust, Ruby.", to: "/developers/sdks" },
  { icon: Webhook, title: "Webhooks", desc: "Subscribe to vault events in real time.", to: "/developers/webhooks" },
  { icon: Plug, title: "Integrations", desc: "120+ providers — AWS, GitHub, Vercel, Datadog.", to: "/developers/integrations" },
  { icon: Activity, title: "System Status", desc: "Live uptime & incident history.", to: "/status" },
  { icon: Github, title: "Open Source", desc: "Audited cryptography, public libraries.", to: "/open-source" },
];

export default () => (
  <PageShell>
    <PageHero eyebrow="Developers" title={<>Build on <span className="text-gradient-primary">NovaSafe.</span></>} lede="A complete platform for credentials, secrets, and identity. Production-ready APIs, native SDKs, and the same encryption that powers our consumer apps." />
    <Section className="!pt-0">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.title} to={c.to}><FeatureCard icon={c.icon} title={c.title} desc={c.desc} /></Link>
        ))}
      </div>
    </Section>
    <CTASection title="Get your API keys" lede="Free for development. Pay only for production workloads." primary={{ label: "Open dashboard", to: "/pricing" }} secondary={{ label: "Read the docs", to: "/docs" }} />
  </PageShell>
);
