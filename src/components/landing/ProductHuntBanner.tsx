import { ArrowUpRight, Rocket } from "lucide-react";

import { PRODUCT_HUNT } from "@/config/product-hunt.config";
import { cn } from "@/lib/utils";

/** Compact Product Hunt announcement — fixed above the site header on every page. */
export function ProductHuntTopStrip() {
  return (
    <div
      className="bg-product-hunt text-product-hunt-foreground"
      role="region"
      aria-label="Product Hunt launch"
    >
      <div className="container flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-[12px] font-medium sm:gap-x-4 sm:py-2.5 sm:text-[13px]">
        <span className="inline-flex items-center gap-1.5">
          <Rocket className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
          <span className="font-semibold uppercase tracking-[0.08em]">Featured on Product Hunt</span>
        </span>
        <span className="hidden text-product-hunt-foreground/75 sm:inline" aria-hidden>·</span>
        <span className="text-product-hunt-foreground/95">Love NovaSafe? Help us grow with a review.</span>
        <a
          href={PRODUCT_HUNT.reviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold",
            "ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/25 sm:text-[13px]",
          )}
        >
          Review on Product Hunt
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}

export default ProductHuntTopStrip;
