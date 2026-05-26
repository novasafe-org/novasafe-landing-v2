import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { LANDING_ROUTES } from "@/config";

export const CTA = () => (
  <section id="cta" className="relative py-32">
    <div className="container">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-ink p-12 text-background shadow-elevated sm:p-20">
        <div className="pointer-events-none absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full bg-primary/30 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-primary-glow/20 blur-[100px]" />
        <div className="absolute inset-0 -z-0 opacity-[0.06]" style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

        <div className="relative text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary-glow">
            <ShieldCheck className="h-3 w-3" /> Start free · upgrade when ready
          </span>
          <h2 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Take control of your{" "}
            <span className="text-gradient-primary">digital life.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
            Three minutes to set up. A lifetime of peace of mind.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={LANDING_ROUTES.pricing}
              className="group inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3.5 text-[14.5px] font-semibold text-ink shadow-lg transition-all hover:-translate-y-0.5"
            >
              Create your vault
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to={LANDING_ROUTES.contact}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-[14.5px] font-semibold text-background transition-all hover:bg-white/10"
            >
              Talk to security team
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[12px] text-white/50">
            <span>Free for individuals</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>SSO on every plan</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);