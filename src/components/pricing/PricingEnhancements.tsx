import {
  Code2,
  FileText,
  Fingerprint,
  RotateCcw,
  Share2,
  ShieldCheck,
  Smartphone,
  Users,
  Building2,
  ClipboardList,
  User,
  type LucideIcon,
} from "lucide-react";

import { CheckList, Eyebrow, Section, SectionHead } from "@/components/site/primitives";
import { cn } from "@/lib/utils";

const AUDIENCES = [
  {
    icon: User,
    title: "Individuals",
    features: [
      "Store passwords securely",
      "Generate strong passwords",
      "Secure browser autofill",
      "Password health monitoring",
    ],
    comingSoon: false,
  },
  {
    icon: Code2,
    title: "Developers",
    features: [
      "Manage infrastructure logins",
      "Protect admin credentials",
      "Store server passwords",
      "Secure development accounts",
    ],
    comingSoon: false,
  },
  {
    icon: Users,
    title: "Teams",
    features: [
      "Shared vaults",
      "Role-based access",
      "Team collaboration",
      "Organization security controls",
    ],
    comingSoon: true,
  },
] as const;

export function WhoItsForSection() {
  return (
    <Section className="!pb-12 !pt-0 sm:!pb-16">
      <SectionHead
        eyebrow="Who it's for"
        title={
          <>
            Built for modern <span className="text-gradient-primary">digital security.</span>
          </>
        }
        lede="NovaSafe helps individuals securely manage passwords today, while laying the foundation for passkeys, authentication and broader identity security in future releases."
      />
      <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {AUDIENCES.map((audience) => {
          const Icon = audience.icon;
          return (
            <div
              key={audience.title}
              className={cn(
                "rounded-3xl border border-border/70 bg-card p-7 shadow-sm transition-colors",
                audience.comingSoon ? "border-border/50 bg-card/80" : "hover:border-primary/25",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-semibold text-ink">{audience.title}</h3>
                  {audience.comingSoon && (
                    <span className="rounded-full border border-border/80 bg-surface-1 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-ink-soft">
                      Coming soon
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <CheckList items={[...audience.features]} />
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

const INCLUDED_FEATURES = [
  "Zero-knowledge architecture",
  "End-to-end encryption",
  "Strong password generator",
  "Browser extension support",
  "Password health monitoring",
  "Secure vault storage",
  "Encrypted synchronization",
  "Privacy-first design",
  "Modern encryption standards",
  "Cross-device access",
] as const;

export function IncludedEveryPlanSection() {
  return (
    <Section className="!pt-0">
      <SectionHead
        eyebrow="Included in every plan"
        title={
          <>
            Security comes <span className="text-gradient-primary">standard.</span>
          </>
        }
        lede="Every NovaSafe account is built on the same security foundation."
      />
      <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
        {INCLUDED_FEATURES.map((feature) => (
          <div
            key={feature}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3.5 text-[14px] text-ink-soft"
          >
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-[11px] font-bold">✓</span>
            </span>
            {feature}
          </div>
        ))}
      </div>
    </Section>
  );
}

type RoadmapItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const ROADMAP: RoadmapItem[] = [
  {
    icon: Fingerprint,
    title: "Passkey Manager",
    description: "Passwordless sign-in with modern passkey support across your accounts.",
  },
  {
    icon: ShieldCheck,
    title: "Authenticator",
    description: "Built-in two-factor codes for stronger account protection.",
  },
  {
    icon: FileText,
    title: "Secure Notes",
    description: "Private notes stored inside your encrypted vault.",
  },
  {
    icon: RotateCcw,
    title: "Recovery Codes",
    description: "Backup and recovery options when you need them most.",
  },
  {
    icon: Share2,
    title: "Secure Sharing",
    description: "Share credentials safely without exposing plaintext secrets.",
  },
  {
    icon: Users,
    title: "Team Vaults",
    description: "Collaborative vaults with controlled access for teams.",
  },
  {
    icon: Building2,
    title: "Business SSO",
    description: "Single sign-on and identity controls for organizations.",
  },
  {
    icon: ClipboardList,
    title: "Audit Logs",
    description: "Visibility into vault activity for security and compliance.",
  },
  {
    icon: Smartphone,
    title: "Mobile Apps",
    description: "Native mobile access to your encrypted vault on the go.",
  },
];

export function RoadmapSection() {
  return (
    <Section className="!pt-0" id="roadmap">
      <SectionHead
        eyebrow="Roadmap"
        title={
          <>
            What we&apos;re building <span className="text-gradient-primary">next.</span>
          </>
        }
        lede="NovaSafe starts with password management and is expanding into a complete digital identity security platform."
      />
      <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROADMAP.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="group rounded-2xl border border-border/70 bg-card/70 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <span className="shrink-0 rounded-full border border-border/80 bg-surface-1 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-ink-soft">
                  Coming soon
                </span>
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">{item.description}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export function PricingSeoContent() {
  return (
    <Section className="!pt-0" id="why-novasafe">
      <div className="mx-auto max-w-3xl">
        <Eyebrow>About NovaSafe</Eyebrow>
        <h2 className="mt-4 text-balance text-[28px] font-semibold leading-tight tracking-tight text-ink sm:text-[32px]">
          Why users choose <span className="text-gradient-primary">NovaSafe</span>
        </h2>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink-soft sm:text-[16px]">
          <p>
            NovaSafe is a secure password manager built to protect your digital identity with
            zero-knowledge security and end-to-end encryption. As a privacy-first security platform,
            every account starts with the same foundation of password protection and encrypted vault
            storage.
          </p>
          <p>
            Store passwords securely, generate strong credentials, monitor password health and access
            your encrypted vault across devices. NovaSafe is designed for secure login storage without
            compromising privacy — your data stays under your control.
          </p>
          <p>
            As NovaSafe evolves, support for passkeys, authenticators, secure notes, recovery codes,
            secure sharing and team collaboration will expand the platform into a complete digital
            identity security solution.
          </p>
        </div>
      </div>
    </Section>
  );
}
