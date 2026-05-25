import { Link } from "react-router-dom";
import { Logo } from "@/components/landing/Logo";
import { Github, Twitter, Linkedin, Youtube } from "lucide-react";

const cols: { t: string; l: { label: string; href: string }[] }[] = [
  {
    t: "Product",
    l: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Security", href: "/security" },
      { label: "Password Manager", href: "/features/password-manager" },
      { label: "Passkeys", href: "/features/passkeys" },
      { label: "Secure Sharing", href: "/features/secure-sharing" },
      { label: "Secrets Management", href: "/features/secrets-management" },
      { label: "Authenticator", href: "/features/authenticator" },
    ],
  },
  {
    t: "Solutions",
    l: [
      { label: "Personal", href: "/personal" },
      { label: "Teams", href: "/teams" },
      { label: "Enterprise", href: "/enterprise" },
      { label: "Business Vaults", href: "/features/business-vaults" },
      { label: "Cross-platform Sync", href: "/features/cross-platform-sync" },
      { label: "Zero-knowledge", href: "/features/zero-knowledge" },
      { label: "Customers", href: "/customers" },
      { label: "Case Studies", href: "/case-studies" },
    ],
  },
  {
    t: "Developers",
    l: [
      { label: "Overview", href: "/developers" },
      { label: "API Reference", href: "/developers/api" },
      { label: "SDKs", href: "/developers/sdks" },
      { label: "CLI", href: "/developers/cli" },
      { label: "Webhooks", href: "/developers/webhooks" },
      { label: "Integrations", href: "/developers/integrations" },
      { label: "Changelog", href: "/changelog" },
      { label: "System Status", href: "/status" },
      { label: "Open source", href: "/open-source" },
    ],
  },
  {
    t: "Company",
    l: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Press Kit", href: "/press" },
      { label: "Brand Guidelines", href: "/brand" },
      { label: "Blog", href: "/blog" },
      { label: "Help Center", href: "/help" },
      { label: "Documentation", href: "/docs" },
    ],
  },
  {
    t: "Legal",
    l: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Security Policy", href: "/legal/security" },
      { label: "Cookie Policy", href: "/legal/cookies" },
      { label: "Data Processing", href: "/legal/dpa" },
      { label: "Compliance", href: "/compliance" },
      { label: "GDPR", href: "/legal/gdpr" },
      { label: "SOC 2", href: "/legal/soc2" },
      { label: "Responsible Disclosure", href: "/legal/responsible-disclosure" },
    ],
  },
];

export const SiteFooter = () => (
  <footer className="relative border-t border-border/70 bg-surface-1/60 pt-20 pb-10">
    <div className="container">
      <div className="grid gap-12 lg:grid-cols-[1.2fr_3.8fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-ink-soft">
            Your digital life — sealed with zero-knowledge encryption. Only you can open it.
          </p>
          <a href="mailto:support@novasafe.app" className="mt-4 inline-block font-mono text-[12.5px] text-primary hover:underline">
            support@novasafe.app
          </a>
          <div className="mt-6 flex items-center gap-2">
            {[Github, Twitter, Linkedin, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="rounded-lg border border-border/70 p-2 text-ink-soft transition-colors hover:bg-secondary hover:text-ink">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {cols.map((c) => (
            <div key={c.t}>
              <div className="text-[11.5px] font-semibold uppercase tracking-wider text-ink">{c.t}</div>
              <ul className="mt-4 space-y-2.5">
                {c.l.map((i) => (
                  <li key={i.href}>
                    <Link to={i.href} className="text-[13px] text-ink-soft transition-colors hover:text-primary">
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border/70 pt-6 sm:flex-row sm:items-center">
        <div className="text-[12px] text-muted-foreground">© 2026 NovaSafe Technologies Pvt. Ltd. All rights reserved.</div>
        <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-muted-foreground">
          <Link to="/status" className="flex items-center gap-1.5 hover:text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
            All systems operational
          </Link>
          <span className="text-border">·</span>
          <span>SOC 2 Type II</span>
          <span className="text-border">·</span>
          <span>ISO 27001</span>
          <span className="text-border">·</span>
          <span>GDPR</span>
        </div>
      </div>
    </div>
  </footer>
);
