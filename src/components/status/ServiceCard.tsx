import { Skeleton } from "@/components/ui/skeleton";
import { formatUptime, serviceStatusLabel } from "@/lib/status-utils";
import type { StatusService } from "@/types/status";

interface ServiceCardProps {
  service: StatusService;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <article
      className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/70 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between"
      aria-label={`${service.name} status`}
    >
      <h3 className="text-[16px] font-semibold text-ink">{service.name}</h3>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 sm:justify-end">
        <span className="text-[14px] font-semibold text-ink">
          {serviceStatusLabel(service.status)}
        </span>
        <span className="text-[14px] font-medium tabular-nums text-ink-soft">
          {formatUptime(service.uptime.last90Days)} uptime (90 days)
        </span>
      </div>
    </article>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/70 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <Skeleton className="h-5 w-16" />
      <div className="flex gap-5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-40" />
      </div>
    </div>
  );
}
