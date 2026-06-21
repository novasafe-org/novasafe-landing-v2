import { useQuery } from "@tanstack/react-query";

import { statusService } from "@/services/status";

export const statusQueryKeys = {
  overview: ["status", "overview"] as const,
  history: (serviceKey: string, days: number) => ["status", "history", serviceKey, days] as const,
  incidents: (limit: number) => ["status", "incidents", limit] as const,
  incident: (slug: string) => ["status", "incident", slug] as const,
};

export function useStatus() {
  return useQuery({
    queryKey: statusQueryKeys.overview,
    queryFn: () => statusService.fetchOverview(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useStatusHistory(serviceKey = "api", days = 90) {
  return useQuery({
    queryKey: statusQueryKeys.history(serviceKey, days),
    queryFn: () => statusService.fetchHistory(serviceKey, days),
    staleTime: 60_000,
  });
}
