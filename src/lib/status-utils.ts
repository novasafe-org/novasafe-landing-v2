import type { IncidentSeverity, IncidentStatus, OperationalStatus } from "@/types/status";

export function serviceStatusLabel(status: OperationalStatus): string {
  switch (status) {
    case "operational":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "major":
      return "Major Outage";
  }
}

export function severityLabel(severity: IncidentSeverity): string {
  switch (severity) {
    case "maintenance":
      return "Maintenance";
    case "degraded":
      return "Degraded";
    case "major":
      return "Major";
  }
}

export function recentIncidentSeverityLabel(severity: IncidentSeverity): string {
  switch (severity) {
    case "maintenance":
      return "Scheduled Maintenance";
    case "degraded":
      return "Degraded Performance";
    case "major":
      return "Major Outage";
  }
}

export function incidentStatusLabel(status: IncidentStatus): string {
  switch (status) {
    case "investigating":
      return "Investigating";
    case "identified":
      return "Identified";
    case "monitoring":
      return "Monitoring";
    case "resolved":
      return "Resolved";
  }
}

export function statusIndicatorClass(status: OperationalStatus): string {
  switch (status) {
    case "operational":
      return "bg-success";
    case "degraded":
      return "bg-amber-400";
    case "major":
      return "bg-destructive";
  }
}

export function statusTextClass(status: OperationalStatus): string {
  switch (status) {
    case "operational":
      return "text-success";
    case "degraded":
      return "text-amber-600 dark:text-amber-400";
    case "major":
      return "text-destructive";
  }
}

export function overallStatusLabel(status: OperationalStatus): string {
  switch (status) {
    case "operational":
      return "All systems operational";
    case "degraded":
      return "Some systems experiencing issues";
    case "major":
      return "Service disruption detected";
  }
}

export function overallStatusEmoji(status: OperationalStatus): string {
  switch (status) {
    case "operational":
      return "🟢";
    case "degraded":
      return "🟡";
    case "major":
      return "🔴";
  }
}

export function formatUptime(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatDuration(minutes: number | null): string {
  if (minutes == null) return "Ongoing";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
}
