import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-2.5", className)}>
    <img
      src="/brand-icon.png"
      alt=""
      aria-hidden
      className="h-8 w-8 rounded-lg object-cover shrink-0 shadow-glow-primary"
    />
    <span className="text-[17px] font-semibold tracking-tight text-ink">
      Nova<span className="text-primary">Safe</span>
    </span>
  </div>
);