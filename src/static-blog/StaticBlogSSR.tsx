import React, { type ReactNode } from "react";
import { StaticRouter } from "react-router-dom/server";
import { FeatureFlagsProvider } from "@/lib/feature-flags";

/** Providers required to SSR site chrome (header, footer, flags). */
export function StaticBlogSSR({ location, children }: { location: string; children: ReactNode }) {
  return (
    <FeatureFlagsProvider>
      <StaticRouter location={location}>{children}</StaticRouter>
    </FeatureFlagsProvider>
  );
}
