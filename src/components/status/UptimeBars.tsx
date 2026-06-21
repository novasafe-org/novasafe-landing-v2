import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatUptime, serviceStatusLabel, statusIndicatorClass } from "@/lib/status-utils";
import type { UptimeDay } from "@/types/status";

interface UptimeBarsProps {
  history: UptimeDay[];
  serviceName?: string;
  uptime90Days?: number;
}

function formatDisplayDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function UptimeBar({ day }: { day: UptimeDay }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-8 flex-1 min-w-[3px] rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
            statusIndicatorClass(day.status),
          )}
          aria-label={`${formatDisplayDate(day.date)}: ${serviceStatusLabel(day.status)}, ${formatUptime(day.uptimePercentage)} uptime`}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <p className="font-semibold">{formatDisplayDate(day.date)}</p>
        <p>{serviceStatusLabel(day.status)}</p>
        <p className="tabular-nums">{formatUptime(day.uptimePercentage)} uptime</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function UptimeBars({ history, serviceName, uptime90Days }: UptimeBarsProps) {
  if (history.length === 0) {
    return <UptimeBarsEmptyState />;
  }

  return (
    <div aria-label={serviceName ? `${serviceName} uptime history` : "Uptime history"}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-soft">
          {serviceName ? `${serviceName} · ` : ""}Last 90 days
        </p>
        {uptime90Days != null && (
          <p className="text-[13px] font-medium tabular-nums text-ink-soft">
            {formatUptime(uptime90Days)} uptime (90 days)
          </p>
        )}
      </div>
      <div className="flex gap-[2px] overflow-x-auto pb-2" role="img" aria-label="90-day uptime bar chart">
        {history.map((day) => (
          <UptimeBar key={day.date} day={day} />
        ))}
      </div>
    </div>
  );
}

export function UptimeBarsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex gap-[2px]">
        {Array.from({ length: 90 }).map((_, i) => (
          <Skeleton key={i} className="h-8 flex-1 min-w-[3px] rounded-sm" />
        ))}
      </div>
    </div>
  );
}

export function UptimeBarsEmptyState() {
  return (
    <div
      className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-10 text-center"
      role="status"
    >
      <p className="text-[15px] font-medium text-ink">No uptime data available</p>
      <p className="mt-2 text-[14px] text-ink-soft">Historical uptime will appear here once collected.</p>
    </div>
  );
}
