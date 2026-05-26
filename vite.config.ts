import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Dev-server port resolution: PORT > VITE_PORT > 3000.
 * Keeps localhost development environment-driven (matches `src/config/env.ts`).
 */
function resolveDevPort(): number {
  const raw = process.env.PORT ?? process.env.VITE_PORT;
  if (!raw) return 3000;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3000;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: resolveDevPort(),
    hmr: {
      overlay: false,
    },
  },
  preview: {
    port: resolveDevPort(),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
