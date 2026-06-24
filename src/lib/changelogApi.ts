import { readEnv } from "@/config/env";

const CORE_API = (readEnv("VITE_API_URL", "API_URL") || "http://localhost:3125").replace(/\/$/, "");
const CHANGELOG_BASE = `${CORE_API}/api/v1/changelog`;

export type PublicChangelogRelease = {
  id: string;
  version: string;
  title: string;
  category: string;
  summary: string;
  notes: string[];
  contentMarkdown: string;
  tags: string[];
  publishedAt: string | null;
  slug: string;
};

type ReleaseDto = {
  id: string;
  version: string;
  title: string;
  category: string;
  summary: string;
  notes: string[];
  content_markdown?: string;
  contentMarkdown?: string;
  tags: string[];
  publishedAt?: string | null;
  published_at?: string | null;
  slug: string;
};

type ApiList<T> = { success: boolean; data: T };

function mapRelease(dto: ReleaseDto): PublicChangelogRelease {
  const md = dto.content_markdown ?? dto.contentMarkdown ?? "";
  const publishedAt = dto.publishedAt ?? dto.published_at ?? null;
  return {
    id: dto.id,
    version: dto.version,
    title: dto.title,
    category: dto.category,
    summary: dto.summary,
    notes: dto.notes?.length ? dto.notes : markdownToNotes(md),
    contentMarkdown: md,
    tags: dto.tags ?? [],
    publishedAt,
    slug: dto.slug,
  };
}

function markdownToNotes(md: string): string[] {
  if (!md.trim()) return [];
  return md
    .split(/\n+/)
    .map((line) => line.replace(/^[-*#>\s]+/, "").trim())
    .filter(Boolean);
}

export async function fetchPublishedChangelog(): Promise<PublicChangelogRelease[]> {
  const res = await fetch(CHANGELOG_BASE, { headers: { Accept: "application/json" } });
  const json = (await res.json()) as ApiList<ReleaseDto[]>;
  if (!res.ok) throw new Error("Failed to load changelog");
  return (json.data || []).map(mapRelease);
}
