import { appConfig } from "./app.config";
import { AUTH_PATH, authConfig, type AuthPath } from "./auth.config";

/**
 * URL builders for cross-subdomain navigation.
 *
 * Single source of truth for every CTA on the marketing site. Components
 * call typed builders (`buildLoginUrl`, `buildSignupUrl`, …) instead of
 * concatenating subdomains and paths — the production rollout is a one-line
 * env change.
 */

export interface BuildOptions {
  /**
   * Optional `next=<absolute-url>` parameter. The auth project validates the
   * origin matches `appConfig.urls.app` before honoring it.
   */
  next?: string;
  /** Optional analytics ref (e.g. "hero_cta"). Public, non-sensitive. */
  ref?: string;
  /** Extra public query parameters. Empty values are skipped. */
  query?: Record<string, string | undefined | null>;
}

function buildAuthUrlAt(path: AuthPath, options?: BuildOptions): string {
  const url = new URL(path, appConfig.urls.auth);
  if (options?.next) url.searchParams.set(authConfig.nextQueryKey, options.next);
  if (options?.ref) url.searchParams.set(authConfig.refQueryKey, options.ref);
  if (options?.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value == null || value === "") continue;
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

/** Login page on the auth project (e.g. `https://start.novasafe.io/login`). */
export function buildLoginUrl(options?: BuildOptions): string {
  return buildAuthUrlAt(AUTH_PATH.Login, options);
}

/** Free signup on the auth project (e.g. `https://start.novasafe.io/signup`). */
export function buildSignupUrl(options?: BuildOptions): string {
  return buildAuthUrlAt(AUTH_PATH.Signup, options);
}

/** Pro signup on the auth project (e.g. `https://start.novasafe.io/signup/pro`). */
export function buildSignupProUrl(options?: BuildOptions): string {
  return buildAuthUrlAt(AUTH_PATH.SignupPro, options);
}

/** Absolute URL pointing at the authenticated app (cross-subdomain). */
export function buildAppUrl(options?: { path?: string } = {}): string {
  const url = new URL(options.path ?? "/", appConfig.urls.app);
  return url.toString();
}

/** Internal landing-site routes — kept here so consumers don't sprinkle string paths. */
export const LANDING_ROUTES = Object.freeze({
  home: "/",
  pricing: "/pricing",
  security: "/security",
  features: "/features",
  contact: "/contact",
  about: "/about",
  help: "/help",
  status: "/status",
  changelog: "/changelog",
  blog: "/blog",
  docs: "/docs",
  legal: Object.freeze({
    privacy: "/legal/privacy",
    terms: "/legal/terms",
    cookies: "/legal/cookies",
    security: "/legal/security",
    responsibleDisclosure: "/legal/responsible-disclosure",
  }),
});

export const ROUTES = Object.freeze({
  paths: AUTH_PATH,
  buildLoginUrl,
  buildSignupUrl,
  buildSignupProUrl,
  buildAppUrl,
  landing: LANDING_ROUTES,
});

export type Routes = typeof ROUTES;
