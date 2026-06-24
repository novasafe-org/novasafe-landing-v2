import { Link } from "react-router-dom";
import { ArrowRight, HelpCircle } from "lucide-react";

import { FaqAccordion } from "@/components/shared/FaqAccordion";
import { FAQ_ITEMS } from "@/data/faq-items";
import { LANDING_ROUTES } from "@/config";
import { cn } from "@/lib/utils";

type FaqContentProps = {
  id?: string;
  headingId?: string;
  showCta?: boolean;
  className?: string;
};

export function FaqContent({
  id,
  headingId = "faq-heading",
  showCta = false,
  className,
}: FaqContentProps) {
  return (
    <div className={cn("mx-auto max-w-[1000px]", className)}>
      <header className="text-center">
        <p className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary shadow-sm">
            <HelpCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            Frequently asked questions
          </span>
        </p>
        <h2
          id={headingId}
          className="mt-5 text-balance text-[32px] font-semibold tracking-tight text-ink sm:text-4xl lg:text-[44px]"
        >
          Everything you need to know.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-[15px] leading-relaxed text-ink-soft sm:text-[17px]">
          Questions about security, privacy, passwords, passkeys, authenticator codes and how NovaSafe
          protects your data.
        </p>
      </header>

      <FaqAccordion items={FAQ_ITEMS} className="mt-12 sm:mt-14" />

      {showCta && (
        <div className="mt-16 rounded-2xl border border-border/60 bg-surface-1/50 px-6 py-10 text-center sm:px-10">
          <h3 className="text-xl font-semibold tracking-tight text-ink">Still have questions?</h3>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-soft">
            Talk to our team or explore our documentation.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={LANDING_ROUTES.docs}
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              View documentation
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to={LANDING_ROUTES.contact}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              Contact us
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
