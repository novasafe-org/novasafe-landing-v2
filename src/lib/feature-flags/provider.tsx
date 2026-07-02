import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { isFlagEnabled, resolveBootstrapSnapshot } from "./resolve";
import type { FeatureFlagKey, FeatureFlagsContextValue } from "./types";

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

/** Landing is unauthenticated — uses safe defaults, session cache, and dev overrides only. */
export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<FeatureFlagsContextValue>(() => {
    const boot = resolveBootstrapSnapshot(null);
    return {
      version: boot.snapshot.version,
      flags: boot.snapshot.flags,
      source: boot.source,
      loading: false,
      error: null,
      refresh: async () => {},
    };
  });

  const refresh = useCallback(async () => {
    const boot = resolveBootstrapSnapshot(null);
    setValue((prev) => ({
      ...prev,
      version: boot.snapshot.version,
      flags: boot.snapshot.flags,
      source: boot.source,
      loading: false,
      error: null,
    }));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const contextValue = useMemo<FeatureFlagsContextValue>(
    () => ({
      ...value,
      refresh,
    }),
    [value, refresh],
  );

  return <FeatureFlagsContext.Provider value={contextValue}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags(): FeatureFlagsContextValue {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) {
    throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  }
  return ctx;
}

export function useFeatureFlag(key: FeatureFlagKey | string): boolean {
  const { flags } = useFeatureFlags();
  return isFlagEnabled(flags, key);
}
