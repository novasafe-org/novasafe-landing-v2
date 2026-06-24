import { motion } from "framer-motion";
import { Mail } from "lucide-react";

export function ContactHero() {
  return (
    <section className="relative overflow-hidden pb-12 pt-4 sm:pb-16 sm:pt-8">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-70" />
      <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/12 via-primary-glow/6 to-transparent blur-3xl" />

      <motion.div
        className="container"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto max-w-[700px] text-center">
          <p className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary shadow-sm backdrop-blur">
              <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              Contact NovaSafe
            </span>
          </p>
          <h1 className="mt-6 text-balance text-[40px] font-semibold leading-[1.06] tracking-tightest text-ink sm:text-5xl md:text-[56px]">
            Let&apos;s <span className="text-gradient-primary">talk.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[700px] text-balance text-[16px] leading-relaxed text-ink-soft sm:text-[17px]">
            Questions about NovaSafe, security, partnerships, support or upcoming business plans?
            Send us a message and we&apos;ll get back to you.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
