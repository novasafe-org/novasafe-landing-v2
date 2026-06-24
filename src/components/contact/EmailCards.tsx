import { useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Mail } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

const SUPPORT_EMAIL = "support@novasafe.io";

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast.success("Email copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy email");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${email}`}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-background",
        "text-muted-foreground transition-all hover:border-primary/30 hover:text-primary",
      )}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

export function EmailCards() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45 }}
      className="mt-16 sm:mt-20"
    >
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Prefer email?</h2>
        <p className="mt-1.5 text-[14px] text-ink-soft">Reach us directly anytime.</p>
      </div>

      <motion.a
        href={`mailto:${SUPPORT_EMAIL}`}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className={cn(
          "group mx-auto flex max-w-md items-center gap-4 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm",
          "transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md",
        )}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          <Mail className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-ink">Support</div>
          <div className="truncate font-mono text-[13px] text-primary">{SUPPORT_EMAIL}</div>
        </div>
        <CopyEmailButton email={SUPPORT_EMAIL} />
      </motion.a>
    </motion.section>
  );
}
