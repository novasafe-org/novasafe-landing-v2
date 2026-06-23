import type { UptimeDay } from "@/types/status";

/** First day we publicly report uptime (UTC date key). */
export const STATUS_MONITORING_START_DATE = "2026-06-20";

export function isBeforeMonitoringStart(dateKey: string): boolean {
  return dateKey < STATUS_MONITORING_START_DATE;
}

export function formatMonitoringStartLabel(): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${STATUS_MONITORING_START_DATE}T12:00:00.000Z`));
}

/** Mark pre-launch days as unavailable (grey bars, no fake 100% uptime). */
export function normalizeUptimeHistory(history: UptimeDay[]): UptimeDay[] {
  return history.map((day) =>
    day.unavailable || isBeforeMonitoringStart(day.date) ? { ...day, unavailable: true } : day,
  );
}

/** Average daily uptime for days we actually monitored (fallback when API summary is stale). */
export function averageMonitoredUptime(history: UptimeDay[]): number | undefined {
  const monitored = history.filter((d) => !d.unavailable);
  if (monitored.length === 0) return undefined;
  const sum = monitored.reduce((acc, d) => acc + d.uptimePercentage, 0);
  return Math.round((sum / monitored.length) * 100) / 100;
}
