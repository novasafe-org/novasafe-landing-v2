import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-2.5", className)}>
    <div className="relative h-8 w-8">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-glow-primary" />
      <svg viewBox="0 0 32 32" className="absolute inset-0 h-full w-full p-1.5 text-primary-foreground">
        <path
          fill="currentColor"
          d="M16 3 5 7v8c0 6.6 4.7 12.3 11 14 6.3-1.7 11-7.4 11-14V7L16 3Zm-1 17.5-4.2-4.2 1.4-1.4L15 17.7l5.8-5.8 1.4 1.4L15 20.5Z"
        />
      </svg>
    </div>
    <span className="text-[17px] font-semibold tracking-tight text-ink">
      Nova<span className="text-primary">Safe</span>
    </span>
  </div>
);