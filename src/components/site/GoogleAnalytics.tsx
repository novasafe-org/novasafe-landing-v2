import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { trackPageView } from "@/lib/google-analytics";

/** Sends GA4 page_view on SPA route changes (initial load + navigation). */
export function GoogleAnalytics() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    trackPageView(pathname + search);
  }, [pathname, search]);

  return null;
}
