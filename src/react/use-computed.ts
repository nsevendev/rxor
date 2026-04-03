import { useMemo } from "react";
import { computed } from "../core/computed";
import { useSignal } from "./use-signal";

export function useComputed<T>(fn: () => T): T {
  // Create a stable computed that persists across renders
  // biome-ignore lint/correctness/useExhaustiveDependencies: fn is intentionally stable per mount
  const comp = useMemo(() => computed(fn), []);
  return useSignal(comp);
}
