import { ArrowRight, Play, ShieldCheck } from "lucide-react";
import { VaultPreview } from "./VaultPreview";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-32">
      {/* Background layers */}
      <div className="absolute inset-0 -z-10 bg-mesh" />
      <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[640px] w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/15 via-primary-glow/8 to-transparent blur-3xl" />

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-3 py-1 text-[12px] font-medium text-ink-soft shadow-sm backdrop-blur">
            <span className="flex h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Zero-knowledge architecture · audited
          </div>

          <h1
            className="animate-fade-up mt-6 text-balance text-[44px] font-semibold leading-[1.02] tracking-tightest text-ink sm:text-6xl md:text-[76px]"
            style={{ animationDelay: "0.05s" }}
          >
            Security that{" "}
            <span className="relative inline-block">
              <span className="text-gradient-primary">belongs only</span>
              <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none">
                <path d="M2 7 Q 50 1 100 5 T 198 4" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
              </svg>
            </span>{" "}
            to you.
          </h1>

          <p
            className="animate-fade-up mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-ink-soft sm:text-xl"
            style={{ animationDelay: "0.15s" }}
          >
            NovaSafe is the encrypted vault for passwords, secrets and sensitive data —
            sealed on your device with keys only you can hold.
          </p>

          <div
            className="animate-fade-up mt-9 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "0.25s" }}
          >
            <a
              href="#cta"
              className="group inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-background shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Get started — free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#demo"
              className="group inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Play className="h-2.5 w-2.5 fill-current" />
              </span>
              Live demo
            </a>
          </div>

          <div
            className="animate-fade-up mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[12px] text-muted-foreground"
            style={{ animationDelay: "0.35s" }}
          >
            <span>No credit card</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>AES-256 · XChaCha20</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>SOC 2 ready</span>
          </div>
        </div>

        {/* 3D Vault preview */}
        <div className="animate-fade-up relative mt-20 [perspective:2000px]" style={{ animationDelay: "0.45s" }}>
          <div className="origin-top transition-transform duration-700 [transform:rotateX(8deg)] hover:[transform:rotateX(2deg)]">
            <VaultPreview />
          </div>
        </div>
      </div>
    </section>
  );
};