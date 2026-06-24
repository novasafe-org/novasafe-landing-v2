import { Link } from "react-router-dom";
import { AlertTriangle, Wrench } from "lucide-react";

import { statusIncidentPath } from "@/config";
import type { StatusIncidentSummary } from "@/types/status";
import { cn } from "@/lib/utils";

export function ActiveIncidentsBanner({ incidents }: { incidents: StatusIncidentSummary[] }) {
  if (!incidents.length) return null;

  return (
    <section aria-label="Active incidents" className="mx-auto max-w-4xl px-4 sm:px-0 -mt-2 mb-6">
      <div className="rounded-2xl border border-warning/40 bg-warning/5 p-5 backdrop-blur">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="size-4 text-warning" aria-hidden />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink">
            Active incident{incidents.length > 1 ? "s" : ""}
          </h2>
        </div>
        <ul className="space-y-3" role="list">
          {incidents.map((incident) => (
            <li key={incident.id}>
              <Link
                to={statusIncidentPath(incident.slug)}
                className="block rounded-xl border border-border/60 bg-card/60 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-card/80"
              >
                <p className="text-[15px] font-semibold text-ink">{incident.title}</p>
                {incident.publicMessage && (
                  <p className="mt-1 text-[14px] text-ink-soft line-clamp-2">{incident.publicMessage}</p>
                )}
                <p className="mt-2 text-[12px] font-medium uppercase tracking-wide text-ink-soft/80">
                  {incident.status} · {incident.serviceName}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ScheduledMaintenanceSection({ items }: { items: StatusIncidentSummary[] }) {
  if (!items.length) return null;

  return (
    <section aria-labelledby="scheduled-maintenance-heading" className="mx-auto max-w-4xl">
      <h2
        id="scheduled-maintenance-heading"
        className="mb-4 flex items-center gap-2 text-[22px] font-semibold tracking-tight text-ink sm:text-2xl"
      >
        <Wrench className="size-5 text-ink-soft" aria-hidden />
        Scheduled maintenance
      </h2>
      <ul className="space-y-3" role="list">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={statusIncidentPath(item.slug)}
              className={cn(
                "block rounded-2xl border border-border/70 bg-card/70 px-5 py-4 backdrop-blur",
                "transition-colors hover:border-primary/30 hover:bg-card/90",
              )}
            >
              <p className="text-[16px] font-semibold text-ink">{item.title}</p>
              {item.publicMessage && (
                <p className="mt-1 text-[14px] text-ink-soft">{item.publicMessage}</p>
              )}
              <time
                dateTime={item.startedAt}
                className="mt-2 block text-[13px] font-medium tabular-nums text-ink-soft"
              >
                {new Date(item.startedAt).toLocaleString(undefined, {
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
