import { PageShell } from "@/components/site/PageShell";
import { Section } from "@/components/site/primitives";
import { RecentIncidents, RecentIncidentsSkeleton } from "@/components/status/RecentIncidents";
import { StatusErrorState } from "@/components/status/StatusErrorState";
import { StatusHero, StatusHeroSkeleton } from "@/components/status/StatusHero";
import {
  UptimeBars,
  UptimeBarsEmptyState,
  UptimeBarsSkeleton,
} from "@/components/status/UptimeBars";
import { useIncidents } from "@/hooks/useIncidents";
import { useStatus, useStatusHistory } from "@/hooks/useStatus";

export default function StatusPage() {
  const statusQuery = useStatus();
  const historyQuery = useStatusHistory("api");
  const incidentsQuery = useIncidents();

  const isLoading =
    statusQuery.isLoading || historyQuery.isLoading || incidentsQuery.isLoading;
  const isError =
    statusQuery.isError || historyQuery.isError || incidentsQuery.isError;

  const retryAll = () => {
    void statusQuery.refetch();
    void historyQuery.refetch();
    void incidentsQuery.refetch();
  };

  const overview = statusQuery.data;
  const primaryService = overview?.services[0];
  const history = historyQuery.data?.history;
  const uptime90Days =
    primaryService?.uptime.last90Days ?? historyQuery.data?.service.uptime.last90Days;

  return (
    <PageShell>
      {isLoading && !overview && <StatusHeroSkeleton />}

      {overview && <StatusHero overallStatus={overview.overallStatus} />}

      <Section className="!pt-0 !pb-10 sm:!pb-12">
        {isError && <StatusErrorState onRetry={retryAll} />}

        {!isError && (
          <div className="mx-auto max-w-4xl space-y-10 sm:space-y-12">
            <section aria-label="90-day uptime history">
              {historyQuery.isLoading && !history ? (
                <UptimeBarsSkeleton />
              ) : history && history.length > 0 ? (
                <div className="rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur sm:p-6">
                  <UptimeBars
                    history={history}
                    serviceName={primaryService?.name ?? historyQuery.data?.service.name}
                    uptime90Days={uptime90Days}
                  />
                </div>
              ) : (
                <UptimeBarsEmptyState />
              )}
            </section>

            <section aria-labelledby="recent-incidents-heading">
              <h2
                id="recent-incidents-heading"
                className="mb-5 text-[22px] font-semibold tracking-tight text-ink sm:text-2xl"
              >
                Recent Incidents
              </h2>
              {incidentsQuery.isLoading && !incidentsQuery.data ? (
                <RecentIncidentsSkeleton />
              ) : incidentsQuery.data ? (
                <RecentIncidents incidents={incidentsQuery.data} />
              ) : null}
            </section>
          </div>
        )}
      </Section>
    </PageShell>
  );
}
