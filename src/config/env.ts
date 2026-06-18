import { z } from "zod";

/**
 * Public, browser-safe environment for the marketing site.
 *
 * Reads from `import.meta.env.*` (Vite-injected) with a `process.env` fallback
 * so build scripts that pre-stamp env work transparently. Validation runs once
 * at module load — fail fast, fail loud.
 *
 * The landing project has no server-only secrets, so we deliberately do NOT
 * ship a `env.server.ts`. Anything browser-unsafe lives in novasafe-auth-v2.
 */

type EnvRecord = Record<string, string | undefined>;

const viteEnv: EnvRecord =
  typeof import.meta !== "undefined" && (import.meta as { env?: EnvRecord }).env
    ? ((import.meta as { env: EnvRecord }).env as EnvRecord)
    : {};

const procEnv: EnvRecord =
  typeof process !== "undefined" && process.env ? (process.env as EnvRecord) : {};

declare global {
  interface Window {
    __NS_PUBLIC_ENV__?: Record<string, string>;
  }
}

function readRuntimeInjected(key: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  const value = window.__NS_PUBLIC_ENV__?.[key];
  return value != null && value !== "" ? value : undefined;
}

export function readEnv(key: string, ...aliases: string[]): string | undefined {
  for (const candidate of [key, ...aliases]) {
    const fromRuntime = readRuntimeInjected(candidate);
    if (fromRuntime != null) return fromRuntime;

    const fromVite = viteEnv[candidate];
    if (fromVite != null && fromVite !== "") return fromVite;

    const fromProc = procEnv[candidate];
    if (fromProc != null && fromProc !== "") return fromProc;
  }
  return undefined;
}

const positiveInt = (fallback: number) =>
  z
    .union([z.string(), z.number(), z.undefined()])
    .transform((v) => {
      if (v === undefined || v === "") return fallback;
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
    });

const url = z.string().url("must be a fully-qualified URL (http(s)://…)");

const PublicEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "staging", "production"])
    .default("development"),
  PORT: positiveInt(3000),
  LANDING_URL: url,
  AUTH_URL: url,
  APP_URL: url,
  APP_VERSION: z.string().min(1).default("0.0.0"),
});

const rawPublic = {
  NODE_ENV: readEnv("NODE_ENV", "MODE"),
  PORT: readEnv("PORT", "VITE_PORT"),
  LANDING_URL: readEnv("VITE_LANDING_URL"),
  AUTH_URL: readEnv("VITE_AUTH_URL"),
  APP_URL: readEnv("VITE_APP_URL"),
  APP_VERSION: readEnv("VITE_APP_VERSION", "APP_VERSION"),
};

let parsed: z.infer<typeof PublicEnvSchema>;
try {
  parsed = PublicEnvSchema.parse(rawPublic);
} catch (err) {
  if (err instanceof z.ZodError) {
    const lines = err.issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `[novasafe-landing] Invalid public environment configuration:\n${lines}\n\n` +
        `Set the missing values in your .env (see .env.example).`,
    );
  }
  throw err;
}

export const env = Object.freeze(parsed);
export type PublicEnv = typeof env;

export const runtime = Object.freeze({
  isBrowser: typeof window !== "undefined",
  isServer: typeof window === "undefined",
  isProduction: env.NODE_ENV === "production",
  isStaging: env.NODE_ENV === "staging",
  isDevelopment: env.NODE_ENV === "development",
  isTest: env.NODE_ENV === "test",
});
