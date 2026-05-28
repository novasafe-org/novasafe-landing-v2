import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-2.5", className)}>
    <div className="relative h-8 w-8">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-glow-primary" />
      <img
        src="/logo.svg"
        alt="NovaSafe"
        className="absolute inset-0 h-full w-full p-1.5 object-contain"
      />
    </div>
    <span className="text-[17px] font-semibold tracking-tight text-ink">
      Nova<span className="text-primary">Safe</span>
    </span>
  </div>
);