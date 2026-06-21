import { cn } from "@/lib/utils";
import {
  overallStatusEmoji,
  serviceStatusLabel,
  statusIndicatorClass,
  statusTextClass,
} from "@/lib/status-utils";
import type { OperationalStatus } from "@/types/status";

interface StatusIndicatorProps {
  status: OperationalStatus;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StatusIndicator({
  status,
  showLabel = true,
  size = "md",
  className,
}: StatusIndicatorProps) {
  const dotSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn("shrink-0 rounded-full", dotSize, statusIndicatorClass(status))}
        role="img"
        aria-label={serviceStatusLabel(status)}
      />
      {showLabel && (
        <span className={cn("text-[13px] font-semibold", statusTextClass(status))}>
          {serviceStatusLabel(status)}
        </span>
      )}
    </span>
  );
}

export function StatusEmoji({ status, className }: { status: OperationalStatus; className?: string }) {
  return (
    <span className={className} role="img" aria-hidden="true">
      {overallStatusEmoji(status)}
    </span>
  );
}
