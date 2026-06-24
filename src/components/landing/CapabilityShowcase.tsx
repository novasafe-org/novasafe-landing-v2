import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  FileText,
  Fingerprint,
  KeyRound,
  Lock,
  RotateCcw,
  ShieldCheck,
  Terminal,
  Vault,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Capability = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const CAPABILITIES: Capability[] = [
  {
    title: "Password Manager",
    description: "Securely store and autofill passwords across devices as part of your digital security workflow.",
    icon: KeyRound,
  },
  {
    title: "Passkey Manager",
    description: "Manage modern passwordless sign-ins with passkeys for stronger identity security.",
    icon: Fingerprint,
  },
  {
    title: "Authenticator",
    description: "Generate and store two-factor authentication codes in one authenticator app.",
    icon: ShieldCheck,
  },
  {
    title: "Secure Notes",
    description: "Keep encrypted notes private — accessible only to you inside your secure vault.",
    icon: FileText,
  },
  {
    title: "Payment Cards",
    description: "Payment card storage with end-to-end encryption for checkout and billing details.",
    icon: CreditCard,
  },
  {
    title: "Secrets Vault",
    description: "A secrets manager for API keys, tokens, and confidential credentials.",
    icon: Vault,
  },
  {
    title: "SSH Keys",
    description: "SSH key storage and organization for secure infrastructure access.",
    icon: Terminal,
  },
  {
    title: "Recovery Codes",
    description: "Store backup and recovery codes safely when you need them most.",
    icon: RotateCcw,
  },
];

const KEYWORD_CHIPS = [
  "Passwords",
  "Passkeys",
  "Authenticator",
  "Secure Notes",
  "Cards",
  "Recovery Codes",
  "API Keys",
  "Secrets",
] as const;

const TRUST_BADGES = [
  "Argon2id",
  "XChaCha20-Poly1305",
  "Zero-Knowledge Architecture",
  "End-to-End Encryption",
] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

function CapabilityCard({ capability }: { capability: Capability }) {
  const Icon = capability.icon;

  return (
    <motion.article
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5",
        "transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/[0.06]",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary",
          "transition-colors duration-300 group-hover:bg-primary/15",
        )}
        aria-hidden
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className="text-[15px] font-semibold tracking-tight text-ink">{capability.title}</h3>
      <p className="text-[13.5px] leading-relaxed text-ink-soft">{capability.description}</p>
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-primary/20 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
    </motion.article>
  );
}

export function CapabilityShowcase() {
  return (
    <section
      className="relative bg-background py-16 sm:py-20"
      aria-labelledby="capabilities-heading"
    >
      <div className="container">
        <motion.header
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary shadow-sm">
              <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              The trust layer
            </span>
          </p>
          <h2
            id="capabilities-heading"
            className="mt-5 text-balance text-[28px] font-semibold tracking-tight text-ink sm:text-4xl"
          >
            One secure place for everything important
          </h2>
          <p className="mt-4 text-balance text-[15px] leading-relaxed text-ink-soft sm:text-[17px]">
            Everything you need to protect your digital identity — with end-to-end encryption and
            zero-knowledge security in one place.
          </p>
          <ul
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
            role="list"
            aria-label="What you can protect with NovaSafe"
          >
            {KEYWORD_CHIPS.map((chip, index) => (
              <motion.li
                key={chip}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
              >
                <span
                  className={cn(
                    "inline-flex rounded-full border border-border/80 bg-card px-3.5 py-1.5",
                    "text-[13px] font-medium text-ink-soft shadow-sm",
                    "transition-colors duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
                  )}
                >
                  {chip}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.header>

        <motion.div
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {CAPABILITIES.map((capability) => (
            <CapabilityCard key={capability.title} capability={capability} />
          ))}
        </motion.div>

        <motion.div
          className="mt-12 flex flex-col items-center gap-4 pt-2"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          <p className="flex justify-center">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" strokeWidth={2} aria-hidden />
              Protected with
            </span>
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-2" role="list">
            {TRUST_BADGES.map((badge) => (
              <li key={badge}>
                <span className="inline-flex rounded-full border border-border/80 bg-card px-3.5 py-1 text-[11.5px] font-medium text-ink-soft">
                  {badge}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
