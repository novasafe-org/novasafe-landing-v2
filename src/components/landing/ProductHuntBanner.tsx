import { motion } from "framer-motion";
import { ArrowUpRight, Lock, Rocket, Star } from "lucide-react";

import { PRODUCT_HUNT } from "@/config/product-hunt.config";
import { cn } from "@/lib/utils";

const STATS = [
  { icon: Star, label: "Early supporters welcome" },
  { icon: Lock, label: "Building privacy-first security" },
  { icon: Rocket, label: "Public launch on Product Hunt" },
] as const;

export function ProductHuntBanner() {
  return (
    <section className="relative bg-background py-16 sm:py-16" aria-labelledby="product-hunt-heading">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-[700px]"
        >
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "rounded-3xl border border-border/70 bg-card/70 px-6 py-8 text-center shadow-sm backdrop-blur",
              "transition-shadow duration-300 hover:border-primary/25 hover:shadow-md hover:shadow-primary/[0.06]",
              "sm:px-10 sm:py-10",
            )}
          >
            <p className="flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-product-hunt/25 bg-product-hunt/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-product-hunt">
                <Rocket className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                Featured on Product Hunt
              </span>
            </p>

            <h2
              id="product-hunt-heading"
              className="mt-5 text-balance text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]"
            >
              Love NovaSafe?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-balance text-[15px] leading-relaxed text-ink-soft sm:text-[16px]">
              Help us grow by leaving a review on Product Hunt.
            </p>

            <motion.a
              href={PRODUCT_HUNT.reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-product-hunt px-5 py-3",
                "text-[14px] font-semibold text-product-hunt-foreground shadow-sm",
                "transition-colors hover:bg-product-hunt-hover hover:shadow-md hover:shadow-product-hunt/25",
                "sm:w-auto",
              )}
            >
              Review on Product Hunt
              <ArrowUpRight className="h-4 w-4" />
            </motion.a>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
              {STATS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-primary/70" strokeWidth={1.75} />
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default ProductHuntBanner;
