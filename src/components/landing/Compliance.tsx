import { Lock, Eye, ShieldCheck, FileCheck2, KeyRound, Globe2 } from "lucide-react";

const items = [
  { icon: Eye, k: "Zero-knowledge", v: "Server can't read your data — by design.", spec: "argon2id · per-user key" },
  { icon: Lock, k: "AES-256 + XChaCha20", v: "Modern, audited cryptography in every layer.", spec: "FIPS-aligned primitives" },
  { icon: ShieldCheck, k: "End-to-end encryption", v: "Sealed on device, sealed in transit, sealed at rest.", spec: "TLS 1.3 · pinned" },
  { icon: KeyRound, k: "You hold the keys", v: "Master key never leaves your device. Period.", spec: "no key escrow" },
  { icon: FileCheck2, k: "Compliance-ready", v: "GDPR, SOC 2, ISO 27001-aligned controls.", spec: "audit trails included" },
  { icon: Globe2, k: "Region pinning", v: "Choose where encrypted blobs are stored.", spec: "EU · US · APAC" },
];

export const Compliance = () => {
  return (
    <section className="relative bg-background py-28 text-ink">
      <div className="absolute inset-0 -z-0 bg-grid bg-grid-fade opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <div className="container relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
            Bank-grade infrastructure
          </span>
          <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            Built so deeply secure, even we couldn't break in.
          </h2>
          <p className="mt-5 text-lg text-ink-soft">
            Every byte is encrypted before it leaves your device — and verified with proofs you can audit.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-px overflow-hidden rounded-3xl border border-border bg-border/60 shadow-card sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <div key={i.k} className="group relative bg-card p-7 transition-colors hover:bg-surface-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <i.icon className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-ink">{i.k}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{i.v}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[10.5px] text-ink-soft ring-1 ring-border">
                {i.spec}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 flex flex-wrap items-center justify-center gap-3 text-[12px] font-medium text-ink-soft">
          {["SOC 2 Type II", "ISO 27001", "GDPR", "HIPAA-ready", "PCI-DSS", "CCPA"].map((b) => (
            <span key={b} className="rounded-full border border-border bg-card px-3 py-1 shadow-xs">
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};