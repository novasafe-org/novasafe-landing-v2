import { PageHero } from "@/components/site/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import type { OperationalStatus } from "@/types/status";

interface StatusHeroProps {
  overallStatus: OperationalStatus;
}

function StatusHeroTitle({ status }: { status: OperationalStatus }) {
  switch (status) {
    case "operational":
      return (
        <>
          All systems <span className="text-gradient-primary">operational.</span>
        </>
      );
    case "degraded":
      return (
        <>
          Some systems experiencing <span className="text-gradient-primary">issues.</span>
        </>
      );
    case "major":
      return (
        <>
          Service <span className="text-gradient-primary">disruption</span> detected.
        </>
      );
  }
}

export function StatusHero({ overallStatus }: StatusHeroProps) {
  return (
    <div className="[&_section]:pb-8 [&_section]:sm:pb-10">
      <PageHero
        eyebrow="System status"
        title={<StatusHeroTitle status={overallStatus} />}
        lede="Live status, 90-day uptime, and incident history."
      />
    </div>
  );
}

export function StatusHeroSkeleton() {
  return (
    <section className="relative overflow-hidden pb-8 pt-16 sm:pb-10 sm:pt-20">
      <div className="container text-center">
        <Skeleton className="mx-auto h-6 w-32 rounded-full" />
        <Skeleton className="mx-auto mt-5 h-14 w-full max-w-xl" />
        <Skeleton className="mx-auto mt-6 h-5 w-full max-w-md" />
      </div>
    </section>
  );
}
