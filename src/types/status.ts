export type OperationalStatus = "operational" | "degraded" | "major";

export type IncidentSeverity = "maintenance" | "degraded" | "major";

export type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";

export interface ServiceUptime {
  last24Hours: number;
  last30Days: number;
  last90Days: number;
}

export interface StatusService {
  id: string;
  key: string;
  name: string;
  description?: string;
  status: OperationalStatus;
  uptime: ServiceUptime;
}

export interface StatusIncidentSummary {
  id: string;
  slug: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  serviceKey: string;
  serviceName: string;
  publicMessage?: string;
  startedAt: string;
  resolvedAt: string | null;
}

export interface StatusOverview {
  overallStatus: OperationalStatus;
  services: StatusService[];
  activeIncidents: StatusIncidentSummary[];
  scheduledMaintenance: StatusIncidentSummary[];
  updatedAt: string;
}

export interface IncidentTimelineEntry {
  status: IncidentStatus;
  label: string;
  at: string;
  description?: string;
}

export interface StatusIncidentDetail extends StatusIncidentSummary {
  description: string;
  affectedServices: string[];
  timeline: IncidentTimelineEntry[];
  durationMinutes: number | null;
}

export interface RecentIncident {
  slug: string;
  date: string;
  displayDate: string;
  severity: IncidentSeverity;
  title: string;
}

export interface IncidentHistoryRow {
  date: string;
  displayDate: string;
  periodLabel: string;
  status: OperationalStatus;
  summary: string;
  incidentSlug?: string;
}

export interface UptimeDay {
  date: string;
  status: OperationalStatus;
  uptimePercentage: number;
}

export interface ServiceHistoryResponse {
  serviceKey: string;
  serviceName: string;
  days: number;
  history: UptimeDay[];
}
