import { env } from "@/config/env";

export type BuildMetadata = {
  version: string;
  build: string;
  commit: string;
  branch: string;
  environment: string;
  releasedAt: string;
  repository: string;
};

let cached: BuildMetadata | null = null;
let fetchPromise: Promise<BuildMetadata | null> | null = null;

function fallback(): BuildMetadata {
  return {
    version: env.APP_VERSION,
    build: "local",
    commit: "unknown",
    branch: "unknown",
    environment: env.NODE_ENV,
    releasedAt: new Date().toISOString(),
    repository: "novasafe-landing-v2",
  };
}

/** Build metadata from /version.json (generated at build) with env fallback. */
export async function fetchBuildMetadata(): Promise<BuildMetadata> {
  if (cached) return cached;
  if (!fetchPromise) {
    fetchPromise = fetch("/version.json", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<BuildMetadata>) : null))
      .catch(() => null);
  }
  const remote = await fetchPromise;
  cached = remote ?? fallback();
  return cached;
}

export function getBuildMetadataSync(): BuildMetadata {
  return cached ?? fallback();
}
