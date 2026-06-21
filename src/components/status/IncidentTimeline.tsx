import { cn } from "@/lib/utils";
import { formatDateTime, incidentStatusLabel } from "@/lib/status-utils";
import type { IncidentTimelineEntry, IncidentStatus } from "@/types/status";

const TIMELINE_ORDER: IncidentStatus[] = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
];

interface IncidentTimelineProps {
  entries: IncidentTimelineEntry[];
  currentStatus: IncidentStatus;
}

function stepIndex(status: IncidentStatus): number {
  return TIMELINE_ORDER.indexOf(status);
}

export function IncidentTimeline({ entries, currentStatus }: IncidentTimelineProps) {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
  const reached = stepIndex(currentStatus);

  return (
    <ol className="relative space-y-0" aria-label="Incident timeline">
      {sorted.map((entry, index) => {
        const idx = stepIndex(entry.status);
        const isComplete = idx <= reached;
        const isLast = index === sorted.length - 1;

        return (
          <li key={`${entry.status}-${entry.at}`} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[11px] top-6 h-[calc(100%-12px)] w-px",
                  isComplete ? "bg-primary/40" : "bg-border",
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                isComplete
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-ink-soft",
              )}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-[16px] font-semibold text-ink">
                  {entry.label || incidentStatusLabel(entry.status)}
                </h3>
                <time
                  dateTime={entry.at}
                  className="text-[13px] tabular-nums text-ink-soft"
                >
                  {formatDateTime(entry.at)}
                </time>
              </div>
              {entry.description && (
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{entry.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
