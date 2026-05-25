import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "@/components/landing/Logo";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";

type Group = { label: string; items: { label: string; href: string; desc?: string }[] };

const NAV: Group[] = [
  {
    label: "Product",
    items: [
      { label: "Features", href: "/features", desc: "Everything in NovaSafe" },
      { label: "Password Manager", href: "/features/password-manager", desc: "Sealed credentials, instantly" },
      { label: "Passkeys", href: "/features/passkeys", desc: "Phishing-resistant sign-in" },
      { label: "Secure Sharing", href: "/features/secure-sharing", desc: "Send secrets, not screenshots" },
      { label: "Secrets Management", href: "/features/secrets-management", desc: "For engineering teams" },
      { label: "Authenticator", href: "/features/authenticator", desc: "Built-in OTP, encrypted" },
      { label: "Cross-platform Sync", href: "/features/cross-platform-sync", desc: "Every device, in step" },
      { label: "Zero-knowledge", href: "/features/zero-knowledge", desc: "Only you hold the keys" },
      { label: "Business Vaults", href: "/features/business-vaults", desc: "Org-wide encrypted spaces" },
    ],
  },
  {
    label: "Solutions",
    items: [
      { label: "Personal", href: "/personal", desc: "For individuals & families" },
      { label: "Teams", href: "/teams", desc: "For modern teams up to 250" },
      { label: "Enterprise", href: "/enterprise", desc: "Compliance, SSO, audit" },
      { label: "Customers", href: "/customers", desc: "Loved by 12,000+ orgs" },
      { label: "Case Studies", href: "/case-studies", desc: "Real-world deployments" },
    ],
  },
  {
    label: "Developers",
    items: [
      { label: "Overview", href: "/developers", desc: "Build on NovaSafe" },
      { label: "API Reference", href: "/developers/api", desc: "REST + GraphQL" },
      { label: "SDKs", href: "/developers/sdks", desc: "JS, Python, Go, Rust" },
      { label: "CLI", href: "/developers/cli", desc: "Vault from terminal" },
      { label: "Webhooks", href: "/developers/webhooks", desc: "Event-driven secrets" },
      { label: "Integrations", href: "/developers/integrations", desc: "120+ providers" },
      { label: "Changelog", href: "/changelog", desc: "What's new" },
      { label: "System Status", href: "/status", desc: "Live uptime" },
      { label: "Open source", href: "/open-source", desc: "Research & libraries" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Security", href: "/security", desc: "Architecture & audits" },
      { label: "Compliance", href: "/compliance", desc: "SOC2, ISO, GDPR" },
      { label: "Documentation", href: "/docs", desc: "Guides & references" },
      { label: "Help Center", href: "/help", desc: "Get unblocked" },
      { label: "Blog", href: "/blog", desc: "Engineering & research" },
      { label: "About", href: "/about", desc: "Our mission" },
      { label: "Careers", href: "/careers", desc: "Join the team" },
      { label: "Contact", href: "/contact", desc: "Talk to us" },
    ],
  },
];

export const SiteHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(null); setMobile(false); }, [location.pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={cn(
          "flex w-full max-w-6xl items-center justify-between gap-6 rounded-2xl px-4 py-2.5 transition-all duration-500",
          scrolled || open ? "glass-strong shadow-card border border-border/70" : "border border-transparent",
        )}
        onMouseLeave={() => setOpen(null)}
      >
        <Link to="/" className="flex items-center"><Logo /></Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV.map((g) => (
            <li key={g.label} onMouseEnter={() => setOpen(g.label)}>
              <button
                className={cn(
                  "flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition-colors",
                  open === g.label ? "bg-secondary text-ink" : "text-ink-soft hover:bg-secondary hover:text-ink"
                )}
              >
                {g.label}
                <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", open === g.label && "rotate-180")} />
              </button>
            </li>
          ))}
          <li>
            <Link to="/pricing" className="rounded-lg px-3 py-1.5 text-[13.5px] font-medium text-ink-soft hover:bg-secondary hover:text-ink">
              Pricing
            </Link>
          </li>
        </ul>

        <div className="flex items-center gap-2">
          <Link to="/contact" className="hidden rounded-lg px-3 py-1.5 text-[13.5px] font-medium text-ink-soft hover:text-ink sm:block">
            Sign in
          </Link>
          <Link to="/pricing" className="group inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-semibold text-background shadow-sm transition-all hover:bg-ink/90">
            Get started
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setMobile((v) => !v)} aria-label="Menu">
            {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mega panel */}
        {open && (
          <div className="absolute left-0 right-0 top-full mt-2 hidden lg:block">
            <div className="glass-strong mx-auto max-w-5xl rounded-2xl border border-border/70 p-6 shadow-elevated animate-fade-in">
              <div className="grid grid-cols-3 gap-x-6 gap-y-1">
                {NAV.find((n) => n.label === open)?.items.map((it) => (
                  <Link key={it.href} to={it.href} className="group rounded-xl p-3 transition-colors hover:bg-secondary">
                    <div className="text-[13.5px] font-semibold text-ink group-hover:text-primary">{it.label}</div>
                    {it.desc && <div className="mt-0.5 text-[12.5px] text-ink-soft">{it.desc}</div>}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile */}
      {mobile && (
        <div className="absolute inset-x-4 top-20 lg:hidden">
          <div className="glass-strong max-h-[80vh] overflow-y-auto rounded-2xl border border-border/70 p-4 shadow-elevated animate-fade-in">
            {NAV.map((g) => (
              <div key={g.label} className="border-b border-border/60 py-3 last:border-0">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{g.label}</div>
                <div className="space-y-1">
                  {g.items.map((it) => (
                    <Link key={it.href} to={it.href} className="block rounded-lg px-2 py-1.5 text-[14px] text-ink hover:bg-secondary">
                      {it.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Link to="/pricing" className="block rounded-lg px-2 py-3 text-[14px] font-semibold text-primary">Pricing</Link>
          </div>
        </div>
      )}
    </header>
  );
};
