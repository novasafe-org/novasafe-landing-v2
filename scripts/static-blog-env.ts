/** Defaults for SSR so SiteHeader/config validate outside Vite. */
process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.VITE_LANDING_URL =
  process.env.VITE_LANDING_URL || process.env.PUBLIC_SITE_URL || "https://novasafe.io";
process.env.VITE_AUTH_URL = process.env.VITE_AUTH_URL || "https://auth.novasafe.io";
process.env.VITE_APP_URL = process.env.VITE_APP_URL || "https://app.novasafe.io";
process.env.VITE_API_URL = process.env.VITE_API_URL || "https://mobile-api.novasafe.io";
