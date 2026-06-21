import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { PageShell } from "@/components/site/PageShell";
import { GhostButton, PageHero, Section } from "@/components/site/primitives";
import { IncidentTimeline } from "@/components/status/IncidentTimeline";
import { StatusErrorState } from "@/components/status/StatusErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config";
import {
  formatDateTime,
  formatDuration,
  incidentStatusLabel,
  severityLabel,
} from "@/lib/status-utils";
import { useIncident } from "@/hooks/useIncidents";

function IncidentDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3 backdrop-blur">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{label}</dt>
      <dd className="mt-1 text-[15px] font-medium text-ink">{value}</dd>
    </div>
  );
}

export default function IncidentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: incident, isLoading, isError, refetch } = useIncident(slug);

  return (
    <PageShell>
      <PageHero
        align="left"
        eyebrow="Incident"
        title={
          isLoading ? (
            <Skeleton className="h-12 w-full max-w-xl" />
          ) : incident ? (
            incident.title
          ) : (
            "Incident not found"
          )
        }
        lede={
          incident?.publicMessage ??
          (isLoading ? undefined : "This incident could not be found or is no longer public.")
        }
      >
        <GhostButton to={ROUTES.landing.status} className="gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to status
        </GhostButton>
      </PageHero>

      <Section className="!pt-0">
        {isLoading && <IncidentDetailSkeleton />}

        {isError && (
          <StatusErrorState
            title="Unable to load incident"
            message="We couldn't fetch this incident. It may have been removed or is temporarily unavailable."
            onRetry={() => void refetch()}
          />
        )}

        {!isLoading && !isError && !incident && (
          <div className="mx-auto max-w-lg text-center">
            <p className="text-[15px] text-ink-soft">
              The incident you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link
              to={ROUTES.landing.status}
              className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to status page
            </Link>
          </div>
        )}

        {incident && (
          <div className="mx-auto max-w-3xl space-y-10">
            <dl className="grid gap-4 sm:grid-cols-2">
              <MetaField label="Severity" value={severityLabel(incident.severity)} />
              <MetaField label="Status" value={incidentStatusLabel(incident.status)} />
              <MetaField
                label="Affected services"
                value={incident.affectedServices.join(", ")}
              />
              <MetaField label="Started at" value={formatDateTime(incident.startedAt)} />
              <MetaField
                label="Resolved at"
                value={incident.resolvedAt ? formatDateTime(incident.resolvedAt) : "—"}
              />
              <MetaField label="Duration" value={formatDuration(incident.durationMinutes)} />
            </dl>

            <div className="rounded-2xl border border-border/70 bg-card/70 p-6 backdrop-blur">
              <h2 className="text-[18px] font-semibold text-ink">Description</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{incident.description}</p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/70 p-6 backdrop-blur">
              <h2 className="mb-6 text-[18px] font-semibold text-ink">Timeline</h2>
              <IncidentTimeline entries={incident.timeline} currentStatus={incident.status} />
            </div>
          </div>
        )}
      </Section>
    </PageShell>
  );
}
