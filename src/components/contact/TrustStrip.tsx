import { motion } from "framer-motion";
import { Globe, Lock, Shield, Zap } from "lucide-react";

const TRUST_ITEMS = [
  { icon: Lock, label: "Security-first" },
  { icon: Zap, label: "Fast response" },
  { icon: Globe, label: "Global availability" },
  { icon: Shield, label: "Privacy respected" },
] as const;

export function TrustStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="mt-8 rounded-2xl border border-border/60 bg-surface-1/50 px-4 py-5 backdrop-blur sm:px-8"
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center justify-center gap-2.5 sm:justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <span className="text-[13px] font-medium text-ink-soft sm:text-[14px]">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
