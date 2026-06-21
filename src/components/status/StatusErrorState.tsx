import { AlertCircle, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatusErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function StatusErrorState({
  title = "Unable to load status",
  message = "We couldn't fetch the latest system status. Please try again.",
  onRetry,
}: StatusErrorStateProps) {
  return (
    <div
      className="mx-auto max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
      role="alert"
    >
      <AlertCircle className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />
      <h2 className="mt-4 text-[18px] font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-5 py-3 text-[14px] font-semibold text-ink backdrop-blur transition-all hover:bg-secondary",
          )}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}
