import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { statusIncidentPath } from "@/config";
import { cn } from "@/lib/utils";
import { overallStatusEmoji } from "@/lib/status-utils";
import type { IncidentHistoryRow } from "@/types/status";

interface IncidentHistoryProps {
  rows: IncidentHistoryRow[];
}

function IncidentHistoryRowItem({ row }: { row: IncidentHistoryRow }) {
  const content = (
    <>
      <div className="flex flex-col gap-1 sm:col-start-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft/80">
          {row.periodLabel}
        </span>
        <time dateTime={row.date} className="text-[14px] font-medium tabular-nums text-ink-soft">
          {row.displayDate}
        </time>
      </div>

      <div className="relative hidden sm:block">
        <span
          className="relative z-10 mx-auto mt-3 block size-[7px] rounded-full bg-primary ring-[5px] ring-background"
          aria-hidden="true"
        />
      </div>

      <div className="flex min-w-0 items-center justify-between gap-3 sm:col-start-3 sm:pl-10">
        <div className="flex min-w-0 items-center gap-3">
          <span className="sm:hidden" role="img" aria-hidden="true">
            {overallStatusEmoji(row.status)}
          </span>
          <span className="hidden sm:inline" role="img" aria-hidden="true">
            {overallStatusEmoji(row.status)}
          </span>
          <p className="truncate text-[16px] font-medium text-ink">{row.summary}</p>
        </div>
        {row.incidentSlug && (
          <ChevronRight className="hidden h-4 w-4 shrink-0 text-ink-soft sm:block" aria-hidden="true" />
        )}
      </div>
    </>
  );

  const className = cn(
    "group relative grid grid-cols-1 gap-3 rounded-xl border border-transparent px-2 py-4 transition-colors sm:grid-cols-[140px_20px_minmax(0,1fr)] sm:gap-x-0",
    row.incidentSlug && "hover:border-border/70 hover:bg-card/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
  );

  if (row.incidentSlug) {
    return (
      <Link
        to={statusIncidentPath(row.incidentSlug)}
        className={className}
        aria-label={`View incident: ${row.summary}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={className} role="listitem">
      {content}
    </div>
  );
}

export function IncidentHistory({ rows }: IncidentHistoryProps) {
  if (rows.length === 0) {
    return <IncidentHistoryEmptyState />;
  }

  return (
    <div className="relative mx-auto max-w-[900px]">
      <div
        className="pointer-events-none absolute bottom-0 left-[150px] top-0 hidden w-px bg-primary/20 sm:block"
        aria-hidden="true"
      />
      <ul className="divide-y divide-border/50" role="list" aria-label="Incident history">
        {rows.map((row) => (
          <li key={`${row.date}-${row.summary}`}>
            <IncidentHistoryRowItem row={row} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function IncidentHistorySkeleton() {
  return (
    <div className="mx-auto max-w-[900px] space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-5 w-full max-w-md" />
        </div>
      ))}
    </div>
  );
}

export function IncidentHistoryEmptyState() {
  return (
    <div
      className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-10 text-center"
      role="status"
    >
      <p className="text-[15px] font-medium text-ink">No incidents reported</p>
      <p className="mt-2 text-[14px] text-ink-soft">
        All systems have been running smoothly during the selected period.
      </p>
    </div>
  );
}
