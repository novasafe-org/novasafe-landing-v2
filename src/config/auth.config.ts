/**
 * Auth-related configuration that is safe for the browser bundle.
 *
 * Path-based routing — every auth screen has a real URL on the auth project
 * (e.g. `/login`, `/signup`, `/signup/pro`). We do NOT smuggle flow state
 * through query parameters. Mirror of the same module in novasafe-auth-v2.
 */

/**
 * Canonical paths on the auth project.
 *
 * Adding a new auth screen? Add it here, add a builder in `routes.config.ts`,
 * and add the matching route file in `novasafe-auth-v2/src/routes/`.
 */
export const AUTH_PATH = {
  Login: "/login",
  Signup: "/signup",
  SignupPro: "/signup/pro",
} as const;

export type AuthPath = (typeof AUTH_PATH)[keyof typeof AUTH_PATH];

export const authConfig = Object.freeze({
  paths: AUTH_PATH,
  /** Open-redirect-safe `next` parameter (validated by the auth project). */
  nextQueryKey: "next",
  /** Optional analytics ref (e.g. `?ref=hero_cta`). Not security-relevant. */
  refQueryKey: "ref",
});

export type AuthConfig = typeof authConfig;
