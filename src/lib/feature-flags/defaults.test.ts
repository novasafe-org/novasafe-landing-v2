import { describe, expect, it } from "vitest";

import { buildProductionSafeDefaults, isFlagEnabled } from "@/lib/feature-flags/defaults";
import { mergeFlagSnapshots, resolveBootstrapSnapshot } from "@/lib/feature-flags/resolve";

describe("feature-flags defaults", () => {
  it("parked product flags default false from shared catalog", () => {
    const defaults = buildProductionSafeDefaults();
    expect(defaults.teams).toBe(false);
    expect(defaults.enterprise).toBe(false);
    expect(defaults.sso).toBe(false);
  });

  it("released product flags default true in production snapshot", () => {
    const defaults = buildProductionSafeDefaults();
    expect(defaults.vault).toBe(true);
  });

  it("unknown flags resolve false", () => {
    expect(isFlagEnabled({}, "unknown_flag")).toBe(false);
    expect(isFlagEnabled({ teams: true }, "enterprise")).toBe(false);
  });

  it("falls back to safe defaults when remote is unavailable", () => {
    const boot = resolveBootstrapSnapshot(null);
    expect(["defaults", "cache"]).toContain(boot.source);
    expect(boot.snapshot.flags.teams).toBe(false);
  });

  it("merges remote flags over safe defaults", () => {
    const boot = resolveBootstrapSnapshot({
      version: "2",
      flags: { teams: true },
    });
    expect(boot.snapshot.flags.teams).toBe(true);
    expect(boot.snapshot.flags.enterprise).toBe(false);
  });

  it("overlay wins in mergeFlagSnapshots", () => {
    const merged = mergeFlagSnapshots({ teams: false }, { teams: true });
    expect(merged.teams).toBe(true);
  });
});
