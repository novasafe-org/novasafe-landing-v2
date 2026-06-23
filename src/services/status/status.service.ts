import { appConfig } from "@/config/app.config";
import { normalizeUptimeHistory } from "@/lib/status-monitoring";
import type {
  RecentIncident,
  StatusIncidentDetail,
  StatusIncidentSummary,
  StatusOverview,
  UptimeDay,
} from "@/types/status";

export class StatusApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "StatusApiError";
  }
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  message?: string;
}

interface ApiIncidentDto {
  id: string;
  serviceKey: string;
  serviceName: string;
  title: string;
  slug: string;
  severity: StatusIncidentSummary["severity"];
  status: StatusIncidentSummary["status"];
  description?: string;
  publicMessage?: string;
  startedAt: string;
  resolvedAt: string | null;
}

interface ApiIncidentDetailDto extends ApiIncidentDto {
  affectedServices: string[];
  durationMinutes: number | null;
  timeline: StatusIncidentDetail["timeline"];
}

interface ApiHistoryResponse {
  service: {
    id: string;
    key: string;
    name: string;
    status: StatusOverview["overallStatus"];
    uptime: StatusOverview["services"][0]["uptime"];
  };
  days: number;
  history: UptimeDay[];
}

interface ApiIncidentsListResponse {
  success: true;
  data: ApiIncidentDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

const STATUS_BASE = `${appConfig.urls.api}/status`;

async function statusFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${STATUS_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  const body = (await response.json()) as ApiSuccess<T> | ApiFailure;

  if (!response.ok || !body.success) {
    throw new StatusApiError(
      "message" in body && body.message ? body.message : `Request failed (${response.status})`,
      response.status,
    );
  }

  return body.data;
}

function formatDisplayDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function toIncidentSummary(dto: ApiIncidentDto): StatusIncidentSummary {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    severity: dto.severity,
    status: dto.status,
    serviceKey: dto.serviceKey,
    serviceName: dto.serviceName,
    publicMessage: dto.publicMessage,
    startedAt: dto.startedAt,
    resolvedAt: dto.resolvedAt,
  };
}

function toRecentIncident(dto: ApiIncidentDto): RecentIncident {
  return {
    slug: dto.slug,
    date: dto.startedAt.slice(0, 10),
    displayDate: formatDisplayDate(dto.startedAt),
    severity: dto.severity,
    title: dto.title,
  };
}

function toIncidentDetail(dto: ApiIncidentDetailDto): StatusIncidentDetail {
  return {
    ...toIncidentSummary(dto),
    description: dto.description || dto.publicMessage || "",
    affectedServices: dto.affectedServices,
    durationMinutes: dto.durationMinutes,
    timeline: dto.timeline,
  };
}

export const statusService = {
  async fetchOverview(): Promise<StatusOverview> {
    return statusFetch<StatusOverview>("/");
  },

  async fetchHistory(serviceKey = "api", days = 90): Promise<{
    history: UptimeDay[];
    service: ApiHistoryResponse["service"];
  }> {
    const params = new URLSearchParams({
      serviceKey,
      days: String(days),
    });
    const data = await statusFetch<ApiHistoryResponse>(`/history?${params.toString()}`);
    const history = normalizeUptimeHistory(data.history);
    return { history, service: data.service };
  },

  async fetchIncidents(limit = 10): Promise<RecentIncident[]> {
    const params = new URLSearchParams({ page: "1", limit: String(limit) });
    const response = await fetch(`${STATUS_BASE}/incidents?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    const body = (await response.json()) as ApiIncidentsListResponse | ApiFailure;

    if (!response.ok || !body.success) {
      throw new StatusApiError(
        "message" in body && body.message ? body.message : `Request failed (${response.status})`,
        response.status,
      );
    }

    return body.data.map(toRecentIncident);
  },

  async fetchIncidentBySlug(slug: string): Promise<StatusIncidentDetail | null> {
    try {
      const data = await statusFetch<ApiIncidentDetailDto>(`/incidents/${encodeURIComponent(slug)}`);
      return toIncidentDetail(data);
    } catch (error) {
      if (error instanceof StatusApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },
};

export type StatusServiceApi = typeof statusService;
