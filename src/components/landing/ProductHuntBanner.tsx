import { ArrowUpRight, Rocket } from "lucide-react";

import { PRODUCT_HUNT } from "@/config/product-hunt.config";
import { cn } from "@/lib/utils";

/** Scrollable Product Hunt announcement above the sticky site header. */
export function ProductHuntTopStrip() {
  return (
    <div
      className="bg-product-hunt text-product-hunt-foreground"
      role="region"
      aria-label="Product Hunt launch"
    >
      <div className="container flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-3 py-1.5 text-center text-[11px] font-medium sm:gap-x-3 sm:text-[12px]">
        <span className="inline-flex items-center gap-1">
          <Rocket className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
          <span className="font-semibold uppercase tracking-[0.06em]">Featured on Product Hunt</span>
        </span>
        <span className="hidden text-product-hunt-foreground/75 sm:inline" aria-hidden>·</span>
        <span className="hidden text-product-hunt-foreground/95 sm:inline">Love NovaSafe? Help us grow with a review.</span>
        <a
          href={PRODUCT_HUNT.reviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold",
            "ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/25 sm:text-[12px]",
          )}
        >
          Review on Product Hunt
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </a>
      </div>
    </div>
  );
}

export default ProductHuntTopStrip;
