import { motion } from "framer-motion";
import {
  Cloud,
  KeyRound,
  Lock,
  Monitor,
  Server,
  Shield,
  Smartphone,
} from "lucide-react";

import { cn } from "@/lib/utils";

const TRUST_CARDS = [
  {
    title: "Encrypted Storage",
    description: "NovaSafe stores encrypted data only — your password manager vault never holds readable secrets.",
    icon: Shield,
  },
  {
    title: "Zero Knowledge",
    description: "NovaSafe cannot read your vault contents. Passkeys, secure notes, and cards stay private.",
    icon: Lock,
  },
  {
    title: "You Own The Keys",
    description: "Only you control access to your secure vault, authenticator codes, and recovery codes.",
    icon: KeyRound,
  },
  {
    title: "Breach Protection",
    description: "Even if servers are compromised, your vault remains unreadable thanks to end-to-end encryption.",
    icon: Server,
  },
] as const;

const flowSteps = [
  { label: "Your Data", icon: Smartphone, sub: "Passwords, passkeys, notes & cards" },
  { label: "Encrypted", icon: null, sub: "Locked before it leaves you" },
  { label: "NovaSafe Cloud", icon: Cloud, sub: "Encrypted data only" },
  { label: "Your Devices", icon: Monitor, sub: "Unlocked by you alone" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

function FlowStepCard({
  step,
  isLock,
  compact,
}: {
  step: (typeof flowSteps)[number];
  isLock?: boolean;
  compact?: boolean;
}) {
  if (isLock) {
    return (
      <div className="relative flex shrink-0 flex-col items-center px-1 py-2">
        <motion.div
          className={cn(
            "relative flex items-center justify-center rounded-3xl border border-primary/30 bg-gradient-to-br from-primary to-primary-deep text-primary-foreground shadow-lg",
            compact ? "h-20 w-20" : "h-24 w-24",
          )}
          animate={{
            boxShadow: [
              "0 0 40px hsl(var(--primary) / 0.25)",
              "0 0 64px hsl(var(--primary) / 0.4)",
              "0 0 40px hsl(var(--primary) / 0.25)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Lock className={compact ? "h-9 w-9" : "h-11 w-11"} strokeWidth={1.75} />
          <span className="pointer-events-none absolute -inset-3 -z-10 rounded-3xl bg-primary/25 blur-2xl" />
        </motion.div>
        <p className="mt-3 text-center text-sm font-semibold text-ink">{step.label}</p>
        <p className="mt-0.5 max-w-[140px] text-center text-[11px] leading-snug text-muted-foreground sm:text-xs">
          {step.sub}
        </p>
      </div>
    );
  }

  const Icon = step.icon!;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "flex shrink-0 flex-col items-center rounded-2xl border border-border/70 bg-card/80 px-4 py-4 text-center shadow-sm backdrop-blur-md",
        compact ? "w-[148px]" : "w-full max-w-[200px] sm:w-[168px]",
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <p className="mt-3 text-sm font-semibold text-ink">{step.label}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">{step.sub}</p>
    </motion.div>
  );
}

function FlowConnector({ direction }: { direction: "horizontal" | "vertical" }) {
  if (direction === "horizontal") {
    return (
      <div className="hidden shrink-0 items-center px-1 md:flex" aria-hidden>
        <div className="h-px w-6 bg-gradient-to-r from-border via-primary/40 to-border lg:w-10" />
        <div className="text-primary/60">
          <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
            <path d="M8 6L0 0v12L8 6z" />
          </svg>
        </div>
        <div className="h-px w-6 bg-gradient-to-r from-border via-primary/40 to-border lg:w-10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-1 md:hidden" aria-hidden>
      <div className="h-6 w-px bg-gradient-to-b from-border via-primary/40 to-border" />
      <div className="my-0.5 text-primary/60">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
          <path d="M6 8L0 0h12L6 8z" />
        </svg>
      </div>
      <div className="h-6 w-px bg-gradient-to-b from-border via-primary/40 to-border" />
    </div>
  );
}

export const EncryptionFlow = () => {
  return (
    <section id="security" className="relative overflow-hidden py-20 sm:py-28" aria-labelledby="trust-layer-heading">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/4 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-[100px]" />
        <motion.div
          className="absolute right-[10%] top-[20%] h-64 w-64 rounded-full bg-primary-glow/10 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-[8%] bottom-[15%] h-48 w-48 rounded-full bg-primary/8 blur-3xl"
          animate={{ x: [0, -15, 0], y: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="container">
        <motion.header
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary shadow-sm">
              <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              Zero-knowledge security
            </span>
          </p>
          <h2
            id="trust-layer-heading"
            className="mt-5 text-balance text-[32px] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl"
          >
            Only you can unlock your vault.
          </h2>
          <p className="mt-5 text-balance text-[16px] leading-relaxed text-ink-soft sm:text-lg">
            Your passwords, passkeys, secure notes, payment cards, SSH keys, recovery codes, and
            authenticator secrets are protected with end-to-end encryption before they leave your device.
            NovaSafe cannot see, access, or recover your data — a true zero-knowledge password manager
            and secure vault built for digital security you control.
          </p>
        </motion.header>

        {/* Centered trust visual */}
        <motion.div
          className="relative mx-auto mt-14 max-w-6xl sm:mt-16"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <div className="relative rounded-[2rem] border border-border/60 bg-card/50 p-6 shadow-card backdrop-blur-sm sm:p-10">
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-r from-primary/[0.04] via-transparent to-primary/[0.06]" />

            <div className="relative flex flex-col items-center md:flex-row md:items-center md:justify-center">
              <FlowStepCard step={flowSteps[0]} compact />
              <FlowConnector direction="vertical" />
              <FlowConnector direction="horizontal" />
              <FlowStepCard step={flowSteps[1]} isLock compact />
              <FlowConnector direction="vertical" />
              <FlowConnector direction="horizontal" />
              <FlowStepCard step={flowSteps[2]} compact />
              <FlowConnector direction="vertical" />
              <FlowConnector direction="horizontal" />
              <FlowStepCard step={flowSteps[3]} compact />
            </div>

            <p className="relative mt-8 text-center text-[13px] font-medium text-ink-soft">
              Your data travels securely — only you hold the key.
            </p>
          </div>
        </motion.div>

        {/* Trust cards */}
        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:mt-16">
          {TRUST_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={cn(
                  "group rounded-2xl border border-border/60 bg-card p-5",
                  "transition-shadow duration-300 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/[0.06]",
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-ink">{card.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{card.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
