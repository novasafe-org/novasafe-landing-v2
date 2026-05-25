import { Link } from "react-router-dom";
import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section } from "@/components/site/primitives";

const groups: { t: string; l: { label: string; href: string }[] }[] = [
  { t: "Product", l: [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
    { label: "Security", href: "/security" },
    { label: "Pricing", href: "/pricing" },
    { label: "Password Manager", href: "/features/password-manager" },
    { label: "Passkeys", href: "/features/passkeys" },
    { label: "Secure Sharing", href: "/features/secure-sharing" },
  ]},
  { t: "Developers", l: [
    { label: "API Reference", href: "/developers/api" },
    { label: "Documentation", href: "/docs" },
    { label: "Getting Started", href: "/docs/getting-started" },
    { label: "Migration", href: "/docs/migration" },
    { label: "CLI", href: "/developers/cli" },
    { label: "Changelog", href: "/changelog" },
    { label: "Status", href: "/status" },
  ]},
  { t: "Resources", l: [
    { label: "Help Center", href: "/help" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ]},
  { t: "Legal", l: [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Security Policy", href: "/legal/security" },
    { label: "Cookie Policy", href: "/legal/cookies" },
    { label: "Responsible Disclosure", href: "/legal/responsible-disclosure" },
  ]},
];

export default function Sitemap() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Sitemap"
        title="Everything on NovaSafe"
        lede="A flat, indexed list of every public page on novasafe.app."
      />
      <Section className="!pt-0">
        <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g) => (
            <div key={g.t}>
              <div className="text-[11.5px] font-semibold uppercase tracking-wider text-ink">{g.t}</div>
              <ul className="mt-4 space-y-2.5">
                {g.l.map((i) => (
                  <li key={i.href}>
                    <Link to={i.href} className="text-[13.5px] text-ink-soft transition-colors hover:text-primary">
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}