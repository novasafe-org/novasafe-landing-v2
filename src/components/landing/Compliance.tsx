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
    <section className="relative bg-ink py-28 text-background">
      <div className="absolute inset-0 -z-0 opacity-[0.06]" style={{
        backgroundImage:
          "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 90%)",
      }} />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />

      <div className="container relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary-glow">
            Bank-grade infrastructure
          </span>
          <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Built so deeply secure, even we couldn't break in.
          </h2>
          <p className="mt-5 text-lg text-white/70">
            Every byte is encrypted before it leaves your device — and verified with proofs you can audit.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <div key={i.k} className="group relative bg-ink p-7 transition-colors hover:bg-white/[0.03]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-primary-glow ring-1 ring-white/10">
                <i.icon className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <h3 className="mt-5 text-[17px] font-semibold tracking-tight">{i.k}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/60">{i.v}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10.5px] text-white/50">
                {i.spec}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 flex flex-wrap items-center justify-center gap-3 text-[12px] font-medium text-white/60">
          {["SOC 2 Type II", "ISO 27001", "GDPR", "HIPAA-ready", "PCI-DSS", "CCPA"].map((b) => (
            <span key={b} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};