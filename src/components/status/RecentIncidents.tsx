import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { statusIncidentPath } from "@/config";
import { recentIncidentSeverityLabel } from "@/lib/status-utils";
import type { RecentIncident } from "@/types/status";

interface RecentIncidentsProps {
  incidents: RecentIncident[];
}

export function RecentIncidents({ incidents }: RecentIncidentsProps) {
  if (incidents.length === 0) {
    return (
      <p className="text-[14px] text-ink-soft" role="status">
        No recent incidents.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/60" role="list" aria-label="Recent incidents">
      {incidents.map((incident) => (
        <li key={incident.slug}>
          <Link
            to={statusIncidentPath(incident.slug)}
            className="group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-card/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={`View incident: ${incident.title}`}
          >
            <div className="min-w-0">
              <time
                dateTime={incident.date}
                className="text-[13px] font-medium tabular-nums text-ink-soft"
              >
                {incident.displayDate}
              </time>
              <p className="mt-1 text-[12px] font-semibold uppercase tracking-wide text-ink-soft/80">
                {recentIncidentSeverityLabel(incident.severity)}
              </p>
              <p className="mt-0.5 text-[15px] font-medium text-ink group-hover:text-primary">
                {incident.title}
              </p>
            </div>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-ink-soft/60 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function RecentIncidentsSkeleton() {
  return (
    <div className="divide-y divide-border/60">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="py-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-3 w-36" />
          <Skeleton className="mt-2 h-5 w-56" />
        </div>
      ))}
    </div>
  );
}
