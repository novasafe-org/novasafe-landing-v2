/**
 * NovaSafe landing — canonical list of publicly-indexable routes.
 *
 * This file is the single source of truth for `public/sitemap.xml`.
 * It deliberately ships as a plain ES module (not a TypeScript file) so
 * the Node-side generator (`scripts/generate-seo.mjs`) can import it
 * without a TS toolchain, while Vite/the React app can still consume
 * the same export if/when we want to render a human sitemap from it.
 *
 * Editing rules:
 *   - Only add paths that exist in `src/App.tsx` and are safe to index.
 *   - `priority` follows Google's 0.0–1.0 convention. Home = 1.0; deep
 *     legal/utility pages trend lower. Relative weights are what matter,
 *     not absolute numbers.
 *   - `changefreq` is advisory only. Search engines mostly ignore it,
 *     but we keep it sensible for human reviewers.
 *   - Do NOT include private / authenticated routes. Those live on
 *     `start.novasafe.io` and `app.novasafe.io` and have their own
 *     `robots.txt` / sitemap policies.
 */

/**
 * @typedef {Object} SeoRoute
 * @property {string} path             Absolute path on the marketing site (must start with `/`).
 * @property {number} priority         0.0 – 1.0, Google sitemap priority.
 * @property {"always"|"hourly"|"daily"|"weekly"|"monthly"|"yearly"|"never"} changefreq
 */

/** @type {ReadonlyArray<SeoRoute>} */
export const seoRoutes = Object.freeze([
  // ---- Top-level marketing ---------------------------------------------
  { path: "/",                                 priority: 1.0, changefreq: "weekly"  },
  { path: "/features",                         priority: 0.9, changefreq: "monthly" },
  { path: "/pricing",                          priority: 0.9, changefreq: "monthly" },
  { path: "/security",                         priority: 0.8, changefreq: "monthly" },

  // ---- Feature deep-dives ----------------------------------------------
  { path: "/features/password-manager",        priority: 0.7, changefreq: "monthly" },
  { path: "/features/passkeys",                priority: 0.7, changefreq: "monthly" },
  { path: "/features/secure-sharing",          priority: 0.7, changefreq: "monthly" },

  // ---- Company / contact ----------------------------------------------
  { path: "/about",                            priority: 0.6, changefreq: "monthly" },
  { path: "/contact",                          priority: 0.6, changefreq: "monthly" },
  { path: "/blog",                             priority: 0.5, changefreq: "weekly"  },

  // ---- Support ---------------------------------------------------------
  { path: "/help",                             priority: 0.5, changefreq: "monthly" },

  // ---- Docs ------------------------------------------------------------
  { path: "/docs",                             priority: 0.6, changefreq: "monthly" },
  { path: "/docs/getting-started",             priority: 0.5, changefreq: "monthly" },
  { path: "/docs/migration",                   priority: 0.4, changefreq: "monthly" },

  // ---- Developers ------------------------------------------------------
  { path: "/developers/api",                   priority: 0.6, changefreq: "monthly" },
  { path: "/developers/cli",                   priority: 0.5, changefreq: "monthly" },
  { path: "/demo",                             priority: 0.7, changefreq: "monthly" },
  { path: "/changelog",                        priority: 0.5, changefreq: "weekly"  },
  { path: "/status",                           priority: 0.4, changefreq: "weekly"  },

  // ---- Legal -----------------------------------------------------------
  { path: "/legal/privacy",                    priority: 0.4, changefreq: "yearly"  },
  { path: "/legal/terms",                      priority: 0.4, changefreq: "yearly"  },
  { path: "/legal/security",                   priority: 0.4, changefreq: "yearly"  },
  { path: "/legal/cookies",                    priority: 0.3, changefreq: "yearly"  },
  { path: "/legal/responsible-disclosure",     priority: 0.3, changefreq: "yearly"  },

  // ---- Utility ---------------------------------------------------------
  // Human-readable sitemap page (the XML one — this file's output —
  // lives at /sitemap.xml and is what Google Search Console consumes).
  { path: "/sitemap",                          priority: 0.2, changefreq: "monthly" },
]);
