#!/usr/bin/env node
/**
 * Write public/runtime-config.js for static hosting (S3/CloudFront).
 * Docker deployments overwrite this at container start via docker-entrypoint.sh.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outPath = path.join(root, "public", "runtime-config.js");

const defaults = {
  VITE_LANDING_URL: "https://novasafe.io",
  VITE_AUTH_URL: "https://start.novasafe.io",
  VITE_APP_URL: "https://app.novasafe.io",
  VITE_API_URL: "https://mobile-api.novasafe.io",
  VITE_APP_VERSION: "0.0.0",
};

const payload = {};
for (const key of Object.keys(defaults)) {
  const value = process.env[key] ?? defaults[key];
  if (value) payload[key] = value;
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `window.__NS_PUBLIC_ENV__=${JSON.stringify(payload)};\n`);
console.log(`[runtime-config] wrote ${path.relative(root, outPath)}`);
