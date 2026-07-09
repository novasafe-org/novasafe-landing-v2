import { env } from "@/config/env";

import type { PlatformFeatureFlagPayload } from "./types";

type FeatureFlagsApiResponse = {
  success: boolean;
  data?: PlatformFeatureFlagPayload;
};

/** Maps app runtime env to the feature-flag store environment. */
export function resolveFeatureFlagEnvironment(): "production" | "staging" | "development" | "enterprise-dev" {
  switch (env.NODE_ENV) {
    case "production":
      return "production";
    case "staging":
      return "staging";
    case "development":
    case "test":
      return "development";
    default:
      return "production";
  }
}

/** Browser fetch against the public mobile-api feature flags endpoint. */
export async function fetchPublicFeatureFlags(): Promise<PlatformFeatureFlagPayload | null> {
  const environment = resolveFeatureFlagEnvironment();
  const baseUrl = env.API_URL.replace(/\/+$/, "");
  const url = new URL(`${baseUrl}/api/v1/platform/feature-flags/public`);
  url.searchParams.set("environment", environment);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Client-Source": "landing",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as FeatureFlagsApiResponse;
    return payload.data ?? null;
  } catch (error) {
    console.error("[feature-flags] Failed to load platform flags", error);
    return null;
  }
}
