import { useQuery } from "@tanstack/react-query";

import { statusService } from "@/services/status";
import { statusQueryKeys } from "@/hooks/useStatus";

export function useIncidents(limit = 10) {
  return useQuery({
    queryKey: statusQueryKeys.incidents(limit),
    queryFn: () => statusService.fetchIncidents(limit),
    staleTime: 60_000,
  });
}

export function useIncident(slug: string | undefined) {
  return useQuery({
    queryKey: statusQueryKeys.incident(slug ?? ""),
    queryFn: () => statusService.fetchIncidentBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}
